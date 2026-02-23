import { useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNotificationStore } from '../store/notificationStore';

let audio = null;
let audioUnlocked = false;

// Unlock audio on first user interaction (browser autoplay policy)
function unlockAudio() {
  if (audioUnlocked) return;
  try {
    audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0;
    audio.play().then(() => {
      audio.pause();
      audio.volume = 1;
      audio.currentTime = 0;
      audioUnlocked = true;
    }).catch(() => {});
  } catch {
    // ignore
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('keydown', unlockAudio, { once: true });
}

function playSound() {
  try {
    if (!audio) {
      audio = new Audio('/sounds/notification.mp3');
    }
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {
    // Sound not available
  }
}

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

async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;
    const { data } = await axios.post('/api/auth/refresh', { refreshToken });
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    return data.data.accessToken;
  } catch {
    return null;
  }
}

export default function useNotifications() {
  const eventSourceRef = useRef(null);
  const retryRef = useRef(null);
  const failCountRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      if (cancelled) return;

      let token = localStorage.getItem('accessToken');
      if (!token) return;

      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`);
      eventSourceRef.current = es;

      es.onopen = () => {
        failCountRef.current = 0;
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          playSound();
          showNotification(data);
          if (data.type === 'new_order') {
            useNotificationStore.getState().incrementOrders();
          } else if (data.type === 'new_call_request') {
            useNotificationStore.getState().incrementCallRequests();
          }
        } catch {
          // Ignore parse errors
        }
      };

      es.onerror = async () => {
        es.close();
        eventSourceRef.current = null;
        if (cancelled) return;

        failCountRef.current += 1;

        // After 3 consecutive fails, try refreshing the token
        if (failCountRef.current >= 2) {
          const newToken = await refreshAccessToken();
          if (!newToken) {
            // Can't refresh — stop trying (user will be redirected on next API call)
            return;
          }
        }

        // Reconnect with backoff: 5s, 10s, 15s... max 30s
        const delay = Math.min(failCountRef.current * 5000, 30000);
        retryRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (retryRef.current) {
        clearTimeout(retryRef.current);
      }
    };
  }, []);
}
