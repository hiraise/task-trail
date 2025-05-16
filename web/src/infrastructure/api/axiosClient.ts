import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

import { API_ROUTES } from "@/infrastructure/config/apiRoutes";

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}[] = [];

function resolveQueue(error: AxiosError | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
}

axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error: AxiosError) => {
    const { response, config } = error;
    const originalRequest = config as AxiosRequestConfig & { _retry?: boolean };

    // Check if the error is due to a 401 Unauthorized response
    // and if the request is not for the login endpoint
    if (response?.config.url?.includes(API_ROUTES.LOGIN)) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized error
    if (response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If the request is already in the queue, wait for it to finish
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // Try to refresh the token
        await axiosClient.post(API_ROUTES.REFRESH);
        resolveQueue(null);
        return axiosClient(originalRequest);
      } catch (refreshErr) {
        // Reject all queued requests and throw Error
        resolveQueue(refreshErr as AxiosError);
        throw new Error();
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
