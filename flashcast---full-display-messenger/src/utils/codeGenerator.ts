import { UserIdentity, PeerContact } from '../types';

const COLORS = [
  'from-indigo-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-fuchsia-500 to-violet-600',
];

export function generateUserCode(): string {
  // AnyDesk-style 9-digit address grouped in 3-3-3: e.g. 784 912 305
  const part1 = Math.floor(100 + Math.random() * 900);
  const part2 = Math.floor(100 + Math.random() * 900);
  const part3 = Math.floor(100 + Math.random() * 900);
  return `${part1} ${part2} ${part3}`;
}

export function normalizeCode(raw: string): string {
  if (!raw) return '';
  return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export function formatCode(raw: string): string {
  const clean = normalizeCode(raw);
  if (clean.length === 9 && /^\d+$/.test(clean)) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)}`;
  }
  return raw.trim().toUpperCase();
}

export function getStoredIdentity(): UserIdentity {
  if (typeof window === 'undefined') {
    return {
      code: '845 291 736',
      name: 'User 736',
      color: COLORS[0],
      avatar: 'avatar_1',
      bio: 'BD CHAT BOOK এ সক্রিয় আছি ✨',
      statusMood: 'online',
      joinedAt: Date.now(),
    };
  }

  // Check tab-specific sessionStorage first so opening 2 tabs allows immediate testing with 2 distinct codes!
  const sessionStored = sessionStorage.getItem('fc_session_identity');
  if (sessionStored) {
    try {
      const parsed = JSON.parse(sessionStored);
      return {
        ...parsed,
        avatar: parsed.avatar || 'avatar_1',
        bio: parsed.bio || 'BD CHAT BOOK এ সক্রিয় আছি ✨',
        statusMood: parsed.statusMood || 'online',
        joinedAt: parsed.joinedAt || Date.now(),
      };
    } catch {
      // ignore
    }
  }

  // Generate a distinct identity for this browser tab
  const code = generateUserCode();
  const digits = normalizeCode(code);
  const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  const identity: UserIdentity = {
    code,
    name: `User ${digits.slice(-3)}`,
    color: randomColor,
    avatar: 'avatar_1',
    bio: 'BD CHAT BOOK এ সক্রিয় আছি ✨',
    statusMood: 'online',
    joinedAt: Date.now(),
  };

  sessionStorage.setItem('fc_session_identity', JSON.stringify(identity));
  localStorage.setItem('fc_user_identity', JSON.stringify(identity));
  return identity;
}

export function createNewIdentity(): UserIdentity {
  const code = generateUserCode();
  const digits = normalizeCode(code);
  const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  const identity: UserIdentity = {
    code,
    name: `User ${digits.slice(-3)}`,
    color: randomColor,
    avatar: 'avatar_1',
    bio: 'BD CHAT BOOK এ সক্রিয় আছি ✨',
    statusMood: 'online',
    joinedAt: Date.now(),
  };

  if (typeof window !== 'undefined') {
    sessionStorage.setItem('fc_session_identity', JSON.stringify(identity));
    localStorage.setItem('fc_user_identity', JSON.stringify(identity));
  }
  return identity;
}

export function saveStoredIdentity(identity: UserIdentity): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('fc_session_identity', JSON.stringify(identity));
    localStorage.setItem('fc_user_identity', JSON.stringify(identity));
  }
}

export function getStoredPeers(): PeerContact[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('fc_recent_peers');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export function saveStoredPeers(peers: PeerContact[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('fc_recent_peers', JSON.stringify(peers));
  }
}

export function addOrUpdatePeer(peer: PeerContact): PeerContact[] {
  const current = getStoredPeers();
  const peerNorm = normalizeCode(peer.code);
  const existingIdx = current.findIndex((p) => normalizeCode(p.code) === peerNorm);

  let updated: PeerContact[];
  if (existingIdx >= 0) {
    updated = [
      { ...current[existingIdx], ...peer },
      ...current.filter((_, idx) => idx !== existingIdx),
    ];
  } else {
    updated = [peer, ...current];
  }

  // Keep top 20 peers
  const trimmed = updated.slice(0, 20);
  saveStoredPeers(trimmed);
  return trimmed;
}
