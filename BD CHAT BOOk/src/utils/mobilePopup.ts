import { ChatMessage } from '../types';

let wakeLockSentinel: any = null;
let pipWindow: Window | null = null;

/**
 * Request notification permission from browser
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Trigger system notification with vibration and click-to-focus full display
 */
export function triggerSystemNotification(
  message: ChatMessage,
  onClickCallback?: () => void
): void {
  if (typeof window === 'undefined') return;

  // 1. Mobile Vibration (AnyDesk / Phone alert pattern)
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([300, 100, 300, 100, 500]);
    } catch {
      // Ignore vibration error
    }
  }

  // 2. Trigger Notification if supported and permitted
  if ('Notification' in window && Notification.permission === 'granted') {
    const title = `🚨 ${message.senderName || message.senderCode} থেকে ফুল ডিসপ্লে বার্তা!`;
    const body =
      message.msgType === 'drawing'
        ? '🎨 একটি লাইভ ড্রয়িং স্কেচ পাঠিয়েছেন!'
        : message.msgType === 'image'
        ? '📷 একটি ছবি পাঠিয়েছেন!'
        : message.msgType === 'video'
        ? '🎬 একটি ভিডিও পাঠিয়েছেন!'
        : message.msgType === 'audio'
        ? '🎙️ একটি ভয়েস বার্তা পাঠিয়েছেন!'
        : message.content || 'নতুন বার্তা';

    try {
      const notification = new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'flashcast-full-display',
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (onClickCallback) {
          onClickCallback();
        }
      };
    } catch {
      // Some mobile browsers require service worker showNotification
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: 'flashcast-full-display',
          });
        });
      }
    }
  }
}

/**
 * Acquire Screen WakeLock so screen doesn't turn off during full display
 */
export async function acquireWakeLock(): Promise<void> {
  if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;
  try {
    wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
  } catch {
    // Ignore wakelock denial
  }
}

export function releaseWakeLock(): void {
  if (wakeLockSentinel) {
    try {
      wakeLockSentinel.release();
    } catch {
      // Ignore
    }
    wakeLockSentinel = null;
  }
}

/**
 * Request Fullscreen Mode
 */
export function enterFullscreen(): void {
  if (typeof document === 'undefined') return;
  const docEl = document.documentElement as any;
  if (docEl.requestFullscreen) {
    docEl.requestFullscreen().catch(() => {});
  } else if (docEl.webkitRequestFullscreen) {
    docEl.webkitRequestFullscreen();
  }
}

export function exitFullscreen(): void {
  if (typeof document === 'undefined') return;
  const doc = document as any;
  if (document.fullscreenElement) {
    if (doc.exitFullscreen) {
      doc.exitFullscreen().catch(() => {});
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    }
  }
}

/**
 * Floating Picture-in-Picture Window Support (Document PiP API)
 * Allows displaying an always-on-top floating popup window on mobile or desktop
 * while user is using other apps!
 */
export function isPipSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'documentPictureInPicture' in window;
}

export async function openFloatingPipWindow(
  currentMessage: ChatMessage | null,
  onClose?: () => void
): Promise<boolean> {
  if (typeof window === 'undefined' || !('documentPictureInPicture' in window)) {
    return false;
  }

  try {
    const pip = (window as any).documentPictureInPicture;
    if (pipWindow) {
      pipWindow.close();
      pipWindow = null;
    }

    pipWindow = await pip.requestWindow({
      width: 360,
      height: 480,
    });

    if (!pipWindow) return false;

    // Copy style sheets
    [...document.styleSheets].forEach((styleSheet) => {
      try {
        const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
        const style = pipWindow!.document.createElement('style');
        style.textContent = cssRules;
        pipWindow!.document.head.appendChild(style);
      } catch {
        const link = pipWindow!.document.createElement('link');
        if (styleSheet.href) {
          link.rel = 'stylesheet';
          link.type = styleSheet.type;
          link.href = styleSheet.href;
          pipWindow!.document.head.appendChild(link);
        }
      }
    });

    pipWindow.document.body.className =
      'bg-slate-950 text-white flex flex-col items-center justify-center p-4 min-h-screen text-center font-sans';

    updateFloatingPipContent(currentMessage);

    pipWindow.addEventListener('pagehide', () => {
      pipWindow = null;
      if (onClose) onClose();
    });

    return true;
  } catch (err) {
    console.debug('Failed to open document PiP window:', err);
    return false;
  }
}

export function updateFloatingPipContent(message: ChatMessage | null): void {
  if (!pipWindow || !pipWindow.document) return;

  const body = pipWindow.document.body;
  if (!message) {
    body.innerHTML = `
      <div style="font-family: sans-serif; padding: 20px;">
        <div style="font-size: 24px; margin-bottom: 8px;">🇧🇩 BD CHAT BOOK</div>
        <div style="color: #94a3b8; font-size: 13px;">ফ্লোটিং পপআপ উইন্ডো সক্রিয় আছে। নতুন বার্তা আসলেই এখানে তৎক্ষণাৎ ভেসে উঠবে!</div>
      </div>
    `;
    return;
  }

  let mediaHtml = '';
  if (message.msgType === 'drawing' && message.drawingData) {
    mediaHtml = `<img src="${message.drawingData}" style="max-height: 200px; border-radius: 12px; margin: 12px auto; display: block; border: 1px solid #06b6d4;" />`;
  } else if (message.msgType === 'image' && message.mediaUrl) {
    mediaHtml = `<img src="${message.mediaUrl}" style="max-height: 200px; border-radius: 12px; margin: 12px auto; display: block;" />`;
  }

  body.innerHTML = `
    <div style="font-family: sans-serif; width: 100%; max-width: 320px; margin: auto;">
      <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #06b6d4; font-weight: bold; margin-bottom: 4px;">
        🚨 ফুল ডিসপ্লে পপআপ বার্তা
      </div>
      <div style="font-size: 12px; color: #94a3b8; margin-bottom: 12px;">
        প্রেরক: <strong style="color: #fff;">${message.senderName || message.senderCode}</strong>
      </div>
      ${mediaHtml}
      <div style="font-size: 22px; font-weight: 800; color: #f8fafc; line-height: 1.3; margin-bottom: 16px; word-break: break-word;">
        ${message.content || 'নতুন বার্তা!'}
      </div>
      <div style="font-size: 11px; color: #64748b;">
        ক্লিক করে অ্যাপে ফিরে যান
      </div>
    </div>
  `;
}

export function closeFloatingPipWindow(): void {
  if (pipWindow) {
    pipWindow.close();
    pipWindow = null;
  }
}
