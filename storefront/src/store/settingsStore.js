import { create } from 'zustand';
import api from '../services/api';

export const useSettingsStore = create((set) => ({
  callRequestMode: false,
  loaded: false,

  fetchSettings: async () => {
    try {
      const { data } = await api.get('/call-requests/mode');
      set({ callRequestMode: data.data.callRequestMode, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
}));
