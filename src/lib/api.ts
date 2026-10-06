// src/lib/api.ts

import axios, { InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { supabase } from './supabase';
import { APIResponse, TransactionResponse, MetricsResponse, StatementResponse } from '../types/api';
import { logEvent } from '../utils/errorHandling';
import { notifyRateLimit } from '../utils/rateLimitSignal';
import { sentryLogger } from './sentry';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const MAX_STATEMENT_UPLOAD_MB = Number(process.env.REACT_APP_MAX_STATEMENT_UPLOAD_MB) || 25;
const MAX_STATEMENT_UPLOAD_BYTES = MAX_STATEMENT_UPLOAD_MB * 1024 * 1024;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: new AxiosHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  })
});

// Request interceptor with proper token refresh handling
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // First, try to get the current session
      let { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      // If session exists but token might be expired, try to refresh it
      if (session?.expires_at) {
        const expiresAt = session.expires_at * 1000; // Convert to milliseconds
        const now = Date.now();
        const bufferTime = 60 * 1000; // 1 minute buffer before expiry

        // If token is expired or about to expire, force a refresh
        if (now >= expiresAt - bufferTime) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            // Refresh failed - session is truly invalid
            throw new Error('Session expired');
          }
          session = refreshData.session;
        }
      }

      if (!session?.access_token) {
        throw new Error('No valid session');
      }

      // Create new headers instance
      const headers = new AxiosHeaders(config.headers);

      // Set auth headers properly
      headers.set('Authorization', `Bearer ${session.access_token}`);
      headers.set('X-Client-Info', 'supabase-js/2.x');

      // Set CORS headers
      if (config.method?.toLowerCase() === 'options') {
        headers.set('Access-Control-Request-Method', 'GET,POST,PUT,DELETE,OPTIONS');
        headers.set('Access-Control-Request-Headers', 'authorization,content-type');
      }

      // Assign headers back to config
      config.headers = headers;

      return config;
    } catch (error) {
      if (error instanceof Error && (error.message === 'No valid session' || error.message === 'Session expired')) {
        // Prevent redirect loop - only redirect if not already on auth pages
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/signin') && !currentPath.includes('/signup') && !currentPath.includes('/reset-password')) {
          window.location.href = '/signin';
        }
      }
      return Promise.reject(error);
    }
  }
);

// Retry interceptor with exponential backoff (MUST be added first)
const MAX_RETRIES = 3;

api.interceptors.response.use(undefined, async (error) => {
  // Ensure config exists - critical safety check
  if (!error.config) {
    return Promise.reject(error);
  }

  const config = error.config;

  // Initialize retry properties if not set
  if (config.retry === undefined) {
    config.retry = MAX_RETRIES;
  }

  if (config.__retryCount === undefined) {
    config.__retryCount = 0;
  }

  // Notify the rate-limit banner and log to Sentry on the first 429 for this request
  if (error.response?.status === 429 && config.__retryCount === 0) {
    const retryAfter = parseInt(error.response.headers['retry-after'] || '30', 10) || 30;
    notifyRateLimit(retryAfter);
    sentryLogger.warn('Rate limited', {
      retry_after: retryAfter,
      url: config.url,
      method: config.method,
    });
  }

  // Don't retry on 4xx errors (client errors) except 429 (rate limit)
  if (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
    return Promise.reject(error);
  }

  // Check if we've exhausted retries
  if (config.__retryCount >= config.retry) {
    return Promise.reject(error);
  }

  config.__retryCount += 1;

  // Exponential backoff
  const backoffDelay = Math.min(1000 * Math.pow(2, config.__retryCount - 1), 10000);

  await new Promise(resolve => setTimeout(resolve, backoffDelay));

  // Log retry attempt in development only
  if (process.env.NODE_ENV === 'development') {
    logEvent(`Retrying request (${config.__retryCount}/${config.retry})`);
  }

  return api(config);
});

// Enhanced response interceptor for user-friendly error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorMessage = 'An unexpected error occurred';

    if (error.response) {
      // Request was made and server responded with error status
      if (process.env.NODE_ENV === 'development') {
        // Only log in development
        logEvent('Server error response', {
          status: error.response.status,
        });
      }

      switch (error.response.status) {
        case 401:
          errorMessage = 'Session expired. Please sign in again.';
          // Prevent redirect loop - only redirect if not already on auth pages
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/signin') && !currentPath.includes('/signup') && !currentPath.includes('/reset-password')) {
            window.location.href = '/signin';
          }
          break;
        case 403:
          errorMessage = 'You do not have permission to access this resource';
          break;
        case 404:
          errorMessage = 'Resource not found';
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again shortly.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later';
          break;
        default:
          errorMessage = error.response.data?.message || 'An error occurred';
      }
    } else if (error.request) {
      // Request was made but no response received
      logEvent('Network error - no response received');
      errorMessage = 'Network error. Please check your connection.';
    }

    // Preserve original error object with config for potential retries
    error.message = errorMessage;
    return Promise.reject(error);
  }
);

export interface APIError extends Error {
  response?: {
    data?: any;
    status?: number;
  };
}

const handleError = (error: any): APIError => {
  const apiError = new Error() as APIError;

  if (error.response) {
    apiError.message = error.response.data?.message || 'An error occurred';
    apiError.response = error.response;
  } else if (error.request) {
    apiError.message = 'Network error. Please check your connection.';
  } else {
    apiError.message = error.message || 'An unexpected error occurred';
  }

  return apiError;
};

const DEFAULT_RETRY_CONFIG = {
  retry: 3,
  retryDelay: (retryCount: number) => Math.min(1000 * Math.pow(2, retryCount), 10000),
  timeout: 10000,
};

export const transactionsAPI = {
  uploadStatement: async (file: File) => {
    try {
      if (file.size === 0) {
        throw new Error('Uploaded file is empty');
      }
      if (file.size > MAX_STATEMENT_UPLOAD_BYTES) {
        throw new Error(`File too large. Maximum size is ${MAX_STATEMENT_UPLOAD_MB} MB.`);
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload-statement/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 90000, // 90 seconds for upload (OCR + ML classification takes ~35s)
      });

      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw handleError(error);
    }
  },


  getTransactions: async (params?: {
    skip?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    statement_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<APIResponse<TransactionResponse>> => {
    const cacheKey = `transactions_${JSON.stringify(params)}`;
    const cachedResponse = sessionStorage.getItem(cacheKey);

    if (cachedResponse) {
      return JSON.parse(cachedResponse);
    }

    try {
      // Auth headers are handled by the request interceptor with proper token refresh
      const response = await api.get<TransactionResponse>('/transactions/', {
        params,
        ...DEFAULT_RETRY_CONFIG,
      });

      // Cache the successful response in sessionStorage
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: response.data,
        status: response.status
      }));

      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      logEvent('Failed to get transactions');
      throw handleError(error);
    }
  },

  getMetrics: async (): Promise<APIResponse<MetricsResponse>> => {
    try {
      const response = await api.get<MetricsResponse>('/metrics/');
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      logEvent('Failed to get metrics');
      throw error;
    }
  },

  getStatements: async (): Promise<APIResponse<StatementResponse>> => {
    try {
      const response = await api.get<StatementResponse>('/statements/');
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      logEvent('Failed to get statements');
      throw error;
    }
  },
};

export { api };
export default transactionsAPI;
