/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  AxiosRequestConfig as AxiosConfig,
  AxiosError,
  AxiosInstance,
  AxiosResponse,
} from "axios";
import axios from "axios";

import { API_ROUTES } from "../config/apiRoutes";

import type { AxiosRequestConfig, HttpClient } from "./HttpClient";

// Extend Axios config for custom flags
declare module "axios" {
  export interface AxiosRequestConfig {
    _skipAuthRefresh?: boolean;
    _retry?: boolean;
  }
}

type RefreshQueueItem = {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
};

export class AxiosHttpClient implements HttpClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshQueue: RefreshQueueItem[] = [];

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  getAxiosInstance(): AxiosInstance {
    return this.client;
  }

  private setupInterceptors(): void {
    // Response interceptor for handling 401 and token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const { config } = error;
        const originalRequest = config as AxiosConfig;

        if (!this.shouldRefresh(error, config)) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.refreshQueue.push({ resolve, reject });
          })
            .then(() => this.retryOriginalRequest(originalRequest))
            .catch((err) => Promise.reject(err));
        }

        this.isRefreshing = true;

        try {
          await this.refreshTokenRequest();
          this.resolveQueue(null);
          return this.retryOriginalRequest(originalRequest);
        } catch (refreshErr) {
          this.resolveQueue(refreshErr as AxiosError);
          throw refreshErr;
        } finally {
          this.isRefreshing = false;
        }
      }
    );
  }

  /**
   * Determines whether the authentication token should be refreshed based on the given error and request configuration.
   *
   * The method returns `false` if:
   * - The `_skipAuthRefresh` flag is set in the config.
   * - The request URL matches the login or logout API routes.
   *
   * Otherwise, it returns `true` only if:
   * - The error response status is 401 (Unauthorized).
   * - The `_retry` flag is not set in the config.
   *
   * @param error - The Axios error object received from a failed HTTP request.
   * @param config - (Optional) The Axios request configuration associated with the request.
   * @returns `true` if the token should be refreshed, otherwise `false`.
   */
  private shouldRefresh(error: AxiosError, config?: AxiosConfig): boolean {
    if (
      config?._skipAuthRefresh ||
      config?.url?.includes(API_ROUTES.LOGIN) ||
      config?.url?.includes(API_ROUTES.LOGOUT)
    ) {
      return false;
    }
    return error.response?.status === 401 && !config?._retry;
  }

  /**
   * Sends a request to the API to refresh the authentication token.
   * This method uses the configured Axios client to make a POST request
   * to the refresh token endpoint defined in `API_ROUTES.REFRESH`.
   * The `_skipAuthRefresh` option is set to true to prevent triggering
   * any automatic authentication refresh logic that may be present in interceptors.
   *
   * @returns {Promise<void>} A promise that resolves when the refresh request completes.
   * @throws Will propagate any errors encountered during the HTTP request.
   * @private
   */
  private async refreshTokenRequest(): Promise<void> {
    await this.client.post(API_ROUTES.REFRESH, undefined, {
      _skipAuthRefresh: true,
    });
  }

  private retryOriginalRequest(request: AxiosConfig) {
    return this.client(request);
  }

  /**
   * Resolves or rejects all promises in the refresh queue based on the provided error.
   *
   * If an error is provided, each promise in the queue is rejected with the error.
   * Otherwise, all promises are resolved successfully.
   * After processing, the refresh queue is cleared.
   *
   * @param error - An optional AxiosError. If present, all queued promises are rejected with this error; otherwise, they are resolved.
   */
  private resolveQueue(error: AxiosError | null) {
    this.refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
    this.refreshQueue = [];
  }
}
