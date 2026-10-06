// src/services/userMetricsService.ts

import { supabase } from '../lib/supabase';
import { ComprehensiveUserMetrics, FinancialMetrics, AchievementMetrics, ActivityMetrics } from '../context/UserMetricsContext';
import { secureLogger, logDevDetails } from '../utils/secureLogger';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/v1`;

// Configuration constants
const CONFIG = {
  DEFAULT_TIMEOUT: 60000, // 60 seconds - allow time for backend processing
  RETRY_ATTEMPTS: 2 as number, // Retry twice for reliability
  RETRY_DELAY: 1000, // 1 second retry delay
};

interface ApiResponse<T> {
  success: boolean;
  data: T;
  calculated_at: string;
  user_id: string;
}

interface MetricsSummary {
  financial_health_score: number;
  current_level: number;
  total_points: number;
  savings_streak: number;
  total_achievements: number;
  savings_rate: number;
  spending_trend: string;
  recent_activity: boolean;
  last_calculated: string | null;
}

type FetchOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

class UserMetricsService {
  // Track in-flight requests to prevent duplicate simultaneous calls
  private inFlightRequests = new Map<string, Promise<any>>();

  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      let { data: { session }, error } = await supabase.auth.getSession();
      logDevDetails('UserMetricsService', 'Session check', { sessionFound: !!session });

      if (error) {
        secureLogger.error('UserMetricsService', 'Session retrieval error', error);
        throw new Error('Failed to get authentication session. Please log in again.');
      }

      // Check if token is expired or about to expire, and refresh if needed
      if (session?.expires_at) {
        const expiresAt = session.expires_at * 1000; // Convert to milliseconds
        const now = Date.now();
        const bufferTime = 60 * 1000; // 1 minute buffer before expiry

        if (now >= expiresAt - bufferTime) {
          logDevDetails('UserMetricsService', 'Token expiring soon, refreshing...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            secureLogger.error('UserMetricsService', 'Token refresh failed', refreshError);
            // Redirect to signin if not already on auth pages
            const currentPath = window.location.pathname;
            if (!currentPath.includes('/signin') && !currentPath.includes('/signup') && !currentPath.includes('/reset-password')) {
              window.location.href = '/signin';
            }
            throw new Error('Session expired. Please log in again.');
          }
          session = refreshData.session;
        }
      }

      if (!session?.access_token) {
        secureLogger.error('UserMetricsService', 'Token retrieval failed - no access token in session');
        throw new Error('No authentication token found. Please log in again.');
      }

      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      };
    } catch (error) {
      secureLogger.error('UserMetricsService', 'Authentication error', error);
      throw error instanceof Error ? error : new Error('Authentication failed. Please log in again.');
    }
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number = CONFIG.RETRY_ATTEMPTS,
    fetchOptions?: FetchOptions
  ): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutMs = fetchOptions?.timeoutMs ?? CONFIG.DEFAULT_TIMEOUT;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // If caller provides a signal, abort our internal controller as well
      const externalSignal = fetchOptions?.signal;
      const onExternalAbort = () => controller.abort();
      if (externalSignal) {
        if (externalSignal.aborted) controller.abort();
        else externalSignal.addEventListener('abort', onExternalAbort, { once: true });
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
      return response;
    } catch (error) {
      if (retries > 0 && (error instanceof TypeError || (error as Error).name === 'AbortError')) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
        return this.fetchWithRetry(url, options, retries - 1, fetchOptions);
      }
      throw error;
    }
  }

  private handleApiError(response: Response, context: string): void {
    if (response.status === 401) {
      // Redirect to signin if not already on auth pages (prevent redirect loop)
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/signin') && !currentPath.includes('/signup') && !currentPath.includes('/reset-password')) {
        window.location.href = '/signin';
      }
      throw new Error('Authentication expired. Please log in again.');
    } else if (response.status === 403) {
      throw new Error('Access denied. You do not have permission to access this resource.');
    } else if (response.status === 429) {
      throw new Error('Too many requests. Please wait a moment before trying again.');
    } else if (response.status >= 500) {
      throw new Error(`Server error occurred while ${context}. Please try again later.`);
    } else {
      throw new Error(`Request failed while ${context}. Status: ${response.status}`);
    }
  }

  async getComprehensiveMetrics(
    forceRecalculate = false,
    bankName?: string | null,
    fetchOptions?: FetchOptions
  ): Promise<ComprehensiveUserMetrics> {
    // Build query params
    const params = new URLSearchParams();
    if (forceRecalculate) {
      params.append('force_recalculate', 'true');
    }
    if (bankName) {
      params.append('bank_name', bankName);
    }
    const queryString = params.toString();
    const url = `${API_BASE_URL}/metrics${queryString ? `?${queryString}` : ''}`;
    const context = 'fetching comprehensive user metrics';

    // Create a unique key for this request (for deduplication)
    const requestKey = `metrics:${queryString}`;

    // If there's already an in-flight request for the same params, return that promise
    const existingRequest = this.inFlightRequests.get(requestKey);
    if (existingRequest && !forceRecalculate) {
      logDevDetails('UserMetricsService', 'Reusing in-flight request', { requestKey });
      return existingRequest;
    }

    // Create the request promise
    const requestPromise = (async () => {
      try {
        const response = await this.fetchWithRetry(url, {
          method: 'GET',
          headers: await this.getAuthHeaders(),
        }, CONFIG.RETRY_ATTEMPTS, fetchOptions);

        if (!response.ok) {
          this.handleApiError(response, context);
        }

        const result: ApiResponse<ComprehensiveUserMetrics> = await response.json();

        if (!result.success) {
          throw new Error('Server returned unsuccessful response for user metrics');
        }

        return result.data;
      } catch (error) {
        // Avoid noisy console output (prod); still capture in Sentry via secureLogger
        secureLogger.error('UserMetricsService', 'Error fetching comprehensive metrics', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('An unexpected error occurred while fetching metrics');
      } finally {
        // Clean up the in-flight request after completion (success or failure)
        this.inFlightRequests.delete(requestKey);
      }
    })();

    // Store the promise for deduplication
    this.inFlightRequests.set(requestKey, requestPromise);

    return requestPromise;
  }

  async getFinancialMetrics(): Promise<FinancialMetrics> {
    const url = `${API_BASE_URL}/metrics/financial`;
    const context = 'fetching financial metrics';

    try {
      const response = await this.fetchWithRetry(url, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        this.handleApiError(response, context);
      }

      const result: ApiResponse<FinancialMetrics> = await response.json();

      if (!result.success) {
        throw new Error('Server returned unsuccessful response for financial metrics');
      }

      return result.data;
    } catch (error) {
      secureLogger.error('UserMetricsService', 'Error fetching financial metrics', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching financial metrics');
    }
  }

  async getAchievementMetrics(): Promise<AchievementMetrics> {
    const url = `${API_BASE_URL}/achievements`;
    const context = 'fetching achievement metrics';

    try {
      const response = await this.fetchWithRetry(url, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        this.handleApiError(response, context);
      }

      const result: ApiResponse<AchievementMetrics> = await response.json();

      if (!result.success) {
        throw new Error('Server returned unsuccessful response for achievement metrics');
      }

      return result.data;
    } catch (error) {
      secureLogger.error('UserMetricsService', 'Error fetching achievement metrics', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching achievement metrics');
    }
  }

  async getActivityMetrics(): Promise<ActivityMetrics> {
    const url = `${API_BASE_URL}/metrics/activity`;
    const context = 'fetching activity metrics';

    try {
      const response = await this.fetchWithRetry(url, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        this.handleApiError(response, context);
      }

      const result: ApiResponse<ActivityMetrics> = await response.json();

      if (!result.success) {
        throw new Error('Server returned unsuccessful response for activity metrics');
      }

      return result.data;
    } catch (error) {
      secureLogger.error('UserMetricsService', 'Error fetching activity metrics', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching activity metrics');
    }
  }

  async initializeMetrics(): Promise<{ success: boolean; message: string; metrics_summary: any }> {
    const url = `${API_BASE_URL}/metrics/initialize`;
    const context = 'initializing user metrics';

    try {
      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        this.handleApiError(response, context);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Server returned unsuccessful response for metrics initialization');
      }

      return {
        success: true,
        message: result.message || 'Metrics initialized successfully',
        metrics_summary: result.metrics_summary || {}
      };
    } catch (error) {
      secureLogger.error('UserMetricsService', 'Error initializing metrics', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while initializing metrics');
    }
  }

  async recalculateMetrics(): Promise<{ success: boolean; message: string }> {
    const url = `${API_BASE_URL}/metrics/recalculate`;
    const context = 'recalculating user metrics';

    try {
      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        this.handleApiError(response, context);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Server returned unsuccessful response for metrics recalculation');
      }

      return {
        success: true,
        message: result.message || 'Metrics recalculated successfully'
      };
    } catch (error) {
      secureLogger.error('UserMetricsService', 'Error recalculating metrics', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while recalculating metrics');
    }
  }

  async getMetricsSummary(): Promise<MetricsSummary> {
    const url = `${API_BASE_URL}/metrics/summary`;
    const context = 'fetching metrics summary';

    try {
      const response = await this.fetchWithRetry(url, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        this.handleApiError(response, context);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error('Server returned unsuccessful response for metrics summary');
      }

      return result.data;
    } catch (error) {
      secureLogger.error('UserMetricsService', 'Error fetching metrics summary', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching metrics summary');
    }
  }

  // Helper method to check if metrics are stale
  isMetricsStale(lastCalculated: string, thresholdMinutes = 30): boolean {
    const lastCalc = new Date(lastCalculated);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastCalc.getTime()) / (1000 * 60);
    return diffMinutes > thresholdMinutes;
  }

  // Helper method to format financial values
  formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // Helper method to format percentages
  formatPercentage(value: number, decimals = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  // Helper method to get spending trend color class
  getSpendingTrendColor(trend: string): string {
    switch (trend) {
      case 'up':
        return 'text-red-500';
      case 'down':
        return 'text-green-500';
      case 'stable':
      default:
        return 'text-gray-500';
    }
  }

  // Helper method to get financial health score color and description
  getFinancialHealthInfo(score: number): { color: string; description: string } {
    if (score >= 80) {
      return { color: 'text-green-500', description: 'Excellent' };
    } else if (score >= 60) {
      return { color: 'text-blue-500', description: 'Good' };
    } else if (score >= 40) {
      return { color: 'text-yellow-500', description: 'Fair' };
    } else {
      return { color: 'text-red-500', description: 'Needs Improvement' };
    }
  }
}

// Export singleton instance
export const userMetricsService = new UserMetricsService();
