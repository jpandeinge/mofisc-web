// src/components/Shared/FeatureGate.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useSubscription, PLAN_LIMITS, SubscriptionPlan } from '../../context/SubscriptionContext';

interface FeatureGateProps {
  feature: keyof typeof PLAN_LIMITS.free;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

const PLAN_DISPLAY_NAMES: Record<SubscriptionPlan, string> = {
  free: 'Free',
  basic: 'Basic',
  premium: 'Premium',
  enterprise: 'Enterprise',
};

const getMinimumPlanForFeature = (feature: keyof typeof PLAN_LIMITS.free): SubscriptionPlan => {
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
};

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}) => {
  const { canAccessFeature } = useSubscription();
  const navigate = useNavigate();

  if (canAccessFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const requiredPlan = getMinimumPlanForFeature(feature);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#F1F3F4]/90 to-[#FFFFFF]/90
                 border border-[#5F6368]/30 p-6 text-center"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-emerald-600/5" />

      <div className="relative z-10">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-600/20 to-emerald-600/20
                        flex items-center justify-center">
          <FiLock className="w-6 h-6 text-blue-400" />
        </div>

        <h3 className="mb-2 text-lg font-semibold text-[#15263c]">
          Upgrade to {PLAN_DISPLAY_NAMES[requiredPlan]}
        </h3>

        <p className="mb-4 text-sm text-[#5f6f82]">
          This feature is available on the {PLAN_DISPLAY_NAMES[requiredPlan]} plan and above.
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/pricing')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                     bg-gradient-to-r from-blue-600 to-emerald-600
                     text-white text-sm font-medium
                     hover:from-blue-700 hover:to-emerald-700 transition-all"
        >
          View Plans
          <FiArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

// Inline upgrade badge for compact spaces
interface UpgradeBadgeProps {
  feature: keyof typeof PLAN_LIMITS.free;
  compact?: boolean;
}

export const UpgradeBadge: React.FC<UpgradeBadgeProps> = ({ feature, compact = false }) => {
  const { canAccessFeature } = useSubscription();
  const navigate = useNavigate();

  if (canAccessFeature(feature)) {
    return null;
  }

  const requiredPlan = getMinimumPlanForFeature(feature);

  if (compact) {
    return (
      <span
        onClick={() => navigate('/pricing')}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
                   bg-blue-600/20 text-blue-300 border border-blue-500/30 cursor-pointer
                   hover:bg-blue-600/30 transition-colors"
      >
        <FiLock className="w-3 h-3" />
        {PLAN_DISPLAY_NAMES[requiredPlan]}
      </span>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/pricing')}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                 bg-gradient-to-r from-blue-600/20 to-emerald-600/20
                 text-blue-300 border border-blue-500/30
                 hover:from-blue-600/30 hover:to-emerald-600/30 transition-all"
    >
      <FiLock className="w-3.5 h-3.5" />
      Upgrade to {PLAN_DISPLAY_NAMES[requiredPlan]}
    </motion.button>
  );
};

export default FeatureGate;
