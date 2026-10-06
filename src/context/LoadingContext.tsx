// src/context/LoadingContext.tsx

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface LoadingContextType {
  isProcessing: boolean;
  setIsProcessing: (state: boolean) => void;
  processingVariant: 'upload' | 'process';
  setProcessingVariant: (variant: 'upload' | 'process') => void;
  isPersistentLoading: boolean;
  setPersistentLoading: (state: boolean) => void;
  isPageTransitioning: boolean;
  setPageTransitioning: (state: boolean) => void;
  startPreload: () => void;
  stopPreload: () => void;
  pageLoadStatus: Map<string, boolean>;
  markPageLoaded: (pathname: string) => void;
  isPathLoaded: (pathname: string) => boolean;
}

// Create context with a default value that matches the shape
const defaultContext: LoadingContextType = {
  isProcessing: false,
  setIsProcessing: () => {},
  processingVariant: 'process',
  setProcessingVariant: () => {},
  isPersistentLoading: false,
  setPersistentLoading: () => {},
  isPageTransitioning: false,
  setPageTransitioning: () => {},
  startPreload: () => {},
  stopPreload: () => {},
  pageLoadStatus: new Map(),
  markPageLoaded: () => {},
  isPathLoaded: () => false
};

const LoadingContext = createContext<LoadingContextType>(defaultContext);

// Global page load status tracking
const globalPageLoadStatus = new Map<string, boolean>();

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingVariant, setProcessingVariant] = useState<'upload' | 'process'>('process');
  const [isPersistentLoading, setPersistentLoading] = useState(false);
  const [isPageTransitioning, setPageTransitioning] = useState(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track when transitions started to auto-clear stuck transitions
  const transitionStartTime = useRef<number | null>(null);

  // Automatically clear page transitions after a timeout to prevent stuck states
  useEffect(() => {
    if (isPageTransitioning) {
      transitionStartTime.current = Date.now();

      // Clear any existing timer
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }

      // Set a new timer to automatically clear the transition state
      transitionTimerRef.current = setTimeout(() => {
        setPageTransitioning(false);
      }, 2000); // Force clear after 2 seconds
    } else {
      // Clear the timer when transitioning is done
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      transitionStartTime.current = null;
    }

    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, [isPageTransitioning]);

  // Combined handlers for common loading patterns
  const startPreload = useCallback(() => {
    setIsProcessing(true);
    setPersistentLoading(true);
  }, []);

  const stopPreload = useCallback(() => {
    setIsProcessing(false);
    setPersistentLoading(false);
  }, []);

  // Page load status tracking
  const markPageLoaded = useCallback((pathname: string) => {
    globalPageLoadStatus.set(pathname, true);
  }, []);

  const isPathLoaded = useCallback((pathname: string) => {
    return globalPageLoadStatus.has(pathname) && globalPageLoadStatus.get(pathname) === true;
  }, []);

  // Custom page transition handler with debounce
  const handlePageTransition = useCallback((state: boolean) => {
    if (state) {
      // Starting a transition
      setPageTransitioning(true);
      transitionStartTime.current = Date.now();

      // Clear any existing timer
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }

      // Set a safety timeout
      transitionTimerRef.current = setTimeout(() => {
        setPageTransitioning(false);
      }, 2000);
    } else {
      // Ending a transition
      // Add a small delay to ensure animations complete
      setTimeout(() => {
        setPageTransitioning(false);

        if (transitionTimerRef.current) {
          clearTimeout(transitionTimerRef.current);
          transitionTimerRef.current = null;
        }
      }, 50);
    }
  }, []);

  const value = {
    isProcessing,
    setIsProcessing,
    processingVariant,
    setProcessingVariant,
    isPersistentLoading,
    setPersistentLoading,
    isPageTransitioning,
    setPageTransitioning: handlePageTransition,
    startPreload,
    stopPreload,
    pageLoadStatus: globalPageLoadStatus,
    markPageLoaded,
    isPathLoaded
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};