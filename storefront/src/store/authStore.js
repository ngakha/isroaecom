import { create } from 'zustand';
import api, { getSessionId } from '../services/api';

export const useAuthStore = create((set, get) => ({
  customer: JSON.parse(localStorage.getItem('customer') || 'null'),
  token: localStorage.getItem('customerAccessToken'),

  isAuthenticated: () => !!get().token,

  login: async (email, password) => {
    const { data } = await api.post('/auth/customer/login', { email, password });
    const { customer, accessToken, refreshToken } = data.data;

    localStorage.setItem('customerAccessToken', accessToken);
    localStorage.setItem('customerRefreshToken', refreshToken);
    localStorage.setItem('customer', JSON.stringify(customer));

    set({ customer, token: accessToken });

    // Merge guest cart into customer cart
    try {
      const sessionId = getSessionId();
      await api.post('/cart/merge', { sessionId });
    } catch {
      // Ignore merge errors
    }

    return customer;
  },

  register: async ({ email, password, firstName, lastName, phone }) => {
    const { data } = await api.post('/auth/customer/register', {
      email,
      password,
      firstName,
      lastName,
      phone,
    });
    const { customer, accessToken, refreshToken } = data.data;

    localStorage.setItem('customerAccessToken', accessToken);
    localStorage.setItem('customerRefreshToken', refreshToken);
    localStorage.setItem('customer', JSON.stringify(customer));

    set({ customer, token: accessToken });

    // Merge guest cart
    try {
      const sessionId = getSessionId();
      await api.post('/cart/merge', { sessionId });
    } catch {
      // Ignore merge errors
    }

    return customer;
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('customerRefreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore logout errors
    }

    localStorage.removeItem('customerAccessToken');
    localStorage.removeItem('customerRefreshToken');
    localStorage.removeItem('customer');
    set({ customer: null, token: null });
  },

  updateCustomer: (customer) => {
    localStorage.setItem('customer', JSON.stringify(customer));
    set({ customer });
  },
}));
