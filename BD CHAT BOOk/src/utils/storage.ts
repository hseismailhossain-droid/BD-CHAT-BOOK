import { ChatMessage } from '../types';

const DB_NAME = 'FlashCastDB';
const DB_VERSION = 1;
const STORE_MESSAGES = 'messages';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
          const store = db.createObjectStore(STORE_MESSAGES, { keyPath: 'id' });
          store.createIndex('pairKey', 'pairKey', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  return dbPromise;
}

export function getPairKey(code1: string, code2: string): string {
  return [code1.toUpperCase(), code2.toUpperCase()].sort().join(':');
}

export async function saveMessageToLocal(message: ChatMessage): Promise<void> {
  try {
    const db = await getDB();
    const pairKey = getPairKey(message.senderCode, message.recipientCode);
    const item = { ...message, pairKey };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MESSAGES, 'readwrite');
      const store = tx.objectStore(STORE_MESSAGES);
      store.put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    // Fallback: localStorage backup for crucial small records
    try {
      const key = `fc_history_${getPairKey(message.senderCode, message.recipientCode)}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = existing.filter((m: ChatMessage) => m.id !== message.id);
      // Strip heavy media if storing in localStorage fallback to avoid quota exceeded
      const fallbackItem = {
        ...message,
        mediaUrl: message.mediaUrl && message.mediaUrl.length > 50000 ? '[Media stored in cache]' : message.mediaUrl,
      };
      filtered.push(fallbackItem);
      localStorage.setItem(key, JSON.stringify(filtered.slice(-50)));
    } catch (e) {
      console.debug('Storage fallback error:', e);
    }
  }
}

export async function getMessagesFromLocal(myCode: string, peerCode: string): Promise<ChatMessage[]> {
  const targetPairKey = getPairKey(myCode, peerCode);
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_MESSAGES, 'readonly');
      const store = tx.objectStore(STORE_MESSAGES);
      const index = store.index('pairKey');
      const request = index.getAll(targetPairKey);

      request.onsuccess = () => {
        const msgs = (request.result || []).sort((a: ChatMessage, b: ChatMessage) => a.timestamp - b.timestamp);
        resolve(msgs);
      };

      request.onerror = () => {
        resolve(getFallbackMessages(targetPairKey));
      };
    });
  } catch {
    return getFallbackMessages(targetPairKey);
  }
}

export async function getPendingOfflineMessages(myCode: string): Promise<ChatMessage[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_MESSAGES, 'readonly');
      const store = tx.objectStore(STORE_MESSAGES);
      const request = store.getAll();

      request.onsuccess = () => {
        const all: ChatMessage[] = request.result || [];
        const pending = all.filter(
          (m) =>
            m.pendingOffline === true &&
            m.senderCode.toUpperCase() === myCode.toUpperCase()
        );
        resolve(pending.sort((a, b) => a.timestamp - b.timestamp));
      };

      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function updateLocalMessage(
  id: string,
  updates: Partial<ChatMessage>
): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_MESSAGES, 'readwrite');
      const store = tx.objectStore(STORE_MESSAGES);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        if (getReq.result) {
          const updated = { ...getReq.result, ...updates };
          store.put(updated);
        }
        resolve();
      };
      getReq.onerror = () => resolve();
    });
  } catch {
    // Ignore
  }
}

export async function deleteMessageFromLocal(id: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_MESSAGES, 'readwrite');
      const store = tx.objectStore(STORE_MESSAGES);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore
  }
}

export async function cleanExpiredMessages(): Promise<string[]> {
  const expiredIds: string[] = [];
  const now = Date.now();
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_MESSAGES, 'readwrite');
      const store = tx.objectStore(STORE_MESSAGES);
      const req = store.openCursor();

      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          const val = cursor.value as ChatMessage;
          if (val.expiresAt && val.expiresAt <= now) {
            expiredIds.push(val.id);
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve(expiredIds);
        }
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function markMessageSent(id: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_MESSAGES, 'readwrite');
      const store = tx.objectStore(STORE_MESSAGES);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        if (getReq.result) {
          const updated = { ...getReq.result, pendingOffline: false, delivered: true };
          store.put(updated);
        }
        resolve();
      };
      getReq.onerror = () => resolve();
    });
  } catch {
    // Ignore
  }
}

function getFallbackMessages(pairKey: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(`fc_history_${pairKey}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function deleteConversationFromLocal(myCode: string, peerCode: string): Promise<void> {
  const targetPairKey = getPairKey(myCode, peerCode);
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_MESSAGES, 'readwrite');
    const store = tx.objectStore(STORE_MESSAGES);
    const index = store.index('pairKey');
    const request = index.openKeyCursor(IDBKeyRange.only(targetPairKey));

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
  } catch (e) {
    console.debug('IDB delete error:', e);
  }

  try {
    localStorage.removeItem(`fc_history_${targetPairKey}`);
  } catch {
    // ignore
  }
}

export async function clearAllLocalData(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_MESSAGES, 'readwrite');
    tx.objectStore(STORE_MESSAGES).clear();
  } catch (e) {
    console.debug('IDB clear error:', e);
  }
}
