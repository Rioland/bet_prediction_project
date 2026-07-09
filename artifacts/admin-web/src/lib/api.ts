import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// When VITE_API_URL is set to /api, all admin routes call through
// the Express proxy which forwards them to the Python backend.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  withCredentials: true
});

type QueueItem = {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
};

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

function processQueue(error: unknown) {
  failedQueue.forEach((item) => {
    if (error) item.reject(error);
    else item.resolve(undefined);
  });
  failedQueue = [];
}

// Attach stored Bearer token on every request. The Python backend authorizes
// admin actions using this header ONLY (never cookies), which is inherently
// CSRF-safe since a cross-origin page cannot set custom request headers.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_access_token_hint");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAuthEndpoint =
      original?.url?.includes("/admin/auth/login") ||
      original?.url?.includes("/admin/auth/refresh");

    if (error.response?.status !== 401 || !original || original._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => api(original));
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await api.post("/admin/auth/refresh");
      if (data?.access_token) {
        localStorage.setItem("admin_access_token_hint", data.access_token);
      }
      processQueue(null);
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError);
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
