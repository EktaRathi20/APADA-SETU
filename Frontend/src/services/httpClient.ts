import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

const baseURL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const instance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

instance.interceptors.response.use(
  response => response,
  (error: AxiosError<{ detail?: unknown }>) => {
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(new DOMException('The operation was aborted.', 'AbortError'));
    }

    if (!error.response) {
      return Promise.reject(new Error(`API request failed: ${error.config?.url ?? 'unknown endpoint'}. ${error.message}`));
    }

    const detail = error.response.data?.detail;
    const detailMessage = typeof detail === 'string' ? ` ${detail}` : '';
    const path = error.config?.url ?? 'unknown endpoint';
    return Promise.reject(new Error(`API request failed (${error.response.status}): ${path}.${detailMessage}`));
  },
);

export const httpClient = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await instance.get<T>(url, config);
    return response.data;
  },
  async post<T, TBody = unknown>(url: string, body?: TBody, config?: AxiosRequestConfig): Promise<T> {
    const response = await instance.post<T>(url, body, config);
    return response.data;
  },
  async put<T, TBody = unknown>(url: string, body?: TBody, config?: AxiosRequestConfig): Promise<T> {
    const response = await instance.put<T>(url, body, config);
    return response.data;
  },
  async patch<T, TBody = unknown>(url: string, body?: TBody, config?: AxiosRequestConfig): Promise<T> {
    const response = await instance.patch<T>(url, body, config);
    return response.data;
  },
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await instance.delete<T>(url, config);
    return response.data;
  },
};
