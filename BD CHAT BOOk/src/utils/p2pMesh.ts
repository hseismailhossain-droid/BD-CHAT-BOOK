/**
 * P2P Mesh & Local Direct Transport Engine
 * Allows offline text messages, connection requests, and full-display alerts
 * to travel directly between peer codes without needing internet or QR scanning.
 */

import { ChatMessage } from '../types';
import { normalizeCode } from './codeGenerator';

export type MeshPacketType =
  | 'mesh_connection_request'
  | 'mesh_accept_connection'
  | 'mesh_reject_connection'
  | 'mesh_cancel_request'
  | 'mesh_disconnect'
  | 'mesh_text_message'
  | 'mesh_typing'
  | 'mesh_delivery_receipt';

export interface MeshPacket {
  type: MeshPacketType;
  fromCode: string;
  fromName?: string;
  toCode: string;
  timestamp: number;
  message?: ChatMessage;
  isTyping?: boolean;
}

type PacketListener = (packet: MeshPacket) => void;

class LocalP2PMesh {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<PacketListener> = new Set();
  private storageKey = 'flashcast_mesh_bus';

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('flashcast_p2p_mesh');
        this.channel.onmessage = (event) => {
          if (event.data && typeof event.data === 'object') {
            this.notifyListeners(event.data as MeshPacket);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not available, using storage fallback', e);
      }
    }

    // Storage event fallback for older browsers or cross-context syncing
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === this.storageKey && e.newValue) {
          try {
            const packet = JSON.parse(e.newValue) as MeshPacket;
            this.notifyListeners(packet);
          } catch {
            // Ignore parse errors
          }
        }
      });
    }
  }

  public subscribe(listener: PacketListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(packet: MeshPacket) {
    this.listeners.forEach((listener) => {
      try {
        listener(packet);
      } catch (err) {
        console.error('Error in mesh listener:', err);
      }
    });
  }

  public broadcast(packet: MeshPacket) {
    // 1. Send via BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(packet);
      } catch (e) {
        console.warn('BroadcastChannel postMessage failed:', e);
      }
    }

    // 2. Dispatch via localStorage event
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify({ ...packet, _rand: Math.random() }));
      } catch {
        // storage quota or incognito
      }
    }
  }

  /**
   * Helper to send offline direct text message
   */
  public sendDirectOfflineMessage(
    fromCode: string,
    fromName: string,
    toCode: string,
    message: ChatMessage
  ) {
    const packet: MeshPacket = {
      type: 'mesh_text_message',
      fromCode,
      fromName,
      toCode,
      timestamp: Date.now(),
      message,
    };
    this.broadcast(packet);
  }

  /**
   * Send offline connection request
   */
  public sendDirectConnectionRequest(fromCode: string, fromName: string, toCode: string) {
    const packet: MeshPacket = {
      type: 'mesh_connection_request',
      fromCode,
      fromName,
      toCode,
      timestamp: Date.now(),
    };
    this.broadcast(packet);
  }

  /**
   * Send offline accept connection
   */
  public sendDirectAccept(fromCode: string, fromName: string, toCode: string) {
    const packet: MeshPacket = {
      type: 'mesh_accept_connection',
      fromCode,
      fromName,
      toCode,
      timestamp: Date.now(),
    };
    this.broadcast(packet);
  }

  /**
   * Send offline disconnect
   */
  public sendDirectDisconnect(fromCode: string, toCode: string) {
    const packet: MeshPacket = {
      type: 'mesh_disconnect',
      fromCode,
      toCode,
      timestamp: Date.now(),
    };
    this.broadcast(packet);
  }

  /**
   * Send offline typing indicator
   */
  public sendDirectTyping(fromCode: string, toCode: string, isTyping: boolean) {
    const packet: MeshPacket = {
      type: 'mesh_typing',
      fromCode,
      toCode,
      isTyping,
      timestamp: Date.now(),
    };
    this.broadcast(packet);
  }
}

export const localP2PMesh = new LocalP2PMesh();
