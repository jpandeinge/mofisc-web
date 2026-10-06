// src/App.tsx

import './styles/animations.css';
import { Route, BrowserRouter as Router, Routes, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/toast.css';
import { lazy, Suspense, useEffect, useState, memo } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { colors, withOpacity } from './styles/colors';

// Initialize Sentry
import { initSentry } from './lib/sentry';

// Layout and Core Components
import Layout from './components/Layout/Layout';
import { PageWrapper } from './components/Layout/PageWrapper';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoadingSpinner from './components/Shared/LoadingSpinner';

// Context Providers
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { StatementProvider } from './context/StatementContext';
import { LoadingProvider } from './context/LoadingContext';
import { ThemeProvider } from './context/ThemeContext';
import { GoalsProvider } from './context/GoalsContext';
import { BudgetProvider } from './context/BudgetContext';
import { GamificationProvider } from './context/GamificationContext';
import { UserProvider } from './context/UserContext';
import { LoanProvider } from './context/LoanContext';
import { UserMetricsProvider } from './context/UserMetricsContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { SessionProvider } from './context/SessionContext';
import { MFAProvider } from './context/MFAContext';
import { DeviceTrustProvider } from './context/DeviceTrustContext';
import { ReauthProvider } from './context/ReauthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ReauthModal } from './components/Security/ReauthModal';
import { RateLimitBanner } from './components/Security/RateLimitBanner';

// Preload critical pages to improve navigation performance
const preloadPages = () => {
  // Preload the most commonly accessed pages
  const preloadPromises = [
    import('./pages/HomePage'),
    import('./pages/InsightsPage'),
    import('./components/Overview/EnhancedCashFlow'),
    import('./components/Overview/TransactionsTable'),
    import('./components/Overview/SubscriptionCalendar'),
    import('./components/Overview/FinancialMetricsGrid')
  ];

  // Don't wait for these to complete - let them load in the background
  Promise.allSettled(preloadPromises).catch(() => {
    // Silently handle preload errors - not critical for app functionality
  });
};

// Preload additional pages based on user behavior
const preloadSecondaryPages = () => {
  // These are loaded with lower priority after the app is interactive
  setTimeout(() => {
    import('./pages/PlanningPage');
    import('./pages/ActivityPage');
  }, 2000);
};

// Lazy load pages with retry logic for better error handling
const withRetry = (importer: () => Promise<any>, retries = 2) => {
  return new Promise<any>((resolve, reject) => {
    importer()
      .then(resolve)
      .catch((error) => {
        if (retries === 0) return reject(error);
        setTimeout(() => {
          withRetry(importer, retries - 1).then(resolve, reject);
        }, 500);
      });
  });
};

// Lazy load pages for better performance
const HomePage = lazy(() => withRetry(() => import('./pages/HomePage')));
const InsightsPage = lazy(() => withRetry(() => import('./pages/InsightsPage')));
const PlanningPage = lazy(() => withRetry(() => import('./pages/PlanningPage')));
const ActivityPage = lazy(() => withRetry(() => import('./pages/ActivityPage')));
const SettingsPage = lazy(() => withRetry(() => import('./pages/SettingsPage')));
const UserProfile = lazy(() => withRetry(() => import('./components/Profile/UserProfile')));
// Keep the notification inbox lazy-loaded with the other protected pages.
const NotificationsPage = lazy(() => withRetry(() => import('./pages/NotificationInboxPage')));

// Auth and public pages
const SignInPage = lazy(() => withRetry(() => import('./pages/SignInPage')));
const SignUpPage = lazy(() => withRetry(() => import('./pages/SignUpPage')));
const ForgotPasswordPage = lazy(() => withRetry(() => import('./pages/ForgotPasswordPage')));
const VerifyEmailPage = lazy(() => withRetry(() => import('./pages/VerifyEmailPage')));
const AuthCallbackPage = lazy(() => withRetry(() => import('./pages/AuthCallbackPage')));

// Static pages
const LandingPage = lazy(() => withRetry(() => import('./pages/LandingPage')));
const AboutPage = lazy(() => withRetry(() => import('./pages/AboutPage')));
const PricingPage = lazy(() => withRetry(() => import('./pages/PricingPage')));
const PaymentSuccessPage = lazy(() => withRetry(() => import('./pages/PaymentSuccessPage')));
const TermsOfService = lazy(() => withRetry(() => import('./pages/TermsOfService')));
const DataPolicy = lazy(() => withRetry(() => import('./pages/DataPolicy')));
const CookiePolicy = lazy(() => withRetry(() => import('./pages/CookiePolicy')));
const ApiReferencePage = lazy(() => withRetry(() => import('./pages/ApiReferencePage')));

// Track loaded routes to avoid showing loading spinners for already loaded routes
const loadedRoutes = new Set<string>();

// Custom Suspense component to handle loading and errors gracefully
const PageSuspense = memo(({ children, path }: { children: React.ReactNode; path?: string }) => {
  const [isLoaded, setIsLoaded] = useState(path ? loadedRoutes.has(path) : false);

  useEffect(() => {
    if (path) {
      return () => {
        // Mark this route as loaded when the component unmounts successfully
        loadedRoutes.add(path);
        setIsLoaded(true);
      };
    }
  }, [path]);

  // We can't actually catch errors in the Suspense boundary directly with hooks
  // Instead, we'll use the standard Suspense with a fallback
  return (
    <Suspense
      fallback={
        isLoaded ? (
          <div className="min-h-screen flex items-center justify-center opacity-60">
            <LoadingSpinner size="small" />
          </div>
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )
      }
    >
      {children}
    </Suspense>
  );
});

PageSuspense.displayName = 'PageSuspense';

const ScrollToLocation = memo(() => {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (hash) {
        document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
        return;
      }

      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash, key]);

  return null;
});

ScrollToLocation.displayName = 'ScrollToLocation';

// Create a component for protected routes with layout
const ProtectedLayout = memo(({ children, path }: { children: React.ReactNode; path: string }) => (
  <ProtectedRoute>
    <Layout>
      <PageWrapper>
        <PageSuspense path={path}>
          {children}
        </PageSuspense>
      </PageWrapper>
    </Layout>
  </ProtectedRoute>
));

ProtectedLayout.displayName = 'ProtectedLayout';

const AppRoutes = memo(() => {
  const location = useLocation();

  // Preload critical pages when the app initializes
  useEffect(() => {
    // Start preloading immediately
    preloadPages();

    // Preload secondary pages after a delay
    const secondaryTimer = setTimeout(() => {
      preloadSecondaryPages();
    }, 3000);

    return () => clearTimeout(secondaryTimer);
  }, []);

  // Preload pages based on user navigation patterns
  useEffect(() => {
    // Predictive preloading based on current route
    if (location.pathname === '/app') {
      // If user is on homepage, they're likely to visit insights next
      import('./pages/InsightsPage').catch(() => {});
    } else if (location.pathname === '/insights') {
      // If on insights, they might go to planning
      import('./pages/PlanningPage').catch(() => {});
    }
  }, [location.pathname]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/signup" element={<PageSuspense path="/signup"><SignUpPage /></PageSuspense>} />
      <Route path="/signin" element={<PageSuspense path="/signin"><SignInPage /></PageSuspense>} />
      <Route path="/forgot-password" element={<PageSuspense path="/forgot-password"><ForgotPasswordPage /></PageSuspense>} />
      <Route path="/verify-email" element={<PageSuspense path="/verify-email"><VerifyEmailPage /></PageSuspense>} />
      <Route path="/auth/callback" element={<PageSuspense path="/auth/callback"><AuthCallbackPage /></PageSuspense>} />
      <Route path="/terms" element={<PageSuspense path="/terms"><TermsOfService /></PageSuspense>} />
      <Route path="/data-policy" element={<PageSuspense path="/data-policy"><DataPolicy /></PageSuspense>} />
      <Route path="/cookie-policy" element={<PageSuspense path="/cookie-policy"><CookiePolicy /></PageSuspense>} />
      <Route path="/about" element={<PageSuspense path="/about"><AboutPage /></PageSuspense>} />
      <Route path="/pricing" element={<PageSuspense path="/pricing"><PricingPage /></PageSuspense>} />
      <Route path="/api-reference" element={<PageSuspense path="/api-reference"><ApiReferencePage /></PageSuspense>} />
      <Route path="/payment/success" element={<PageSuspense path="/payment/success"><PaymentSuccessPage /></PageSuspense>} />

      {/* Landing Page - Root route */}
      <Route
        path="/"
        element={<PageSuspense path="/"><LandingPage /></PageSuspense>}
      />

      {/* Protected Routes with Layout */}
      <Route
        path="/app"
        element={<ProtectedLayout path="/app"><HomePage /></ProtectedLayout>}
      />

      <Route
        path="/insights"
        element={<ProtectedLayout path="/insights"><InsightsPage /></ProtectedLayout>}
      />

      <Route
        path="/planning"
        element={<ProtectedLayout path="/planning"><PlanningPage /></ProtectedLayout>}
      />

      <Route
        path="/activity"
        element={<ProtectedLayout path="/activity"><ActivityPage /></ProtectedLayout>}
      />

      <Route
        path="/profile"
        element={<ProtectedLayout path="/profile"><UserProfile /></ProtectedLayout>}
      />

      <Route
        path="/notifications"
        element={<ProtectedLayout path="/notifications"><NotificationsPage /></ProtectedLayout>}
      />

      <Route
        path="/settings/*"
        element={<ProtectedLayout path="/settings"><SettingsPage /></ProtectedLayout>}
      />

      {/* Catch all route - redirects to home */}
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
});

AppRoutes.displayName = 'AppRoutes';

const App: React.FC = () => {
  // Initialize Sentry and preload critical assets on initial load
  useEffect(() => {
    // Initialize Sentry first
    initSentry();

    // Start preloading immediately
    preloadPages();
  }, []);

  return (
    <HelmetProvider>
      <Router>
        <ScrollToLocation />
        <AppProvider>
          <AuthProvider>
            <MFAProvider>
              <SessionProvider>
                <DeviceTrustProvider>
                <ReauthProvider>
                <UserProvider>
                  <NotificationProvider>
                  <SubscriptionProvider>
                    <LoadingProvider>
                      <StatementProvider>
                        <GoalsProvider>
                          <BudgetProvider>
                            <LoanProvider>
                            <ThemeProvider>
                              <GamificationProvider>
                                <UserMetricsProvider>
                        <ToastContainer
                          position="top-right"
                          autoClose={2500}
                          hideProgressBar={false}
                          closeOnClick
                          pauseOnHover={false}
                          draggable={false}
                          theme="light"
                          limit={2}
                          style={{
                            fontSize: '13px',
                            fontWeight: '500',
                            zIndex: 99999,
                          }}
                          toastStyle={{
                            backgroundColor: colors.background.secondary,
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: `1px solid ${colors.border.light}`,
                            borderRadius: '12px',
                            boxShadow: `0 8px 32px ${withOpacity(colors.primary.dark, 0.15)}`,
                            padding: '12px 16px',
                            minHeight: '52px',
                            maxWidth: '380px',
                            color: colors.text.primary,
                          }}
                          progressStyle={{
                            background: `linear-gradient(90deg, ${colors.primary.main} 0%, ${colors.status.success} 100%)`,
                            height: '3px',
                          }}
                        />
                          <RateLimitBanner />
                          <ReauthModal />
                          <AppRoutes />
                                </UserMetricsProvider>
                              </GamificationProvider>
                            </ThemeProvider>
                            </LoanProvider>
                          </BudgetProvider>
                        </GoalsProvider>
                      </StatementProvider>
                    </LoadingProvider>
                  </SubscriptionProvider>
                  </NotificationProvider>
                </UserProvider>
                </ReauthProvider>
                </DeviceTrustProvider>
              </SessionProvider>
            </MFAProvider>
          </AuthProvider>
        </AppProvider>
      </Router>
    </HelmetProvider>
  );
};

export default App;
