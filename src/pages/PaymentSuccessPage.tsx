// src/pages/PaymentSuccessPage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { secureLogger } from '../utils/secureLogger';

// Plan-specific configurations
const PLAN_CONFIG = {
  basic: {
    name: 'Basic',
    tagline: 'The essentials for managing personal finances',
    features: [
      'Advanced transaction categorisation',
      'Up to 300 transactions each month',
      'Multiple bank accounts (up to 3)',
      'Detailed financial health analysis',
      'Basic NER transaction analysis',
      'Weekly financial insights',
    ],
  },
  premium: {
    name: 'Premium',
    tagline: 'More detail and fewer limits',
    features: [
      'Automatic transaction categorisation',
      'Unlimited transactions',
      'Unlimited bank accounts',
      'Advanced financial health insights',
      'Full NER transaction analysis',
      'Priority support',
      'Weekly personalised insights',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    tagline: 'Controls and support for larger teams',
    features: [
      'All Premium features',
      'Dedicated account manager',
      'Custom categorisation rules',
      'Full API access',
      'Advanced data analytics',
      'Custom integrations',
    ],
  },
};

type PlanType = keyof typeof PLAN_CONFIG;

// Card decline troubleshooting guide
const DECLINE_TROUBLESHOOTING = [
  {
    title: 'Enable international transactions',
    description: 'Many banks block international online purchases by default. Check your banking app or call your bank to enable international/online transactions.',
  },
  {
    title: 'Verify 3D Secure enrolment',
    description: 'Ensure your card is enrolled in Verified by Visa or Mastercard SecureCode. This may require activation through your bank.',
  },
  {
    title: 'Check card limits',
    description: 'Your daily or monthly spending limit may have been reached. Contact your bank to check or temporarily increase your limits.',
  },
  {
    title: 'Contact your bank',
    description: 'Your bank may have flagged the transaction for security. A quick call to approve the transaction often resolves this.',
  },
];

// Helper to get user-friendly decline message based on error details
const getDeclineMessage = (status: string, errorMessage?: string): { title: string; subtitle: string } => {
  const lowerError = (errorMessage || '').toLowerCase();
  const lowerStatus = status.toLowerCase();

  if (lowerError.includes('declined') || lowerError.includes('card_declined')) {
    return {
      title: 'Your card was declined',
      subtitle: 'Your bank did not approve this transaction. This is common with international purchases.',
    };
  }
  if (lowerError.includes('insufficient') || lowerError.includes('funds')) {
    return {
      title: 'Insufficient funds',
      subtitle: 'Please ensure your card has sufficient funds and try again.',
    };
  }
  if (lowerError.includes('expired')) {
    return {
      title: 'Card expired',
      subtitle: 'The card you used has expired. Please try with a different card.',
    };
  }
  if (lowerError.includes('authentication') || lowerError.includes('3d_secure') || lowerError.includes('3ds')) {
    return {
      title: 'Authentication failed',
      subtitle: 'The 3D Secure verification was not completed. Please try again and complete the bank verification step.',
    };
  }
  if (lowerStatus === 'cancelled' || lowerStatus === 'canceled') {
    return {
      title: 'Payment cancelled',
      subtitle: 'The payment was cancelled. You can try again when you\'re ready.',
    };
  }
  if (lowerStatus === 'expired') {
    return {
      title: 'Session expired',
      subtitle: 'The payment session timed out. Please start a new checkout.',
    };
  }

  // Default message
  return {
    title: 'Payment unsuccessful',
    subtitle: 'Your payment couldn\'t be processed. This may be due to your bank\'s security settings.',
  };
};

interface VerificationData {
  verified: boolean;
  plan: string;
  billing_frequency: string;
  status: string;
  user_email?: string;
  amount_paid?: number;
  currency?: string;
  next_billing_date?: string;
  is_trial?: boolean;
  trial_ends?: string;
  error_message?: string;
}

// Check if status indicates payment failure
const isFailedStatus = (status: string): boolean => {
  return ['failed', 'cancelled', 'canceled', 'expired', 'incomplete'].includes(status.toLowerCase());
};

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  // New URL format: ?user_id=xxx&plan=premium
  // Legacy format: ?session_id=xxx&subscription_id=xxx&status=xxx
  const userIdParam = searchParams.get('user_id');
  const planParam = searchParams.get('plan');
  const sessionIdParam = searchParams.get('session_id');
  const subscriptionId = searchParams.get('subscription_id');
  const statusParam = searchParams.get('status');

  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [syncedOnce, setSyncedOnce] = useState(false);

  const isPlaceholderValue = (value: string | null) => {
    if (!value) return true;
    return ['{session_id}', '{{session_id}}', '%7Bsession_id%7D', 'session_id',
            '{subscription_id}', '{{subscription_id}}', '%7Bsubscription_id%7D', 'subscription_id',
            'null', 'undefined'].includes(value);
  };

  const verifySession = useCallback(async () => {
    // Determine the effective user ID (from URL or auth context)
    const effectiveUserId = userIdParam || user?.id;
    const hasValidSessionId = !!sessionIdParam && !isPlaceholderValue(sessionIdParam);
    const hasValidSubscriptionId = !!subscriptionId && !isPlaceholderValue(subscriptionId);

    // If we have user_id (new format), we can verify via user lookup
    // If we have valid session/subscription IDs (legacy), use those
    if (!effectiveUserId && !hasValidSessionId && !hasValidSubscriptionId) {
      // Nothing to verify with
      setIsVerifying(false);
      setVerificationData({
        verified: false,
        plan: planParam || 'unknown',
        billing_frequency: 'monthly',
        status: statusParam || 'pending',
      });
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);

      // Call verify-session with whatever IDs we have
      const response = await api.get(
        `/v1/subscriptions/verify-session/${encodeURIComponent(hasValidSessionId ? sessionIdParam! : 'lookup')}`,
        {
          params: {
            subscription_id: hasValidSubscriptionId ? subscriptionId : undefined,
            user_id: effectiveUserId || undefined,
          },
        }
      );
      const data = response.data;

      setVerificationData(data);

      if (!data.verified && data.status !== 'active' && data.status !== 'trialing') {
        // Payment might still be processing - retry a few times
        if (retryCount < 3) {
          const delay = 2000 * Math.pow(2, retryCount); // 2s, 4s, 8s
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, delay);
          return;
        }

        // After retries, try a server-side sync to reconcile stale pending state
        if (effectiveUserId && !syncedOnce) {
          try {
            await api.post('/v1/subscriptions/sync-subscription', { user_id: effectiveUserId });
            const statusResp = await api.get(`/v1/subscriptions/subscription-status/${effectiveUserId}`);
            const sub = statusResp.data;
            setVerificationData({
              verified: sub.status === 'active' || sub.status === 'trialing',
              plan: sub.plan || planParam || 'unknown',
              billing_frequency: 'monthly',
              status: sub.status,
              is_trial: sub.is_trial || sub.status === 'trialing',
              next_billing_date: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
              trial_ends: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
            });
            setSyncedOnce(true);
            return;
          } catch (syncErr) {
            secureLogger.error('PaymentSuccessPage', 'Sync after verify failed', syncErr);
          }
        }

        setError('Payment verification is taking longer than expected. Your subscription will be activated shortly.');
      }
    } catch (err: any) {
      // Treat verification failures as pending; do not grant access optimistically
      setVerificationData({
        verified: false,
        plan: planParam || 'unknown',
        billing_frequency: 'monthly',
        status: statusParam || 'pending',
      });
    } finally {
      setIsVerifying(false);
    }
  }, [userIdParam, planParam, sessionIdParam, subscriptionId, statusParam, retryCount, user?.id, syncedOnce]);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  // Get plan configuration
  const planKey = (verificationData?.plan || 'basic') as PlanType;
  const planConfig = PLAN_CONFIG[planKey] || PLAN_CONFIG.basic;

  // Format billing frequency
  const formatBillingFrequency = (freq: string) => {
    return freq === 'annually' ? 'year' : 'month';
  };

  // Manual retry handler
  const handleRetry = () => {
    setRetryCount(0);
    verifySession();
  };

  const failed = Boolean(
    verificationData && isFailedStatus(verificationData.status)
  );
  const verified = Boolean(verificationData?.verified);
  const declineMessage = failed && verificationData
    ? getDeclineMessage(verificationData.status, verificationData.error_message)
    : null;
  const reference = (
    userIdParam ||
    (sessionIdParam && !isPlaceholderValue(sessionIdParam)
      ? sessionIdParam
      : subscriptionId) ||
    ''
  ).substring(0, 16);

  return (
    <main className="public-page min-h-screen bg-[#f8fafc] text-[#15263c]">
      <header className="border-b border-[#d9e0e8] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-5 sm:px-8">
          <Link to="/" className="text-xl font-semibold tracking-[-0.02em]">
            Mofisc
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-8 sm:py-20">
        <div className="border border-[#d9e0e8] bg-white p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f6f82]">
            {isVerifying
              ? 'Checking payment'
              : failed
                ? 'Payment not completed'
                : verified
                  ? `${planConfig.name} plan`
                  : 'Confirmation pending'}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
            {isVerifying
              ? 'Activating your subscription'
              : failed
                ? declineMessage?.title
                : verified
                  ? 'Your subscription is active'
                  : 'We are still checking your subscription'}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#5f6f82]">
            {isVerifying
              ? 'Please wait while we confirm the payment with the provider.'
              : failed
                ? `${declineMessage?.subtitle} You have not been charged.`
                : error
                  ? error
                  : verified && verificationData?.is_trial
                    ? `Your seven day free trial of ${planConfig.name} has started. You will not be charged before the trial ends.`
                    : verified
                      ? `Your ${planConfig.name} plan is ready to use.`
                      : 'We could not confirm the payment yet. You can check again now or continue to your account.'}
          </p>

          {!isVerifying && verified && (
            <div className="mt-8 border-t border-[#d9e0e8] pt-6">
              <h2 className="text-base font-semibold">{planConfig.name}</h2>
              <p className="mt-1 text-sm text-[#5f6f82]">{planConfig.tagline}</p>
            </div>
          )}

          {!isVerifying && failed && (
            <div className="mt-8 border-t border-[#d9e0e8] pt-6">
              <h2 className="text-base font-semibold">Things to check</h2>
              <ol className="mt-4 space-y-4">
                {DECLINE_TROUBLESHOOTING.map((item, index) => (
                  <li key={item.title} className="grid grid-cols-[1.5rem_1fr] gap-3 text-sm">
                    <span className="text-[#5f6f82]">{index + 1}.</span>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 leading-6 text-[#5f6f82]">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {!isVerifying && verified && (verificationData?.amount_paid || verificationData?.is_trial) && (
            <dl className="mt-8 grid gap-px border border-[#d9e0e8] bg-[#d9e0e8] sm:grid-cols-3">
              {verificationData?.is_trial ? (
                <>
                  <div className="bg-white p-4">
                    <dt className="text-xs text-[#5f6f82]">Charged today</dt>
                    <dd className="mt-1 font-semibold">$0.00</dd>
                  </div>
                  <div className="bg-white p-4">
                    <dt className="text-xs text-[#5f6f82]">After trial</dt>
                    <dd className="mt-1 font-semibold">
                      {planKey === 'basic' ? '$2.99' : planKey === 'premium' ? '$7.99' : 'Custom'}
                      /{formatBillingFrequency(verificationData.billing_frequency)}
                    </dd>
                  </div>
                  <div className="bg-white p-4">
                    <dt className="text-xs text-[#5f6f82]">First billing</dt>
                    <dd className="mt-1 font-semibold">{verificationData.trial_ends || 'In seven days'}</dd>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white p-4">
                    <dt className="text-xs text-[#5f6f82]">Amount paid</dt>
                    <dd className="mt-1 font-semibold">
                      {verificationData?.currency === 'USD' ? '$' : verificationData?.currency}
                      {verificationData?.amount_paid?.toFixed(2)}
                    </dd>
                  </div>
                  <div className="bg-white p-4">
                    <dt className="text-xs text-[#5f6f82]">Billing cycle</dt>
                    <dd className="mt-1 font-semibold">
                      Per {formatBillingFrequency(verificationData?.billing_frequency || 'monthly')}
                    </dd>
                  </div>
                  {verificationData?.next_billing_date && (
                    <div className="bg-white p-4">
                      <dt className="text-xs text-[#5f6f82]">Next billing</dt>
                      <dd className="mt-1 font-semibold">{verificationData.next_billing_date}</dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          )}

          {!isVerifying && verified && (
            <div className="mt-8 border-t border-[#d9e0e8] pt-6">
              <h2 className="text-base font-semibold">Included in this plan</h2>
              <ul className="mt-4 grid list-disc gap-2 pl-5 text-sm leading-6 text-[#5f6f82] sm:grid-cols-2">
                {planConfig.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 border-t border-[#d9e0e8] pt-6 sm:flex-row">
            {failed ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/pricing')}
                  className="inline-flex h-11 items-center justify-center bg-[#15263c] px-5 text-sm font-semibold text-white hover:bg-[#213852]"
                >
                  Try again
                </button>
                <a
                  href={`mailto:support@mofisc.com?subject=Payment%20Issue&body=Hi,%20I%20encountered%20a%20payment%20issue%20while%20subscribing%20to%20${verificationData?.plan || 'a'} plan.%0AUser%20ID:%20${userIdParam || user?.id || 'unknown'}%0APlease%20help.`}
                  className="inline-flex h-11 items-center justify-center border border-[#b8c2cf] bg-white px-5 text-sm font-semibold hover:bg-[#f8fafc]"
                >
                  Contact support
                </a>
                <button
                  type="button"
                  onClick={() => navigate('/app')}
                  className="inline-flex h-11 items-center justify-center px-3 text-sm text-[#5f6f82] hover:text-[#15263c]"
                >
                  Continue with the free plan
                </button>
              </>
            ) : verified ? (
              <button
                type="button"
                onClick={() => navigate('/app')}
                className="inline-flex h-11 items-center justify-center bg-[#15263c] px-5 text-sm font-semibold text-white hover:bg-[#213852]"
              >
                Open Mofisc
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isVerifying}
                  className="inline-flex h-11 items-center justify-center bg-[#15263c] px-5 text-sm font-semibold text-white hover:bg-[#213852] disabled:cursor-not-allowed disabled:bg-[#8b98a8]"
                >
                  {isVerifying ? 'Checking payment' : 'Check again'}
                </button>
                {!isVerifying && (
                  <button
                    type="button"
                    onClick={() => navigate('/app')}
                    className="inline-flex h-11 items-center justify-center border border-[#b8c2cf] bg-white px-5 text-sm font-semibold hover:bg-[#f8fafc]"
                  >
                    Continue to account
                  </button>
                )}
              </>
            )}
          </div>

          {!isVerifying && verificationData?.user_email && (
            <p className="mt-6 text-xs text-[#5f6f82]">
              Confirmation sent to <strong className="font-medium text-[#15263c]">{verificationData.user_email}</strong>
            </p>
          )}

          {reference && (
            <div className="mt-3 text-xs text-[#5f6f82]">
              <p className="font-mono">Reference: {reference}</p>
              <a
                href={`mailto:support@mofisc.com?subject=Payment%20Verification%20Assistance&body=Please%20help%20verify%20my%20subscription.%0AUser:%20${user?.email || userIdParam || 'unknown'}%0ASubscription%20ID:%20${subscriptionId || 'N/A'}%0ASession%20ID:%20${sessionIdParam || 'N/A'}`}
                className="mt-2 inline-block text-[#1f5f99] underline underline-offset-4"
              >
                Ask support about this payment
              </a>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default PaymentSuccessPage;
