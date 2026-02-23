import { create } from 'zustand';
import api from '../services/api';

export const useCartStore = create((set, get) => ({
  cart: null,
  loading: false,
  error: null,

  items: () => get().cart?.items || [],
  itemCount: () => get().cart?.itemCount || 0,
  subtotal: () => get().cart?.subtotal || 0,

  fetchCart: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/cart');
      set({ cart: data.data, loading: false });
      return data.data;
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, loading: false });
    }
  },

  addItem: async (productId, variantId = null, quantity = 1) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/cart/items', { productId, variantId, quantity });
      set({ cart: data.data, loading: false });
      return data.data;
    } catch (err) {
      const error = err.response?.data?.error || err.message;
      set({ error, loading: false });
      throw new Error(error);
    }
  },

  updateItem: async (itemId, quantity) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.put(`/cart/items/${itemId}`, { quantity });
      set({ cart: data.data, loading: false });
      return data.data;
    } catch (err) {
      const error = err.response?.data?.error || err.message;
      set({ error, loading: false });
      throw new Error(error);
    }
  },

  removeItem: async (itemId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.delete(`/cart/items/${itemId}`);
      set({ cart: data.data, loading: false });
      return data.data;
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, loading: false });
    }
  },

  clearCart: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.delete('/cart');
      set({ cart: data.data, loading: false });
      return data.data;
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, loading: false });
    }
  },
}));
