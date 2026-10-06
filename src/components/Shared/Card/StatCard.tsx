// src/components/Shared/Card/StatCard.tsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '../../../utils/formatters';
import { ArrowDown, ArrowUp } from 'lucide-react';



interface StatCardProps {
  title: string;
  value: string;
  color?: 'green' | 'red' | 'default';
  subValue?: string;
  trend?: number;
  icon?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  color = 'default',
  subValue,
  trend,
  icon,
  className,
  isLoading = false
}) => {
  const formatValue = (val: string): string => {
    if (val.includes(' - ') && val !== 'No statements') {
      const [start, end] = val.split(' - ');
      try {
        return `${formatDate(start)} - ${formatDate(end)}`;
      } catch {
        return val;
      }
    }
    return val;
  };

  const getColorClasses = (color: 'green' | 'red' | 'default') => {
    switch (color) {
      case 'green':
        return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500';
      case 'red':
        return 'border-rose-500/20 bg-rose-500/10 text-rose-500';
      default:
        return 'border-[color:var(--border-color)] bg-[color:var(--bg-secondary)] text-[color:var(--text-primary)]';
    }
  };

  // Skeleton loader for Revolut-style smooth transitions
  const SkeletonValue = () => (
    <div className="animate-pulse">
      <div className="h-5 w-20 bg-white/10 rounded" />
    </div>
  );

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative overflow-hidden rounded-xl border backdrop-blur-lg p-3 transition-all duration-200 ${getColorClasses(color)} ${className || ''}`}
    >
      <div className="flex items-start justify-between w-full">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {icon && (
              <div className={`p-1.5 rounded-lg ${
                color === 'green' ? 'bg-emerald-500/20' :
                color === 'red' ? 'bg-rose-500/20' :
                'bg-[color:var(--bg-secondary)]/50'
              }`}>
                {icon}
              </div>
            )}
            <p className="text-2xs font-medium text-[color:var(--text-secondary)] truncate">
              {title}
            </p>
          </div>

          <div className="flex items-baseline gap-2">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <SkeletonValue />
                </motion.div>
              ) : (
                <motion.h3
                  key={value}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm font-semibold truncate"
                  style={{ maxWidth: '90%' }}
                >
                  {formatValue(value)}
                </motion.h3>
              )}
            </AnimatePresence>
            {!isLoading && trend !== undefined && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1"
              >
                {trend > 0 ? (
                  <ArrowUp className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowDown className="w-3 h-3 text-rose-500" />
                )}
                <span className={`text-2xs ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {Math.abs(trend)}%
                </span>
              </motion.div>
            )}
          </div>

          {subValue && (
            <p className="text-2xs text-[color:var(--text-secondary)] truncate">
              {subValue}
            </p>
          )}
        </div>
      </div>

      {/* Decorative gradient blob */}
      <div
        className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-25 blur-2xl"
        style={{
          background: `radial-gradient(circle at center, ${
            color === 'green' ? 'rgb(16 185 129 / 0.2)' :
            color === 'red' ? 'rgb(239 68 68 / 0.2)' :
            'rgb(99 102 241 / 0.2)'
          }, transparent)`
        }}
      />
    </motion.div>
  );
};

export default StatCard;