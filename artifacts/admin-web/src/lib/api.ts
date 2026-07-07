import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
  withCredentials: true
});

type QueueItem = {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
};

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)admin_csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function processQueue(error: unknown) {
  failedQueue.forEach((item) => {
    if (error) item.reject(error);
    else item.resolve(undefined);
  });
  failedQueue = [];
}

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined" && config.method) {
    const method = config.method.toUpperCase();
    const unsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    if (unsafe) {
      const csrf = getCsrfToken();
      if (csrf) config.headers["x-csrf-token"] = csrf;
    }
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
      await api.post("/admin/auth/refresh");
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
