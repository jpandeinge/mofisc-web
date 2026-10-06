import axios from 'axios';
import { supabase } from '../lib/supabase';
import { secureLogger } from './secureLogger';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/v1`;
const MAX_STATEMENT_UPLOAD_MB = Number(process.env.REACT_APP_MAX_STATEMENT_UPLOAD_MB) || 25;
const MAX_STATEMENT_UPLOAD_BYTES = MAX_STATEMENT_UPLOAD_MB * 1024 * 1024;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(async (config) => {
  const session = await supabase.auth.getSession();
  if (session && session.data.session) {
    config.headers['Authorization'] = `Bearer ${session.data.session.access_token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor: return directly, let callers handle errors (no noisy console logs)
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export const uploadStatement = async (file: File) => {
  if (file.size === 0) {
    throw new Error('Uploaded file is empty');
  }
  if (file.size > MAX_STATEMENT_UPLOAD_BYTES) {
    throw new Error(`File too large. Maximum size is ${MAX_STATEMENT_UPLOAD_MB} MB.`);
  }

  // Get current user info for per-user processing
  const session = await supabase.auth.getSession();
  const userId = session?.data?.session?.user?.id;

  // Create user-specific filename to ensure per-user statement processing
  let fileToUpload = file;

  if (userId) {
    // Create a unique filename by appending user ID hash
    // This ensures per-user statement processing while maintaining privacy
    const originalName = file.name;
    const fileExtension = originalName.split('.').pop() || 'pdf';
    const baseName = originalName.replace(`.${fileExtension}`, '');
    const userHash = userId.substring(0, 8); // Truncated for privacy - only first 8 chars
    const uniqueName = `${baseName}_${userHash}.${fileExtension}`;

    // Create new file with unique name but same content
    fileToUpload = new File([file], uniqueName, {
      type: file.type,
      lastModified: file.lastModified
    });
  }

  const formData = new FormData();
  formData.append('file', fileToUpload);

  try {
    const response = await api.post('/upload-statement/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    // Handle the nested response structure
    if (response.data.success && response.data.data) {
      // Return both data and tier_info for upgrade prompting
      return {
        ...response.data.data,
        tier_info: response.data.tier_info, // Include tier info for upgrade modal
      };
    }

    throw new Error(response.data.message || 'Failed to process statement');
  } catch (error: any) {
    const httpStatus = error?.response?.status ?? error?.status;
    const responseData = error?.response?.data ?? error;
    const detail = responseData?.detail ?? responseData;
    const code = detail?.error ?? detail?.code;

    // Expected paywall path: do not log as an error (it’s a normal product flow).
    if (
      httpStatus === 403 &&
      (code === 'transaction_limit_exceeded' || code === 'bank_limit_exceeded')
    ) {
      throw responseData;
    }

    secureLogger.error('api', 'Error uploading statement', error);
    throw responseData ?? error;
  }
};

export const getTransactions = async () => {
  try {
    const response = await api.get('/transactions/');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch transactions');
  } catch (error: any) {
    secureLogger.error('api', 'Error getting transactions', error);
    throw error.response?.data || error;
  }
};

export const getMetrics = async () => {
  try {
    const response = await api.get('/metrics/');
    return response.data.data; // Updated to handle the new response structure
  } catch (error: any) {
    secureLogger.error('api', 'Error getting metrics', error);
    throw error.response?.data || error;
  }
};

export const checkExistingStatement = async (file: File) => {
  if (file.size === 0) {
    throw new Error('Uploaded file is empty');
  }
  if (file.size > MAX_STATEMENT_UPLOAD_BYTES) {
    throw new Error(`File too large. Maximum size is ${MAX_STATEMENT_UPLOAD_MB} MB.`);
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/upload-statement/check', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to check statement');
    }
  } catch (error: any) {
    secureLogger.error('api', 'Error checking existing statement', error);
    throw error.response?.data || error;
  }
};
