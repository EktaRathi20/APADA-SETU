import axios from 'axios';

export type ApiErrorKind = 'timeout' | 'network' | 'server' | 'http' | 'empty-response';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: ApiErrorKind,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function normalizeApiError(error: unknown, _endpoint = 'API request'): Error {
  if (error instanceof ApiError || error instanceof DOMException && error.name === 'AbortError') {
    return error;
  }

  if (!axios.isAxiosError<{ detail?: unknown }>(error)) {
    return error instanceof Error ? error : new Error('Something went wrong. Please try again.');
  }

  const axiosError = error;
  if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
    return new ApiError('The request took too long. Check your connection and try again.', 'timeout');
  }

  if (!axiosError.response) {
    return new ApiError('We couldn’t connect to the service. Check your connection and try again.', 'network');
  }

  const status = axiosError.response.status;
  const kind = status >= 500 ? 'server' : 'http';
  const message = status >= 500
    ? 'This service is temporarily unavailable. Please try again shortly.'
    : 'We couldn’t complete that request. Please try again.';

  return new ApiError(message, kind, status);
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
    || error instanceof Error && error.name === 'AbortError';
}
