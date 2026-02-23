import { useEffect, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNotificationStore } from '../store/notificationStore';

// ─── Web Audio API for reliable sound from timers ────────
const SOUND_URL = (import.meta.env.BASE_URL || '/') + 'sounds/notification.mp3';
let audioCtx = null;
let audioBuffer = null;

// Unlock AudioContext on first user interaction, then preload sound
function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Preload the notification sound
    fetch(SOUND_URL)
      .then((res) => res.arrayBuffer())
      .then((buf) => audioCtx.decodeAudioData(buf))
      .then((decoded) => {
        audioBuffer = decoded;
      })
      .catch(() => {});
  } catch {
    // Web Audio API not supported
  }
}

if (typeof document !== 'undefined') {
  ['click', 'keydown', 'touchstart'].forEach((evt) => {
    document.addEventListener(evt, initAudio, { once: true });
  });
}

function playSound() {
  if (!audioCtx || !audioBuffer) return;
  try {
    // Resume context if suspended (browser policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start(0);
  } catch (err) {
    console.warn('[Notification] Sound error:', err.message);
  }
}

// ─── Toast notifications ─────────────────────────────────
function showNotification(data) {
  if (data.type === 'new_order') {
    toast(
      `New Order ${data.orderNumber}\n${data.customerName} — ${data.total} ${data.currency}`,
      {
        icon: '\u{1F6D2}',
        duration: 8000,
        style: { borderLeft: '3px solid #3b82f6', fontWeight: 500 },
      }
    );
  } else if (data.type === 'new_call_request') {
    const productInfo = data.productName ? `\n${data.productName}` : '';
    toast(
      `New Call Request\n${data.customerName} — ${data.phone}${productInfo}`,
      {
        icon: '\u{1F4DE}',
        duration: 8000,
        style: { borderLeft: '3px solid #22c55e', fontWeight: 500 },
      }
    );
  }
}

// ─── Polling hook ────────────────────────────────────────
const POLL_INTERVAL = 10000; // 10 seconds

export default function useNotifications() {
  const lastPollRef = useRef(new Date().toISOString());
  const intervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (cancelled) return;

      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const { data } = await api.get('/notifications/poll', {
          params: { since: lastPollRef.current },
        });

        if (data.serverTime) {
          lastPollRef.current = data.serverTime;
        }

        const notifications = data.data || [];
        if (notifications.length > 0) {
          playSound();

          for (const n of notifications) {
            showNotification(n);
            if (n.type === 'new_order') {
              useNotificationStore.getState().incrementOrders();
            } else if (n.type === 'new_call_request') {
              useNotificationStore.getState().incrementCallRequests();
            }
          }
        }
      } catch {
        // Silently fail — will retry on next interval
      }
    }

    // Start polling
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
