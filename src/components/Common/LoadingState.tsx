// src/components/Common/LoadingState.tsx

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { colors, withOpacity } from '../../styles/colors';

interface LoadingStateProps {
  variant?: 'upload' | 'process';
}

// CSS keyframes for spinner animation (more reliable than framer-motion for continuous rotations)
const spinnerStyles = `
  @keyframes spin-clockwise {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes spin-counterclockwise {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-360deg);
    }
  }

  @keyframes pulse-dot {
    0%, 100% {
      transform: scale(1);
      opacity: 0.5;
    }
    50% {
      transform: scale(1.2);
      opacity: 0.8;
    }
  }

  @keyframes pulse-dots {
    0%, 100% {
      transform: scale(1);
      opacity: 0.3;
    }
    50% {
      transform: scale(1.3);
      opacity: 0.8;
    }
  }

  .spinner-outer {
    animation: spin-clockwise 1.2s linear infinite;
    will-change: transform;
  }

  .spinner-inner {
    animation: spin-counterclockwise 1.8s linear infinite;
    will-change: transform;
  }

  .spinner-dot {
    animation: pulse-dot 2s ease-in-out infinite;
    will-change: transform, opacity;
  }

  .loading-dot {
    animation: pulse-dots 1.5s ease-in-out infinite;
    will-change: transform, opacity;
  }

  @media (prefers-reduced-motion: reduce) {
    .spinner-outer,
    .spinner-inner,
    .spinner-dot,
    .loading-dot {
      animation: none;
      will-change: auto;
    }
  }
`;

const LoadingState: React.FC<LoadingStateProps> = ({ variant = 'process' }) => {
  const shouldReduceMotion = useReducedMotion();
  const messages = {
    'upload': {
      title: "Processing Your Statement",
      description: "We’re analyzing your transactions to provide personalized insights"
    },
    'process': {
      title: "Unlocking Financial Insights",
      description: "Our AI is processing your data to provide meaningful analytics and patterns"
    }
  };

  const { title, description } = messages[variant];

  return (
    <>
      {/* Inject CSS animations */}
      <style>{spinnerStyles}</style>

      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="min-h-[80vh] flex items-center justify-center px-4 overflow-hidden"
      >
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="relative w-full max-w-md"
        >
          {/* Content Container */}
          <div className="text-center space-y-6">
            {/* Spinner - clean, minimal, smooth */}
            <div className="relative mx-auto w-20 h-20 mb-8">
              {/* Outer rotating ring - CSS animation for better performance */}
              <div className="absolute inset-0 spinner-outer">
                <svg aria-hidden="true" className="w-full h-full" viewBox="0 0 80 80" fill="none">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke={colors.primary.light}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="180 40"
                    style={{ opacity: 0.2 }}
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke={colors.primary.main}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="60 160"
                  />
                </svg>
              </div>

              {/* Inner counter-rotating accent - CSS animation */}
              <div className="absolute inset-3 spinner-inner">
                <svg aria-hidden="true" className="w-full h-full" viewBox="0 0 68 68" fill="none">
                  <circle
                    cx="34"
                    cy="34"
                    r="30"
                    stroke={colors.status.success}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="40 150"
                    style={{ opacity: 0.6 }}
                  />
                </svg>
              </div>

              {/* Center dot pulse - CSS animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-2 h-2 rounded-full spinner-dot"
                  style={{ backgroundColor: colors.primary.main }}
                />
              </div>
            </div>

          {/* Title - Clean typography */}
          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.2 }}
            className="text-pretty text-2xl md:text-3xl font-semibold tracking-tight"
            style={{ color: colors.text.primary }}
          >
            {title}
          </motion.h1>

          {/* Description - Subtle, minimal */}
          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.3 }}
            className="text-pretty text-sm md:text-base leading-relaxed max-w-sm mx-auto px-4"
            style={{ color: colors.text.secondary }}
          >
            {description}
          </motion.p>

          {/* Progress dots indicator with CSS animations */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.4 }}
            aria-hidden="true"
            className="flex items-center justify-center gap-2 pt-4"
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full loading-dot"
                style={{
                  backgroundColor: colors.primary.main,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Subtle ambient background glow - very minimal */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none -z-10"
          style={{ backgroundColor: withOpacity(colors.primary.main, 0.06) }}
        />
      </motion.div>
    </div>
    </>
  );
};

export default LoadingState;
