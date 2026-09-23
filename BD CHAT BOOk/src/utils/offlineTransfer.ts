import QRCode from 'qrcode';
import { ChatMessage, DisplayTheme } from '../types';

export interface OfflinePayload {
  v: 1;
  type: 'flashcast_offline_msg';
  id: string;
  senderCode: string;
  senderName?: string;
  recipientCode?: string;
  content: string;
  theme: DisplayTheme;
  timestamp: number;
}

/**
 * Encode a chat message into a compact string payload for QR representation
 */
export function encodeOfflineMessage(
  content: string,
  senderCode: string,
  senderName: string,
  theme: DisplayTheme = 'neon',
  recipientCode?: string
): string {
  const payload: OfflinePayload = {
    v: 1,
    type: 'flashcast_offline_msg',
    id: `off_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    senderCode,
    senderName,
    recipientCode,
    content,
    theme,
    timestamp: Date.now(),
  };
  return JSON.stringify(payload);
}

/**
 * Decode a scanned string back into a ChatMessage
 */
export function decodeOfflineMessage(dataStr: string): ChatMessage | null {
  try {
    const parsed = JSON.parse(dataStr);
    if (parsed.type === 'flashcast_offline_msg' && parsed.content && parsed.senderCode) {
      return {
        id: parsed.id || `msg_${Date.now()}`,
        senderCode: parsed.senderCode,
        senderName: parsed.senderName || 'অফলাইন ব্যবহারকারী',
        recipientCode: parsed.recipientCode || '',
        content: parsed.content,
        msgType: 'text',
        theme: parsed.theme || 'neon',
        timestamp: parsed.timestamp || Date.now(),
        sound: true,
        delivered: true,
        pendingOffline: false,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate a QR Code Data URL with optimal contrast and error correction
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
    color: {
      dark: '#020617',
      light: '#ffffff',
    },
  });
}
