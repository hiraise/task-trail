import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

import { API_ROUTES } from "@/infrastructure/config/apiRoutes";

// Extend Axios config for custom flags
declare module "axios" {
  export interface AxiosRequestConfig {
    _skipAuthRefresh?: boolean;
    _retry?: boolean;
  }
}

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

type RefreshQueueItem = {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
};

let isRefreshing = false;
let refreshQueue: RefreshQueueItem[] = [];

// Resolve or reject all queued requests
function resolveQueue(error: AxiosError | null) {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  refreshQueue = [];
}

// Refresh token request
async function refreshToken(): Promise<void> {
  await axiosClient.post(API_ROUTES.REFRESH, undefined, { _skipAuthRefresh: true });
}

// Should refresh on 401
function shouldRefresh(error: AxiosError, config?: AxiosRequestConfig): boolean {
  if (config?._skipAuthRefresh || config?.url?.includes(API_ROUTES.LOGIN)) return false;
  return error.response?.status === 401 && !config?._retry;
}

// Retry original request
function retryRequest(request: AxiosRequestConfig) {
  return axiosClient(request);
}

// Interceptor for handling 401 and refresh logic
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error: AxiosError) => {
    const { config } = error;
    const originalRequest = config as AxiosRequestConfig;

    if (!shouldRefresh(error, config)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      })
        .then(() => retryRequest(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      await refreshToken();
      resolveQueue(null);
      return retryRequest(originalRequest);
    } catch (refreshErr) {
      resolveQueue(refreshErr as AxiosError);
      throw refreshErr;
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosClient;

