import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

interface ClientSession {
  ws: WebSocket;
  userCode: string;
  normCode: string;
  name: string;
  lastActive: number;
}

interface ChatMessage {
  id: string;
  senderCode: string;
  senderName: string;
  recipientCode: string;
  content: string;
  msgType?: 'text' | 'image' | 'video' | 'audio' | 'drawing';
  mediaUrl?: string;
  mediaInfo?: {
    duration?: number;
    size?: number;
    name?: string;
    width?: number;
    height?: number;
    mimeType?: string;
  };
  drawingData?: string;
  theme?: string;
  timestamp: number;
  sound?: boolean;
  isEdited?: boolean;
  editedAt?: number;
  isDeletedForEveryone?: boolean;
  deletedAt?: number;
  ttlSeconds?: number;
  expiresAt?: number;
}

const app = express();
const PORT = 3000;
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

export function normalizeCode(raw: string): string {
  if (!raw) return "";
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

// In-memory state: key is normalized code (e.g. "845291736")
const activeClients = new Map<string, ClientSession>();

export interface UserPresence {
  userCode: string;
  normCode: string;
  name: string;
  lastActive: number;
}
// Active user presence (both WebSocket and HTTP heartbeat active users)
const activeUsers = new Map<string, UserPresence>();

// Store message history between pairs: key is sorted pair "CODEA:CODEB"
const conversationHistory = new Map<string, ChatMessage[]>();
// Active AnyDesk-style paired sessions: key is "CODEA:CODEB"
const activePairSessions = new Set<string>();

export interface StoredRequest {
  id: string;
  fromCode: string;
  fromName: string;
  toCode: string;
  timestamp: number;
  status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
}

// Pending Connection / Message Requests: key is normalized toCode
const pendingRequests = new Map<string, StoredRequest[]>();

function getActiveCount(): number {
  const now = Date.now();
  let count = 0;
  for (const [norm, u] of activeUsers.entries()) {
    if (now - u.lastActive < 35000) {
      count++;
    } else {
      activeUsers.delete(norm);
    }
  }
  return Math.max(count, activeClients.size, 1);
}

function getActiveSessionForUser(userCode: string): { connected: boolean; peerCode: string | null; peerName: string | null } {
  const norm = normalizeCode(userCode);
  for (const pair of activePairSessions) {
    const [c1, c2] = pair.split(":");
    if (c1 === norm) {
      const peerPres = activeUsers.get(c2) || activeClients.get(c2);
      return { connected: true, peerCode: peerPres?.userCode || c2, peerName: peerPres?.name || c2 };
    } else if (c2 === norm) {
      const peerPres = activeUsers.get(c1) || activeClients.get(c1);
      return { connected: true, peerCode: peerPres?.userCode || c1, peerName: peerPres?.name || c1 };
    }
  }
  return { connected: false, peerCode: null, peerName: null };
}

function addStoredRequest(fromCode: string, fromName: string, toCode: string): StoredRequest {
  const toNorm = normalizeCode(toCode);
  const fromNorm = normalizeCode(fromCode);
  const existing = pendingRequests.get(toNorm) || [];
  // Remove any previous request from the exact same sender
  const filtered = existing.filter((r) => normalizeCode(r.fromCode) !== fromNorm);
  const req: StoredRequest = {
    id: `req_${fromNorm}_${toNorm}_${Date.now()}`,
    fromCode,
    fromName: fromName || `User ${fromNorm.slice(-3)}`,
    toCode,
    timestamp: Date.now(),
    status: 'pending',
  };
  filtered.unshift(req);
  pendingRequests.set(toNorm, filtered.slice(0, 50));
  return req;
}

function removeStoredRequest(code1: string, code2: string): boolean {
  const norm1 = normalizeCode(code1);
  const norm2 = normalizeCode(code2);
  let removed = false;

  const list1 = pendingRequests.get(norm1);
  if (list1) {
    const next1 = list1.filter((r) => normalizeCode(r.fromCode) !== norm2);
    if (next1.length !== list1.length) {
      pendingRequests.set(norm1, next1);
      removed = true;
    }
  }

  const list2 = pendingRequests.get(norm2);
  if (list2) {
    const next2 = list2.filter((r) => normalizeCode(r.fromCode) !== norm1);
    if (next2.length !== list2.length) {
      pendingRequests.set(norm2, next2);
      removed = true;
    }
  }

  return removed;
}

function getUserRequests(userCode: string) {
  const norm = normalizeCode(userCode);
  const incoming = pendingRequests.get(norm) || [];
  const outgoing: StoredRequest[] = [];

  for (const list of pendingRequests.values()) {
    for (const r of list) {
      if (normalizeCode(r.fromCode) === norm) {
        outgoing.push(r);
      }
    }
  }

  return { incoming, outgoing };
}

function notifyRequestsUpdate(userCode: string) {
  const norm = normalizeCode(userCode);
  const client = activeClients.get(norm);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    const reqs = getUserRequests(userCode);
    client.ws.send(
      JSON.stringify({
        type: 'pending_requests_update',
        incoming: reqs.incoming,
        outgoing: reqs.outgoing,
      })
    );
  }
}

function getPairKey(code1: string, code2: string): string {
  return [normalizeCode(code1), normalizeCode(code2)].sort().join(":");
}

function broadcastPeerStatus(peerCode: string, isOnline: boolean, name?: string) {
  const norm = normalizeCode(peerCode);
  const payload = JSON.stringify({
    type: "peer_status",
    peerCode: peerCode,
    online: isOnline,
    name: name || "",
  });

  for (const client of activeClients.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

// REST API endpoints
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    activeUsers: getActiveCount(),
    activeSessions: activePairSessions.size,
    timestamp: Date.now(),
  });
});

// Periodic heartbeat & presence registration for both WebSocket & non-WebSocket clients
app.post("/api/users/heartbeat", (req, res) => {
  const { userCode, name } = req.body;
  if (userCode) {
    const norm = normalizeCode(userCode);
    activeUsers.set(norm, {
      userCode,
      normCode: norm,
      name: name || `User ${norm.slice(-3)}`,
      lastActive: Date.now(),
    });
  }

  const activeCount = getActiveCount();
  const rawCode = userCode || "";
  const reqs = getUserRequests(rawCode);
  const session = getActiveSessionForUser(rawCode);

  res.json({
    status: "ok",
    activeCount,
    incoming: reqs.incoming,
    outgoing: reqs.outgoing,
    activeSession: session,
  });
});

// Get user incoming and outgoing connection requests
app.get("/api/requests/:code", (req, res) => {
  const rawCode = req.params.code || "";
  const data = getUserRequests(rawCode);
  const session = getActiveSessionForUser(rawCode);
  res.json({
    ...data,
    activeSession: session,
  });
});

// Send a connection / message request via HTTP (reliable fallback if WebSocket is connecting/down)
app.post("/api/requests/send", (req, res) => {
  const { fromCode, fromName, toCode } = req.body;
  if (!fromCode || !toCode) {
    return res.status(400).json({ error: "fromCode and toCode required" });
  }

  const fromNorm = normalizeCode(fromCode);
  const toNorm = normalizeCode(toCode);

  if (!fromNorm || !toNorm) {
    return res.status(400).json({ error: "সঠিক কোড প্রদান করুন" });
  }

  if (fromNorm === toNorm) {
    return res.status(400).json({ error: "নিজের কোডে রিকোয়েস্ট পাঠানো যাবে না" });
  }

  // Update sender's presence
  activeUsers.set(fromNorm, {
    userCode: fromCode,
    normCode: fromNorm,
    name: fromName || `User ${fromNorm.slice(-3)}`,
    lastActive: Date.now(),
  });

  const storedReq = addStoredRequest(fromCode, fromName, toCode);

  // Check if target is online (via WebSocket OR recent heartbeat)
  const targetWs = activeClients.get(toNorm);
  const targetPres = activeUsers.get(toNorm);
  const isWsOnline = !!targetWs && targetWs.ws.readyState === WebSocket.OPEN;
  const isHttpOnline = !!targetPres && (Date.now() - targetPres.lastActive < 35000);
  const isTargetOnline = isWsOnline || isHttpOnline;

  // Real-time notify target via WebSocket if connected
  if (isWsOnline && targetWs) {
    const targetIncoming = pendingRequests.get(toNorm) || [];
    targetWs.ws.send(
      JSON.stringify({
        type: "incoming_connection_request",
        fromCode: fromCode,
        fromName: fromName || `User ${fromNorm.slice(-3)}`,
        timestamp: storedReq.timestamp,
        allIncoming: targetIncoming,
      })
    );
  }

  // Real-time sync updates
  notifyRequestsUpdate(fromCode);
  notifyRequestsUpdate(toCode);

  res.json({
    success: true,
    request: storedReq,
    isOnline: isTargetOnline,
    message: isTargetOnline
      ? `${toCode} কোডে অনুরোধ সফলভাবে পৌঁছেছে। অনুমোদনের অপেক্ষায়...`
      : `${toCode} কোডে অনুরোধ পাঠানো ও সেভ করা হয়েছে। অপর পাশের ব্যবহারকারী অন হলেই নোটিফিকেশন পাবেন।`,
  });
});

app.post("/api/requests/accept", (req, res) => {
  const { fromCode, toCode, acceptorName } = req.body;
  if (!fromCode || !toCode) {
    return res.status(400).json({ error: "fromCode and toCode required" });
  }
  const norm1 = normalizeCode(fromCode);
  const norm2 = normalizeCode(toCode);
  removeStoredRequest(norm1, norm2);
  const pairKey = getPairKey(norm1, norm2);
  activePairSessions.add(pairKey);

  const client1 = activeClients.get(norm1);
  const client2 = activeClients.get(norm2);
  const pres1 = activeUsers.get(norm1);
  const pres2 = activeUsers.get(norm2);

  // Notify both parties if they have open WebSocket
  if (client1 && client1.ws.readyState === WebSocket.OPEN) {
    client1.ws.send(
      JSON.stringify({
        type: "connection_accepted",
        peerCode: toCode,
        peerName: acceptorName || pres2?.name || toCode,
      })
    );
  }
  if (client2 && client2.ws.readyState === WebSocket.OPEN) {
    client2.ws.send(
      JSON.stringify({
        type: "connection_accepted",
        peerCode: fromCode,
        peerName: pres1?.name || fromCode,
      })
    );
  }

  notifyRequestsUpdate(norm1);
  notifyRequestsUpdate(norm2);
  res.json({
    success: true,
    peerCode: fromCode,
    peerName: pres1?.name || fromCode,
    pairKey,
  });
});

app.post("/api/requests/cancel", (req, res) => {
  const { fromCode, toCode } = req.body;
  if (!fromCode || !toCode) {
    return res.status(400).json({ error: "fromCode and toCode required" });
  }
  const norm1 = normalizeCode(fromCode);
  const norm2 = normalizeCode(toCode);
  removeStoredRequest(norm1, norm2);

  const client1 = activeClients.get(norm1);
  const client2 = activeClients.get(norm2);

  if (client1 && client1.ws.readyState === WebSocket.OPEN) {
    client1.ws.send(
      JSON.stringify({
        type: "connection_request_cancelled",
        fromCode: toCode,
      })
    );
  }
  if (client2 && client2.ws.readyState === WebSocket.OPEN) {
    client2.ws.send(
      JSON.stringify({
        type: "connection_request_cancelled",
        fromCode: fromCode,
      })
    );
  }

  notifyRequestsUpdate(norm1);
  notifyRequestsUpdate(norm2);
  res.json({ success: true });
});

// Check if a user exists and is online
app.get("/api/users/check/:code", (req, res) => {
  const rawCode = req.params.code || "";
  const norm = normalizeCode(rawCode);
  const client = activeClients.get(norm);
  const presence = activeUsers.get(norm);
  const isWsOnline = !!client && client.ws.readyState === WebSocket.OPEN;
  const isHttpOnline = !!presence && (Date.now() - presence.lastActive < 35000);
  const isOnline = isWsOnline || isHttpOnline;

  res.json({
    code: rawCode,
    normCode: norm,
    exists: !!client || !!presence,
    online: isOnline,
    name: client?.name || presence?.name || null,
  });
});

// Get current paired session status for a user
app.get("/api/session/status/:code", (req, res) => {
  const rawCode = req.params.code || "";
  const session = getActiveSessionForUser(rawCode);
  res.json(session);
});

// Disconnect an active paired session
app.post("/api/session/disconnect", (req, res) => {
  const { code1, code2 } = req.body;
  if (code1 && code2) {
    const pair = getPairKey(code1, code2);
    activePairSessions.delete(pair);

    const norm1 = normalizeCode(code1);
    const norm2 = normalizeCode(code2);
    const cl1 = activeClients.get(norm1);
    const cl2 = activeClients.get(norm2);
    if (cl1 && cl1.ws.readyState === WebSocket.OPEN) {
      cl1.ws.send(JSON.stringify({ type: "session_disconnected" }));
    }
    if (cl2 && cl2.ws.readyState === WebSocket.OPEN) {
      cl2.ws.send(JSON.stringify({ type: "session_disconnected" }));
    }
  }
  res.json({ success: true });
});

// Send message via HTTP fallback
app.post("/api/messages/send", (req, res) => {
  const msg: ChatMessage = req.body;
  if (!msg || !msg.senderCode || !msg.recipientCode) {
    return res.status(400).json({ error: "Invalid message payload" });
  }

  const key = getPairKey(msg.senderCode, msg.recipientCode);
  const history = conversationHistory.get(key) || [];
  const existingIdx = history.findIndex((m) => m.id === msg.id);
  if (existingIdx >= 0) {
    history[existingIdx] = msg;
  } else {
    history.push(msg);
  }
  conversationHistory.set(key, history.slice(-200));

  // If recipient has WS open, deliver immediately
  const recNorm = normalizeCode(msg.recipientCode);
  const recClient = activeClients.get(recNorm);
  let delivered = false;
  if (recClient && recClient.ws.readyState === WebSocket.OPEN) {
    recClient.ws.send(
      JSON.stringify({
        type: "new_message",
        message: msg,
      })
    );
    delivered = true;
  }

  res.json({ success: true, delivered, message: msg });
});

app.get("/api/conversations/:myCode/:peerCode", (req, res) => {
  const myCode = req.params.myCode || "";
  const peerCode = req.params.peerCode || "";
  const key = getPairKey(myCode, peerCode);
  const history = conversationHistory.get(key) || [];
  res.json({ messages: history.slice(-50) });
});

app.delete("/api/conversations/:myCode/:peerCode", (req, res) => {
  const myCode = req.params.myCode || "";
  const peerCode = req.params.peerCode || "";
  const key = getPairKey(myCode, peerCode);
  conversationHistory.delete(key);
  res.json({ success: true });
});

// Digital Asset Links for Android TWA (Google Play Store verification)
app.get("/.well-known/assetlinks.json", (_req, res) => {
  const assetLinksPath = path.join(process.cwd(), "public", ".well-known", "assetlinks.json");
  res.setHeader("Content-Type", "application/json");
  res.sendFile(assetLinksPath);
});

async function startServer() {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 * 1024 });

  server.on("upgrade", (request, socket, head) => {
    const protocol = request.headers["sec-websocket-protocol"] || "";
    // If request is from Vite HMR client or contains vite-hmr protocol, quietly destroy
    if (
      (typeof protocol === "string" && protocol.includes("vite-hmr")) ||
      request.url?.includes("/@vite/") ||
      request.url?.includes("__vite_ping")
    ) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws);
    });
  });

  wss.on("connection", (ws: WebSocket) => {
    let currentUserCode: string | null = null;
    let currentNormCode: string | null = null;

    ws.on("message", (raw: string) => {
      try {
        const data = JSON.parse(raw.toString());

        switch (data.type) {
          case "register": {
            const userCode = (data.userCode || "").trim();
            const norm = normalizeCode(userCode);
            const name = (data.name || `User ${norm.slice(-3)}`).trim();

            if (!norm) {
              ws.send(JSON.stringify({ type: "error", message: "User code cannot be empty" }));
              return;
            }

            currentUserCode = userCode;
            currentNormCode = norm;

            activeClients.set(norm, {
              ws,
              userCode,
              normCode: norm,
              name,
              lastActive: Date.now(),
            });

            activeUsers.set(norm, {
              userCode,
              normCode: norm,
              name,
              lastActive: Date.now(),
            });

            ws.send(
              JSON.stringify({
                type: "registered",
                userCode,
                normCode: norm,
                name,
                activeCount: getActiveCount(),
              })
            );

            // Notify online status
            broadcastPeerStatus(userCode, true, name);

            // Sync pending message requests
            notifyRequestsUpdate(userCode);

            // If there is any pending incoming request for this user, trigger incoming alert
            const incomingReqs = pendingRequests.get(norm) || [];
            if (incomingReqs.length > 0) {
              const latest = incomingReqs[0];
              ws.send(
                JSON.stringify({
                  type: "incoming_connection_request",
                  fromCode: latest.fromCode,
                  fromName: latest.fromName,
                  timestamp: latest.timestamp,
                  allIncoming: incomingReqs,
                })
              );
            }
            break;
          }

          case "get_pending_requests": {
            if (currentUserCode) {
              notifyRequestsUpdate(currentUserCode);
            }
            break;
          }

          case "ping": {
            if (currentNormCode) {
              if (activeClients.has(currentNormCode)) {
                activeClients.get(currentNormCode)!.lastActive = Date.now();
              }
              const u = activeUsers.get(currentNormCode);
              if (u) u.lastActive = Date.now();
            }
            ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
            break;
          }

          case "check_peer": {
            const rawPeer = (data.peerCode || "").trim();
            const norm = normalizeCode(rawPeer);
            const peer = activeClients.get(norm);
            const isOnline = !!peer && peer.ws.readyState === WebSocket.OPEN;
            ws.send(
              JSON.stringify({
                type: "peer_status",
                peerCode: rawPeer,
                online: isOnline,
                name: peer?.name || "",
              })
            );
            break;
          }

          // AnyDesk-style Connection / Message Request
          case "request_connection": {
            if (!currentNormCode || !currentUserCode) {
              ws.send(JSON.stringify({ type: "error", message: "Not registered yet" }));
              return;
            }

            const targetRaw = (data.to || "").trim();
            const targetNorm = normalizeCode(targetRaw);

            if (!targetNorm) {
              ws.send(JSON.stringify({ type: "request_failed", reason: "invalid_code", message: "সঠিক কোড প্রবেশ করান" }));
              return;
            }

            if (targetNorm === currentNormCode) {
              ws.send(JSON.stringify({ type: "request_failed", reason: "self_connection", message: "নিজের কোডে কানেকশন রিকোয়েস্ট পাঠানো যাবে না" }));
              return;
            }

            const sender = activeClients.get(currentNormCode);
            const senderName = sender?.name || currentUserCode;
            const target = activeClients.get(targetNorm);
            const isTargetOnline = !!target && target.ws.readyState === WebSocket.OPEN;

            // Save in persistent pending requests queue!
            const storedReq = addStoredRequest(currentUserCode, senderName, target?.userCode || targetRaw);

            // Acknowledge to requester
            ws.send(
              JSON.stringify({
                type: "request_sent",
                toCode: target?.userCode || targetRaw,
                peerName: target?.name || targetRaw,
                isOnline: isTargetOnline,
                message: isTargetOnline
                  ? `${target?.userCode || targetRaw} কোডে অনুরোধ পাঠানো হয়েছে। অনুমোদনের অপেক্ষায়...`
                  : `${targetRaw} কোডে অনুরোধ পাঠানো ও সেভ করা হয়েছে। অপর পাশের ব্যবহারকারী অ্যাপ খুললে রিকোয়েস্ট দেখতে পাবেন।`,
              })
            );

            // If target is currently online, immediately send real-time incoming request alert
            if (isTargetOnline && target) {
              const targetIncoming = pendingRequests.get(targetNorm) || [];
              target.ws.send(
                JSON.stringify({
                  type: "incoming_connection_request",
                  fromCode: currentUserCode,
                  fromName: senderName,
                  timestamp: storedReq.timestamp,
                  allIncoming: targetIncoming,
                })
              );
            }

            // Sync updated request lists to both parties
            notifyRequestsUpdate(currentUserCode);
            notifyRequestsUpdate(targetRaw);
            break;
          }

          // User accepts incoming request
          case "accept_connection": {
            if (!currentNormCode || !currentUserCode) return;

            const requesterRaw = (data.to || "").trim();
            const requesterNorm = normalizeCode(requesterRaw);
            const requester = activeClients.get(requesterNorm);

            const acceptor = activeClients.get(currentNormCode);
            const acceptorName = acceptor?.name || currentUserCode;

            // Remove from pending requests
            removeStoredRequest(currentNormCode, requesterNorm);

            // Mark session as active
            const pairKey = getPairKey(currentNormCode, requesterNorm);
            activePairSessions.add(pairKey);

            // Notify acceptor
            ws.send(
              JSON.stringify({
                type: "connection_accepted",
                peerCode: requester?.userCode || requesterRaw,
                peerName: requester?.name || requesterRaw,
              })
            );

            // Notify requester
            if (requester && requester.ws.readyState === WebSocket.OPEN) {
              requester.ws.send(
                JSON.stringify({
                  type: "connection_accepted",
                  peerCode: currentUserCode,
                  peerName: acceptorName,
                })
              );
            }

            notifyRequestsUpdate(currentUserCode);
            notifyRequestsUpdate(requesterRaw);
            break;
          }

          // User rejects incoming request
          case "reject_connection": {
            if (!currentNormCode || !currentUserCode) return;

            const requesterRaw = (data.to || "").trim();
            const requesterNorm = normalizeCode(requesterRaw);
            const requester = activeClients.get(requesterNorm);

            const rejector = activeClients.get(currentNormCode);
            const rejectorName = rejector?.name || currentUserCode;

            // Remove from pending requests
            removeStoredRequest(currentNormCode, requesterNorm);

            if (requester && requester.ws.readyState === WebSocket.OPEN) {
              requester.ws.send(
                JSON.stringify({
                  type: "connection_rejected",
                  peerCode: currentUserCode,
                  peerName: rejectorName,
                })
              );
            }

            notifyRequestsUpdate(currentUserCode);
            notifyRequestsUpdate(requesterRaw);
            break;
          }

          // Requester cancels waiting request
          case "cancel_connection_request": {
            if (!currentNormCode || !currentUserCode) return;

            const targetRaw = (data.to || "").trim();
            const targetNorm = normalizeCode(targetRaw);
            const target = activeClients.get(targetNorm);

            // Remove from pending requests
            removeStoredRequest(currentNormCode, targetNorm);

            if (target && target.ws.readyState === WebSocket.OPEN) {
              target.ws.send(
                JSON.stringify({
                  type: "connection_request_cancelled",
                  fromCode: currentUserCode,
                })
              );
            }

            notifyRequestsUpdate(currentUserCode);
            notifyRequestsUpdate(targetRaw);
            break;
          }

          // End/Disconnect active session (AnyDesk disconnect)
          case "disconnect_session": {
            if (!currentNormCode || !currentUserCode) return;

            const peerRaw = (data.to || "").trim();
            const peerNorm = normalizeCode(peerRaw);
            const pairKey = getPairKey(currentNormCode, peerNorm);
            activePairSessions.delete(pairKey);

            const peer = activeClients.get(peerNorm);

            ws.send(
              JSON.stringify({
                type: "session_disconnected",
                peerCode: peer?.userCode || peerRaw,
                reason: "self_disconnected",
              })
            );

            if (peer && peer.ws.readyState === WebSocket.OPEN) {
              peer.ws.send(
                JSON.stringify({
                  type: "session_disconnected",
                  peerCode: currentUserCode,
                  reason: "peer_disconnected",
                })
              );
            }
            break;
          }

          case "typing": {
            const recipientRaw = (data.to || "").trim();
            const recipientNorm = normalizeCode(recipientRaw);
            const target = activeClients.get(recipientNorm);
            if (target && target.ws.readyState === WebSocket.OPEN && currentUserCode) {
              target.ws.send(
                JSON.stringify({
                  type: "typing",
                  from: currentUserCode,
                  isTyping: !!data.isTyping,
                })
              );
            }
            break;
          }

          case "message": {
            if (!currentUserCode || !currentNormCode) {
              ws.send(JSON.stringify({ type: "error", message: "Not registered yet" }));
              return;
            }

            const recipientRaw = (data.to || "").trim();
            const recipientNorm = normalizeCode(recipientRaw);
            const content = (data.content || "").trim();
            const hasMedia = !!(data.mediaUrl || data.drawingData);

            if (!recipientNorm || (!content && !hasMedia)) {
              ws.send(JSON.stringify({ type: "error", message: "Recipient and message content or media required" }));
              return;
            }

            const sender = activeClients.get(currentNormCode);
            const senderName = sender?.name || currentUserCode;

            const ttlSeconds = typeof data.ttlSeconds === 'number' && data.ttlSeconds > 0 ? data.ttlSeconds : undefined;
            const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;

            const chatMsg: ChatMessage = {
              id: data.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              senderCode: currentUserCode,
              senderName,
              recipientCode: recipientRaw,
              content,
              msgType: data.msgType || (data.drawingData ? 'drawing' : data.mediaUrl ? 'image' : 'text'),
              mediaUrl: data.mediaUrl,
              mediaInfo: data.mediaInfo,
              drawingData: data.drawingData,
              theme: data.theme || "neon",
              sound: data.sound !== false,
              timestamp: Date.now(),
              ttlSeconds,
              expiresAt,
            };

            // Save to conversation history
            const pairKey = getPairKey(currentNormCode, recipientNorm);
            if (!conversationHistory.has(pairKey)) {
              conversationHistory.set(pairKey, []);
            }
            const history = conversationHistory.get(pairKey)!;
            history.push(chatMsg);
            if (history.length > 200) history.shift();

            // Deliver to recipient if connected
            const target = activeClients.get(recipientNorm);
            const isDelivered = target && target.ws.readyState === WebSocket.OPEN;

            if (isDelivered) {
              target.ws.send(
                JSON.stringify({
                  type: "new_message",
                  message: chatMsg,
                  isIncomingFullDisplay: true,
                })
              );
            }

            // Acknowledge to sender with delivery status
            ws.send(
              JSON.stringify({
                type: "message_sent",
                message: chatMsg,
                delivered: !!isDelivered,
              })
            );
            break;
          }

          case "edit_message": {
            if (!currentUserCode || !currentNormCode) {
              ws.send(JSON.stringify({ type: "error", message: "Not registered yet" }));
              return;
            }

            const messageId = (data.messageId || "").trim();
            const recipientRaw = (data.to || "").trim();
            const recipientNorm = normalizeCode(recipientRaw);
            const newContent = (data.newContent || "").trim();

            if (!messageId || !newContent || !recipientNorm) {
              ws.send(JSON.stringify({ type: "error", message: "Missing edit parameters" }));
              return;
            }

            const pairKey = getPairKey(currentNormCode, recipientNorm);
            const history = conversationHistory.get(pairKey);
            if (history) {
              const msg = history.find((m) => m.id === messageId);
              if (msg && normalizeCode(msg.senderCode) === currentNormCode) {
                msg.content = newContent;
                msg.isEdited = true;
                msg.editedAt = Date.now();
              }
            }

            // Notify recipient
            const target = activeClients.get(recipientNorm);
            if (target && target.ws.readyState === WebSocket.OPEN) {
              target.ws.send(
                JSON.stringify({
                  type: "message_edited",
                  messageId,
                  newContent,
                  editedAt: Date.now(),
                  fromCode: currentUserCode,
                })
              );
            }

            // Acknowledge to sender
            ws.send(
              JSON.stringify({
                type: "message_edited",
                messageId,
                newContent,
                editedAt: Date.now(),
                fromCode: currentUserCode,
              })
            );
            break;
          }

          case "delete_message": {
            if (!currentUserCode || !currentNormCode) {
              ws.send(JSON.stringify({ type: "error", message: "Not registered yet" }));
              return;
            }

            const messageId = (data.messageId || "").trim();
            const recipientRaw = (data.to || "").trim();
            const recipientNorm = normalizeCode(recipientRaw);
            const deleteForEveryone = !!data.deleteForEveryone;

            if (!messageId || !recipientNorm) {
              ws.send(JSON.stringify({ type: "error", message: "Missing delete parameters" }));
              return;
            }

            const pairKey = getPairKey(currentNormCode, recipientNorm);
            const history = conversationHistory.get(pairKey);
            if (history) {
              if (deleteForEveryone) {
                const msgIndex = history.findIndex((m) => m.id === messageId);
                if (msgIndex !== -1) {
                  const msg = history[msgIndex];
                  msg.isDeletedForEveryone = true;
                  msg.content = "এই বার্তাটি মুছে ফেলা হয়েছে (Deleted for everyone)";
                  msg.mediaUrl = undefined;
                  msg.drawingData = undefined;
                  msg.deletedAt = Date.now();
                }
              }
            }

            // If delete for everyone, notify recipient
            if (deleteForEveryone) {
              const target = activeClients.get(recipientNorm);
              if (target && target.ws.readyState === WebSocket.OPEN) {
                target.ws.send(
                  JSON.stringify({
                    type: "message_deleted",
                    messageId,
                    deleteForEveryone: true,
                    fromCode: currentUserCode,
                  })
                );
              }
            }

            // Acknowledge sender
            ws.send(
              JSON.stringify({
                type: "message_deleted",
                messageId,
                deleteForEveryone,
                fromCode: currentUserCode,
              })
            );
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error("WS message parse error:", err);
      }
    });

    ws.on("close", () => {
      if (currentNormCode && currentUserCode) {
        const client = activeClients.get(currentNormCode);
        if (client && client.ws === ws) {
          activeClients.delete(currentNormCode);
          broadcastPeerStatus(currentUserCode, false);

          // Find active pair sessions and notify partner
          for (const key of Array.from(activePairSessions)) {
            if (key.includes(currentNormCode)) {
              activePairSessions.delete(key);
              const parts = key.split(":");
              const otherNorm = parts[0] === currentNormCode ? parts[1] : parts[0];
              const otherClient = activeClients.get(otherNorm);
              if (otherClient && otherClient.ws.readyState === WebSocket.OPEN) {
                otherClient.ws.send(
                  JSON.stringify({
                    type: "session_disconnected",
                    peerCode: currentUserCode,
                    reason: "peer_disconnected",
                  })
                );
              }
            }
          }
        }
      }
    });

    ws.on("error", (err) => {
      console.error("WS error:", err);
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server and WebSocket running on http://localhost:${PORT}`);
  });
}

startServer();
