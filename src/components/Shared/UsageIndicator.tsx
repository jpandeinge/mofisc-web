// src/components/Shared/UsageIndicator.tsx
// Revolut-style usage indicator with transaction and bank account tracking

import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiCreditCard, FiDatabase } from 'react-icons/fi';
import { useSubscription } from '../../context/SubscriptionContext';
import { colors, withOpacity } from '../../styles/colors';

interface UsageIndicatorProps {
  compact?: boolean;
  showUpgradeButton?: boolean;
  onUpgradeClick?: () => void;
}

const UsageIndicator: React.FC<UsageIndicatorProps> = ({
  compact = false,
  showUpgradeButton = true,
  onUpgradeClick,
}) => {
  const { usage, effectivePlan, isLoadingUsage, isPremium } = useSubscription();

  // Don't show for premium/enterprise users (unlimited)
  if (isPremium || !usage) {
    return null;
  }

  // Don't show loading state for compact mode
  if (isLoadingUsage && compact) {
    return null;
  }

  const {
    transactionsUsed,
    transactionsLimit,
    transactionsPercent,
    bankAccountsUsed,
    bankAccountsLimit,
    isNearLimit,
    isAtLimit,
    daysUntilReset,
  } = usage;
  const displayTransactions = usage.visibleTransactions ?? transactionsUsed;
  const totalCount = usage.totalTransactions ?? displayTransactions;
  const hiddenTransactions = usage.hiddenTransactions ?? Math.max(0, totalCount - transactionsLimit);

  // Calculate bank accounts percentage
  const bankAccountsPercent = bankAccountsLimit && bankAccountsLimit < 999999
    ? (bankAccountsUsed / bankAccountsLimit) * 100
    : 0;
  const isBankLimitNear = bankAccountsPercent >= 80;
  const isBankLimitAt = bankAccountsUsed >= bankAccountsLimit && bankAccountsLimit < 999999;

  // Determine status color
  const getStatusColor = () => {
    if (isAtLimit) return colors.status.error;
    if (isNearLimit) return colors.status.warning;
    return colors.status.success;
  };

  const statusColor = getStatusColor();

  // Compact version for headers/toolbars
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{
          backgroundColor: withOpacity(statusColor, 0.1),
          border: `1px solid ${withOpacity(statusColor, 0.2)}`,
        }}
      >
        {isAtLimit ? (
          <FiAlertTriangle className="w-3.5 h-3.5" style={{ color: statusColor }} />
        ) : isNearLimit ? (
          <FiTrendingUp className="w-3.5 h-3.5" style={{ color: statusColor }} />
        ) : (
          <FiCheckCircle className="w-3.5 h-3.5" style={{ color: statusColor }} />
        )}
        <span className="text-xs font-medium" style={{ color: statusColor }}>
          {displayTransactions}/{transactionsLimit === 999999 ? '∞' : transactionsLimit}
        </span>
      </motion.div>
    );
  }

  // Full version for dashboard/settings
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4"
      style={{
        backgroundColor: withOpacity(colors.background.secondary, 0.9),
        border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: withOpacity(statusColor, 0.1) }}
          >
            {isAtLimit ? (
              <FiAlertTriangle className="w-4 h-4" style={{ color: statusColor }} />
            ) : (
              <FiTrendingUp className="w-4 h-4" style={{ color: statusColor }} />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: colors.text.primary }}>
              Plan Usage
            </h3>
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              {hiddenTransactions > 0
                ? `Showing ${displayTransactions} of ${totalCount}. Unlock ${hiddenTransactions} more.`
                : `Resets in ${daysUntilReset} days`}
            </p>
          </div>
        </div>

        {showUpgradeButton && !isPremium && (isNearLimit || isAtLimit || isBankLimitNear || isBankLimitAt) && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onUpgradeClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: colors.primary.main,
              color: colors.text.inverse,
            }}
          >
            <FiCreditCard className="w-3.5 h-3.5" />
            Upgrade
          </motion.button>
        )}
      </div>

      {/* Transactions Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <FiTrendingUp className="w-3.5 h-3.5" style={{ color: colors.text.secondary }} />
            <span className="text-xs" style={{ color: colors.text.secondary }}>
              Transactions
            </span>
          </div>
          <span className="text-xs font-medium" style={{ color: colors.text.primary }}>
            {displayTransactions} / {transactionsLimit === 999999 ? 'Unlimited' : transactionsLimit}
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: withOpacity(colors.text.secondary, 0.1) }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(transactionsPercent, 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: statusColor }}
          />
        </div>
        {/* Remaining indicator */}
        <div className="flex justify-between mt-1">
          <span className="text-[10px]" style={{ color: colors.text.tertiary }}>
            {Math.round(transactionsPercent)}% used
          </span>
          <span className="text-[10px]" style={{ color: isAtLimit ? colors.status.error : colors.text.tertiary }}>
            {isAtLimit ? 'Limit reached' : `${usage.transactionsRemaining} remaining`}
          </span>
        </div>
        {hiddenTransactions > 0 && (
          <div className="mt-2 px-3 py-2 rounded-lg" style={{ backgroundColor: withOpacity(colors.status.warning, 0.08) }}>
            <p className="text-[11px] font-medium" style={{ color: colors.status.warning }}>
              {hiddenTransactions} transactions are hidden. Upgrade to unlock your full history and keep uploading statements.
            </p>
          </div>
        )}
      </div>

      {/* Bank Accounts Progress */}
      {bankAccountsLimit && bankAccountsLimit < 999999 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <FiDatabase className="w-3.5 h-3.5" style={{ color: colors.text.secondary }} />
              <span className="text-xs" style={{ color: colors.text.secondary }}>
                Bank Accounts
              </span>
            </div>
            <span className="text-xs font-medium" style={{ color: colors.text.primary }}>
              {bankAccountsUsed} / {bankAccountsLimit}
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: withOpacity(colors.text.secondary, 0.1) }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(bankAccountsPercent, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{
                backgroundColor: isBankLimitAt
                  ? colors.status.error
                  : isBankLimitNear
                  ? colors.status.warning
                  : colors.status.success,
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px]" style={{ color: colors.text.tertiary }}>
              {Math.round(bankAccountsPercent)}% used
            </span>
            <span className="text-[10px]" style={{ color: isBankLimitAt ? colors.status.error : colors.text.tertiary }}>
              {isBankLimitAt ? 'Limit reached' : `${bankAccountsLimit - bankAccountsUsed} remaining`}
            </span>
          </div>
        </div>
      )}

      {/* Status message */}
      <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: `1px solid ${withOpacity(colors.text.secondary, 0.1)}` }}>
        {isAtLimit || isBankLimitAt ? (
          <>
            <FiAlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: colors.status.error }} />
            <p className="text-xs" style={{ color: colors.status.error }}>
              {isAtLimit
                ? "You've reached your transaction limit."
                : "You've reached your bank account limit."}{' '}
              Upgrade to continue.
            </p>
          </>
        ) : isNearLimit || isBankLimitNear ? (
          <>
            <FiTrendingUp className="w-4 h-4 flex-shrink-0" style={{ color: colors.status.warning }} />
            <p className="text-xs" style={{ color: colors.status.warning }}>
              You're approaching your plan limits. Consider upgrading.
            </p>
          </>
        ) : (
          <>
            <FiCheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: colors.status.success }} />
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              You're within your plan limits.
            </p>
          </>
        )}
      </div>

      {/* Plan badge */}
      <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${withOpacity(colors.text.secondary, 0.1)}` }}>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: colors.text.secondary }}>
            Current Plan
          </span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: withOpacity(colors.primary.main, 0.1),
              color: colors.primary.main,
            }}
          >
            {effectivePlan?.charAt(0).toUpperCase()}{effectivePlan?.slice(1) || 'Free'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default UsageIndicator;
