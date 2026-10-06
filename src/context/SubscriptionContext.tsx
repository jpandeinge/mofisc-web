// src/context/SubscriptionContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { secureLogger } from '../utils/secureLogger';
import { useUser } from './UserContext';

const getHttpStatus = (err: any): number | null => {
  const status = err?.response?.status;
  return typeof status === 'number' ? status : null;
};

const isTransientNetworkError = (err: any): boolean => {
  const status = getHttpStatus(err);
  // Treat gateway/service errors as transient (Cloud Run / edge / provider blips).
  if (status === 502 || status === 503 || status === 504) return true;

  // If we have any other concrete HTTP status, it's not a "network" failure.
  if (typeof status === 'number') return false;

  const code = err?.code;
  const message = String(err?.message || '').toLowerCase();
  return (
    code === 'ECONNABORTED' ||
    code === 'ERR_NETWORK' ||
    message.includes('network error') ||
    message.includes('timeout')
  );
};

// Subscription plan tiers
export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'cancelled'
  | 'canceled'
  | 'pending'
  | 'incomplete'
  | 'expired'
  | 'unknown';

// Trial period in days
export const TRIAL_PERIOD_DAYS = 7;

// Feature limits by plan
export const PLAN_LIMITS = {
  free: {
    maxTransactionsPerMonth: 100,
    maxBankAccounts: 1,
    advancedCategorisation: false,
    nerAnalysis: false,
    financialHealthInsights: 'basic',
    weeklyInsights: false,
    prioritySupport: false,
    apiAccess: false,
    organisationWorkspace: false,
    teamMembers: 1,
    customModelConfiguration: false,
    advancedDataAnalytics: false,
    brandCustomisation: false,
  },
  basic: {
    maxTransactionsPerMonth: 300,
    maxBankAccounts: 3,
    advancedCategorisation: true,
    nerAnalysis: 'basic',
    financialHealthInsights: 'detailed',
    weeklyInsights: true,
    prioritySupport: false,
    apiAccess: false,
    organisationWorkspace: false,
    teamMembers: 1,
    customModelConfiguration: false,
    advancedDataAnalytics: false,
    brandCustomisation: false,
  },
  premium: {
    maxTransactionsPerMonth: Infinity,
    maxBankAccounts: Infinity,
    advancedCategorisation: true,
    nerAnalysis: 'full',
    financialHealthInsights: 'advanced',
    weeklyInsights: true,
    prioritySupport: true,
    apiAccess: false,
    organisationWorkspace: false,
    teamMembers: 1,
    customModelConfiguration: false,
    advancedDataAnalytics: false,
    brandCustomisation: false,
  },
  enterprise: {
    maxTransactionsPerMonth: Infinity,
    maxBankAccounts: Infinity,
    advancedCategorisation: true,
    nerAnalysis: 'full',
    financialHealthInsights: 'advanced',
    weeklyInsights: true,
    prioritySupport: true,
    apiAccess: true,
    organisationWorkspace: true,
    teamMembers: Infinity,
    customModelConfiguration: true,
    advancedDataAnalytics: true,
    brandCustomisation: true,
  },
} as const;

interface SubscriptionData {
  plan: SubscriptionPlan;
  effectivePlan?: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd?: number;
  currentPeriodStart?: number;
  isTrial: boolean;
  cancelAtPeriodEnd: boolean;
  hasActiveAccess: boolean;
  organisationId?: string | null;
  entitlements?: Partial<Record<keyof typeof PLAN_LIMITS.free, number | boolean | string | null>>;
}

// Portal response types for handling different states
export type PortalActionRequired = 'upgrade' | 'complete_payment' | 'contact_support' | null;

export interface PortalResult {
  success: boolean;
  portalUrl?: string;
  actionRequired?: PortalActionRequired;
  message: string;
}

export interface SyncResult {
  synced: boolean;
  message: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  provider_status?: string | null;
  provider_plan?: SubscriptionPlan | null;
  cancel_at_period_end?: boolean;
}

// Cancellation result types
export interface CancelResult {
  success: boolean;
  message: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd?: string;
  plan: SubscriptionPlan;
}

export interface ReactivateResult {
  success: boolean;
  message: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
}

// Usage tracking for tier enforcement
export interface UsageData {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;

  // Transaction usage
  transactionsUsed: number;
  transactionsLimit: number;
  transactionsRemaining: number;
  transactionsPercent: number;
  totalTransactions?: number;
  visibleTransactions?: number;
  hiddenTransactions?: number;

  // Bank account usage
  bankAccountsUsed: number;
  bankAccountsLimit: number;
  bankAccountsRemaining: number;

  // Warning thresholds
  isNearLimit: boolean;  // > 80% used
  isAtLimit: boolean;    // 100% used

  // Period info
  daysUntilReset: number;
}

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  effectivePlan: SubscriptionPlan;
  usage: UsageData | null;
  isLoading: boolean;
  isLoadingUsage: boolean;
  error: string | null;
  isPremium: boolean;
  isBasicOrAbove: boolean;
  canAccessFeature: (feature: keyof typeof PLAN_LIMITS.free) => boolean;
  getFeatureLimit: (feature: keyof typeof PLAN_LIMITS.free) => number | boolean | string;
  refreshSubscription: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  openCustomerPortal: () => Promise<PortalResult>;
  syncSubscription: () => Promise<SyncResult>;
  cancelSubscription: (reason?: string, feedback?: string) => Promise<CancelResult>;
  reactivateSubscription: () => Promise<ReactivateResult>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { profile, loading: isProfileLoading } = useUser();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive an effective plan that only grants access when the subscription is active/trialing
  const effectivePlan: SubscriptionPlan = useMemo(() => {
    if (subscription?.effectivePlan) return subscription.effectivePlan;
    if (!subscription) return 'free';
    return subscription.hasActiveAccess ? subscription.plan : 'free';
  }, [subscription]);

  // Fetch usage statistics from backend
  const fetchUsage = useCallback(async () => {
    if (!user?.id) {
      setUsage(null);
      return;
    }
    if (isProfileLoading) return;

    try {
      setIsLoadingUsage(true);

      const response = await api.get(`/v1/subscriptions/usage/${user.id}`, { retry: 0 } as any);
      const data = response.data;

      setUsage({
        plan: data.plan as SubscriptionPlan,
        status: data.status as SubscriptionStatus,
        totalTransactions: data.total_transactions ?? data.transactions_used,
        visibleTransactions: data.visible_transactions ?? data.transactions_used,
        hiddenTransactions: data.hidden_transactions ?? 0,
        transactionsUsed: data.transactions_used,
        transactionsLimit: data.transactions_limit,
        transactionsRemaining: data.transactions_remaining,
        transactionsPercent: data.transactions_percent,
        bankAccountsUsed: data.bank_accounts_used,
        bankAccountsLimit: data.bank_accounts_limit,
        bankAccountsRemaining: data.bank_accounts_remaining,
        isNearLimit: data.is_near_limit,
        isAtLimit: data.is_at_limit,
        daysUntilReset: data.days_until_reset,
      });
    } catch (err: any) {
      if (!isTransientNetworkError(err)) {
        secureLogger.error('SubscriptionContext', 'Failed to fetch usage', err);
      }
      // Don't set error - usage is supplementary data
    } finally {
      setIsLoadingUsage(false);
    }
  }, [user?.id, isProfileLoading, profile?.organisation_id]);

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setSubscription({ plan: 'free', effectivePlan: 'free', status: 'active', isTrial: false, cancelAtPeriodEnd: false, hasActiveAccess: true });
      setIsLoading(false);
      return;
    }
    if (isProfileLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get(`/v1/subscriptions/subscription-status/${user.id}`, { retry: 0 } as any);
      const data = response.data;

      setSubscription({
        plan: (data.plan || 'free') as SubscriptionPlan,
        effectivePlan: (data.effective_plan || data.plan || 'free') as SubscriptionPlan,
        status: data.status as SubscriptionStatus,
        currentPeriodEnd: data.current_period_end,
        currentPeriodStart: data.current_period_start,
        isTrial: data.is_trial || false,
        cancelAtPeriodEnd: data.cancel_at_period_end || false,
        hasActiveAccess: data.has_active_access === true,
        organisationId: data.organisation_id || profile?.organisation_id || null,
        entitlements: data.entitlements || undefined,
      });
    } catch (err: any) {
      const status = getHttpStatus(err);
      const isServerError = status !== null && status >= 500;
      const transient = isTransientNetworkError(err) || isServerError;

      if (isServerError || !transient) {
        secureLogger.error('SubscriptionContext', 'Failed to fetch subscription', err);
      }

      // Fail closed for access (treat as Free), but avoid blocking UX with a scary
      // error banner when the user is simply offline or the API is temporarily unreachable.
      setSubscription({ plan: 'free', effectivePlan: 'free', status: 'active', isTrial: false, cancelAtPeriodEnd: false, hasActiveAccess: true });
      setError(transient ? null : 'Failed to load subscription status');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isProfileLoading, profile?.organisation_id]);

  useEffect(() => {
    fetchSubscription();
    fetchUsage();
  }, [fetchSubscription, fetchUsage]);

  // Check if user has premium plan (effective)
  const isPremium = useMemo(() => {
    return effectivePlan === 'premium' || effectivePlan === 'enterprise';
  }, [effectivePlan]);

  // Check if user has basic or higher plan
  const isBasicOrAbove = useMemo(() => {
    return effectivePlan !== 'free';
  }, [effectivePlan]);

  // Check if user can access a specific feature
  const canAccessFeature = useCallback((feature: keyof typeof PLAN_LIMITS.free): boolean => {
    if (!subscription) return false;

    const planLimits = PLAN_LIMITS[effectivePlan];
    const serverValue = subscription.entitlements?.[feature];
    const featureValue = serverValue === undefined ? planLimits[feature] : serverValue;

    // The API represents unlimited numeric entitlements as null for valid JSON.
    if (featureValue === null) return true;

    // For boolean features
    if (typeof featureValue === 'boolean') {
      return featureValue;
    }

    // For numeric features (check if not 0)
    if (typeof featureValue === 'number') {
      return featureValue > 0;
    }

    // For string features (check if not falsy)
    return !!featureValue;
  }, [subscription, effectivePlan]);

  // Get the limit/value for a specific feature
  const getFeatureLimit = useCallback((
    feature: keyof typeof PLAN_LIMITS.free
  ): number | boolean | string => {
    const serverValue = subscription?.entitlements?.[feature];
    if (serverValue === null) return Infinity;
    if (serverValue !== undefined) return serverValue;
    const plan = effectivePlan || 'free';
    return PLAN_LIMITS[plan][feature] as number | boolean | string;
  }, [effectivePlan, subscription]);

  // Open Dodo Payments Customer Portal for subscription management
  const openCustomerPortal = useCallback(async (): Promise<PortalResult> => {
    if (!user?.id) {
      return {
        success: false,
        message: 'Please log in to manage your subscription.',
        actionRequired: null,
      };
    }

    try {
      const response = await api.post('/v1/subscriptions/customer-portal', {
        user_id: user.id,
      });

      const data = response.data;

      // Check if we got a portal URL
      if (data.portal_url) {
        window.location.href = data.portal_url;
        return {
          success: true,
          portalUrl: data.portal_url,
          message: data.message || 'Opening subscription portal...',
        };
      }

      // No portal URL - return the action required
      return {
        success: false,
        actionRequired: data.action_required as PortalActionRequired,
        message: data.message || 'Unable to open subscription portal.',
      };
    } catch (err: any) {
      secureLogger.error('SubscriptionContext', 'Failed to open customer portal', err);

      // Handle specific error responses
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to open subscription management';

      setError(errorMessage);

      return {
        success: false,
        message: errorMessage,
        actionRequired: 'contact_support',
      };
    }
  }, [user?.id]);

  // Sync subscription from payment provider (recovery mechanism)
  const syncSubscription = useCallback(async (): Promise<SyncResult> => {
    if (!user?.id) {
      return {
        synced: false,
        message: 'Please log in to sync subscription.',
        plan: 'free',
        status: 'active',
      };
    }

    try {
      const response = await api.post('/v1/subscriptions/sync-subscription', {
        user_id: user.id,
        user_email: user.email, // Include email for customer lookup if IDs missing
      });

      const data = response.data;

      // Refresh local state if sync was successful
      if (data.synced) {
        await fetchSubscription();
      }

      return {
        synced: data.synced,
        message: data.message,
        plan: data.plan as SubscriptionPlan,
        status: data.status as SubscriptionStatus,
        provider_status: data.provider_status || null,
        provider_plan: data.provider_plan || null,
        cancel_at_period_end: data.cancel_at_period_end || false,
      };
    } catch (err: any) {
      secureLogger.error('SubscriptionContext', 'Failed to sync subscription', err);
      return {
        synced: false,
        message: err.response?.data?.detail || 'Failed to sync subscription',
        plan: subscription?.plan || 'free',
        status: subscription?.status || 'active',
        provider_status: null,
        provider_plan: null,
      };
    }
  }, [user?.id, user?.email, fetchSubscription, subscription]);

  // Cancel subscription at period end (Revolut-style)
  const cancelSubscription = useCallback(async (reason?: string, feedback?: string): Promise<CancelResult> => {
    if (!user?.id) {
      return {
        success: false,
        message: 'Please log in to cancel subscription.',
        cancelAtPeriodEnd: false,
        plan: 'free',
      };
    }

    try {
      const response = await api.post('/v1/subscriptions/cancel-subscription', {
        user_id: user.id,
        reason,
        feedback,
      });

      const data = response.data;

      // Refresh local state
      if (data.success) {
        await fetchSubscription();
      }

      return {
        success: data.success,
        message: data.message,
        cancelAtPeriodEnd: data.cancel_at_period_end || false,
        currentPeriodEnd: data.current_period_end,
        plan: data.plan as SubscriptionPlan,
      };
    } catch (err: any) {
      secureLogger.error('SubscriptionContext', 'Failed to cancel subscription', err);
      return {
        success: false,
        message: err.response?.data?.detail || 'Failed to cancel subscription',
        cancelAtPeriodEnd: false,
        plan: subscription?.plan || 'free',
      };
    }
  }, [user?.id, fetchSubscription, subscription]);

  // Reactivate a cancelled subscription before period ends
  const reactivateSubscription = useCallback(async (): Promise<ReactivateResult> => {
    if (!user?.id) {
      return {
        success: false,
        message: 'Please log in to reactivate subscription.',
        status: 'active',
        plan: 'free',
      };
    }

    try {
      const response = await api.post('/v1/subscriptions/reactivate-subscription', {
        user_id: user.id,
      });

      const data = response.data;

      // Refresh local state
      if (data.success) {
        await fetchSubscription();
      }

      return {
        success: data.success,
        message: data.message,
        status: data.status as SubscriptionStatus,
        plan: data.plan as SubscriptionPlan,
      };
    } catch (err: any) {
      secureLogger.error('SubscriptionContext', 'Failed to reactivate subscription', err);
      return {
        success: false,
        message: err.response?.data?.detail || 'Failed to reactivate subscription',
        status: subscription?.status || 'active',
        plan: subscription?.plan || 'free',
      };
    }
  }, [user?.id, fetchSubscription, subscription]);

  const value: SubscriptionContextType = {
    subscription,
    effectivePlan,
    usage,
    isLoading,
    isLoadingUsage,
    error,
    isPremium,
    isBasicOrAbove,
    canAccessFeature,
    getFeatureLimit,
    refreshSubscription: fetchSubscription,
    refreshUsage: fetchUsage,
    openCustomerPortal,
    syncSubscription,
    cancelSubscription,
    reactivateSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

// Helper hook for gating features
export const useFeatureGate = (feature: keyof typeof PLAN_LIMITS.free) => {
  const { canAccessFeature, effectivePlan } = useSubscription();

  return {
    hasAccess: canAccessFeature(feature),
    currentPlan: effectivePlan || 'free',
    requiredPlan: getMinimumPlanForFeature(feature),
  };
};

// Helper to determine minimum plan required for a feature
function getMinimumPlanForFeature(feature: keyof typeof PLAN_LIMITS.free): SubscriptionPlan {
  const plans: SubscriptionPlan[] = ['free', 'basic', 'premium', 'enterprise'];

  for (const plan of plans) {
    const featureValue = PLAN_LIMITS[plan][feature];
    if (typeof featureValue === 'boolean' && featureValue) {
      return plan;
    }
    if (typeof featureValue === 'number' && featureValue > 0) {
      return plan;
    }
    if (typeof featureValue === 'string' && featureValue) {
      return plan;
    }
  }

  return 'enterprise';
}
