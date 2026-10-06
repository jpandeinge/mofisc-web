// src/components/Security/RateLimitBanner.tsx
// Fixed banner that slides in from the top when a 429 rate-limit response
// is detected.  Shows a countdown driven by the server's Retry-After header
// and auto-dismisses when the cooldown expires.

import React, { useState, useEffect, useRef } from 'react';

import { onRateLimitDetected } from '../../utils/rateLimitSignal';
import { colors, withOpacity } from '../../styles/colors';

export const RateLimitBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Refs used inside the signal handler to avoid stale closures
  const initialSeconds = useRef(0);
  const remaining = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const deadline = useRef(0);

  useEffect(() => {
    const clearTimer = () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };

    const unsubscribe = onRateLimitDetected((retryAfter) => {
      const normalizedRetryAfter = Math.max(
        1,
        Math.ceil(Number.isFinite(retryAfter) ? retryAfter : 30)
      );
      // Ignore if an existing countdown already has more time left
      if (remaining.current > normalizedRetryAfter) return;

      clearTimer();

      initialSeconds.current = normalizedRetryAfter;
      remaining.current = normalizedRetryAfter;
      deadline.current = Date.now() + normalizedRetryAfter * 1000;
      setSecondsLeft(normalizedRetryAfter);
      setVisible(true);

      timer.current = setInterval(() => {
        const nextRemaining = Math.max(
          0,
          Math.ceil((deadline.current - Date.now()) / 1000)
        );
        remaining.current = nextRemaining;

        if (nextRemaining <= 0) {
          clearTimer();
          setVisible(false);
          setSecondsLeft(0);
          return;
        }
        setSecondsLeft(nextRemaining);
      }, 1000);
    });

    return () => {
      unsubscribe();
      clearTimer();
    };
  }, []);

  const progressPercent =
    initialSeconds.current > 0
      ? (secondsLeft / initialSeconds.current) * 100
      : 0;

  if (!visible || secondsLeft <= 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40, // above content, below modals (50)
        transform: 'translateY(0)',
        transition: 'transform 0.3s ease-out',
        pointerEvents: 'auto',
      }}
    >
      {/* Message row */}
      <div
        style={{
          backgroundColor: withOpacity(colors.status.warning, 0.08),
          borderBottom: `1px solid ${withOpacity(colors.status.warning, 0.25)}`,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {/* Clock icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.status.warning}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>

        <span
          style={{
            color: colors.status.warning,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Too many requests — try again in {secondsLeft}s
        </span>
      </div>

      {/* Countdown progress bar */}
      <div
        style={{
          height: 3,
          backgroundColor: withOpacity(colors.status.warning, 0.15),
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            backgroundColor: colors.status.warning,
            transition: 'width 1s linear',
          }}
        />
      </div>
    </div>
  );
};
