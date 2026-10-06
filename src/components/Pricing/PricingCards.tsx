import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { secureLogger } from '../../utils/secureLogger';
import CheckoutModal from './CheckoutModal';

const plans = [
  {
    name: 'Free',
    price: '0',
    description: 'For trying the core product',
    features: ['Basic transaction categorisation', 'Up to 100 transactions each month', 'One bank account', 'Basic financial health score', 'Email support'],
    cta: 'Get started',
    planId: 'free',
    recommended: false,
  },
  {
    name: 'Basic',
    price: '2.99',
    description: 'For regular personal use',
    features: ['Advanced transaction categorisation', 'Up to 300 transactions each month', 'Multiple bank accounts', 'Detailed financial health analysis', 'Weekly financial summaries'],
    cta: 'Start trial',
    planId: 'basic',
    recommended: false,
  },
  {
    name: 'Premium',
    price: '7.99',
    description: 'For more accounts and activity',
    recommended: true,
    features: ['Automatic transaction categorisation', 'Unlimited transactions', 'Unlimited bank accounts', 'Advanced financial health information', 'Full transaction analysis', 'Priority support'],
    cta: 'Start trial',
    planId: 'premium',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For organisations',
    features: ['All Premium features', 'Dedicated account contact', 'Custom model configuration', 'API access', 'Advanced data analysis', 'Brand customisation'],
    cta: 'Start enterprise trial',
    planId: 'enterprise',
    recommended: false,
  },
];

const PricingCards = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'annually'>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, planName: '', price: '' });

  const calculateAnnualPrice = (price: string): string => {
    if (price === 'Custom') return price;
    return (Number.parseFloat(price) * 12 * 0.8).toFixed(2);
  };

  const handlePlanSelect = async (plan: typeof plans[number]) => {
    setError(null);

    if (plan.planId === 'free') {
      navigate('/signup');
      return;
    }

    if (plan.planId === 'enterprise') {
      sessionStorage.setItem('selectedPlan', JSON.stringify({ plan: 'enterprise', billingFrequency: 'annually' }));
      navigate('/signup?account=organisation&plan=enterprise');
      return;
    }

    if (!user) {
      sessionStorage.setItem('selectedPlan', JSON.stringify({ plan: plan.planId, billingFrequency }));
      navigate('/signup');
      return;
    }

    try {
      setIsLoading(plan.planId);
      const displayPrice = billingFrequency === 'annually' ? `$${calculateAnnualPrice(plan.price)}` : `$${plan.price}`;
      setCheckoutModal({ isOpen: true, planName: plan.name, price: displayPrice });

      const response = await api.post('/v1/subscriptions/create-checkout-session', {
        plan: plan.planId,
        billing_frequency: billingFrequency,
        user_id: user.id,
        user_email: user.email,
        user_name: user.profile?.full_name || user.email?.split('@')[0],
      });

      window.location.href = response.data.checkout_url;
    } catch (checkoutError: any) {
      secureLogger.error('Checkout error:', 'PricingCards', checkoutError);
      setCheckoutModal({ isOpen: false, planName: '', price: '' });
      setError(checkoutError.response?.data?.detail || 'We could not start checkout. Please try again.');
      setIsLoading(null);
    }
  };

  return (
    <>
      <CheckoutModal isOpen={checkoutModal.isOpen} planName={checkoutModal.planName} price={checkoutModal.price} billingFrequency={billingFrequency} isTrialEnabled />

      {error ? <div role="alert" className="mx-auto mb-6 max-w-md border border-[#e9b8b8] bg-[#fff7f7] p-3 text-center text-sm text-[#a43b3b]">{error}</div> : null}

      <div className="mb-8 flex justify-center">
        <div className="inline-flex rounded-lg border border-[#cfd7e2] bg-white p-1" aria-label="Billing frequency">
          {(['monthly', 'annually'] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setBillingFrequency(period)}
              className={`rounded-md px-4 py-2 text-sm font-medium ${billingFrequency === period ? 'bg-[#15263c] text-white' : 'bg-transparent text-[#5f6f82] hover:bg-[#f1f4f7]'}`}
              aria-pressed={billingFrequency === period}
            >
              {period === 'monthly' ? 'Monthly' : 'Annual, save 20%'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid border-l border-t border-[#d7dee7] sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isPlanLoading = isLoading === plan.planId;
          const displayPrice = plan.price === 'Custom' ? 'Custom' : `$${billingFrequency === 'annually' ? calculateAnnualPrice(plan.price) : plan.price}`;

          return (
            <article key={plan.name} className={`relative flex min-h-[430px] flex-col border-b border-r p-6 ${plan.recommended ? 'border-[#246bfd] bg-[#f7f9fd]' : 'border-[#d7dee7] bg-white'}`}>
              {plan.recommended ? <p className="mb-4 text-xs font-medium uppercase tracking-[0.1em] text-[#245dc7]">Recommended</p> : <div className="mb-4 h-4" />}
              <h2 className="text-xl font-semibold text-[#15263c]">{plan.name}</h2>
              <p className="mt-1 text-xs text-[#738194]">{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-[-0.03em] text-[#15263c]">{displayPrice}</span>
                {plan.price !== 'Custom' ? <span className="text-xs text-[#738194]">/{billingFrequency === 'monthly' ? 'month' : 'year'}</span> : null}
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => <li key={feature} className="text-sm leading-5 text-[#5f6f82]">{feature}</li>)}
              </ul>

              <button
                type="button"
                onClick={() => handlePlanSelect(plan)}
                disabled={isPlanLoading}
                className={`mt-6 h-10 w-full rounded-lg text-sm font-medium ${plan.recommended ? 'bg-[#15263c] text-white' : 'border border-[#cfd7e2] bg-white text-[#15263c]'}`}
              >
                {isPlanLoading ? 'Processing' : plan.cta}
              </button>
            </article>
          );
        })}
      </div>

      <p className="mt-5 text-center text-xs text-[#738194]">Paid plans include a seven day trial. You can cancel from account settings.</p>
    </>
  );
};

export default PricingCards;
