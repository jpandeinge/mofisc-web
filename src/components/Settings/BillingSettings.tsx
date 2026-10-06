// src/components/Settings/BillingSettings.tsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiLoader, FiExternalLink, FiAlertCircle, FiCreditCard, FiMail, FiArrowRight, FiRefreshCw } from 'react-icons/fi';
import { useSubscription, SubscriptionPlan, PortalResult, PortalActionRequired, CancelResult, ReactivateResult } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { toast } from 'react-toastify';
import { colors, withOpacity } from '../../styles/colors';
import CancellationModal from './CancellationModal';
import UsageIndicator from '../Shared/UsageIndicator';
import { secureLogger } from '../../utils/secureLogger';

// Plan configuration with pricing and features
const PLANS = [
  {
    id: 'free' as SubscriptionPlan,
    name: 'Free',
    price: 0,
    period: 'month',
    description: 'Perfect for getting started',
    features: [
      'Basic transaction categorisation',
      'Up to 100 transactions/month',
      'Single bank account',
      'Basic financial health score',
    ],
  },
  {
    id: 'basic' as SubscriptionPlan,
    name: 'Basic',
    price: 2.99,
    period: 'month',
    description: 'Great for personal finance',
    features: [
      'Advanced transaction categorisation',
      'Up to 300 transactions/month',
      'Multiple bank accounts',
      'Detailed financial health analysis',
      'Basic NER transaction analysis',
    ],
  },
  {
    id: 'premium' as SubscriptionPlan,
    name: 'Premium',
    price: 7.99,
    period: 'month',
    description: 'Best for power users',
    features: [
      'AI-powered transaction categorisation',
      'Unlimited transactions',
      'Unlimited bank accounts',
      'Advanced financial health insights',
      'Full NER transaction analysis',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'enterprise' as SubscriptionPlan,
    name: 'Enterprise',
    price: 'Custom',
    period: 'month',
    description: 'For large organisations',
    features: [
      'All Premium features',
      'Dedicated account manager',
      'Custom AI model training',
      'API access',
      'Advanced data analytics',
    ],
  },
];

// Helper to format date
const formatDate = (timestamp?: number): string => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Helper to calculate days until period end and total period length
const getPeriodProgress = (endTimestamp?: number, startTimestamp?: number) => {
  if (!endTimestamp) {
    return { daysLeft: 0, totalDays: 30 }; // fallback
  }
  const nowMs = Date.now();
  const endMs = endTimestamp * 1000;
  const startMs = startTimestamp ? startTimestamp * 1000 : nowMs;
  const totalMs = Math.max(endMs - startMs, 0);
  const remainingMs = Math.max(endMs - nowMs, 0);
  const totalDays = Math.max(totalMs / (1000 * 60 * 60 * 24), 1);
  const daysLeft = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  return { daysLeft, totalDays };
};

// Helper to get status badge styling using app color system
const getStatusStyle = (status: string): React.CSSProperties => {
  switch (status) {
    case 'active':
      return {
        backgroundColor: withOpacity(colors.status.success, 0.1),
        color: colors.status.success,
        borderColor: withOpacity(colors.status.success, 0.2),
      };
    case 'trialing':
      return {
        backgroundColor: withOpacity(colors.status.info, 0.1),
        color: colors.status.info,
        borderColor: withOpacity(colors.status.info, 0.2),
      };
    case 'past_due':
      return {
        backgroundColor: withOpacity(colors.status.warning, 0.1),
        color: colors.status.warning,
        borderColor: withOpacity(colors.status.warning, 0.2),
      };
    case 'cancelled':
      return {
        backgroundColor: withOpacity(colors.status.error, 0.1),
        color: colors.status.error,
        borderColor: withOpacity(colors.status.error, 0.2),
      };
    default:
      return {
        backgroundColor: withOpacity(colors.text.secondary, 0.1),
        color: colors.text.secondary,
        borderColor: withOpacity(colors.text.secondary, 0.2),
      };
  }
};

// Helper to format status text
const formatStatus = (status: string): string => {
  switch (status) {
    case 'active': return 'Active';
    case 'trialing': return '7-Day Trial';
    case 'past_due': return 'Past Due';
    case 'cancelled': return 'Cancelled';
    case 'pending': return 'Pending';
    case 'incomplete': return 'Incomplete';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

const BillingSettings: React.FC = () => {
  const { user } = useAuth();
  const {
    subscription,
    effectivePlan,
    isLoading: isSubscriptionLoading,
    error: subscriptionError,
    openCustomerPortal,
    refreshSubscription,
    refreshUsage,
    syncSubscription,
    cancelSubscription,
    reactivateSubscription
  } = useSubscription();

  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portalAction, setPortalAction] = useState<PortalActionRequired>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Get current plan details
  // Access plan is the ONLY plan that should drive in-app entitlements/visibility.
  // Billing plan (subscription.plan) can be "pending" during checkout and must not be treated as active access.
  const currentPlanId = effectivePlan || 'free';
  const currentPlanDetails = PLANS.find(p => p.id === currentPlanId) || PLANS[0];
  const billingPlanId = (subscription?.plan || 'free') as SubscriptionPlan;
  const isPaymentPending = subscription?.status === 'pending' || subscription?.status === 'incomplete';
  const hasPlanMismatch = billingPlanId !== currentPlanId && isPaymentPending;

  // Handle plan upgrade via Dodo Payments checkout
  const handleUpgrade = async (planId: SubscriptionPlan) => {
    if (!user?.id) {
      toast.error('Please log in to upgrade your plan');
      return;
    }

    if (planId === 'enterprise') {
      window.location.href = 'mailto:sales@mofisc.com?subject=Enterprise%20Plan%20Inquiry';
      return;
    }

    if (planId === 'free') {
      return;
    }

    try {
      setUpgradingPlan(planId);
      setError(null);

      const response = await api.post('/v1/subscriptions/create-checkout-session', {
        plan: planId,
        billing_frequency: 'monthly',
        user_id: user.id,
        user_email: user.email,
        user_name: user.profile?.full_name || user.email?.split('@')[0],
      });

      // Redirect to Dodo Payments Checkout
      window.location.href = response.data.checkout_url;
    } catch (err: any) {
      secureLogger.error('BillingSettings', 'Upgrade error', err);
      setError(err.response?.data?.detail || 'Failed to start checkout. Please try again.');
      toast.error('Failed to start checkout');
    } finally {
      setUpgradingPlan(null);
    }
  };

  // Handle downgrades safely (no fake upgrades via checkout)
  const handleDowngrade = async (planId: SubscriptionPlan) => {
    if (!user?.id) {
      toast.error('Please log in to manage your plan');
      return;
    }

    // Downgrade to free is treated as cancellation at period end (keeps access until end)
    if (planId === 'free') {
      try {
        setIsCancelling(true);
        const result = await cancelSubscription('downgrade', 'User selected downgrade to Free');
        await refreshSubscription();
        return;
      } catch (err: any) {
        toast.error(err?.message || 'Failed to schedule downgrade');
        return;
      } finally {
        setIsCancelling(false);
      }
    }

    // For downgrades between paid tiers, route through customer portal (provider-managed)
    try {
      setIsOpeningPortal(true);
      await openCustomerPortal();
    } catch (err: any) {
      toast.error('Unable to open subscription management');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  // Handle opening customer portal for subscription management
  const handleManageSubscription = async () => {
    try {
      setIsOpeningPortal(true);
      setError(null);
      setPortalAction(null);

      const result: PortalResult = await openCustomerPortal();

      if (!result.success) {
        // Handle different action states
        setPortalAction(result.actionRequired || null);

        if (result.actionRequired === 'complete_payment') {
          toast.warning(result.message);
        } else if (result.actionRequired === 'contact_support') {
          toast.error(result.message);
        } else {
          setError(result.message);
        }
      }
    } catch (err: any) {
      secureLogger.error('BillingSettings', 'Portal error', err);
      setError('Failed to open subscription management');
      toast.error('Failed to open subscription management');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const handleRetryStatus = async () => {
    try {
      setIsRetrying(true);
      await refreshSubscription();
      await refreshUsage();
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle action based on portal result
  const handlePortalAction = () => {
    if (portalAction === 'upgrade') {
      // Scroll to plans section or navigate to pricing
      const plansSection = document.getElementById('available-plans');
      plansSection?.scrollIntoView({ behavior: 'smooth' });
    } else if (portalAction === 'contact_support') {
      window.location.href = 'mailto:support@mofisc.com?subject=Subscription%20Portal%20Issue';
    } else if (portalAction === 'complete_payment') {
      // Trigger re-checkout
      if (billingPlanId && billingPlanId !== 'free') {
        handleUpgrade(billingPlanId);
      }
    }
    setPortalAction(null);
  };

  // Handle subscription sync from payment provider
  const handleSyncSubscription = async () => {
    try {
      setIsSyncing(true);
      setError(null);

      await syncSubscription();
    } catch (err: any) {
      secureLogger.error('BillingSettings', 'Sync error', err);
      toast.error('Failed to sync subscription');
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async (reason?: string, feedback?: string) => {
    try {
      setIsCancelling(true);
      setError(null);

      const result: CancelResult = await cancelSubscription(reason, feedback);
      if (!result.success) {
        toast.error(result.message);
      }
    } catch (err: any) {
      secureLogger.error('BillingSettings', 'Cancellation error', err);
      toast.error('Failed to cancel subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle subscription reactivation
  const handleReactivateSubscription = async () => {
    try {
      setIsReactivating(true);
      setError(null);

      const result: ReactivateResult = await reactivateSubscription();
      if (!result.success) {
        toast.error(result.message);
      }
    } catch (err: any) {
      secureLogger.error('BillingSettings', 'Reactivation error', err);
      toast.error('Failed to reactivate subscription');
    } finally {
      setIsReactivating(false);
    }
  };

  // Calculate progress for billing cycle
  const { daysLeft, totalDays } = getPeriodProgress(subscription?.currentPeriodEnd, subscription?.currentPeriodStart);
  const progressPercent = Math.min(100, Math.max(0, ((totalDays - daysLeft) / totalDays) * 100));

  // Loading state
  if (isSubscriptionLoading) {
    return (
      <div className="px-6 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="w-8 h-8 animate-spin" style={{ color: colors.primary.main }} />
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            Loading subscription details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6">
      <div className="space-y-4">
        {/* Error Banner */}
        <AnimatePresence>
          {(error || subscriptionError) && !portalAction && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between gap-3 p-4 rounded-xl"
              style={{
                backgroundColor: withOpacity(colors.status.error, 0.1),
                border: `1px solid ${withOpacity(colors.status.error, 0.2)}`,
              }}
            >
              <div className="flex items-center gap-3">
                <FiAlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: colors.status.error }} />
                <p className="text-sm" style={{ color: colors.status.error }}>
                  {error || subscriptionError}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRetryStatus}
                disabled={isRetrying}
                className="px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                style={{
                  backgroundColor: withOpacity(colors.status.error, 0.12),
                  color: colors.status.error,
                  border: `1px solid ${withOpacity(colors.status.error, 0.25)}`,
                }}
              >
                {isRetrying ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiRefreshCw className="w-4 h-4" />}
                <span>{isRetrying ? 'Retrying…' : 'Retry'}</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cancellation Pending Banner */}
        <AnimatePresence>
          {subscription?.cancelAtPeriodEnd && subscription?.hasActiveAccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between gap-4 p-4 rounded-xl"
              style={{
                backgroundColor: withOpacity(colors.status.warning, 0.1),
                border: `1px solid ${withOpacity(colors.status.warning, 0.3)}`,
              }}
            >
              <div className="flex items-center gap-3">
                <FiAlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: colors.status.warning }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.status.warning }}>
                    Your subscription is set to cancel
                  </p>
                  <p className="text-xs" style={{ color: colors.text.secondary }}>
                    You'll have full access until {formatDate(subscription.currentPeriodEnd)}. Changed your mind?
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleReactivateSubscription}
                disabled={isReactivating}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                style={{
                  backgroundColor: colors.status.success,
                  color: colors.text.inverse,
                }}
              >
                {isReactivating ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    <span>Reactivating...</span>
                  </>
                ) : (
                  <>
                    <FiRefreshCw className="w-4 h-4" />
                    <span>Keep Subscription</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Portal Action Required Banner */}
        <AnimatePresence>
          {portalAction && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between gap-4 p-4 rounded-xl border"
              style={{
                backgroundColor: withOpacity(
                  portalAction === 'upgrade'
                    ? colors.primary.main
                    : portalAction === 'complete_payment'
                    ? colors.status.warning
                    : colors.text.secondary,
                  0.1
                ),
                borderColor: withOpacity(
                  portalAction === 'upgrade'
                    ? colors.primary.main
                    : portalAction === 'complete_payment'
                    ? colors.status.warning
                    : colors.text.secondary,
                  0.2
                ),
              }}
            >
              <div className="flex items-center gap-3">
                {portalAction === 'upgrade' ? (
                  <FiArrowRight className="w-5 h-5 flex-shrink-0" style={{ color: colors.primary.main }} />
                ) : portalAction === 'complete_payment' ? (
                  <FiCreditCard className="w-5 h-5 flex-shrink-0" style={{ color: colors.status.warning }} />
                ) : (
                  <FiMail className="w-5 h-5 flex-shrink-0" style={{ color: colors.text.secondary }} />
                )}
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: portalAction === 'upgrade'
                        ? colors.primary.main
                        : portalAction === 'complete_payment'
                        ? colors.status.warning
                        : colors.text.secondary,
                    }}
                  >
                    {portalAction === 'upgrade' && 'Upgrade to Manage Subscription'}
                    {portalAction === 'complete_payment' && 'Complete Your Payment'}
                    {portalAction === 'contact_support' && 'Need Assistance?'}
                  </p>
                  <p className="text-xs" style={{ color: colors.text.secondary }}>
                    {portalAction === 'upgrade' && 'Choose a plan below to access subscription management.'}
                    {portalAction === 'complete_payment' && 'Your payment setup is incomplete. Please try again.'}
                    {portalAction === 'contact_support' && 'Our support team will help resolve this issue.'}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePortalAction}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: portalAction === 'upgrade'
                    ? colors.primary.main
                    : portalAction === 'complete_payment'
                    ? colors.status.warning
                    : colors.text.secondary,
                  color: colors.text.inverse,
                }}
              >
                {portalAction === 'upgrade' && 'View Plans'}
                {portalAction === 'complete_payment' && 'Retry Payment'}
                {portalAction === 'contact_support' && 'Contact Support'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Plan Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-sm rounded-xl p-4"
          style={{
            background: `linear-gradient(to right, ${withOpacity(colors.background.primary, 0.9)}, ${withOpacity(colors.background.secondary, 0.9)}, ${withOpacity(colors.background.primary, 0.9)})`,
            border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
          }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                    {currentPlanDetails.name} Plan
                  </h1>
                  <span
                    className="px-2 py-0.5 text-xs rounded-full border"
                    style={getStatusStyle(subscription?.status || 'active')}
                  >
                    {formatStatus(subscription?.status || 'active')}
                  </span>
                  {hasPlanMismatch && (
                    <span
                      className="px-2 py-0.5 text-xs rounded-full border"
                      style={{
                        backgroundColor: withOpacity(colors.status.warning, 0.1),
                        color: colors.status.warning,
                        borderColor: withOpacity(colors.status.warning, 0.25),
                      }}
                    >
                      Pending {billingPlanId}
                    </span>
                  )}
                  {subscription?.isTrial && (
                    <span
                      className="px-2 py-0.5 text-xs rounded-full border"
                      style={{
                        backgroundColor: withOpacity(colors.status.info, 0.1),
                        color: colors.status.info,
                        borderColor: withOpacity(colors.status.info, 0.2),
                      }}
                    >
                      Trial
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>
                  {subscription?.status === 'cancelled'
                    ? 'Subscription cancelled'
                    : isPaymentPending && hasPlanMismatch
                    ? 'Payment pending — access remains unchanged until confirmed'
                    : subscription?.status === 'trialing'
                    ? 'Free trial — no charge until trial ends'
                    : currentPlanDetails.price === 'Custom' || currentPlanDetails.price === 0
                    ? 'Free forever'
                    : `Billed monthly — $${currentPlanDetails.price}/month`}
                </p>
                {isPaymentPending && hasPlanMismatch && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpgrade(billingPlanId)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: colors.primary.main,
                        color: colors.text.inverse,
                      }}
                    >
                      Complete payment
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncSubscription}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: withOpacity(colors.text.secondary, 0.08),
                        color: colors.text.secondary,
                        border: `1px solid ${withOpacity(colors.text.secondary, 0.18)}`,
                      }}
                    >
                      Refresh status
                    </button>
                  </div>
                )}
                {/* Trial Notice */}
                {subscription?.status === 'trialing' && subscription?.currentPeriodEnd && (
                  <p className="text-xs mt-1" style={{ color: colors.status.info }}>
                    Your trial ends on {formatDate(subscription.currentPeriodEnd)} — then billing begins
                  </p>
                )}
                {/* Cancellation Notice */}
                {(subscription?.status === 'cancelled' || subscription?.cancelAtPeriodEnd) && subscription?.currentPeriodEnd && (
                  <p className="text-xs mt-1" style={{ color: colors.status.warning }}>
                    Cancellation scheduled — you'll keep access until {formatDate(subscription.currentPeriodEnd)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Billing Cycle Progress */}
              {subscription?.currentPeriodEnd && currentPlanId !== 'free' && (
                <div className="flex flex-col items-end">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs" style={{ color: colors.text.secondary }}>
                      {subscription?.status === 'cancelled'
                        ? 'Access ends'
                        : subscription?.status === 'trialing'
                        ? 'Trial ends'
                        : 'Next billing'}
                    </span>
                    <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                      {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </div>
                  <div className="flex items-center mt-1">
                    <div
                      className="w-24 h-1 rounded-full"
                      style={{ backgroundColor: withOpacity(colors.text.secondary, 0.2) }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: subscription?.status === 'cancelled'
                            ? colors.status.warning
                            : subscription?.status === 'trialing'
                            ? colors.status.info
                            : colors.primary.main,
                        }}
                      />
                    </div>
                    <span className="text-xs ml-2" style={{ color: colors.text.secondary }}>
                      {daysLeft} days left
                    </span>
                  </div>
                </div>
              )}

              {/* Manage Subscription Button */}
              {currentPlanId !== 'free' && (
                <div className="flex items-center gap-2">
                  {/* Reactivation button for cancelled subscriptions */}
                  {(subscription?.status === 'cancelled' || subscription?.cancelAtPeriodEnd) && subscription?.hasActiveAccess && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleReactivateSubscription}
                      disabled={isReactivating}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      style={{
                        backgroundColor: colors.status.success,
                        color: colors.text.inverse,
                      }}
                    >
                      {isReactivating ? (
                        <>
                          <FiLoader className="w-4 h-4 animate-spin" />
                          <span>Reactivating...</span>
                        </>
                      ) : (
                        <>
                          <FiRefreshCw className="w-4 h-4" />
                          <span>Keep Subscription</span>
                        </>
                      )}
                    </motion.button>
                  )}

                  {/* Portal button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleManageSubscription}
                    disabled={isOpeningPortal}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: withOpacity(colors.primary.main, 0.1),
                      color: colors.primary.main,
                      border: `1px solid ${withOpacity(colors.primary.main, 0.2)}`,
                    }}
                  >
                    {isOpeningPortal ? (
                      <>
                        <FiLoader className="w-4 h-4 animate-spin" />
                        <span>Opening...</span>
                      </>
                    ) : (
                      <>
                        <FiCreditCard className="w-4 h-4" />
                        <span>Manage</span>
                        <FiExternalLink className="w-3 h-3" />
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Usage Indicator - Only show for non-premium users */}
        {(currentPlanId !== 'premium' && currentPlanId !== 'enterprise') ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <UsageIndicator
              showUpgradeButton={true}
              onUpgradeClick={() => {
                const plansSection = document.getElementById('available-plans');
                plansSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </motion.div>
        ) : null}

        {/* Available Plans Grid */}
        <motion.div
          id="available-plans"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-sm rounded-xl p-4"
          style={{
            background: `linear-gradient(to right, ${withOpacity(colors.background.primary, 0.9)}, ${withOpacity(colors.background.secondary, 0.9)}, ${withOpacity(colors.background.primary, 0.9)})`,
            border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold" style={{ color: colors.text.primary }}>
              Available Plans
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncSubscription}
                disabled={isSyncing}
                className="text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                style={{ color: colors.text.secondary }}
                title="Sync subscription status from payment provider"
              >
                {isSyncing ? (
                  <>
                    <FiLoader className="w-3 h-3 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <span>Sync</span>
                )}
              </button>
              <button
                onClick={() => refreshSubscription()}
                className="text-xs transition-colors"
                style={{ color: colors.primary.main }}
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => {
              const isCurrentPlan = plan.id === currentPlanId;
              const isUpgrading = upgradingPlan === plan.id;
              const canUpgrade = !isCurrentPlan && !isUpgrading;
              const isDowngrade = PLANS.findIndex(p => p.id === plan.id) < PLANS.findIndex(p => p.id === currentPlanId);

              return (
                <motion.div
                  key={plan.id}
                  whileHover={{ scale: canUpgrade ? 1.02 : 1 }}
                  className="relative rounded-xl overflow-hidden flex flex-col"
                  style={{
                    backgroundColor: isCurrentPlan
                      ? withOpacity(colors.primary.main, 0.1)
                      : withOpacity(colors.background.primary, 0.5),
                    border: isCurrentPlan
                      ? `2px solid ${colors.primary.main}`
                      : plan.popular
                      ? `2px solid ${withOpacity(colors.status.success, 0.5)}`
                      : `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
                  }}
                >
                  {plan.popular && !isCurrentPlan && (
                    <div
                      className="absolute top-0 right-0 px-2 py-0.5 text-xs rounded-bl-lg font-medium"
                      style={{ backgroundColor: colors.status.success, color: colors.text.inverse }}
                    >
                      Popular
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div
                      className="absolute top-0 right-0 px-2 py-0.5 text-xs rounded-bl-lg font-medium"
                      style={{ backgroundColor: colors.primary.main, color: colors.text.inverse }}
                    >
                      Current
                    </div>
                  )}

                  <div className="p-4 flex flex-col flex-1">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                        {plan.name}
                      </h3>
                      <p className="text-xs" style={{ color: colors.text.secondary }}>
                        {plan.description}
                      </p>
                    </div>

                    <div className="flex items-baseline mb-4">
                      <span className="text-xl font-bold" style={{ color: colors.primary.dark }}>
                        {plan.price === 'Custom' ? 'Custom' : plan.price === 0 ? 'Free' : `$${plan.price}`}
                      </span>
                      {plan.price !== 'Custom' && plan.price !== 0 && (
                        <span className="ml-1 text-xs" style={{ color: colors.text.secondary }}>
                          /{plan.period}
                        </span>
                      )}
                    </div>

                    <ul className="space-y-2 mb-4 flex-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <FiCheck
                            className="w-3.5 h-3.5 mr-2 flex-shrink-0 mt-0.5"
                            style={{ color: colors.status.success }}
                          />
                          <span className="text-xs" style={{ color: colors.text.secondary }}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <motion.button
                      whileTap={{ scale: canUpgrade ? 0.98 : 1 }}
                      onClick={() => {
                        if (!canUpgrade) return;
                        if (isDowngrade) {
                          handleDowngrade(plan.id);
                        } else {
                          handleUpgrade(plan.id);
                        }
                      }}
                      disabled={isCurrentPlan || isUpgrading}
                      className="w-full py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: isCurrentPlan
                          ? withOpacity(colors.primary.main, 0.2)
                          : isUpgrading
                          ? colors.primary.main
                          : isDowngrade || plan.id === 'enterprise'
                          ? withOpacity(colors.text.secondary, 0.1)
                          : colors.primary.main,
                        color: isCurrentPlan
                          ? colors.primary.main
                          : isDowngrade || plan.id === 'enterprise'
                          ? colors.text.secondary
                          : colors.text.inverse,
                        opacity: isUpgrading ? 0.75 : 1,
                        cursor: isCurrentPlan
                          ? 'default'
                          : isUpgrading
                          ? 'wait'
                          : 'pointer',
                        border: isDowngrade || plan.id === 'enterprise'
                          ? `1px solid ${withOpacity(colors.text.secondary, 0.2)}`
                          : 'none',
                      }}
                    >
                      {isUpgrading ? (
                        <>
                          <FiLoader className="w-3 h-3 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : isCurrentPlan ? (
                        'Current Plan'
                      ) : plan.id === 'enterprise' ? (
                        'Contact Sales'
                      ) : isDowngrade ? (
                        'Downgrade'
                      ) : (
                        'Upgrade'
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Actions / Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-sm rounded-xl p-4"
          style={{
            background: `linear-gradient(to right, ${withOpacity(colors.background.primary, 0.9)}, ${withOpacity(colors.background.secondary, 0.9)}, ${withOpacity(colors.background.primary, 0.9)})`,
            border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
          }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: colors.text.primary }}>
            Need Help?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <a
              href="mailto:support@mofisc.com?subject=Billing%20Question"
              className="flex items-center gap-3 p-3 rounded-lg transition-colors group"
              style={{
                backgroundColor: withOpacity(colors.background.primary, 0.5),
                border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: withOpacity(colors.primary.main, 0.1) }}
              >
                <svg className="w-4 h-4" style={{ color: colors.primary.main }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
                  Contact Support
                </p>
                <p className="text-xs" style={{ color: colors.text.secondary }}>
                  Get help with billing
                </p>
              </div>
            </a>

            <a
              href="mailto:sales@mofisc.com?subject=Enterprise%20Plan%20Inquiry"
              className="flex items-center gap-3 p-3 rounded-lg transition-colors group"
              style={{
                backgroundColor: withOpacity(colors.background.primary, 0.5),
                border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: withOpacity(colors.status.success, 0.1) }}
              >
                <svg className="w-4 h-4" style={{ color: colors.status.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
                  Enterprise Sales
                </p>
                <p className="text-xs" style={{ color: colors.text.secondary }}>
                  Custom solutions
                </p>
              </div>
            </a>

            {currentPlanId !== 'free' && !subscription?.cancelAtPeriodEnd && subscription?.status !== 'cancelled' && (
              <button
                onClick={() => setShowCancellationModal(true)}
                className="flex items-center gap-3 p-3 rounded-lg transition-colors group text-left"
                style={{
                  backgroundColor: withOpacity(colors.background.primary, 0.5),
                  border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: withOpacity(colors.status.error, 0.1) }}
                >
                  <svg className="w-4 h-4" style={{ color: colors.status.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
                    Cancel Subscription
                  </p>
                  <p className="text-xs" style={{ color: colors.text.secondary }}>
                    Keep access until period ends
                  </p>
                </div>
              </button>
            )}

            {(subscription?.cancelAtPeriodEnd || subscription?.status === 'cancelled') && subscription?.hasActiveAccess && (
              <button
                onClick={handleReactivateSubscription}
                disabled={isReactivating}
                className="flex items-center gap-3 p-3 rounded-lg transition-colors group text-left disabled:opacity-50"
                style={{
                  backgroundColor: withOpacity(colors.background.primary, 0.5),
                  border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: withOpacity(colors.status.success, 0.1) }}
                >
                  {isReactivating ? (
                    <FiLoader className="w-4 h-4 animate-spin" style={{ color: colors.status.success }} />
                  ) : (
                    <svg className="w-4 h-4" style={{ color: colors.status.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
                    Keep My Subscription
                  </p>
                  <p className="text-xs" style={{ color: colors.text.secondary }}>
                    Cancel the cancellation
                  </p>
                </div>
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Cancellation Modal */}
      <CancellationModal
        isOpen={showCancellationModal}
        onClose={() => setShowCancellationModal(false)}
        onConfirm={handleCancelSubscription}
        planName={currentPlanDetails.name}
        periodEndDate={subscription?.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : undefined}
        isLoading={isCancelling}
      />
    </div>
  );
};

export default BillingSettings;
