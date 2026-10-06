// src/components/Shared/UpgradeLimitModal.tsx
// Revolut-style upgrade modal for subscription limit errors
// Provides clear, actionable feedback when users hit plan limits

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiZap, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { colors, withOpacity } from '../../styles/colors';
import { SubscriptionPlan } from '../../context/SubscriptionContext';

export interface LimitError {
  type: 'transaction_limit_exceeded' | 'bank_limit_exceeded' | 'feature_not_available';
  message: string;
  currentCount?: number;
  limit?: number;
  currentPlan?: string;
  feature?: string;
  hiddenTransactions?: number;
  totalTransactions?: number;
}

interface UpgradeLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitError: LimitError;
}

const PLAN_BENEFITS: Record<string, { transactions: number | string; banks: number | string; highlight: string }> = {
  basic: {
    transactions: '300/month',
    banks: '3 banks',
    highlight: 'Perfect for personal finance tracking',
  },
  premium: {
    transactions: 'Unlimited',
    banks: 'Unlimited',
    highlight: 'For power users who want it all',
  },
};

const UpgradeLimitModal: React.FC<UpgradeLimitModalProps> = ({ isOpen, onClose, limitError }) => {
  const navigate = useNavigate();

  const getRecommendedPlan = (): SubscriptionPlan => {
    const current = (limitError.currentPlan || 'free').toLowerCase();
    if (current === 'free') return 'basic';
    if (current === 'basic') return 'premium';
    return 'premium';
  };

  const recommendedPlan = getRecommendedPlan();
  const planBenefits = PLAN_BENEFITS[recommendedPlan];

  const handleUpgrade = () => {
    onClose();
    navigate('/settings/billing');
  };

  const getTitle = () => {
    switch (limitError.type) {
      case 'transaction_limit_exceeded':
        return 'Transaction Limit Reached';
      case 'bank_limit_exceeded':
        return 'Bank Account Limit Reached';
      case 'feature_not_available':
        return 'Feature Unavailable';
      default:
        return 'Upgrade Required';
    }
  };

  const getDescription = () => {
    switch (limitError.type) {
      case 'transaction_limit_exceeded':
        if (limitError.hiddenTransactions && limitError.totalTransactions) {
          return `You're viewing the most recent ${limitError.limit || 'plan'} transactions. ${limitError.hiddenTransactions} older transactions are locked. Upgrade to unlock your full history and keep uploading statements.`;
        }
        return `You've used ${limitError.currentCount || 0} of your ${limitError.limit || 'monthly'} transactions this month. Upgrade to continue tracking your finances.`;
      case 'bank_limit_exceeded':
        return `You've connected ${limitError.currentCount || 0} of ${limitError.limit || 'your'} bank accounts. Upgrade to add more banks.`;
      case 'feature_not_available':
        return limitError.message || 'This feature requires a higher plan.';
      default:
        return limitError.message;
    }
  };

  const getProgressPercent = () => {
    if (limitError.currentCount && limitError.limit) {
      return Math.min(100, (limitError.currentCount / limitError.limit) * 100);
    }
    return 100;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: colors.overlay.backdrop }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm rounded-xl overflow-hidden shadow-2xl"
            style={{
              backgroundColor: colors.background.secondary,
              boxShadow: '0 20px 45px -12px rgba(0, 0, 0, 0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div
              className="px-5 pt-5 pb-3"
              style={{
                background: `linear-gradient(135deg, ${colors.status.warning} 0%, ${withOpacity(colors.status.warning, 0.8)} 100%)`,
              }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full transition-colors"
                style={{
                  backgroundColor: withOpacity(colors.text.inverse, 0.2),
                  color: colors.text.inverse,
                }}
              >
                <FiX className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: withOpacity(colors.text.inverse, 0.2) }}
                >
                  <FiAlertCircle className="w-6 h-6" style={{ color: colors.text.inverse }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: colors.text.inverse }}>{getTitle()}</h2>
              </div>

              <p className="text-sm leading-relaxed" style={{ color: withOpacity(colors.text.inverse, 0.9) }}>{getDescription()}</p>

              {/* Progress bar */}
              {limitError.currentCount !== undefined && limitError.limit !== undefined && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1" style={{ color: withOpacity(colors.text.inverse, 0.8) }}>
                    <span>Current usage</span>
                    <span>
                      {limitError.currentCount} / {limitError.limit}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: withOpacity(colors.text.inverse, 0.3) }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgressPercent()}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: colors.text.inverse }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Recommended plan card */}
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: withOpacity(colors.primary.main, 0.1) }}
                  >
                    <FiZap className="w-5 h-5" style={{ color: colors.primary.main }} />
                  </div>
                  <div>
                    <p className="text-2xs text-[color:var(--text-secondary)] uppercase tracking-wide">Recommended</p>
                    <p className="text-base font-semibold capitalize" style={{ color: colors.text.primary }}>
                      {recommendedPlan} plan
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleUpgrade}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-transform hover:scale-[1.01]"
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.inverse,
                  }}
                >
                  Upgrade <FiArrowRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm" style={{ color: colors.text.secondary }}>
                {planBenefits?.highlight}
              </p>

              <div
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ backgroundColor: withOpacity(colors.primary.main, 0.05) }}
              >
                <div>
                  <p className="text-2xs text-[color:var(--text-secondary)] uppercase tracking-wide">Transactions</p>
                  <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                    {planBenefits?.transactions}
                  </p>
                </div>
                <div>
                  <p className="text-2xs text-[color:var(--text-secondary)] uppercase tracking-wide">Banks</p>
                  <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                    {planBenefits?.banks}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpgrade}
                className="flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                style={{
                  backgroundColor: colors.primary.main,
                  color: colors.text.inverse,
                }}
              >
                <span>Upgrade Now</span>
                <FiArrowRight className="w-4 h-4" />
              </motion.button>

              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl font-medium transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  color: colors.text.secondary,
                  border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
                }}
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpgradeLimitModal;
