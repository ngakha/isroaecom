import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/admin/' : '/',
  server: {
    port: 5173,
    proxy: {
      '/api/notifications/stream': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        timeout: 0,
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
