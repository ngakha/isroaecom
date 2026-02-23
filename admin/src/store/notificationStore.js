import { create } from 'zustand';
import api from '../services/api';

export const useNotificationStore = create((set) => ({
  newCallRequests: 0,
  pendingOrders: 0,

  fetchCounts: async () => {
    try {
      const [callRes, orderRes] = await Promise.all([
        api.get('/call-requests/stats'),
        api.get('/orders/stats'),
      ]);
      set({
        newCallRequests: callRes.data.data?.new || 0,
        pendingOrders: orderRes.data.data?.statusCounts?.pending || 0,
      });
    } catch {
      // ignore
    }
  },

  incrementCallRequests: () => set((s) => ({ newCallRequests: s.newCallRequests + 1 })),
  incrementOrders: () => set((s) => ({ pendingOrders: s.pendingOrders + 1 })),
}));
