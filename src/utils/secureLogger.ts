// src/utils/secureLogger.ts

import { sentryLogger } from '../lib/sentry';

/**
 * Secure logging utility that prevents exposure of sensitive financial data
 * Only logs in development mode and sanitizes all output
 * Integrates with Sentry for production error tracking
 */

interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

// Sensitive fields that should never be logged
const SENSITIVE_FIELDS = [
  'amount', 'balance', 'transaction_amount', 'running_balance',
  'total_income', 'total_expenses', 'net_cash_flow',
  'account_number', 'card_number', 'ssn', 'tax_id',
  'phone', 'email', 'address', 'postal_code',
  'password', 'token', 'key', 'secret', 'auth',
  'fcm', 'vapid', 'api_key', 'apikey', 'firebase'
];

/**
 * Sanitizes objects by removing or masking sensitive fields
 */
const sanitizeObject = (obj: any, depth = 0): any => {
  if (depth > 5) return '[Max Depth Reached]'; // Prevent infinite recursion

  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Check if string looks like sensitive data
    if (obj.length > 50) return `[String: ${obj.length} chars]`;
    return obj;
  }

  if (typeof obj === 'number') {
    // Mask large numbers that might be financial amounts
    if (obj > 1000 || obj < -1000) return '[Amount: ***]';
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length > 10) {
      return `[Array: ${obj.length} items - first item: ${sanitizeObject(obj[0], depth + 1)}]`;
    }
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      // Check if key contains sensitive information
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Special handling for common sensitive patterns
      if (lowerKey.includes('id') && typeof value === 'string' && value.length > 20) {
        sanitized[key] = `[ID: ${value.substring(0, 8)}...]`;
        continue;
      }

      sanitized[key] = sanitizeObject(value, depth + 1);
    }

    return sanitized;
  }

  return obj;
};

/**
 * Secure logger that sanitizes output and respects environment
 */
class SecureLogger {
  private isProduction = process.env.NODE_ENV === 'production';
  private isDevelopment = process.env.NODE_ENV === 'development';

  private shouldLog(_level: string): boolean {
    // Never write to browser console in production.
    // Use Sentry for production observability; keep console clean and avoid data leakage.
    return this.isDevelopment;
  }

  private formatMessage(level: string, context: string, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;

    if (data !== undefined) {
      const sanitizedData = sanitizeObject(data);
      (console as any)[level](prefix, message, sanitizedData);
    } else {
      (console as any)[level](prefix, message);
    }
  }

  debug(context: string, message: string, data?: any): void {
    this.formatMessage(LOG_LEVELS.DEBUG, context, message, data);
  }

  info(context: string, message: string, data?: any): void {
    this.formatMessage(LOG_LEVELS.INFO, context, message, data);
    // Also send to Sentry for breadcrumbs
    sentryLogger.info(`${context}: ${message}`, data);
  }

  warn(context: string, message: string, data?: any): void {
    this.formatMessage(LOG_LEVELS.WARN, context, message, data);
    // Send warnings to Sentry
    sentryLogger.warn(`${context}: ${message}`, data);
  }

  error(context: string, message: string, error?: Error | any): void {
    if (error instanceof Error) {
      const errorData = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : '[Stack trace hidden in production]'
      };
      this.formatMessage(LOG_LEVELS.ERROR, context, message, errorData);
      // Send errors to Sentry
      sentryLogger.error(`${context}: ${message}`, error);
    } else {
      const sanitizedError = sanitizeObject(error);
      this.formatMessage(LOG_LEVELS.ERROR, context, message, sanitizedError);
      // Send generic errors to Sentry
      sentryLogger.error(`${context}: ${message}`, new Error(JSON.stringify(sanitizedError)));
    }
  }

  /**
   * Logs transaction count without exposing transaction data
   */
  logTransactionCount(context: string, transactions: any[]): void {
    this.info(context, `Transactions loaded: ${transactions?.length || 0} items`);
  }

  /**
   * Logs API response status without exposing data
   */
  logApiResponse(context: string, response: any): void {
    this.info(context, 'API Response received', {
      status: response.status,
      success: response.data?.success,
      hasData: !!response.data?.data,
      dataType: Array.isArray(response.data?.data) ? 'array' : typeof response.data?.data
    });
  }

  /**
   * Logs cache operations without exposing cached data
   */
  logCacheOperation(context: string, operation: string, key: string, dataSize?: number): void {
    this.debug(context, `Cache ${operation}`, {
      key: key.includes('user') ? '[USER_KEY]' : key,
      dataSize: dataSize ? `${dataSize} items` : 'unknown'
    });
  }
}

// Export singleton instance
export const secureLogger = new SecureLogger();

// Convenience functions for common use cases
export const logTransactionLoad = (context: string, count: number) => {
  secureLogger.info(context, `Loaded ${count} transactions`);
};

export const logMetricsCalculation = (context: string, metricsAvailable: boolean) => {
  secureLogger.info(context, `Metrics calculation completed - available: ${metricsAvailable}`);
};

export const logAuthEvent = (context: string, event: string) => {
  secureLogger.info(context, `Auth event: ${event}`);
};

export const logApiError = (context: string, error: any) => {
  secureLogger.error(context, 'API request failed', error);
};

// Development-only detailed logging
export const logDevDetails = (context: string, message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    secureLogger.debug(context, message, data);
  }
};

// Firebase/Notification specific logging
export const logNotificationPermission = (context: string, granted: boolean) => {
  secureLogger.info(context, `Notification permission ${granted ? 'granted' : 'denied'}`);
};

export const logFCMToken = (context: string, tokenReceived: boolean) => {
  // NEVER log the actual token - only log that it was received
  if (process.env.NODE_ENV === 'development') {
    secureLogger.debug(context, tokenReceived ? 'FCM token obtained' : 'No FCM token available');
  }
};

export const logServiceWorkerRegistration = (context: string, registered: boolean) => {
  secureLogger.info(context, `Service Worker ${registered ? 'registered successfully' : 'registration failed'}`);
};
