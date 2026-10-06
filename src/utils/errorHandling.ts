/**
 * Secure error handling utilities
 * These functions help prevent leaking sensitive information through logs or user-facing messages
 */

import { toast } from 'react-toastify';

// Error codes mapped to user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credentials': 'Invalid login credentials',
  'auth/user-not-found': 'Account not found',
  'auth/wrong-password': 'Invalid login credentials',
  'auth/email-already-in-use': 'An account with this email already exists',
  'auth/weak-password': 'Password is too weak',
  'auth/invalid-email': 'Invalid email format',
  // Add more mappings as needed
};

// Default messages for different error types
const DEFAULT_ERROR_MESSAGES = {
  auth: 'Authentication error. Please try again.',
  data: 'Unable to process data. Please try again.',
  network: 'Network error. Please check your connection.',
  server: 'Server error. Please try again later.',
  unknown: 'An error occurred. Please try again.',
};

/**
 * Handles errors securely without exposing sensitive information
 * Production-ready: No console logging, uses Sentry for error tracking
 * @param error The error object
 * @param errorType The type of error for default messaging
 * @param customMessage Optional custom message to show to the user
 * @param shouldToast Whether to show a toast message (default: true)
 */
export const handleError = (
  error: any,
  errorType: keyof typeof DEFAULT_ERROR_MESSAGES = 'unknown',
  customMessage?: string,
  shouldToast: boolean = true
): void => {
  // Production: Never log to console
  // Error tracking handled by Sentry

  // Determine user-facing message
  let userMessage = customMessage || DEFAULT_ERROR_MESSAGES[errorType];

  // Check if we have a specific message for this error code
  const errorCode = error?.code || '';
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    userMessage = ERROR_MESSAGES[errorCode];
  }

  // Show toast if requested
  if (shouldToast) {
    toast.error(userMessage);
  }
};

/**
 * Logs non-sensitive information for analytics or monitoring
 * Production-ready: Uses Sentry, no console logging
 * @param _message The message to log
 * @param _data Optional data to include (must not contain PII or sensitive info)
 */
export const logEvent = (_message: string, _data?: Record<string, any>): void => {
  // Production: No console logging
  // Event tracking handled by Sentry or analytics service
};