// src/lib/sentry.ts

import * as Sentry from '@sentry/react';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Initialize Sentry
export const initSentry = () => {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN, // Add this to your .env file
    environment: process.env.NODE_ENV,

    // Performance monitoring
    integrations: [
      // Automatically instrument React components
      Sentry.browserTracingIntegration(),
    ],

    // Performance monitoring sampling
    tracesSampleRate: isDevelopment ? 1.0 : 0.1,

    // Error sampling
    sampleRate: isProduction ? 1.0 : 1.0,

    // Security settings
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.exception) {
        const error = hint.originalException;

        // Don't send authentication errors to Sentry
        if (error instanceof Error && error.message?.includes('auth')) {
          return null;
        }
      }

      // Sanitize request data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.Authorization;
        delete event.request.headers?.authorization;
      }

      // Sanitize user context
      if (event.user) {
        // Only keep non-sensitive user data
        event.user = {
          id: event.user.id ? '[USER_ID]' : undefined,
          ip_address: '{{auto}}', // Sentry will auto-detect IP
        };
      }

      // Sanitize breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            // Remove sensitive data from breadcrumbs
            const sensitiveKeys = ['amount', 'balance', 'income', 'expense', 'token', 'auth', 'password'];
            const sanitizedData: any = {};

            for (const [key, value] of Object.entries(breadcrumb.data)) {
              if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                sanitizedData[key] = '[REDACTED]';
              } else if (typeof value === 'string' && value.length > 100) {
                sanitizedData[key] = '[LONG_STRING]';
              } else if (Array.isArray(value)) {
                sanitizedData[key] = `[ARRAY:${value.length}]`;
              } else {
                sanitizedData[key] = value;
              }
            }

            breadcrumb.data = sanitizedData;
          }
          return breadcrumb;
        });
      }

      return event;
    },

    // Don't send in development unless explicitly enabled
    enabled: isProduction || process.env.REACT_APP_SENTRY_ENABLED === 'true',
  });
};

// Enhanced logging functions that integrate with Sentry
// Production-ready: No console logging, all events tracked via Sentry
export const sentryLogger = {
  // Info level - for general application flow
  info: (message: string, context?: Record<string, any>) => {
    // Production: No console logging
    Sentry.addBreadcrumb({
      message,
      level: 'info',
      data: context,
      category: 'app.info',
    });
  },

  // Warning level - for potential issues
  warn: (message: string, context?: Record<string, any>) => {
    // Production: No console logging
    Sentry.addBreadcrumb({
      message,
      level: 'warning',
      data: context,
      category: 'app.warning',
    });
  },

  // Error level - for actual errors that should be tracked
  error: (message: string, error?: Error | any, context?: Record<string, any>) => {
    // Production: No console logging, only Sentry tracking
    if (error instanceof Error) {
      Sentry.captureException(error, {
        tags: {
          section: 'financial-app',
        },
        contexts: {
          additional: context || {},
        },
        fingerprint: [message, error.name],
      });
    } else {
      Sentry.captureMessage(message, 'error');
    }
  },

  // Performance tracking
  transaction: (name: string, operation: string) => {
    return Sentry.startSpan({
      name,
      op: operation,
    }, () => {
      // Return a function that can be called to finish the span
      return;
    });
  },

  // User context (sanitized)
  setUser: (userId?: string) => {
    Sentry.setUser({
      id: userId ? '[USER_ID]' : undefined,
    });
  },

  // Clear user context on logout
  clearUser: () => {
    Sentry.setUser(null);
  },

  // Add tags for better error categorization
  setTag: (key: string, value: string) => {
    Sentry.setTag(key, value);
  },

  // Financial-specific logging (with automatic sanitization)
  financialEvent: (event: string, metadata?: Record<string, any>) => {
    const sanitizedMetadata: Record<string, any> = {};

    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        if (typeof value === 'number' && (key.includes('amount') || key.includes('balance'))) {
          sanitizedMetadata[key] = '[AMOUNT]';
        } else if (Array.isArray(value)) {
          sanitizedMetadata[key] = `[COUNT:${value.length}]`;
        } else if (typeof value === 'string' && value.length > 50) {
          sanitizedMetadata[key] = '[TEXT]';
        } else {
          sanitizedMetadata[key] = value;
        }
      }
    }

    Sentry.addBreadcrumb({
      message: `Financial Event: ${event}`,
      level: 'info',
      data: sanitizedMetadata,
      category: 'financial.event',
    });
  },
};

// React Error Boundary integration
export const SentryErrorBoundary = Sentry.ErrorBoundary;
