// src/components/Auth/ProtectedRoute.tsx
import React, { useEffect, useRef, useState, memo, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../Shared/LoadingSpinner';
import { toast } from 'react-toastify';
import { useLoading } from '../../context/LoadingContext';
import { colors, withOpacity } from '../../styles/colors';
import { FiCheckCircle } from 'react-icons/fi';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Use sessionStorage to persist welcome toast flag across page reloads
// This ensures users only see the welcome message once per browser session
const WELCOME_TOAST_KEY = 'mofisc_has_shown_welcome_toast';

const hasShownWelcomeToast = () => {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(WELCOME_TOAST_KEY) === 'true';
};

const setWelcomeToastShown = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(WELCOME_TOAST_KEY, 'true');
  }
};

// Keep track of whether we've already authenticated globally
let isGloballyAuthenticated = false;

// Keep track of authenticated paths to prevent flashing during navigation
const authenticatedPaths = new Set<string>();

// Track last authentication time to prevent unnecessary rechecks
let lastAuthCheck = 0;
const AUTH_CHECK_THRESHOLD = 30 * 60 * 1000; // 30 minutes to reduce auth checks

// Track page load status with a lookup table
const pageLoadStatus = new Map<string, boolean>();

// Cache user data to avoid unnecessary re-renders
const userCache = {
  user: null as any,
  session: null as any,
  lastUpdated: 0
};

// Function to reset all authentication state
export const resetAuthState = () => {
  isGloballyAuthenticated = false;
  authenticatedPaths.clear();
  lastAuthCheck = 0;
  pageLoadStatus.clear();
  userCache.user = null;
  userCache.session = null;
  userCache.lastUpdated = 0;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, session, status } = useAuth();
  const { setPageTransitioning } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const [isReady, setIsReady] = useState(isGloballyAuthenticated || authenticatedPaths.has(location.pathname));

  // Use a ref to track if this is the first render
  const isFirstRender = useRef(true);
  const previousPath = useRef<string | null>(null);
  const initialRender = useRef(true);
  const authCheckThrottleRef = useRef<NodeJS.Timeout | null>(null);

  // Check if we're just navigating between protected routes
  const isInternalNavigation = useMemo(() => {
    return previousPath.current &&
           authenticatedPaths.has(previousPath.current) &&
           previousPath.current !== location.pathname;
  }, [location.pathname]);

  // Determine if we need to recheck authentication
  const shouldSkipAuthCheck = useMemo(() => {
    const now = Date.now();
    // Skip auth check if we recently checked and we're navigating between authenticated paths
    return isGloballyAuthenticated &&
           now - lastAuthCheck < AUTH_CHECK_THRESHOLD &&
           authenticatedPaths.size > 0;
  }, []);

  // Handle sign-out detection
  useEffect(() => {
    // If user was previously authenticated but now isn't, they've signed out
    if (status === 'UNAUTHENTICATED' && isGloballyAuthenticated) {
      // Reset authentication state
      resetAuthState();

      // Redirect to sign-in page
      navigate('/signin', { replace: true });
    }
  }, [status, navigate]);

  // Track user authentication state for performance optimization
  const checkAuthentication = useCallback(() => {
    const now = Date.now();
    const hasRecentAuth = now - lastAuthCheck < AUTH_CHECK_THRESHOLD;

    // Check if we're unauthenticated but thought we were authenticated
    if (isGloballyAuthenticated && (!user || !session)) {
      isGloballyAuthenticated = false;
      return false;
    }

    // If authenticated and recently checked, use cached result
    if (isGloballyAuthenticated && hasRecentAuth) {
      return true;
    }

    // Update user cache for faster access
    if (user && session && user !== userCache.user) {
      userCache.user = user;
      userCache.session = session;
      userCache.lastUpdated = now;
    }

    // Otherwise check the actual session and user
    const isAuthenticated = !!user && !!session;

    if (isAuthenticated) {
      // Update our global authentication tracking
      isGloballyAuthenticated = true;
      lastAuthCheck = now;

      // Pre-authenticate common paths to reduce flashing
      if (location.pathname === '/app') {
        ['/', '/app', '/insights', '/planning', '/activity'].forEach(path => {
          authenticatedPaths.add(path);
        });
      }
    }

    return isAuthenticated;
  }, [user, session, location.pathname]);

  // Update path tracking on each navigation
  useEffect(() => {
    if (previousPath.current !== location.pathname) {
      setPageTransitioning(true);
      previousPath.current = location.pathname;

      // Clear any pending auth checks when navigating
      if (authCheckThrottleRef.current) {
        clearTimeout(authCheckThrottleRef.current);
      }
    }

    // Return early if we're already authenticated for this path
    if (authenticatedPaths.has(location.pathname)) {
      setIsReady(true);
      setPageTransitioning(false);
    }
  }, [location.pathname, setPageTransitioning]);

  // Main authentication effect with throttling
  useEffect(() => {
    // Skip immediate auth check if we're navigating between known authenticated paths
    if (isInternalNavigation || shouldSkipAuthCheck) {
      setIsReady(true);
      setPageTransitioning(false);
      return;
    }

    // If we're on the signin page, don't redirect
    if (location.pathname === '/signin' || location.pathname === '/signup') {
      return;
    }

    // Throttle auth checks to prevent excessive re-renders
    if (authCheckThrottleRef.current) {
      clearTimeout(authCheckThrottleRef.current);
    }

    authCheckThrottleRef.current = setTimeout(() => {
      const isAuthenticated = checkAuthentication();

      // Only run this check when loading is complete
      if (!loading) {
        if (isAuthenticated) {
          // We have a valid session, update the flag
          localStorage.setItem('had_session', 'true');

          // Add this path to authenticated paths set
          authenticatedPaths.add(location.pathname);

          // Mark page as ready to render content
          setIsReady(true);
          setPageTransitioning(false);
          pageLoadStatus.set(location.pathname, true);

          // Show welcome toast only once per browser session (persists across page reloads)
          if (!hasShownWelcomeToast() && initialRender.current) {
            const fullName = user?.user_metadata?.full_name || 'there';
            toast.success(
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${colors.status.success} 0%, ${withOpacity(colors.status.success, 0.8)} 100%)`,
                    boxShadow: `0 2px 8px ${withOpacity(colors.status.success, 0.2)}`
                  }}
                >
                  <FiCheckCircle size={14} style={{ color: colors.text.inverse }} strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: colors.text.primary }}>
                    Welcome back, {fullName}!
                  </div>
                </div>
              </div>,
              {
                icon: false,
                style: {
                  backgroundColor: colors.background.secondary,
                  border: `1px solid ${colors.border.light}`,
                  boxShadow: `0 8px 24px ${withOpacity(colors.primary.dark, 0.15)}`,
                  padding: '10px 14px',
                  borderRadius: '12px',
                  minHeight: '48px'
                },
                progressStyle: {
                  background: `linear-gradient(90deg, ${colors.status.success} 0%, ${withOpacity(colors.status.success, 0.7)} 100%)`
                }
              }
            );
            setWelcomeToastShown();
            initialRender.current = false;
          }
        } else if (isFirstRender.current && !isInternalNavigation) {
          // Only redirect on first render if not authenticated and not just navigating between routes
          // Check if we previously had a session (indicating it expired)
          const hadSession = localStorage.getItem('had_session') === 'true';

          if (hadSession) {
            // Clear the flag
            localStorage.removeItem('had_session');
            // Redirect with expiry message
            navigate('/signin?error=session-expired', { replace: true });
          } else {
            // Standard login redirect
            navigate('/signin', {
              replace: true,
              state: { from: `${location.pathname}${location.search}${location.hash}` }
            });
          }
        }

        // No longer first render
        isFirstRender.current = false;
      }
    }, 10); // Small delay to batch auth checks

    return () => {
      if (authCheckThrottleRef.current) {
        clearTimeout(authCheckThrottleRef.current);
      }
    };
  }, [
    user,
    loading,
    navigate,
    location.pathname,
    location.search,
    location.hash,
    session,
    isInternalNavigation,
    shouldSkipAuthCheck,
    checkAuthentication,
    setPageTransitioning
  ]);

  // Immediately render for internal navigation or already authenticated paths
  if (
    user &&
    session &&
    status === 'AUTHENTICATED' &&
    (isInternalNavigation || (isGloballyAuthenticated && authenticatedPaths.has(location.pathname)))
  ) {
    // Still need to update our tracking to make sure the path is registered
    if (!authenticatedPaths.has(location.pathname)) {
      authenticatedPaths.add(location.pathname);
    }
    return <>{children}</>;
  }

  // Show loading spinner during authentication check
  if (loading || (!isReady && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Render child components when authenticated
  return user && session ? <>{children}</> : null;
};

// Memoize the component to prevent unnecessary re-renders
export default memo(ProtectedRoute);
