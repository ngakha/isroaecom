import { create } from 'zustand';
import api from '../services/api';

export const useWishlistStore = create((set, get) => ({
  items: [],
  loaded: false,

  count: () => get().items.length,

  fetch: async () => {
    try {
      const { data } = await api.get('/customers/me/wishlist');
      set({ items: data.data || [], loaded: true });
    } catch {
      set({ items: [], loaded: true });
    }
  },

  add: async (productId) => {
    try {
      await api.post('/customers/me/wishlist', { productId });
      // Refetch to get full product data with images
      await get().fetch();
    } catch {
      // ignore
    }
  },

  remove: async (productId) => {
    set({ items: get().items.filter((i) => i.id !== productId) });
    try {
      await api.delete(`/customers/me/wishlist/${productId}`);
    } catch {
      await get().fetch();
    }
  },

  has: (productId) => get().items.some((i) => i.id === productId),

  reset: () => set({ items: [], loaded: false }),
}));
