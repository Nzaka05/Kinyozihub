import axios from 'axios';

// The in-memory access token is set by AuthProvider
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  withCredentials: true, // Crucial for sending the HttpOnly refresh cookie
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 and concurrent refresh
let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // We only retry 401s, and only once per request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Do not intercept 401s from auth endpoints (login, verify, refresh, etc)
      // These return 401 on invalid credentials, and we want to pass that error to the component.
      if (originalRequest.url?.startsWith('/auth/')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // A refresh is already in progress; wait on the queue.
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      // Mark this request as retrying so we don't infinitely loop
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use a pristine axios instance to prevent interceptor loops
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = data.accessToken;
        setAccessToken(newAccessToken);
        
        // Resolve all queued requests with the new token
        processQueue(null, newAccessToken);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        // If refresh fails (e.g. token expired/revoked), reject queued requests
        processQueue(err, null);
        // Clear the token in memory
        setAccessToken(null);
        // Dispatch event for AuthProvider to handle forced logout
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:logout'));
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
