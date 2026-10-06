// src/context/SessionContext.tsx

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

interface SessionContextType {
  isIdle: boolean;
  lastActivity: number;
  resetIdleTimer: () => void;
  remainingTime: number;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Revolut-style timeouts
const IDLE_WARNING_TIME = 4 * 60 * 1000; // 4 minutes - show warning
const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes - force logout
const SESSION_MAX_TIME = 30 * 60 * 1000; // 30 minutes - absolute max
const WARNING_DURATION = 60 * 1000; // 1 minute warning before logout

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const [isIdle, setIsIdle] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [remainingTime, setRemainingTime] = useState(IDLE_TIMEOUT);
  const [showingWarning, setShowingWarning] = useState(false);

  const idleTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const warningTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const sessionTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const countdownRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const sessionStartRef = useRef<number>(Date.now());

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const handleSessionExpired = useCallback(async () => {
    clearAllTimers();
    setIsIdle(true);
    toast.error('Your session expired due to inactivity. Please sign in again.', {
      autoClose: 5000,
      position: 'top-center',
    });
    await signOut();
  }, [clearAllTimers, signOut]);

  const showIdleWarning = useCallback(() => {
    if (showingWarning) return; // Prevent duplicate warnings

    setShowingWarning(true);
    setRemainingTime(WARNING_DURATION);

    // Start countdown
    const startTime = Date.now();
    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = WARNING_DURATION - elapsed;

      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        handleSessionExpired();
      } else {
        setRemainingTime(remaining);
      }
    }, 1000);

    toast.warning(
      `You will be signed out in ${Math.ceil(WARNING_DURATION / 1000)} seconds due to inactivity. Use the app to stay signed in.`,
      {
        autoClose: false,
        position: 'top-center',
        toastId: 'idle-warning',
        closeButton: true,
      }
    );

    // Set timeout for actual logout
    warningTimerRef.current = setTimeout(() => {
      handleSessionExpired();
    }, WARNING_DURATION);
  }, [handleSessionExpired, showingWarning]);

  const resetIdleTimer = useCallback(() => {
    if (!user) return;

    const now = Date.now();
    setLastActivity(now);
    setIsIdle(false);

    // Dismiss warning if showing
    if (showingWarning) {
      setShowingWarning(false);
      toast.dismiss('idle-warning');
      if (countdownRef.current) clearInterval(countdownRef.current);
    }

    // Clear existing timers
    clearAllTimers();

    // Check if absolute session time exceeded
    const sessionDuration = now - sessionStartRef.current;
    if (sessionDuration >= SESSION_MAX_TIME) {
      toast.info('Maximum session time reached. Please sign in again for security.', {
        position: 'top-center',
      });
      handleSessionExpired();
      return;
    }

    // Set new idle warning timer
    idleTimerRef.current = setTimeout(() => {
      showIdleWarning();
    }, IDLE_WARNING_TIME);

    // Set absolute session timeout
    const remainingSessionTime = SESSION_MAX_TIME - sessionDuration;
    sessionTimerRef.current = setTimeout(() => {
      toast.info('Maximum session time reached. Please sign in again for security.', {
        position: 'top-center',
      });
      handleSessionExpired();
    }, remainingSessionTime);
  }, [user, clearAllTimers, handleSessionExpired, showIdleWarning, showingWarning]);

  // Initialize session timers when user logs in
  useEffect(() => {
    if (user) {
      sessionStartRef.current = Date.now();
      resetIdleTimer();
    } else {
      clearAllTimers();
      setIsIdle(false);
      setShowingWarning(false);
    }

    return () => {
      clearAllTimers();
    };
  }, [user, resetIdleTimer, clearAllTimers]);

  // Track user activity
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Throttle to avoid excessive resets
    let throttleTimeout: NodeJS.Timeout;
    const throttledReset = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        resetIdleTimer();
        clearTimeout(throttleTimeout);
      }, 1000); // Only reset once per second max
    };

    events.forEach(event => {
      document.addEventListener(event, throttledReset, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledReset);
      });
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [user, resetIdleTimer]);

  return (
    <SessionContext.Provider
      value={{
        isIdle,
        lastActivity,
        resetIdleTimer,
        remainingTime,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};
