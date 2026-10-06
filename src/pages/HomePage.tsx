// src/pages/HomePage.tsx

import React, { useEffect, useState, useMemo, useCallback, useRef, lazy, Suspense, startTransition, useDeferredValue } from 'react';
import { FileText, Wallet, ArrowUpCircle, ArrowDownCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { CashFlowData } from '../types';
import { generateCashFlowData } from '../utils/financialCalculations';
import { calculateMonthlyTrends } from '../utils/trendCalculations';
import { SubscriptionService } from '../services/subscriptionService';
import { subscriptionPlatforms } from '../config/subscriptionConfig';
import LoadingState from '../components/Common/LoadingState';
import EmptyState from '../components/Common/EmptyState';
import StatCard from '../components/Shared/Card/StatCard';
import { formatCurrency, formatDate } from '../utils/formatters';
import { resolvePageDataState } from '../utils/pageDataState';
import { useLoading } from '../context/LoadingContext';
import { useStatementContext } from '../context/StatementContext';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useUserMetrics } from '../context/UserMetricsContext';
import { useAppContext } from '../context/AppContext';
import { secureStorage } from '../utils/secureStorage';
import { secureLogger } from '../utils/secureLogger';
import ComingSoonPage from './ComingSoonPage';

// Lazy load heavy components with preloading
const EnhancedCashFlow = lazy(() => {
  // Start preloading the component
  const preload = import('../components/Overview/EnhancedCashFlow');
  return preload;
});

const TransactionsTable = lazy(() => {
  // Start preloading the component
  const preload = import('../components/Overview/TransactionsTable');
  return preload;
});

const SubscriptionCalendar = lazy(() => {
  // Start preloading the component
  const preload = import('../components/Overview/SubscriptionCalendar');
  return preload;
});

const FinancialMetricsGrid = lazy(() => {
  // Start preloading the component
  const preload = import('../components/Overview/FinancialMetricsGrid');
  return preload;
});

// Define types for preloaded data
interface FinancialMetricsData {
  healthScore: number;
  dtiScore: number;
  savingsScore: number;
  cashFlowScore: number;
}

interface PreloadedDataType {
  cashFlowData: CashFlowData[] | null;
  financialMetrics: FinancialMetricsData | null;
  subscriptions: any[] | null;
  trends: any | null;
}

// Create a singleton for preloaded data to avoid redundant calculations
const preloadedData: PreloadedDataType = {
  cashFlowData: null,
  financialMetrics: null,
  subscriptions: null,
  trends: null,
};

// Global cache for expensive calculations with TTL
const calculationCache = new Map<string, {
  data: any;
  timestamp: number;
}>();

// Cache TTL in milliseconds (10 minutes)
const CACHE_TTL = 10 * 60 * 1000;


// Component to render with loading fallback using React 18's startTransition for non-blocking renders
const LazyComponent: React.FC<{
  component: React.ReactNode;
  priority?: number; // Kept for backwards compatibility but not used
}> = React.memo(({ component }) => {
  return (
    <Suspense fallback={
      <div className="w-full h-48 bg-[#F1F3F4]/30 rounded-xl">
        <div className="h-full w-full animate-pulse bg-gradient-to-r from-transparent via-[#4285F4]/5 to-transparent" />
      </div>
    }>
      {component}
    </Suspense>
  );
});

// Helper function to get data from cache or calculate
const getOrCalculate = <T,>(
  cacheKey: string,
  calculator: () => T,
  options: { forceRecalculate?: boolean } = {}
): T => {
  const now = Date.now();
  const cached = calculationCache.get(cacheKey);

  // Use cache if available and not expired
  if (cached && !options.forceRecalculate && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data as T;
  }

  // Calculate new value
  const result = calculator();

  // Store in cache
  calculationCache.set(cacheKey, {
    data: result,
    timestamp: now
  });

  return result;
};

const HomePage: React.FC = () => {
  const location = useLocation();
  const { currentBankAccount } = useAppContext();
  const { user, session } = useAuth();
  const { isProcessing, isPersistentLoading, startPreload: _startPreload, stopPreload: _stopPreload, markPageLoaded } = useLoading();
  const { loading, error } = useUser();
  const { state: userMetricsState, fetchMetrics } = useUserMetrics();
  const { setTransactions: _setTransactions, setMetrics: _setMetrics } = useStatementContext();

  const didInitialLoad = useRef(false);
  const initialRenderTime = useRef(Date.now());
  const subscriptionSectionRef = useRef<HTMLDivElement>(null);
  const transactionSectionRef = useRef<HTMLDivElement>(null);
  const [highlightSubscriptions, setHighlightSubscriptions] = useState(false);
  const [highlightTransactions, setHighlightTransactions] = useState(false);

  const notificationTarget = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      section: params.get('section'),
      transactionId: params.get('transaction_id'),
      subscriptionId: params.get('subscription_id'),
    };
  }, [location.search]);

  const {
    transactions,
    allTransactions,
    filteredTransactions,
    selectedBank,
    metrics,
    aggregatedMetrics,
    viewMode,
    filters,
    statements,
    loadTransactions: _loadTransactions,
    isLoading: isContextLoading,
    isUploading
  } = useStatementContext();

  // Use filtered transactions when a bank is selected, otherwise use view mode logic
  const currentTransactions = selectedBank
    ? filteredTransactions
    : (viewMode === 'aggregated' ? allTransactions : transactions);

  // Calculate metrics from filtered transactions when bank is selected
  // Optimized with single-pass calculation to prevent blocking during navigation
  const currentMetrics = useMemo(() => {
    if (selectedBank && filteredTransactions.length > 0) {
      // Single-pass calculation for better performance
      let totalIncome = 0;
      let totalExpenses = 0;

      for (const t of filteredTransactions) {
        const amount = Math.abs(t.transaction_amount);
        if (t.transaction_type === 'credit') {
          totalIncome += amount;
        } else if (t.transaction_type === 'debit') {
          totalExpenses += amount;
        }
      }

      return {
        total_transactions: filteredTransactions.length,
        balance: filteredTransactions[0]?.balance || 0,
        total_income: totalIncome,
        total_expenses: totalExpenses
      };
    }
    // Use context metrics when no bank filter
    return viewMode === 'aggregated' ? aggregatedMetrics : metrics;
  }, [selectedBank, filteredTransactions, viewMode, aggregatedMetrics, metrics]);

  // Track if we're in a filter transition for smooth loading states
  const isFilterLoading = userMetricsState.isLoading;


  const [_cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);

  useEffect(() => {
    if (notificationTarget.section === 'subscriptions') {
      subscriptionSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightSubscriptions(true);
      const timeout = window.setTimeout(() => setHighlightSubscriptions(false), 2500);
      return () => window.clearTimeout(timeout);
    }
    if (notificationTarget.section === 'transactions') {
      transactionSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightTransactions(true);
      const timeout = window.setTimeout(() => setHighlightTransactions(false), 2500);
      return () => window.clearTimeout(timeout);
    }
  }, [notificationTarget]);

  // Get financial metrics from backend
  const backendMetrics = userMetricsState.metrics;
  const financialMetricsBase: FinancialMetricsData = useMemo(() => {
    if (backendMetrics) {
      return {
        healthScore: backendMetrics.financial_score || 0,
        dtiScore: 70, // Backend doesn't calculate DTI yet, use default
        savingsScore: (backendMetrics.savings_rate || 0) * 100,
        cashFlowScore: backendMetrics.financial_score || 0
      };
    }
    return {
      healthScore: 0,
      dtiScore: 0,
      savingsScore: 0,
      cashFlowScore: 0
    };
  }, [backendMetrics]);

  // Defer financial metrics to prevent blocking navigation
  const financialMetrics = useDeferredValue(financialMetricsBase);

  // Calculate a cache key based on current transactions
  const getTransactionCacheKey = useCallback(() => {
    if (!currentTransactions.length) return '';
    // Use first and last transaction dates plus count as cache key
    const first = currentTransactions[0].transaction_date;
    const last = currentTransactions[currentTransactions.length - 1].transaction_date;
    return `${first}-${last}-${currentTransactions.length}`;
  }, [currentTransactions]);

  // Fetch backend metrics when component loads (with bank filter if selected)
  useEffect(() => {
    if (user && !userMetricsState.metrics && !userMetricsState.isLoading) {
      fetchMetrics(false, selectedBank);
    }
  }, [user, userMetricsState.metrics, userMetricsState.isLoading, fetchMetrics, selectedBank]);

  // Show everything immediately - data loading is handled by StatementContext and components

  // Save data when it changes
  useEffect(() => {
    if (currentTransactions.length > 0 && currentMetrics) {
      // Use debounce to avoid excessive writes
      const saveTimer = setTimeout(() => {
        secureStorage.setTransactions(currentTransactions);
        secureStorage.setMetrics(currentMetrics);
      }, 1000);

      return () => clearTimeout(saveTimer);
    }
  }, [currentTransactions, currentMetrics]);

  // Clear data on logout
  useEffect(() => {
    if (!user || !session) {
      secureStorage.clearFinancialData();
      // Reset preloaded data
      preloadedData.cashFlowData = null;
      preloadedData.financialMetrics = null;
      preloadedData.subscriptions = null;
      preloadedData.trends = null;

      // Clear calculation cache
      calculationCache.clear();
    }
  }, [user, session]);

  // Calculate statement period from current filters, bank selection, or all statements
  const statementPeriod = useMemo(() => {
    // If a specific statement is selected, show only that statement's period
    if (filters.statementId && statements.length) {
      const statement = statements.find(s => s.statement_id === filters.statementId);
      if (statement) {
        return `${formatDate(statement.start_date)} - ${formatDate(statement.end_date)}`;
      }
    }

    // When a bank is selected, calculate period from filtered transactions
    if (selectedBank && filteredTransactions.length > 0) {
      const dates = filteredTransactions.map(t => new Date(t.transaction_date));
      const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
      return `${formatDate(startDate.toISOString())} - ${formatDate(endDate.toISOString())}`;
    }

    // Show min/max dates across ALL statements (aggregated view)
    if (statements.length > 0) {
      const allStartDates = statements.map(s => new Date(s.start_date).getTime());
      const allEndDates = statements.map(s => new Date(s.end_date).getTime());

      const minDate = new Date(Math.min(...allStartDates));
      const maxDate = new Date(Math.max(...allEndDates));

      return `${formatDate(minDate.toISOString())} - ${formatDate(maxDate.toISOString())}`;
    }

    // Fallback to transaction dates if no statements available
    if (currentTransactions.length > 0) {
      const dates = currentTransactions.map(t => new Date(t.transaction_date));
      const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
      return `${formatDate(startDate.toISOString())} - ${formatDate(endDate.toISOString())}`;
    }

    return 'No statements';
  }, [filters.statementId, statements, currentTransactions, selectedBank, filteredTransactions]);

  // Get subscriptions from backend metrics (single source of truth)
  // Map to frontend format with icons and display info
  const subscriptions = useMemo(() => {
    if (!backendMetrics?.subscriptions) return [];

    // Map backend subscriptions to frontend format
    return backendMetrics.subscriptions
      .filter(sub =>
        sub.is_active &&           // Backend active flag
        !sub.soft_deleted_at        // Not soft deleted
        // Note: Paused subscriptions are shown but visually differentiated
      )
      .map(sub => {
        // Get subscription info from config for icons/colors
        const subscriptionInfo = subscriptionPlatforms.find(platform =>
          platform.keywords.some(keyword => sub.name.toLowerCase().includes(keyword))
        );

        return {
          id: sub.id || `${sub.name}-${sub.amount}`,
          name: sub.user_display_name || sub.name,  // Prioritize custom name
          amount: sub.amount,
          dueDate: new Date(sub.first_detected).getDate(), // Use first detected date as due date
          icon: subscriptionInfo?.icon || 'Other',
          category: sub.category || subscriptionInfo?.category || 'Other',
          startDate: new Date(sub.first_detected),
          firstPaymentDate: new Date(sub.first_detected),
          totalSpent: sub.amount * (sub.transaction_count || 1),
          frequency: sub.frequency,
          isActive: sub.is_active,
          confidence: sub.confidence_score,
          // Management fields
          isPaused: sub.is_paused,
          pausedAt: sub.paused_at,
          resumeDate: sub.resume_date,
          userDisplayName: sub.user_display_name,
          lastSyncedMerchantName: sub.last_synced_merchant_name,
          canManage: true
        };
      });
  }, [backendMetrics?.subscriptions]);

  const monthlySpend = useMemo(() => {
    return SubscriptionService.getMonthlySpend(subscriptions);
  }, [subscriptions]);

  const subscriptionStats = useMemo(() => {
    return SubscriptionService.getSubscriptionStats(subscriptions);
  }, [subscriptions]);

  // Generate cash flow data for chart visualization (non-blocking with startTransition)
  useEffect(() => {
    if (currentTransactions.length > 0) {
      // Use startTransition for non-urgent updates to prevent blocking the UI
      startTransition(() => {
        const calculatedCashFlowData = generateCashFlowData(currentTransactions);
        setCashFlowData(calculatedCashFlowData);
      });
    }
  }, [currentTransactions]);

  // Calculate trends with optimized performance
  const trends = useMemo(() => {
    if (!currentTransactions.length) return null;

    // Use preloaded data if available
    if (preloadedData.trends) {
      return preloadedData.trends;
    }

    // Check calculation cache
    const cacheKey = `trends-${getTransactionCacheKey()}`;

    const calculatedTrends = getOrCalculate(
      cacheKey,
      () => calculateMonthlyTrends(currentTransactions)
    );

    // Store for future use
    preloadedData.trends = calculatedTrends;
    return calculatedTrends;
  }, [currentTransactions, getTransactionCacheKey]);

  // Smart loading state logic: check if we have data to show right now
  const hasDataToShow = currentTransactions.length > 0;
  const pageDataState = resolvePageDataState(
    hasDataToShow,
    isPersistentLoading
      || isProcessing
      || isContextLoading
      || isUploading
      || loading
  );

  // Three states, crystal clear:
  // 1. Show loading spinner ONLY when: no data exists AND something is loading
  const shouldShowLoadingSpinner = pageDataState === 'loading';

  // 2. Show empty state ONLY when: no data exists AND nothing is loading
  const shouldShowEmptyState = pageDataState === 'empty';

  // 3. Show content with background indicator when: have data AND something is updating
  const isBackgroundRefresh = hasDataToShow && (isProcessing || isContextLoading || userMetricsState.isLoading);

  // Measure and log performance metrics
  useEffect(() => {
    if (currentTransactions.length > 0) {
      const loadTime = Date.now() - initialRenderTime.current;
      secureLogger.info('HomePage', `Page rendered with data in ${loadTime}ms`);

      // Report to analytics if needed
      // analyticsService.reportPagePerformance('HomePage', loadTime);
    }
  }, [currentTransactions.length]);

  // Mark as loaded after first successful data fetch
  useEffect(() => {
    if (currentTransactions.length > 0 && !didInitialLoad.current) {
      didInitialLoad.current = true;
      markPageLoaded('/app');
      secureLogger.debug('HomePage', 'Initial data loaded, marking as ready');
    }
  }, [currentTransactions.length, markPageLoaded]);

  // Show Coming Soon page if Bank Account is selected
  if (currentBankAccount === 'Bank Account') {
    return <ComingSoonPage />;
  }

  // Three clear loading states:

  // STATE 1: Loading spinner - only when no data exists AND loading
  // This ensures instant navigation when data exists, even if refreshing
  if (shouldShowLoadingSpinner) {
    return <LoadingState variant="process" />;
  }

  // STATE 2: Empty state - ONLY when no data exists AND not loading
  if (shouldShowEmptyState) {
    return (
      <EmptyState
        sectionLabel="Overview"
        title="No Data Yet"
        icon={<Wallet className="h-5 w-5" />}
        description={(
          <>
            Upload your first statement from <strong className="font-semibold text-[color:var(--text-primary)]">New Statement</strong> to unlock balances, spending flow, and recurring payment tracking.
          </>
        )}
      />
    );
  }

  // Error handling - but never block if we have data to show
  if (error && !hasDataToShow) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="w-full max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
            Overview
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[color:var(--text-primary)]">
            Unable to load data
          </h2>
          <p className="mt-3 text-sm text-[color:var(--text-secondary)]">{error}</p>
        </div>
      </div>
    );
  }

  // STATE 3: If we reach here, we have data → Show content IMMEDIATELY
  // Background refreshes won't block the UI, they'll show a subtle indicator

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen bg-gradient-to-br from-[color:var(--bg-secondary)] to-[color:var(--bg-primary)] p-4 lg:p-6 space-y-6"
    >
      {/* Background refresh indicator - subtle, non-blocking */}
      {isBackgroundRefresh && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-20 right-6 z-50 px-4 py-2 rounded-full backdrop-blur-lg shadow-lg flex items-center gap-2"
          style={{
            backgroundColor: 'rgba(66, 133, 244, 0.1)',
            border: '1px solid rgba(66, 133, 244, 0.2)'
          }}
        >
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#4285F4' }} />
          <span className="text-xs font-medium" style={{ color: '#174EA6' }}>Updating…</span>
        </motion.div>
      )}

      {currentTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6"
        >
          {/* Metrics Grid - Always render immediately */}
          {currentMetrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard
                title="Total Transactions"
                value={currentMetrics.total_transactions.toString()}
                icon={<FileText className="w-4 h-4" />}
                trend={trends?.transactionCount.percentageChange}
                isLoading={isFilterLoading}
              />
              <StatCard
                title="Current Balance"
                value={formatCurrency(currentMetrics.balance)}
                color={currentMetrics.balance >= 0 ? 'green' : 'red'}
                icon={<Wallet className="w-4 h-4" />}
                trend={trends?.balance.percentageChange}
                isLoading={isFilterLoading}
              />
              <StatCard
                title="Total Income"
                value={formatCurrency(currentMetrics.total_income)}
                color="green"
                icon={<ArrowUpCircle className="w-4 h-4" />}
                trend={trends?.income.percentageChange}
                isLoading={isFilterLoading}
              />
              <StatCard
                title="Total Expenses"
                value={formatCurrency(currentMetrics.total_expenses)}
                color="red"
                icon={<ArrowDownCircle className="w-4 h-4" />}
                trend={trends?.expenses.percentageChange}
                isLoading={isFilterLoading}
              />
              <StatCard
                title="Statement Period"
                value={statementPeriod}
                icon={<Calendar className="w-4 h-4" />}
                className="overflow-hidden"
                isLoading={isFilterLoading}
              />
            </div>
          )}

          {/* Financial Health Section - Render immediately */}
          <LazyComponent
            component={<FinancialMetricsGrid metrics={financialMetrics} isLoading={isFilterLoading} />}
            priority={0}
          />

          {/* Main Content Grid - Render immediately with lazy loading */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <LazyComponent
              component={
                <motion.div
                  ref={subscriptionSectionRef}
                  className={`bg-[color:var(--bg-primary)] rounded-xl border border-[color:var(--border-color)] shadow-lg overflow-hidden h-[496px] ${
                    highlightSubscriptions ? 'ring-2 ring-[#4285F4]/70 ring-offset-2 ring-offset-[color:var(--bg-primary)]' : ''
                  }`}
                  whileHover={{ scale: 1.005 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <SubscriptionCalendar
                    subscriptions={subscriptions}
                    monthlySpend={monthlySpend}
                    subscriptionStats={subscriptionStats}
                    onRefresh={fetchMetrics}
                    focusSubscriptionId={notificationTarget.subscriptionId}
                  />
                </motion.div>
              }
              priority={0}
            />

            <LazyComponent
              component={
                <motion.div
                  ref={transactionSectionRef}
                  className={`bg-[color:var(--bg-primary)] rounded-xl border border-[color:var(--border-color)] shadow-lg overflow-hidden h-[496px] ${
                    highlightTransactions ? 'ring-2 ring-[#4285F4]/70 ring-offset-2 ring-offset-[color:var(--bg-primary)]' : ''
                  }`}
                  whileHover={{ scale: 1.005 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <TransactionsTable
                    transactions={currentTransactions}
                    focusTransactionId={notificationTarget.transactionId}
                  />
                </motion.div>
              }
              priority={0}
            />
          </div>

          {/* Cash Flow Calendar - Render immediately */}
          <LazyComponent
            component={
              <motion.div
                className="col-span-full"
                whileHover={{ scale: 1.002 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <EnhancedCashFlow
                  transactions={currentTransactions}
                  backendMetrics={backendMetrics ? {
                    total_savings: backendMetrics.total_savings || 0,
                    total_income: backendMetrics.total_income || 0,
                    total_expenses: backendMetrics.total_expenses || 0,
                    avg_daily_spending: backendMetrics.avg_daily_spending || 0
                  } : undefined}
                />
              </motion.div>
            }
            priority={0}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

// Add display name for debugging
HomePage.displayName = 'HomePage';

// Use React.memo to prevent unnecessary re-renders
export default React.memo(HomePage);
