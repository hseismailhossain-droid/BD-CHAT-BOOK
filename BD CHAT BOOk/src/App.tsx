import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  UserIdentity,
  PeerContact,
  ChatMessage,
  DisplayTheme,
  WebSocketMessage,
  ConnectionRequest,
} from './types';
import {
  getStoredIdentity,
  saveStoredIdentity,
  createNewIdentity,
  getStoredPeers,
  addOrUpdatePeer,
  saveStoredPeers,
  formatCode,
  normalizeCode,
} from './utils/codeGenerator';
import {
  playFullDisplayAlert,
  playSendSound,
  playConnectedSound,
  playDisconnectSound,
} from './utils/audio';
import {
  saveMessageToLocal,
  getMessagesFromLocal,
  deleteConversationFromLocal,
  getPendingOfflineMessages,
  markMessageSent,
  updateLocalMessage,
  deleteMessageFromLocal,
  cleanExpiredMessages,
} from './utils/storage';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  requestNotificationPermission,
  triggerSystemNotification,
} from './utils/mobilePopup';
import { UserHeader } from './components/UserHeader';
import { PeerConnector, ConnectionStatus } from './components/PeerConnector';
import { ChatView } from './components/ChatView';
import { FullDisplayOverlay } from './components/FullDisplayOverlay';
import { DrawingBoardModal } from './components/DrawingBoardModal';
import { MediaUploadModal } from './components/MediaUploadModal';
import { VoiceRecorderModal } from './components/VoiceRecorderModal';
import { IncomingRequestModal } from './components/IncomingRequestModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { OfflineTextTransferModal } from './components/OfflineTextTransferModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AppOpeningAnimation } from './components/AppOpeningAnimation';
import { MessagingVectorIllustration } from './components/MessagingVectorIllustration';
import { AnimatePresence } from 'motion/react';
import { localP2PMesh, MeshPacket } from './utils/p2pMesh';
import {
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Zap,
  Palette,
  Film,
  Mic,
  AlertCircle,
  CheckCircle2,
  PhoneCall,
  QrCode,
  Maximize2,
  WifiOff,
  Radio,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  const [identity, setIdentity] = useState<UserIdentity>(getStoredIdentity);
  const [recentPeers, setRecentPeers] = useState<PeerContact[]>(getStoredPeers);

  // AnyDesk Connection & Session State
  const [sessionStatus, setSessionStatus] = useState<ConnectionStatus>('idle');
  const [currentPeerCode, setCurrentPeerCode] = useState<string | null>(null);
  const [currentPeerName, setCurrentPeerName] = useState<string | undefined>(undefined);
  const [pendingTargetCode, setPendingTargetCode] = useState<string | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<ConnectionRequest | null>(null);
  const [sessionNotification, setSessionNotification] = useState<{
    text: string;
    type: 'info' | 'error' | 'success';
  } | null>(null);

  const [isPeerOnline, setIsPeerOnline] = useState<boolean>(false);
  const [isPeerTyping, setIsPeerTyping] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineCount, setOnlineCount] = useState<number>(0);

  // Full Display message state
  const [activeFullDisplayMessage, setActiveFullDisplayMessage] = useState<ChatMessage | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

  // Modals for drawing, media, and voice
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState<boolean>(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  // User preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [autoFullDisplay, setAutoFullDisplay] = useState<boolean>(true);

  // Offline State & Sync
  const isOnline = useOnlineStatus();
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(0);

  // Offline Text QR Transfer Modal
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState<boolean>(false);
  const [offlineInitialText, setOfflineInitialText] = useState<string>('');

  // Profile modal and Opening entrance animation states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [showOpeningAnimation, setShowOpeningAnimation] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const alreadyShown = sessionStorage.getItem('fc_opening_shown');
      return !alreadyShown;
    }
    return false;
  });

  const handleFinishOpening = useCallback(() => {
    setShowOpeningAnimation(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('fc_opening_shown', 'true');
    }
  }, []);

  const handleReplayOpening = useCallback(() => {
    setShowOpeningAnimation(true);
  }, []);

  const handleUpdateIdentity = useCallback((updated: UserIdentity) => {
    setIdentity(updated);
    saveStoredIdentity(updated);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'register',
          userCode: updated.code,
          name: updated.name,
        })
      );
    }
    setSessionNotification({
      text: 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে!',
      type: 'success',
    });
  }, []);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Request system notification permission on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      requestNotificationPermission();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
  }, []);

  // Track pending offline messages
  useEffect(() => {
    getPendingOfflineMessages(identity.code).then((pending) => {
      setPendingOfflineCount(pending.length);
    });
  }, [identity.code, messages]);

  // Dismiss notifications automatically
  useEffect(() => {
    if (sessionNotification) {
      const timer = setTimeout(() => setSessionNotification(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [sessionNotification]);

  // Seamless Local P2P Mesh listener (Zero Internet, Natural Offline Delivery without QR)
  useEffect(() => {
    const unsubscribe = localP2PMesh.subscribe((packet: MeshPacket) => {
      const myNorm = normalizeCode(identity.code);
      const toNorm = normalizeCode(packet.toCode);
      const fromNorm = normalizeCode(packet.fromCode);

      // Packet must be intended for this device/identity
      if (toNorm !== myNorm) return;

      switch (packet.type) {
        case 'mesh_connection_request': {
          setIncomingRequest({
            fromCode: formatCode(packet.fromCode),
            fromName: packet.fromName || 'অপরিচিত ব্যবহারকারী',
            timestamp: packet.timestamp,
          });
          if (soundEnabled) {
            playConnectedSound();
          }
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
          break;
        }

        case 'mesh_accept_connection': {
          const formattedPeer = formatCode(packet.fromCode);
          setSessionStatus('connected');
          setCurrentPeerCode(formattedPeer);
          setCurrentPeerName(packet.fromName || undefined);
          setIsPeerOnline(true);
          setPendingTargetCode(null);
          setIncomingRequest(null);
          if (soundEnabled) {
            playConnectedSound();
          }
          const updated = addOrUpdatePeer({
            code: formattedPeer,
            name: packet.fromName,
            lastTimestamp: Date.now(),
          });
          setRecentPeers(updated);
          setSessionNotification({
            text: `সফলভাবে ${formattedPeer}-এর সাথে সংযুক্ত হয়েছেন!`,
            type: 'success',
          });
          break;
        }

        case 'mesh_reject_connection': {
          setSessionStatus('idle');
          setPendingTargetCode(null);
          if (soundEnabled) {
            playDisconnectSound();
          }
          setSessionNotification({
            text: `${packet.fromCode || 'ব্যবহারকারী'} অনুরোধটি প্রত্যাখ্যান করেছেন।`,
            type: 'error',
          });
          break;
        }

        case 'mesh_cancel_request': {
          if (incomingRequest && normalizeCode(incomingRequest.fromCode) === fromNorm) {
            setIncomingRequest(null);
          }
          break;
        }

        case 'mesh_disconnect': {
          if (currentPeerCode && normalizeCode(currentPeerCode) === fromNorm) {
            setSessionStatus('idle');
            setCurrentPeerCode(null);
            setPendingTargetCode(null);
            setMessages([]);
            if (soundEnabled) {
              playDisconnectSound();
            }
            setSessionNotification({
              text: 'সেশন সমাপ্ত হয়েছে (সংযোগ বিচ্ছিন্ন)।',
              type: 'info',
            });
          }
          break;
        }

        case 'mesh_typing': {
          if (currentPeerCode && normalizeCode(currentPeerCode) === fromNorm) {
            setIsPeerTyping(!!packet.isTyping);
          }
          break;
        }

        case 'mesh_text_message': {
          if (packet.message) {
            const newMsg = packet.message;
            saveMessageToLocal(newMsg);

            const senderFormatted = formatCode(packet.fromCode);
            setCurrentPeerCode(senderFormatted);
            setSessionStatus('connected');
            setIsPeerOnline(true);

            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            const previewText =
              newMsg.msgType === 'drawing'
                ? '🎨 ড্রয়িং বার্তা'
                : newMsg.msgType === 'image'
                ? '📷 ছবি'
                : newMsg.msgType === 'video'
                ? '🎬 ভিডিও'
                : newMsg.msgType === 'audio'
                ? '🎙️ ভয়েস বার্তা'
                : newMsg.content;

            const updatedList = addOrUpdatePeer({
              code: senderFormatted,
              name: packet.fromName,
              lastMessage: previewText,
              lastTimestamp: newMsg.timestamp,
            });
            setRecentPeers(updatedList);

            if (soundEnabled) {
              playFullDisplayAlert(newMsg.theme || 'neon');
            }

            triggerSystemNotification(newMsg, () => {
              setIsPreviewMode(false);
              setActiveFullDisplayMessage(newMsg);
            });

            if (autoFullDisplay) {
              setIsPreviewMode(false);
              setActiveFullDisplayMessage(newMsg);
            }

            // Acknowledge receipt back to sender
            localP2PMesh.broadcast({
              type: 'mesh_delivery_receipt',
              fromCode: identity.code,
              toCode: packet.fromCode,
              timestamp: Date.now(),
              message: newMsg,
            });
          }
          break;
        }

        case 'mesh_delivery_receipt': {
          if (packet.message?.id) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === packet.message?.id
                  ? { ...m, delivered: true, pendingOffline: false }
                  : m
              )
            );
            markMessageSent(packet.message.id);
          }
          break;
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [
    identity.code,
    identity.name,
    currentPeerCode,
    soundEnabled,
    autoFullDisplay,
    incomingRequest,
  ]);

  // 1. Initialize from URL parameter ?connect=CODE
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const targetCode = params.get('connect');
      if (targetCode && normalizeCode(targetCode) !== normalizeCode(identity.code)) {
        const formatted = formatCode(targetCode);
        handleRequestConnection(formatted);
      }
    }
  }, [identity.code]);

  // 2. Fetch past conversation history from local IndexedDB first, then server
  useEffect(() => {
    if (!currentPeerCode || sessionStatus !== 'connected') {
      setMessages([]);
      return;
    }

    let isSubscribed = true;

    // Clean expired TTL messages locally on connect
    cleanExpiredMessages().then((expiredIds) => {
      if (expiredIds.length > 0 && isSubscribed) {
        setMessages((prev) => prev.filter((m) => !expiredIds.includes(m.id)));
      }
    });

    // Load from local IndexedDB immediately
    getMessagesFromLocal(identity.code, currentPeerCode).then((localMsgs) => {
      if (isSubscribed && localMsgs && localMsgs.length > 0) {
        const now = Date.now();
        setMessages(localMsgs.filter((m) => !m.expiresAt || m.expiresAt > now));
      }
    });

    // Reconcile with server history
    const fetchServerHistory = async () => {
      try {
        const res = await fetch(`/api/conversations/${identity.code}/${currentPeerCode}`);
        if (res.ok && isSubscribed) {
          const data = await res.json();
          if (data.messages && Array.isArray(data.messages)) {
            setMessages((prev) => {
              const map = new Map<string, ChatMessage>();
              prev.forEach((m) => map.set(m.id, m));
              data.messages.forEach((m: ChatMessage) => {
                map.set(m.id, m);
                saveMessageToLocal(m);
              });
              return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
            });
          }
        }
      } catch (err) {
        console.debug('Could not load past conversation history from server:', err);
      }
    };

    fetchServerHistory();

    // Check if peer is online
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'check_peer',
          peerCode: currentPeerCode,
        })
      );
    }

    // Setup periodic expired message cleaner (runs every 3 seconds)
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setMessages((prev) => {
        const hasExpired = prev.some((m) => m.expiresAt && m.expiresAt <= now);
        if (!hasExpired) return prev;
        return prev.filter((m) => !m.expiresAt || m.expiresAt > now);
      });
      cleanExpiredMessages();
    }, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(cleanupInterval);
    };
  }, [currentPeerCode, identity.code, sessionStatus]);

  // 3. WebSocket Connection & AnyDesk Protocol Handler
  const connectWebSocket = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const envWsUrl = (import.meta.env.VITE_WS_URL as string | undefined)?.trim();
    const wsUrl = envWsUrl || `${protocol}//${window.location.host}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);

      // Register identity
      ws.send(
        JSON.stringify({
          type: 'register',
          userCode: identity.code,
          name: identity.name,
        })
      );

      // Setup keepalive ping
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);

        switch (data.type) {
          case 'registered': {
            if (data.activeCount !== undefined) {
              setOnlineCount(data.activeCount);
            }
            break;
          }

          case 'peer_status': {
            if (
              data.peerCode &&
              currentPeerCode &&
              normalizeCode(data.peerCode) === normalizeCode(currentPeerCode)
            ) {
              setIsPeerOnline(!!data.online);
              if (data.name) setCurrentPeerName(data.name);
            }
            break;
          }

          // State 1: Request sent to remote peer
          case 'request_sent': {
            setSessionStatus('requesting');
            setPendingTargetCode(data.toCode || null);
            setSessionNotification({
              text: `${data.toCode} কোডে অনুরোধ পাঠানো হয়েছে। অনুমোদনের অপেক্ষায়...`,
              type: 'info',
            });
            break;
          }

          // State 2: Request failed (offline, invalid, self)
          case 'request_failed': {
            setSessionStatus('idle');
            setPendingTargetCode(null);
            const errorText = typeof data.message === 'string' ? data.message : 'অনুরোধ পাঠানো সম্ভব হয়নি';
            setSessionNotification({
              text: errorText,
              type: 'error',
            });
            break;
          }

          // State 3: Incoming Connection Request (AnyDesk incoming ring!)
          case 'incoming_connection_request': {
            if (data.fromCode) {
              setIncomingRequest({
                fromCode: data.fromCode,
                fromName: data.fromName || 'User',
                timestamp: data.timestamp || Date.now(),
              });
            }
            break;
          }

          // Remote party cancelled request before approval
          case 'connection_request_cancelled': {
            if (
              incomingRequest &&
              normalizeCode(incomingRequest.fromCode) === normalizeCode(data.fromCode || '')
            ) {
              setIncomingRequest(null);
              setSessionNotification({
                text: `${data.fromCode} অনুরোধ বাতিল করেছেন`,
                type: 'info',
              });
            }
            break;
          }

          // State 4: Connection Accepted! Active session started
          case 'connection_accepted': {
            if (data.peerCode) {
              const formattedPeer = formatCode(data.peerCode);
              setSessionStatus('connected');
              setCurrentPeerCode(formattedPeer);
              setCurrentPeerName(data.peerName || undefined);
              setIsPeerOnline(true);
              setPendingTargetCode(null);
              setIncomingRequest(null);

              if (soundEnabled) {
                playConnectedSound();
              }

              // Update recent peers
              const updated = addOrUpdatePeer({
                code: formattedPeer,
                name: data.peerName,
                lastTimestamp: Date.now(),
              });
              setRecentPeers(updated);

              setSessionNotification({
                text: `সফলভাবে ${formattedPeer}-এর সাথে সংযুক্ত হয়েছেন!`,
                type: 'success',
              });
            }
            break;
          }

          // State 5: Connection Rejected
          case 'connection_rejected': {
            setSessionStatus('idle');
            setPendingTargetCode(null);
            if (soundEnabled) {
              playDisconnectSound();
            }
            setSessionNotification({
              text: `${data.peerCode || 'ব্যবহারকারী'} অনুরোধটি প্রত্যাখ্যান করেছেন।`,
              type: 'error',
            });
            break;
          }

          // State 6: Session Disconnected (End session)
          case 'session_disconnected': {
            setSessionStatus('idle');
            setCurrentPeerCode(null);
            setPendingTargetCode(null);
            setMessages([]);
            if (soundEnabled) {
              playDisconnectSound();
            }
            setSessionNotification({
              text: 'সেশন সমাপ্ত হয়েছে (সংযোগ বিচ্ছিন্ন)।',
              type: 'info',
            });
            break;
          }

          case 'typing': {
            if (
              data.from &&
              currentPeerCode &&
              normalizeCode(data.from) === normalizeCode(currentPeerCode)
            ) {
              setIsPeerTyping(!!data.isTyping);
            }
            break;
          }

          case 'new_message': {
            if (data.message && typeof data.message === 'object') {
              const newMsg = data.message as ChatMessage;
              const senderCode = newMsg.senderCode;

              // Save to local storage for offline durability
              saveMessageToLocal(newMsg);

              // Add to message feed if connected with this peer
              if (
                currentPeerCode &&
                normalizeCode(senderCode) === normalizeCode(currentPeerCode)
              ) {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === newMsg.id)) return prev;
                  return [...prev, newMsg];
                });
              }

              // Update recent peers list
              const previewText =
                newMsg.msgType === 'drawing'
                  ? '🎨 ড্রয়িং বার্তা'
                  : newMsg.msgType === 'image'
                  ? '📷 ছবি'
                  : newMsg.msgType === 'video'
                  ? '🎬 ভিডিও'
                  : newMsg.msgType === 'audio'
                  ? '🎙️ ভয়েস বার্তা'
                  : newMsg.content;

              const updatedList = addOrUpdatePeer({
                code: formatCode(senderCode),
                name: newMsg.senderName,
                lastMessage: previewText,
                lastTimestamp: newMsg.timestamp,
              });
              setRecentPeers(updatedList);

              // Sound alert
              if (soundEnabled) {
                playFullDisplayAlert(newMsg.theme || 'neon');
              }

              // Trigger System Notification & Mobile Vibration
              triggerSystemNotification(newMsg, () => {
                setIsPreviewMode(false);
                setActiveFullDisplayMessage(newMsg);
              });

              // Trigger Full Display View automatically if enabled
              if (autoFullDisplay) {
                setIsPreviewMode(false);
                setActiveFullDisplayMessage(newMsg);
              }
            }
            break;
          }

          case 'message_sent': {
            if (data.message && typeof data.message === 'object') {
              const sentMsg: ChatMessage = { ...(data.message as ChatMessage), delivered: !!data.delivered };
              saveMessageToLocal(sentMsg);
              setMessages((prev) => {
                const idx = prev.findIndex((m) => m.id === sentMsg.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = sentMsg;
                  return copy;
                }
                return [...prev, sentMsg];
              });
            }
            break;
          }

          case 'message_edited': {
            const messageId = data.messageId;
            const newContent = data.newContent;
            if (messageId && newContent) {
              updateLocalMessage(messageId, {
                content: newContent,
                isEdited: true,
                editedAt: data.editedAt || Date.now(),
              });
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === messageId
                    ? {
                        ...msg,
                        content: newContent,
                        isEdited: true,
                        editedAt: data.editedAt || Date.now(),
                      }
                    : msg
                )
              );
            }
            break;
          }

          case 'message_deleted': {
            const messageId = data.messageId;
            const deleteForEveryone = !!data.deleteForEveryone;
            if (messageId) {
              if (deleteForEveryone) {
                updateLocalMessage(messageId, {
                  isDeletedForEveryone: true,
                  content: 'এই বার্তাটি মুছে ফেলা হয়েছে (This message was deleted)',
                  mediaUrl: undefined,
                  drawingData: undefined,
                  deletedAt: Date.now(),
                });
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === messageId
                      ? {
                          ...msg,
                          isDeletedForEveryone: true,
                          content: 'এই বার্তাটি মুছে ফেলা হয়েছে (This message was deleted)',
                          mediaUrl: undefined,
                          drawingData: undefined,
                          deletedAt: Date.now(),
                        }
                      : msg
                  )
                );
              } else {
                deleteMessageFromLocal(messageId);
                setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
              }
            }
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('Failed to parse incoming WS message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };

    ws.onerror = (err) => {
      console.debug('WS error encountered:', err);
      ws.close();
    };
  }, [
    identity.code,
    identity.name,
    currentPeerCode,
    soundEnabled,
    autoFullDisplay,
    incomingRequest,
  ]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Synchronize pending offline messages when session becomes active
  useEffect(() => {
    if (
      sessionStatus === 'connected' &&
      currentPeerCode &&
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN
    ) {
      getPendingOfflineMessages(identity.code).then(async (pending) => {
        const peerPending = pending.filter(
          (m) => normalizeCode(m.recipientCode) === normalizeCode(currentPeerCode)
        );
        for (const msg of peerPending) {
          wsRef.current?.send(
            JSON.stringify({
              type: 'message',
              id: msg.id,
              to: currentPeerCode,
              content: msg.content,
              msgType: msg.msgType,
              drawingData: msg.drawingData,
              mediaUrl: msg.mediaUrl,
              mediaInfo: msg.mediaInfo,
              theme: msg.theme,
              sound: soundEnabled,
            })
          );
          await markMessageSent(msg.id);
        }
        if (peerPending.length > 0) {
          setSessionNotification({
            text: `${peerPending.length} টি অফলাইন বার্তা সফলভাবে সিঙ্ক ও পাঠানো হয়েছে!`,
            type: 'success',
          });
          const remaining = await getPendingOfflineMessages(identity.code);
          setPendingOfflineCount(remaining.length);
        }
      });
    }
  }, [sessionStatus, currentPeerCode, identity.code, soundEnabled]);

  // Request Connection to Remote Peer
  const handleRequestConnection = (targetCode: string) => {
    const formatted = formatCode(targetCode);
    setPendingTargetCode(formatted);
    setSessionStatus('requesting');

    let sentViaWs = false;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'request_connection',
          to: formatted,
        })
      );
      sentViaWs = true;
    }

    // Always dispatch to Local P2P Mesh for offline peer discovery
    localP2PMesh.sendDirectConnectionRequest(identity.code, identity.name, formatted);

    setSessionNotification({
      text: sentViaWs
        ? `${formatted}-এ সংযোগের অনুরোধ পাঠানো হয়েছে...`
        : `অফলাইন মোড: ${formatted}-এ সরাসরি কানেকশন রিকোয়েস্ট পাঠানো হয়েছে...`,
      type: 'info',
    });
  };

  // Cancel Pending Request
  const handleCancelRequest = () => {
    if (pendingTargetCode) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'cancel_connection_request',
            to: pendingTargetCode,
          })
        );
      }
      localP2PMesh.broadcast({
        type: 'mesh_cancel_request',
        fromCode: identity.code,
        toCode: pendingTargetCode,
        timestamp: Date.now(),
      });
    }
    setSessionStatus('idle');
    setPendingTargetCode(null);
  };

  // Accept Incoming Request
  const handleAcceptRequest = (fromCode: string) => {
    const formatted = formatCode(fromCode);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'accept_connection',
          to: formatted,
        })
      );
    }
    // Also dispatch on local P2P Mesh
    localP2PMesh.sendDirectAccept(identity.code, identity.name, formatted);

    setSessionStatus('connected');
    setCurrentPeerCode(formatted);
    setIsPeerOnline(true);
    setPendingTargetCode(null);
    setIncomingRequest(null);
    if (soundEnabled) {
      playConnectedSound();
    }
    const updated = addOrUpdatePeer({
      code: formatted,
      lastTimestamp: Date.now(),
    });
    setRecentPeers(updated);
  };

  // Reject Incoming Request
  const handleRejectRequest = (fromCode: string) => {
    const formatted = formatCode(fromCode);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'reject_connection',
          to: formatted,
        })
      );
    }
    localP2PMesh.broadcast({
      type: 'mesh_reject_connection',
      fromCode: identity.code,
      toCode: formatted,
      timestamp: Date.now(),
    });
    setIncomingRequest(null);
  };

  // Disconnect Active Session
  const handleDisconnectSession = () => {
    if (currentPeerCode) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'disconnect_session',
            to: currentPeerCode,
          })
        );
      }
      localP2PMesh.sendDirectDisconnect(identity.code, currentPeerCode);
    }
    setSessionStatus('idle');
    setCurrentPeerCode(null);
    setMessages([]);
    playDisconnectSound();
  };

  // Regenerate ID for this browser tab
  const handleRegenerateCode = () => {
    const newIdentity = createNewIdentity();
    setIdentity(newIdentity);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'register',
          userCode: newIdentity.code,
          name: newIdentity.name,
        })
      );
    }

    setSessionNotification({
      text: `আপনার নতুন কোড তৈরি হয়েছে: ${newIdentity.code}`,
      type: 'success',
    });
  };

  // Send Text Message
  const handleSendMessage = (content: string, theme: DisplayTheme, ttlSeconds?: number) => {
    if (!currentPeerCode || !content.trim()) return;

    const isSocketOpen = wsRef.current && wsRef.current.readyState === WebSocket.OPEN;
    const isActuallyOnline = isOnline && isSocketOpen;
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const expiresAt = ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : undefined;

    const outgoingMsg: ChatMessage = {
      id: msgId,
      senderCode: identity.code,
      senderName: identity.name,
      recipientCode: currentPeerCode,
      content,
      msgType: 'text',
      theme,
      timestamp: Date.now(),
      sound: true,
      delivered: false,
      pendingOffline: !isActuallyOnline,
      ttlSeconds,
      expiresAt,
    };

    saveMessageToLocal(outgoingMsg);
    setMessages((prev) => [...prev, outgoingMsg]);
    playSendSound();

    const updated = addOrUpdatePeer({
      code: currentPeerCode,
      name: currentPeerName,
      lastMessage: content,
      lastTimestamp: Date.now(),
    });
    setRecentPeers(updated);

    if (isActuallyOnline) {
      wsRef.current?.send(
        JSON.stringify({
          type: 'message',
          id: msgId,
          to: currentPeerCode,
          content,
          msgType: 'text',
          theme,
          sound: soundEnabled,
          ttlSeconds,
        })
      );
    }

    // Always dispatch to Local P2P Mesh for offline peer delivery
    localP2PMesh.sendDirectOfflineMessage(
      identity.code,
      identity.name,
      currentPeerCode,
      outgoingMsg
    );

    if (!isActuallyOnline) {
      setSessionNotification({
        text: 'অফলাইন মোড: টেক্সট বার্তা স্বাভাবিকভাবে পাঠানো হয়েছে (লোকাল P2P ও সিঙ্ক চালু)',
        type: 'info',
      });
      setPendingOfflineCount((c) => c + 1);
    }
  };

  // Send Drawing handler
  const handleSendDrawing = (drawingDataUrl: string, caption: string, theme: DisplayTheme) => {
    if (!currentPeerCode) return;

    const isSocketOpen = wsRef.current && wsRef.current.readyState === WebSocket.OPEN;
    const isActuallyOnline = isOnline && isSocketOpen;
    const msgId = `msg_draw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const outgoingMsg: ChatMessage = {
      id: msgId,
      senderCode: identity.code,
      senderName: identity.name,
      recipientCode: currentPeerCode,
      content: caption,
      msgType: 'drawing',
      drawingData: drawingDataUrl,
      mediaUrl: drawingDataUrl,
      theme,
      timestamp: Date.now(),
      sound: true,
      delivered: false,
      pendingOffline: !isActuallyOnline,
    };

    saveMessageToLocal(outgoingMsg);
    setMessages((prev) => [...prev, outgoingMsg]);
    playSendSound();

    const updated = addOrUpdatePeer({
      code: currentPeerCode,
      name: currentPeerName,
      lastMessage: '🎨 ড্রয়িং স্কেচ',
      lastTimestamp: Date.now(),
    });
    setRecentPeers(updated);

    if (isActuallyOnline) {
      wsRef.current?.send(
        JSON.stringify({
          type: 'message',
          id: msgId,
          to: currentPeerCode,
          content: caption,
          msgType: 'drawing',
          drawingData: drawingDataUrl,
          mediaUrl: drawingDataUrl,
          theme,
          sound: soundEnabled,
        })
      );
    }

    localP2PMesh.sendDirectOfflineMessage(
      identity.code,
      identity.name,
      currentPeerCode,
      outgoingMsg
    );

    if (!isActuallyOnline) {
      setSessionNotification({
        text: 'অফলাইন মোড: ড্রয়িং লোকাল স্টোরেজে সংরক্ষিত হয়েছে। সংযোগ ফিরলে স্বয়ংক্রিয়ভাবে পৌঁছাবে।',
        type: 'info',
      });
      setPendingOfflineCount((c) => c + 1);
    }
  };

  // Send Media handler
  const handleSendMedia = (
    type: 'image' | 'video',
    mediaUrl: string,
    caption: string,
    mediaInfo: {
      name?: string;
      size?: number;
      width?: number;
      height?: number;
      duration?: number;
    },
    theme: DisplayTheme
  ) => {
    if (!currentPeerCode) return;

    const isSocketOpen = wsRef.current && wsRef.current.readyState === WebSocket.OPEN;
    const isActuallyOnline = isOnline && isSocketOpen;
    const msgId = `msg_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const outgoingMsg: ChatMessage = {
      id: msgId,
      senderCode: identity.code,
      senderName: identity.name,
      recipientCode: currentPeerCode,
      content: caption,
      msgType: type,
      mediaUrl,
      mediaInfo,
      theme,
      timestamp: Date.now(),
      sound: true,
      delivered: false,
      pendingOffline: !isActuallyOnline,
    };

    saveMessageToLocal(outgoingMsg);
    setMessages((prev) => [...prev, outgoingMsg]);
    playSendSound();

    const updated = addOrUpdatePeer({
      code: currentPeerCode,
      name: currentPeerName,
      lastMessage: type === 'image' ? '📷 ছবি' : '🎬 ভিডিও',
      lastTimestamp: Date.now(),
    });
    setRecentPeers(updated);

    if (isActuallyOnline) {
      wsRef.current?.send(
        JSON.stringify({
          type: 'message',
          id: msgId,
          to: currentPeerCode,
          content: caption,
          msgType: type,
          mediaUrl,
          mediaInfo,
          theme,
          sound: soundEnabled,
        })
      );
    }

    localP2PMesh.sendDirectOfflineMessage(
      identity.code,
      identity.name,
      currentPeerCode,
      outgoingMsg
    );

    if (!isActuallyOnline) {
      setSessionNotification({
        text: 'অফলাইন মোড: মিডিয়া লোকাল স্টোরেজে সংরক্ষিত হয়েছে। সংযোগ ফিরলে পৌঁছাবে।',
        type: 'info',
      });
      setPendingOfflineCount((c) => c + 1);
    }
  };

  // Send Voice note handler
  const handleSendVoice = (
    audioDataUrl: string,
    duration: number,
    caption: string,
    theme: DisplayTheme
  ) => {
    if (!currentPeerCode) return;

    const isSocketOpen = wsRef.current && wsRef.current.readyState === WebSocket.OPEN;
    const isActuallyOnline = isOnline && isSocketOpen;
    const msgId = `msg_voice_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const outgoingMsg: ChatMessage = {
      id: msgId,
      senderCode: identity.code,
      senderName: identity.name,
      recipientCode: currentPeerCode,
      content: caption,
      msgType: 'audio',
      mediaUrl: audioDataUrl,
      mediaInfo: { duration },
      theme,
      timestamp: Date.now(),
      sound: true,
      delivered: false,
      pendingOffline: !isActuallyOnline,
    };

    saveMessageToLocal(outgoingMsg);
    setMessages((prev) => [...prev, outgoingMsg]);
    playSendSound();

    const updated = addOrUpdatePeer({
      code: currentPeerCode,
      name: currentPeerName,
      lastMessage: '🎙️ ভয়েস বার্তা',
      lastTimestamp: Date.now(),
    });
    setRecentPeers(updated);

    if (isActuallyOnline) {
      wsRef.current?.send(
        JSON.stringify({
          type: 'message',
          id: msgId,
          to: currentPeerCode,
          content: caption,
          msgType: 'audio',
          mediaUrl: audioDataUrl,
          mediaInfo: { duration },
          theme,
          sound: soundEnabled,
        })
      );
    }

    localP2PMesh.sendDirectOfflineMessage(
      identity.code,
      identity.name,
      currentPeerCode,
      outgoingMsg
    );

    if (!isActuallyOnline) {
      setSessionNotification({
        text: 'অফলাইন মোড: ভয়েস বার্তা লোকাল স্টোরেজে সংরক্ষিত হয়েছে। সংযোগ ফিরলে পৌঁছাবে।',
        type: 'info',
      });
      setPendingOfflineCount((c) => c + 1);
    }
  };

  // Clear Chat history handler
  const handleClearHistory = async () => {
    if (!currentPeerCode) return;
    if (!confirm('আপনি কি এই কথোপকথনের সমস্ত ছবি, ভিডিও ও ম্যাসেজ হিস্ট্রি মুছে ফেলতে চান?')) {
      return;
    }

    await deleteConversationFromLocal(identity.code, currentPeerCode);
    setMessages([]);

    try {
      await fetch(`/api/conversations/${identity.code}/${currentPeerCode}`, {
        method: 'DELETE',
      });
    } catch {
      // ignore
    }
  };

  // Edit Message handler
  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!currentPeerCode || !messageId || !newContent.trim()) return;

    // Update local storage
    updateLocalMessage(messageId, {
      content: newContent,
      isEdited: true,
      editedAt: Date.now(),
    });

    // Update local state
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              content: newContent,
              isEdited: true,
              editedAt: Date.now(),
            }
          : msg
      )
    );

    // Send to peer via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'edit_message',
          messageId,
          to: currentPeerCode,
          newContent,
        })
      );
    }
  };

  // Delete Message handler (Self vs Everyone)
  const handleDeleteMessage = (messageId: string, deleteForEveryone: boolean) => {
    if (!messageId) return;

    if (deleteForEveryone) {
      // Mark as deleted for everyone locally
      updateLocalMessage(messageId, {
        isDeletedForEveryone: true,
        content: 'এই বার্তাটি মুছে ফেলা হয়েছে (This message was deleted)',
        mediaUrl: undefined,
        drawingData: undefined,
        deletedAt: Date.now(),
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                isDeletedForEveryone: true,
                content: 'এই বার্তাটি মুছে ফেলা হয়েছে (This message was deleted)',
                mediaUrl: undefined,
                drawingData: undefined,
                deletedAt: Date.now(),
              }
            : msg
        )
      );

      // Broadcast to peer
      if (currentPeerCode && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'delete_message',
            messageId,
            to: currentPeerCode,
            deleteForEveryone: true,
          })
        );
      }
    } else {
      // Delete for Me only
      deleteMessageFromLocal(messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    }
  };

  // Quick reply directly from the Full Display overlay
  const handleQuickReply = (text: string) => {
    if (activeFullDisplayMessage) {
      handleSendMessage(text, activeFullDisplayMessage.theme || 'neon');
    }
  };

  // Preview full display
  const handlePreviewFullDisplay = (content: string, theme: DisplayTheme) => {
    const previewMsg: ChatMessage = {
      id: 'preview',
      senderCode: identity.code,
      senderName: identity.name,
      recipientCode: currentPeerCode || 'PEER',
      content,
      msgType: 'text',
      theme,
      timestamp: Date.now(),
    };
    setIsPreviewMode(true);
    setActiveFullDisplayMessage(previewMsg);
  };

  // Open existing message in full display
  const handleOpenFullDisplay = (msg: ChatMessage) => {
    setIsPreviewMode(false);
    setActiveFullDisplayMessage(msg);
  };

  // Send Typing event
  const handleSendTyping = (isTyping: boolean) => {
    if (!currentPeerCode) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'typing',
          to: currentPeerCode,
          isTyping,
        })
      );
    }
    localP2PMesh.sendDirectTyping(identity.code, currentPeerCode, isTyping);
  };

  const handleRemovePeer = (peerCode: string) => {
    const filtered = recentPeers.filter(
      (p) => normalizeCode(p.code) !== normalizeCode(peerCode)
    );
    setRecentPeers(filtered);
    saveStoredPeers(filtered);
    if (normalizeCode(currentPeerCode || '') === normalizeCode(peerCode)) {
      handleDisconnectSession();
    }
  };

  const handleUpdateName = (newName: string) => {
    const updated = { ...identity, name: newName };
    setIdentity(updated);
    saveStoredIdentity(updated);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'register',
          userCode: updated.code,
          name: updated.name,
        })
      );
    }
  };

  // Handle receiving an offline message via camera QR scan
  const handleReceiveOfflineMessage = (msg: ChatMessage) => {
    saveMessageToLocal(msg);
    const formattedSender = formatCode(msg.senderCode);
    const updated = addOrUpdatePeer({
      code: formattedSender,
      name: msg.senderName,
      lastMessage: msg.content,
      lastTimestamp: msg.timestamp,
    });
    setRecentPeers(updated);

    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });

    // Directly blast to Full Display Overlay
    setIsPreviewMode(false);
    setActiveFullDisplayMessage(msg);

    setSessionNotification({
      text: `${formattedSender} থেকে অফলাইন টেক্সট বার্তা সরাসরি ফুল ডিসপ্লেতে ওপেন হয়েছে!`,
      type: 'success',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notifications */}
      {sessionNotification && (
        <div
          id="session-toast-notification"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-40 max-w-md w-[92%] transition-all animate-in fade-in slide-in-from-top-4"
        >
          <div
            className={`p-3.5 rounded-2xl border shadow-xl flex items-center gap-3 backdrop-blur-md ${
              sessionNotification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : sessionNotification.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : 'bg-slate-900/95 border-cyan-500/50 text-cyan-200'
            }`}
          >
            {sessionNotification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : sessionNotification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-medium leading-relaxed font-['Hind_Siliguri',sans-serif]">
              {sessionNotification.text}
            </p>
          </div>
        </div>
      )}

      {/* App Top Header Bar */}
      <UserHeader
        identity={identity}
        isConnected={isConnected}
        onlineCount={onlineCount}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onUpdateName={handleUpdateName}
        onRegenerateCode={handleRegenerateCode}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        {/* Left Column: Peer Connector (Control panel) */}
        <div className="w-full lg:w-96 shrink-0 flex flex-col gap-4 min-w-0">
          <PeerConnector
            myCode={identity.code}
            currentPeerCode={currentPeerCode}
            currentPeerName={currentPeerName}
            sessionStatus={sessionStatus}
            pendingTargetCode={pendingTargetCode}
            recentPeers={recentPeers}
            onRequestConnection={handleRequestConnection}
            onCancelRequest={handleCancelRequest}
            onDisconnectSession={handleDisconnectSession}
            onSelectPeer={(code) => handleRequestConnection(code)}
            onRemovePeer={handleRemovePeer}
            onRegenerateCode={handleRegenerateCode}
            onOpenOfflineModal={() => {
              setOfflineInitialText('');
              setIsOfflineModalOpen(true);
            }}
          />
        </div>

        {/* Right Column: Active Conversation or AnyDesk Idle Dashboard */}
        <div className="flex-1 flex flex-col min-w-0">
          {sessionStatus === 'connected' && currentPeerCode ? (
            <ChatView
              myCode={identity.code}
              peerCode={currentPeerCode}
              peerName={currentPeerName}
              isPeerOnline={isPeerOnline}
              isPeerTyping={isPeerTyping}
              messages={messages}
              onSendMessage={handleSendMessage}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onOpenFullDisplay={handleOpenFullDisplay}
              onPreviewFullDisplay={handlePreviewFullDisplay}
              onSendTyping={handleSendTyping}
              autoFullDisplay={autoFullDisplay}
              onToggleAutoFullDisplay={() => setAutoFullDisplay((prev) => !prev)}
              onOpenDrawingModal={() => setIsDrawingModalOpen(true)}
              onOpenMediaModal={() => setIsMediaModalOpen(true)}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              onOpenOfflineModal={(initial?: string) => {
                setOfflineInitialText(initial || '');
                setIsOfflineModalOpen(true);
              }}
              onClearHistory={handleClearHistory}
              onDisconnect={handleDisconnectSession}
            />
          ) : sessionStatus === 'requesting' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/40 border border-amber-500/30 rounded-3xl text-center backdrop-blur-sm shadow-xl">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-amber-500/20 animate-ping absolute inset-0" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                  <PhoneCall className="w-10 h-10 animate-bounce" />
                </div>
              </div>

              <span className="text-xs uppercase tracking-widest font-bold text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/30 mb-2">
                অনুমোদনের অপেক্ষায়
              </span>

              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 font-['Hind_Siliguri',sans-serif]">
                সংযোগের অনুরোধ বিবেচনাধীন
              </h2>

              <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed font-['Hind_Siliguri',sans-serif]">
                কোড <span className="font-mono text-cyan-300 font-bold">{pendingTargetCode}</span>-এ
                রিকোয়েস্ট গেছে। অপর পাশের ইউজার <strong>Accept</strong> করলেই আপনার এই স্ক্রিনে চ্যাট
                ও ফুল ডিসপ্লে মোড চালু হবে।
              </p>

              <button
                type="button"
                onClick={handleCancelRequest}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-950 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-rose-200 text-sm font-semibold transition-all"
              >
                অনুরোধ বাতিল করুন
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-12 bg-gradient-to-b from-slate-900/40 via-slate-950/70 to-slate-900/40 border border-slate-800/80 rounded-3xl text-center backdrop-blur-md shadow-2xl relative overflow-hidden">
              {/* Background ambient radial glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Beautiful Vector Messaging Illustration */}
              <div className="mb-4 sm:mb-6 relative z-10">
                <MessagingVectorIllustration size="lg" />
              </div>

              {/* Status Chip / Tag */}
              <div className="relative z-10 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-semibold mb-3 shadow-sm">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>রিয়েল-টাইম ও অফলাইন ফুল-ডিসপ্লে মেসেজিং</span>
              </div>

              {/* Attractive Title Typography */}
              <h2 className="relative z-10 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-3 font-['Hind_Siliguri',sans-serif]">
                নিরাপদ ও দ্রুততম{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
                  সরাসরি বার্তা আদান-প্রদান
                </span>
              </h2>

              {/* Description */}
              <p className="relative z-10 text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed font-['Hind_Siliguri',sans-serif] mb-6">
                বাম পাশের প্যানেল থেকে বন্ধুর <strong className="text-cyan-300 font-mono font-bold tracking-wider">৯-ডিজিট কোড</strong> দিন অথবা সরাসরি আপনার নিজস্ব কিউআর কোড স্ক্যান করিয়ে চ্যাট শুরু করুন।
              </p>

              {/* Feature Highlights Grid */}
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl w-full mb-6 text-left">
                <div className="bg-slate-950/80 border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-3.5 flex items-start gap-3 transition-colors shadow-sm">
                  <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 mt-0.5 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 font-['Hind_Siliguri',sans-serif]">৯-ডিজিট কোড</h4>
                    <p className="text-[11px] text-slate-400 leading-snug mt-0.5">কোনো ফোন নম্বর ছাড়া সরাসরি নিরাপদে যোগাযোগ</p>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/90 hover:border-cyan-500/40 rounded-2xl p-3.5 flex items-start gap-3 transition-colors shadow-sm">
                  <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 mt-0.5 shrink-0">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 font-['Hind_Siliguri',sans-serif]">ফুল ডিসপ্লে অ্যালার্ট</h4>
                    <p className="text-[11px] text-slate-400 leading-snug mt-0.5">পুরো স্ক্রিনজুড়ে বড় টেক্সট, ভাইব্রেশন ও স্পেশাল অ্যানিমেশন</p>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/90 hover:border-indigo-500/40 rounded-2xl p-3.5 flex items-start gap-3 transition-colors shadow-sm">
                  <div className="p-2 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 mt-0.5 shrink-0">
                    <WifiOff className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 font-['Hind_Siliguri',sans-serif]">অফলাইন মেসেঞ্জার</h4>
                    <p className="text-[11px] text-slate-400 leading-snug mt-0.5">ইন্টারনেট ছাড়াও আল্ট্রাসাউন্ড বা কিউআরে বার্তা শেয়ার</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="relative z-10 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-teal-500/25 transition-all active:scale-95"
                >
                  <QrCode className="w-4 h-4" />
                  <span>আমার কোড ও কিউআর শেয়ার করুন</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOfflineInitialText('');
                    setIsOfflineModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-white text-xs font-semibold transition-all active:scale-95"
                >
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>অফলাইন মেসেঞ্জার খুলুন</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* AnyDesk Incoming Connection Request Approval Modal */}
      {incomingRequest && (
        <IncomingRequestModal
          request={incomingRequest}
          onAccept={handleAcceptRequest}
          onReject={handleRejectRequest}
          soundEnabled={soundEnabled}
        />
      )}

      {/* Drawing Modal */}
      {currentPeerCode && sessionStatus === 'connected' && (
        <DrawingBoardModal
          isOpen={isDrawingModalOpen}
          onClose={() => setIsDrawingModalOpen(false)}
          onSendDrawing={handleSendDrawing}
          recipientCode={currentPeerCode}
        />
      )}

      {/* Media Upload Modal */}
      {currentPeerCode && sessionStatus === 'connected' && (
        <MediaUploadModal
          isOpen={isMediaModalOpen}
          onClose={() => setIsMediaModalOpen(false)}
          onSendMedia={handleSendMedia}
          recipientCode={currentPeerCode}
        />
      )}

      {/* Voice Recorder Modal */}
      {currentPeerCode && sessionStatus === 'connected' && (
        <VoiceRecorderModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onSendVoice={handleSendVoice}
          recipientCode={currentPeerCode}
        />
      )}

      {/* The Full Display Message Overlay (Triggers on new message or user click) */}
      {activeFullDisplayMessage && (
        <FullDisplayOverlay
          message={activeFullDisplayMessage}
          isSenderPreview={isPreviewMode}
          onClose={() => setActiveFullDisplayMessage(null)}
          onQuickReply={handleQuickReply}
          onOpenDrawingReply={() => setIsDrawingModalOpen(true)}
        />
      )}

      {/* Offline Status & Pending Queue Toast */}
      <OfflineIndicator
        isOnline={isOnline}
        pendingCount={pendingOfflineCount}
        onRetryConnection={() => connectWebSocket()}
      />

      {/* Offline Text QR Messaging Modal (100% Offline, Zero Internet) */}
      <OfflineTextTransferModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
        myCode={identity.code}
        myName={identity.name}
        recipientCode={currentPeerCode || undefined}
        initialText={offlineInitialText}
        onReceiveMessage={handleReceiveOfflineMessage}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        identity={identity}
        onUpdateIdentity={handleUpdateIdentity}
        onRegenerateCode={handleRegenerateCode}
        savedPeersCount={recentPeers.length}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onReplayOpeningAnimation={handleReplayOpening}
      />

      {/* App Opening Entrance Animation */}
      <AnimatePresence>
        {showOpeningAnimation && (
          <AppOpeningAnimation
            identity={identity}
            onComplete={handleFinishOpening}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
