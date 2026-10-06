// src/context/UserMetricsContext.tsx

import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { useAuth } from './AuthContext';
import { userMetricsService } from '../services/userMetricsService';
import { secureLogger } from '../utils/secureLogger';

// Types for user metrics
export interface FinancialMetrics {
  savings_streak: number;
  total_savings: number;
  total_income: number;
  total_expenses: number;
  avg_daily_spending: number;
  savings_rate: number;
  spending_trend: 'up' | 'down' | 'stable';
  financial_score: number;
  transaction_count: number;
}

export interface RealAchievements {
  transaction_milestones: number;
  savings_achievements: number;
  streak_achievements: number;
  balance_achievements: number;
}

export interface AchievementProgress {
  completed: number;
  in_progress: number;
  total: number;
}

export interface AchievementMetrics {
  real_achievements: RealAchievements;
  total_real_achievements: number;
  completed_achievements: number;
  achievement_progress: AchievementProgress;
  current_savings_streak: number;
  streaks: Record<string, any>;
  longest_streak: number;
  total_points: number;
  current_level: number;
  points_to_next_level: number;
}

export interface ActivityMetrics {
  days_active: number;
  avg_transactions_per_day: number;
  most_active_day: string | null;
  most_active_day_count: number;
  recent_activity: boolean;
  transaction_count: number;
}

export interface BackendSubscription {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  description_pattern: string;
  first_detected: string;
  last_seen: string;
  transaction_count: number;
  confidence_score: number;
  is_active: boolean;
  // Subscription management fields
  user_display_name?: string;
  is_paused?: boolean;
  paused_at?: string;
  paused_by_user_id?: string;
  resume_date?: string;
  soft_deleted_at?: string;
  last_synced_merchant_name?: string;
}

// Make most fields optional to handle partial data from backend
export interface ComprehensiveUserMetrics {
  // Financial metrics (from FinancialMetrics)
  savings_streak?: number;
  total_savings?: number;
  total_income?: number;
  total_expenses?: number;
  avg_daily_spending?: number;
  savings_rate?: number;
  spending_trend?: 'up' | 'down' | 'stable';
  financial_score?: number;
  transaction_count?: number;

  // Achievement metrics (from AchievementMetrics)
  real_achievements?: RealAchievements;
  total_real_achievements?: number;
  completed_achievements?: number;
  achievement_progress?: AchievementProgress;
  current_savings_streak?: number;
  streaks?: Record<string, any>;
  longest_streak?: number;
  total_points?: number;
  current_level?: number;
  points_to_next_level?: number;

  // Activity metrics (from ActivityMetrics)
  days_active?: number;
  avg_transactions_per_day?: number;
  most_active_day?: string | null;
  most_active_day_count?: number;
  recent_activity?: boolean;

  // Metadata
  last_calculated?: string;
  calculation_source?: string;
  backend_verification?: string;
  subscriptions?: BackendSubscription[];
}

export interface UserMetricsState {
  metrics: ComprehensiveUserMetrics | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

type UserMetricsAction =
  | { type: 'FETCH_METRICS_START' }
  | { type: 'FETCH_METRICS_SUCCESS'; payload: ComprehensiveUserMetrics }
  | { type: 'FETCH_METRICS_ERROR'; payload: string }
  | { type: 'CLEAR_METRICS' }
  | { type: 'REFRESH_METRICS_START' };

const initialState: UserMetricsState = {
  metrics: null,
  isLoading: false,
  error: null,
  lastFetched: null,
};

function userMetricsReducer(state: UserMetricsState, action: UserMetricsAction): UserMetricsState {
  switch (action.type) {
    case 'FETCH_METRICS_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'REFRESH_METRICS_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'FETCH_METRICS_SUCCESS':
      return {
        ...state,
        metrics: action.payload,
        isLoading: false,
        error: null,
        lastFetched: new Date().toISOString(),
      };
    case 'FETCH_METRICS_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case 'CLEAR_METRICS':
      return initialState;
    default:
      return state;
  }
}

interface UserMetricsContextType {
  state: UserMetricsState;
  fetchMetrics: (forceRecalculate?: boolean, bankName?: string | null) => Promise<void>;
  refreshMetrics: (bankName?: string | null) => Promise<void>;
  recalculateMetrics: () => Promise<void>;
  initializeMetrics: () => Promise<void>;
  clearMetrics: () => void;
  selectedBankForMetrics: string | null;
  setSelectedBankForMetrics: (bankName: string | null) => void;
}

const UserMetricsContext = createContext<UserMetricsContextType | undefined>(undefined);

export const UserMetricsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(userMetricsReducer, initialState);
  const { user } = useAuth();
  const [selectedBankForMetrics, setSelectedBankForMetrics] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (forceRecalculate = false, bankName?: string | null) => {
    if (!user) {
      dispatch({ type: 'CLEAR_METRICS' });
      return;
    }

    try {
      dispatch({ type: 'FETCH_METRICS_START' });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      // Pass bankName to get bank-specific metrics from backend
      const metrics = await userMetricsService.getComprehensiveMetrics(forceRecalculate, bankName, {
        timeoutMs: 90000,
        signal: controller.signal,
      }) as any;

      clearTimeout(timeoutId);

      dispatch({ type: 'FETCH_METRICS_SUCCESS', payload: metrics });
    } catch (error: any) {
      const isAbort = error?.name === 'AbortError';
      const message = isAbort
        ? 'Metrics are taking longer than expected. Please try again in a moment.'
        : (error instanceof Error ? error.message : 'Failed to fetch metrics');

      // Avoid noisy console logs in production; capture in Sentry via secureLogger.
      secureLogger.warn('UserMetricsContext', 'Metrics fetch failed', error);
      dispatch({ type: 'FETCH_METRICS_ERROR', payload: message });
    }
  }, [user]);

  const refreshMetrics = useCallback(async (bankName?: string | null) => {
    if (!user) {
      return;
    }

    try {
      dispatch({ type: 'REFRESH_METRICS_START' });
      // Pass bankName to get bank-specific metrics from backend
      const metrics = await userMetricsService.getComprehensiveMetrics(false, bankName);
      dispatch({ type: 'FETCH_METRICS_SUCCESS', payload: metrics });
    } catch (error) {
      secureLogger.warn('UserMetricsContext', 'Error refreshing user metrics', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh metrics';
      dispatch({ type: 'FETCH_METRICS_ERROR', payload: errorMessage });
    }
  }, [user]);

  const recalculateMetrics = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      dispatch({ type: 'FETCH_METRICS_START' });
      await userMetricsService.recalculateMetrics();
      // After recalculation, fetch the updated metrics
      const metrics = await userMetricsService.getComprehensiveMetrics(false);
      dispatch({ type: 'FETCH_METRICS_SUCCESS', payload: metrics });
    } catch (error) {
      secureLogger.warn('UserMetricsContext', 'Error recalculating user metrics', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to recalculate metrics';
      dispatch({ type: 'FETCH_METRICS_ERROR', payload: errorMessage });
    }
  }, [user]);

  const initializeMetrics = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      dispatch({ type: 'FETCH_METRICS_START' });
      await userMetricsService.initializeMetrics();
      // After initialization, fetch the updated metrics
      const metrics = await userMetricsService.getComprehensiveMetrics(false);
      dispatch({ type: 'FETCH_METRICS_SUCCESS', payload: metrics });
    } catch (error) {
      secureLogger.warn('UserMetricsContext', 'Error initializing user metrics', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize metrics';
      dispatch({ type: 'FETCH_METRICS_ERROR', payload: errorMessage });
    }
  }, [user]);

  const clearMetrics = useCallback(() => {
    dispatch({ type: 'CLEAR_METRICS' });
  }, []);

  // Auto-fetch metrics when user changes
  useEffect(() => {
    if (user) {
      fetchMetrics(false);
    } else {
      clearMetrics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto-refresh metrics every 5 minutes if user is active
  // Also refresh when tab becomes visible again (with cooldown to prevent spam)
  useEffect(() => {
    if (!user || !state.metrics) return;

    let lastRefreshTime = Date.now();
    const MIN_REFRESH_INTERVAL = 60 * 1000; // Minimum 1 minute between refreshes

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !state.isLoading) {
        const now = Date.now();
        // Only refresh if at least 1 minute has passed since last refresh
        if (now - lastRefreshTime >= MIN_REFRESH_INTERVAL) {
          lastRefreshTime = now;
          refreshMetrics();
        }
      }
    };

    const refreshInterval = setInterval(() => {
      // Only refresh if the page is visible and the user is not actively loading
      if (document.visibilityState === 'visible' && !state.isLoading) {
        lastRefreshTime = Date.now();
        refreshMetrics();
      }
    }, 5 * 60 * 1000); // 5 minutes

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, state.metrics, state.isLoading]);

  const value = {
    state,
    fetchMetrics,
    refreshMetrics,
    recalculateMetrics,
    initializeMetrics,
    clearMetrics,
    selectedBankForMetrics,
    setSelectedBankForMetrics,
  };

  return (
    <UserMetricsContext.Provider value={value}>
      {children}
    </UserMetricsContext.Provider>
  );
};

export const useUserMetrics = () => {
  const context = useContext(UserMetricsContext);
  if (context === undefined) {
    throw new Error('useUserMetrics must be used within a UserMetricsProvider');
  }
  return context;
};
