export type DisplayTheme =
  | 'neon'
  | 'midnight'
  | 'crimson'
  | 'emerald'
  | 'sunset'
  | 'cyberpunk'
  | 'monochrome';

export interface ChatMessage {
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
  theme?: DisplayTheme;
  timestamp: number;
  sound?: boolean;
  delivered?: boolean;
  pendingOffline?: boolean;
  isEdited?: boolean;
  editedAt?: number;
  isDeletedForEveryone?: boolean;
  deletedAt?: number;
  ttlSeconds?: number;
  expiresAt?: number;
}

export interface UserIdentity {
  code: string;
  name: string;
  color: string;
  avatar?: string;
  bio?: string;
  statusMood?: 'online' | 'busy' | 'away' | 'focus';
  joinedAt?: number;
}

export interface PeerContact {
  code: string;
  name?: string;
  lastMessage?: string;
  lastTimestamp?: number;
  online?: boolean;
  unreadCount?: number;
}

export interface ConnectionRequest {
  fromCode: string;
  fromName: string;
  timestamp: number;
}

export interface WebSocketMessage {
  type:
    | 'register'
    | 'registered'
    | 'ping'
    | 'pong'
    | 'check_peer'
    | 'peer_status'
    | 'typing'
    | 'message'
    | 'new_message'
    | 'message_sent'
    | 'edit_message'
    | 'message_edited'
    | 'delete_message'
    | 'message_deleted'
    | 'request_connection'
    | 'request_sent'
    | 'request_failed'
    | 'incoming_connection_request'
    | 'accept_connection'
    | 'reject_connection'
    | 'connection_accepted'
    | 'connection_rejected'
    | 'cancel_connection_request'
    | 'connection_request_cancelled'
    | 'disconnect_session'
    | 'session_disconnected'
    | 'error';
  userCode?: string;
  name?: string;
  peerCode?: string;
  peerName?: string;
  to?: string;
  from?: string;
  fromCode?: string;
  fromName?: string;
  toCode?: string;
  reason?: string;
  content?: string;
  messageId?: string;
  newContent?: string;
  deleteForEveryone?: boolean;
  editedAt?: number;
  isTyping?: boolean;
  message?: ChatMessage | string;
  errorMessage?: string;
  delivered?: boolean;
  online?: boolean;
  activeCount?: number;
  isIncomingFullDisplay?: boolean;
  timestamp?: number;
}
