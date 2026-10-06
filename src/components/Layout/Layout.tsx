// src/components/Layout/Layout.tsx

import React, { useEffect, useMemo, memo, useRef, useState } from 'react';
import { Header } from './Header';
import Sidebar from './Sidebar';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from '../../context/LoadingContext';
import { colors } from '../../styles/colors';

interface LayoutProps {
  children: React.ReactNode;
}

// Cache the rendered pages to avoid re-rendering during transitions
const pageCache = new Map<string, {
  content: React.ReactNode;
  timestamp: number;
}>();

// Maximum age for cached pages (5 minutes)
const MAX_CACHE_AGE = 5 * 60 * 1000;

// Maximum number of pages to keep in cache
const MAX_CACHE_SIZE = 15;

// Ultra-fast page transitions with minimal animation
// - 60ms for instant feel
// - Fade only (no Y movement to prevent reflows)
// - Sync mode (no waiting between pages)
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

// Near-instant transitions: 60ms feels instant while preventing flash
const pageTransition = {
  duration: 0.06,
  ease: [0.25, 0.1, 0.25, 1] as const
};

// Track the last render time to throttle expensive re-renders
const lastRenderTimestamp = {
  value: 0
};

const Layout: React.FC<LayoutProps> = memo(({ children }) => {
  const location = useLocation();
  const { isPageTransitioning, setPageTransitioning } = useLoading();
  const previousPathRef = useRef(location.pathname);
  const [_animationComplete, setAnimationComplete] = useState(true);

  // Determine if we're really transitioning between different pages or just reloading
  const isRealPageChange = previousPathRef.current !== location.pathname;

  // Update the previous path reference when location changes
  useEffect(() => {
    previousPathRef.current = location.pathname;
  }, [location.pathname]);

  // Clean up old cache entries periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();

      // Remove expired cache entries
      pageCache.forEach((value, key) => {
        if (now - value.timestamp > MAX_CACHE_AGE) {
          pageCache.delete(key);
        }
      });
    }, 60000); // Run cleanup every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  // Performance optimization: Only cache on real page changes, not on internal state changes
  useEffect(() => {
    if (isRealPageChange && !isPageTransitioning) {
      // Only allow caching at most once every 300ms to avoid thrashing
      const now = Date.now();
      if (now - lastRenderTimestamp.value > 300) {
        // Check if we already have this page cached
        if (!pageCache.has(location.pathname) ||
            now - pageCache.get(location.pathname)!.timestamp > MAX_CACHE_AGE) {

          // Add to cache with timestamp
          pageCache.set(location.pathname, {
            content: children,
            timestamp: now
          });

          lastRenderTimestamp.value = now;

          // Cleanup old cache entries when they exceed the limit
          if (pageCache.size > MAX_CACHE_SIZE) {
            // Find oldest entry
            let oldestKey = location.pathname;
            let oldestTime = now;

            pageCache.forEach((value, key) => {
              if (value.timestamp < oldestTime) {
                oldestTime = value.timestamp;
                oldestKey = key;
              }
            });

            // Delete oldest entry
            if (oldestKey !== location.pathname) {
              pageCache.delete(oldestKey);
            }
          }
        }
      }
    }
  }, [location.pathname, children, isRealPageChange, isPageTransitioning]);

  // Memoize the current page content to avoid re-rendering
  const pageContent = useMemo(() => {
    // Use cached page if available and not too old, otherwise use current children
    const cachedPage = pageCache.get(location.pathname);
    if (cachedPage && Date.now() - cachedPage.timestamp < MAX_CACHE_AGE) {
      return cachedPage.content;
    }
    return children;
  }, [location.pathname, children]);

  // Handle animation completion
  const handleAnimationComplete = () => {
    setAnimationComplete(true);
    setPageTransitioning(false);
  };

  // Reset animation state when location changes
  useEffect(() => {
    if (isRealPageChange) {
      setAnimationComplete(false);
    }
  }, [location.pathname, isRealPageChange]);

  return (
    <div
      className="flex h-screen"
      style={{
        backgroundColor: colors.background.primary,
        color: colors.text.primary
      }}
    >
      <Sidebar />

      <div className="ml-[72px] flex min-w-0 flex-1 flex-col overflow-hidden md:ml-0">
        {/* Header with integrated search */}
        <Header />

        {/* Main Content Area */}
        <div
          className="flex-1 overflow-hidden"
          style={{
            background: `linear-gradient(to bottom right, ${colors.background.primary}, ${colors.background.secondary})`
          }}
        >
          {/* Page Content - No breadcrumbs, sidebar & header provide clear navigation */}
          <div className="h-full overflow-y-auto">
            <div
              className="min-h-full px-3 py-4 sm:px-4 md:px-6 md:py-6"
              style={{
                background: `linear-gradient(to bottom, ${colors.background.primary}80, transparent)`
              }}
            >
              {/* No waiting between page transitions */}
              <AnimatePresence mode="sync" initial={false}>
                <motion.div
                  key={location.pathname}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="h-full"
                  onAnimationStart={() => setAnimationComplete(false)}
                  onAnimationComplete={handleAnimationComplete}
                >
                  {/* Fresh content on every navigation - context provides data instantly */}
                  {pageContent}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Add display name for easier debugging
Layout.displayName = 'Layout';

export default Layout;
