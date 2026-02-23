import axios from 'axios';

// Generate a persistent session ID for guest cart
const getSessionId = () => {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token and session ID to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('customerAccessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Always send session ID for cart operations
  config.headers['x-session-id'] = getSessionId();
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('customerRefreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post('/api/auth/refresh', { refreshToken });

        localStorage.setItem('customerAccessToken', data.data.accessToken);
        localStorage.setItem('customerRefreshToken', data.data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('customerAccessToken');
        localStorage.removeItem('customerRefreshToken');
        localStorage.removeItem('customer');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export { getSessionId };
export default api;
