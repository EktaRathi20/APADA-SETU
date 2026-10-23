import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { ApiError, normalizeApiError } from './apiError';

const baseURL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const instance = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

instance.interceptors.response.use(
  response => response,
  (error: AxiosError<{ detail?: unknown }>) => {
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(new DOMException('The operation was aborted.', 'AbortError'));
    }

    return Promise.reject(normalizeApiError(error, error.config?.url ?? 'API request'));
  },
);

function ensureResponseData<T>(data: T, url: string): T {
  if (
    data === undefined
    || data === null
    || data === ''
    || Array.isArray(data) && data.length === 0 && url !== '/alerts'
    || typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0
  ) {
    throw new ApiError('No information is available right now. Please try again.', 'empty-response');
  }

  return data;
}

export const httpClient = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await instance.get<T>(url, config);
      return ensureResponseData(response.data, url);
    } catch (error) {
      throw normalizeApiError(error, url);
    }
  },
  async post<T, TBody = unknown>(url: string, body?: TBody, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await instance.post<T>(url, body, config);
      return ensureResponseData(response.data, url);
    } catch (error) {
      throw normalizeApiError(error, url);
    }
  },
  async put<T, TBody = unknown>(url: string, body?: TBody, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await instance.put<T>(url, body, config);
      return ensureResponseData(response.data, url);
    } catch (error) {
      throw normalizeApiError(error, url);
    }
  },
  async patch<T, TBody = unknown>(url: string, body?: TBody, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await instance.patch<T>(url, body, config);
      return ensureResponseData(response.data, url);
    } catch (error) {
      throw normalizeApiError(error, url);
    }
  },
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await instance.delete<T>(url, config);
      return ensureResponseData(response.data, url);
    } catch (error) {
      throw normalizeApiError(error, url);
    }
  },
};
