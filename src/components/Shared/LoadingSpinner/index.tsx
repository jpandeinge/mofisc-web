// src/components/Shared/LoadingSpinner/index.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { colors } from '../../../styles/colors';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium' }) => {
  // Size mappings
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const blurSizes = {
    small: 'w-20 h-20',
    medium: 'w-32 h-32',
    large: 'w-40 h-40'
  };

  return (
    <div className="loading-spinner-container">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center space-y-4"
      >
        <div className="relative">
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: [0, 0, 1, 1] as const
            }}
            className={`${sizeClasses[size]} mx-auto mb-4`}
          >
            <div
              className="w-full h-full rounded-full border-t-3 border-r-3 border-transparent"
              style={{
                borderTopColor: colors.primary.main,
                borderRightColor: colors.primary.dark,
                borderWidth: '3px',
              }}
            />
          </motion.div>
          {/* Ambient background effects - only for medium and large */}
          {size !== 'small' && (
            <>
              <div
                className={`absolute -top-20 -right-20 ${blurSizes[size]} rounded-full blur-3xl pointer-events-none`}
                style={{ backgroundColor: `${colors.primary.main}20` }}
              />
              <div
                className={`absolute -bottom-20 -left-20 ${blurSizes[size]} rounded-full blur-3xl pointer-events-none`}
                style={{ backgroundColor: `${colors.primary.light}30` }}
              />
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingSpinner;