import React from 'react';

interface CheckoutModalProps {
  isOpen: boolean;
  planName: string;
  price: string;
  billingFrequency: 'monthly' | 'annually';
  isTrialEnabled?: boolean;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  planName,
  price,
  billingFrequency,
  isTrialEnabled = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#15263c]/45 p-5">
      <section
        className="w-full max-w-md border border-[#d9e0e8] bg-white p-6 sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f6f82]">
          Secure checkout
        </p>
        <h2 id="checkout-title" className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[#15263c]">
          Preparing your checkout
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#5f6f82]">
          You are continuing with the {planName} plan at {price} per{' '}
          {billingFrequency === 'monthly' ? 'month' : 'year'}.
        </p>

        {isTrialEnabled && (
          <p className="mt-4 border-l-2 border-[#1f5f99] pl-3 text-sm text-[#15263c]">
            Your seven day trial starts before the first charge.
          </p>
        )}

        <ol className="mt-7 space-y-3 border-t border-[#d9e0e8] pt-5 text-sm text-[#5f6f82]">
          <li>1. Securing the connection</li>
          <li>2. Preparing your payment details</li>
          <li>3. Opening Dodo Payments</li>
        </ol>
      </section>
    </div>
  );
};

export default CheckoutModal;
