import { create } from 'zustand';
import api from '../services/api';

export const useSettingsStore = create((set) => ({
  callRequestMode: false,
  whatsappNumber: '',
  loaded: false,

  fetchSettings: async () => {
    try {
      const [callRes, publicRes] = await Promise.all([
        api.get('/call-requests/mode').catch(() => null),
        api.get('/settings/public').catch(() => null),
      ]);
      set({
        callRequestMode: callRes?.data?.data?.callRequestMode || false,
        whatsappNumber: publicRes?.data?.data?.whatsapp_number || '',
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },
}));
