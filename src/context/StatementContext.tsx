// src/context/StatementContext.tsx

import { Metrics, Transaction, StatementMetadata, TransactionFilters, BankInfo } from '../types';
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useLoading } from './LoadingContext';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { secureLogger, logTransactionLoad } from '../utils/secureLogger';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

interface StatementContextType {
  // Data
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  allTransactions: Transaction[]; // Add aggregated transactions
  setAllTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  metrics: Metrics | null;
  setMetrics: React.Dispatch<React.SetStateAction<Metrics | null>>;
  aggregatedMetrics: Metrics | null; // Add aggregated metrics
  setAggregatedMetrics: React.Dispatch<React.SetStateAction<Metrics | null>>;
  statements: StatementMetadata[];
  setStatements: React.Dispatch<React.SetStateAction<StatementMetadata[]>>;

  // Bank Filter
  selectedBank: string | null;
  availableBanks: BankInfo[];
  filteredTransactions: Transaction[]; // Transactions filtered by selectedBank
  selectBank: (bankName: string | null) => void;
  fetchAvailableBanks: () => Promise<void>;
  isBanksLoading: boolean;

  // View Mode
  viewMode: 'paginated' | 'aggregated';
  setViewMode: (mode: 'paginated' | 'aggregated') => void;

  // Pagination
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;

  // Filters & Sorting
  filters: TransactionFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';

  // Actions
  loadTransactions: (page?: number) => Promise<void>;
  loadAllTransactions: () => Promise<void>;
  initializeUserData: () => Promise<void>; // New initialization method
  clearCacheAndReload: () => Promise<void>;
  updateFilters: (newFilters: Partial<TransactionFilters>) => void;
  updateSort: (field: string) => void;
  selectStatement: (statementId: string | null) => void;

  // Loading State
  isLoading: boolean;
  isUploading: boolean;
  setIsUploading: (state: boolean) => void;
  error: string | null;
}

const StatementContext = createContext<StatementContextType | undefined>(undefined);

export const StatementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth State
  const { user, session, loading: authLoading } = useAuth();

  // SECURITY: Clear any old localStorage on mount - sensitive data should not persist
  React.useEffect(() => {
    secureLogger.debug('StatementProvider', 'Clearing any old sensitive data from localStorage');
    // Remove old localStorage keys that may contain sensitive data
    localStorage.removeItem('userTransactions');
    localStorage.removeItem('userMetrics');
    localStorage.removeItem('allUserTransactions');
    localStorage.removeItem('aggregatedMetrics');
    localStorage.removeItem('encrypted_transactions');
    localStorage.removeItem('encrypted_metrics');
    localStorage.removeItem('userInitialized');
  }, []);

  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [aggregatedMetrics, setAggregatedMetrics] = useState<Metrics | null>(null);
  const [statements, setStatements] = useState<StatementMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // View Mode State
  const [viewMode, setViewMode] = useState<'paginated' | 'aggregated'>('aggregated');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  // Filter & Sort State
  const [filters, setFilters] = useState<TransactionFilters>({
    statementId: null,
    dateFrom: null,
    dateTo: null,
    category: null,
  });
  const [sortBy, setSortBy] = useState('transaction_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Loading State
  const [isLoading, _setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setIsProcessing, setProcessingVariant } = useLoading();

  // Bank Filter State
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [availableBanks, setAvailableBanks] = useState<BankInfo[]>([]);
  const [isBanksLoading, setIsBanksLoading] = useState(false);

  // Filtered transactions based on selected bank
  const filteredTransactions = useMemo(() => {
    if (!selectedBank) return allTransactions;
    return allTransactions.filter(t => t.bank_name === selectedBank);
  }, [allTransactions, selectedBank]);

  // Fetch available banks from API
  const fetchAvailableBanks = useCallback(async () => {
    setIsBanksLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (session?.data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${session.data.session.access_token}`;
      }

      const response = await fetch(`${API_BASE_URL}/v1/metrics/banks`, {
        headers
      });

      if (!response.ok) throw new Error('Failed to fetch banks');

      const data = await response.json();
      setAvailableBanks(data.banks || []);
      secureLogger.info('StatementContext', 'Available banks loaded', {
        bankCount: data.banks?.length || 0
      });
    } catch (err) {
      secureLogger.error('StatementContext', 'Failed to load available banks', err);
    } finally {
      setIsBanksLoading(false);
    }
  }, []);

  // Select a bank for filtering
  const selectBank = useCallback((bankName: string | null) => {
    setSelectedBank(bankName);
    secureLogger.info('StatementContext', 'Bank filter changed', { bankName });
  }, []);

  const loadTransactions = useCallback(async (page: number = 1) => {
    setIsProcessing(true);
    setProcessingVariant('process');
    setError(null);
    try {
      const limit = 50;
      const skip = (page - 1) * limit;

      // Get authentication token
      const session = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (session?.data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${session.data.session.access_token}`;
      }

      const response = await fetch(`${API_BASE_URL}/v1/transactions/?` + new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(filters.statementId && { statement_id: filters.statementId }),
        ...(filters.dateFrom && { date_from: filters.dateFrom }),
        ...(filters.dateTo && { date_to: filters.dateTo }),
      }), {
        headers
      });

      if (!response.ok) throw new Error('Failed to fetch transactions');

      const data = await response.json();
      setTransactions(data.data.transactions);
      setMetrics(data.data.metrics);

      // SECURITY: No localStorage for sensitive financial data - keep in memory only
      // Data will be re-fetched on page reload for security

      setTotalPages(data.data.metadata.total_pages);
      setHasNextPage(data.data.metadata.has_next);
      setHasPreviousPage(data.data.metadata.has_previous);
      setCurrentPage(page);

      if (!statements.length && data.data.metadata.statements) {
        setStatements(data.data.metadata.statements);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  }, [filters, sortBy, sortOrder, statements.length, setIsProcessing, setProcessingVariant]);

  const loadAllTransactions = useCallback(async () => {
    setIsProcessing(true);
    setProcessingVariant('process');
    setError(null);
    try {
      // Get authentication token
      const session = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Content-Type': 'application/json'
      };

      if (session?.data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${session.data.session.access_token}`;
      }

      const response = await fetch(`${API_BASE_URL}/v1/all-transactions/`, {
        cache: 'no-cache',
        headers
      });

      if (!response.ok) throw new Error('Failed to fetch all transactions');

      const data = await response.json();
      logTransactionLoad('StatementContext', data.data.transactions.length);

      setAllTransactions(data.data.transactions);
      setAggregatedMetrics(data.data.metrics);

      // SECURITY: No localStorage for sensitive financial data - keep in memory only
      // Data will be re-fetched on page reload for security

      // Also update statements if available
      if (data.data.metadata?.statements) {
        setStatements(data.data.metadata.statements);
      }

    } catch (err) {
      secureLogger.error('StatementContext', 'Failed to load all transactions', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  }, [setIsProcessing, setProcessingVariant]);

  // Initialize user data on login/app start
  const initializeUserData = useCallback(async () => {
    setIsProcessing(true);
    setProcessingVariant('process');
    setError(null);
    try {
      secureLogger.info('StatementContext', 'Initializing user data...');

      // Get authentication token
      const session = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Content-Type': 'application/json'
      };

      if (session?.data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${session.data.session.access_token}`;
      }

      secureLogger.debug('StatementContext', 'Making API call to initialize endpoint');
      const response = await fetch(`${API_BASE_URL}/v1/user/initialize/`, {
        cache: 'no-cache',
        headers
      });

      secureLogger.debug('StatementContext', `API response status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to initialize user data: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      secureLogger.info('StatementContext', 'User data initialized', {
        transactionCount: data.data.transactions.length,
        metricsAvailable: !!data.data.metrics,
        statementsCount: data.data.statements?.length || 0
      });

      // Set all the data from initialization
      setAllTransactions(data.data.transactions);
      setAggregatedMetrics(data.data.metrics);
      setStatements(data.data.statements || []);

      // SECURITY: Only store non-sensitive initialization flag
      // Financial data stays in memory only
      sessionStorage.setItem('userInitialized', 'true');

    } catch (err) {
      secureLogger.error('StatementContext', 'Failed to initialize user data', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize user data');
    } finally {
      setIsProcessing(false);
    }
  }, [setIsProcessing, setProcessingVariant]);

  // Add method to manually clear cache and reload
  const clearCacheAndReload = useCallback(async () => {
    secureLogger.info('StatementContext', 'Clearing cache and reloading all data');
    sessionStorage.removeItem('userInitialized');
    setAllTransactions([]);
    setTransactions([]);
    setMetrics(null);
    setAggregatedMetrics(null);
    await initializeUserData();
  }, [initializeUserData]);

  const updateFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const updateSort = useCallback((field: string) => {
    setSortBy(field);
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  const selectStatement = useCallback((statementId: string | null) => {
    updateFilters({ statementId });
    // Switch to paginated view when selecting specific statement
    if (statementId) {
      setViewMode('paginated');
    }
  }, [updateFilters]);

  // Auto-initialize user data on mount when authenticated
  React.useEffect(() => {
    secureLogger.debug('StatementContext', 'useEffect triggered', {
      userExists: !!user,
      sessionExists: !!session,
      authLoading,
      viewMode,
      dataCount: allTransactions.length,
      isInitialized: !!sessionStorage.getItem('userInitialized')
    });

    // Only initialize if user is authenticated and not still loading auth
    if (!user || !session || authLoading) {
      secureLogger.debug('StatementContext', 'Waiting for authentication...');
      return;
    }

    const userInitialized = sessionStorage.getItem('userInitialized');

    // Force fresh initialization if no transactions are loaded
    if (allTransactions.length === 0) {
      if (!userInitialized) {
        secureLogger.info('StatementContext', 'Auto-initializing user data (fresh session)');
        initializeUserData();
      } else {
        secureLogger.info('StatementContext', 'Force re-initializing user data (session initialized but no data)');
        // Clear the initialized flag and reinitialize
        sessionStorage.removeItem('userInitialized');
        initializeUserData();
      }
    } else {
      secureLogger.debug('StatementContext', 'Data already available, no initialization needed');
    }
  }, [user, session, authLoading, viewMode, allTransactions.length, initializeUserData]);

  // Fetch available banks after data is initialized
  React.useEffect(() => {
    if (!user || !session || authLoading) return;

    // Fetch banks when we have transactions
    if (allTransactions.length > 0 && availableBanks.length === 0) {
      secureLogger.debug('StatementContext', 'Fetching available banks');
      fetchAvailableBanks();
    }
  }, [user, session, authLoading, allTransactions.length, availableBanks.length, fetchAvailableBanks]);

  // Load paginated data when switching to paginated view
  React.useEffect(() => {
    if (!user || !session || authLoading) return;

    if (viewMode === 'paginated' && transactions.length === 0) {
      secureLogger.debug('StatementContext', 'Loading paginated data for authenticated user');
      loadTransactions();
    }
  }, [user, session, authLoading, viewMode, transactions.length, loadTransactions]);

  // Clear data when user logs out
  React.useEffect(() => {
    if (!user && !authLoading) {
      secureLogger.info('StatementContext', 'Clearing data for logged out user');
      // Clear all in-memory data
      setAllTransactions([]);
      setTransactions([]);
      setMetrics(null);
      setAggregatedMetrics(null);
      setStatements([]);

      // Clear session storage
      sessionStorage.removeItem('userInitialized');

      // SECURITY: Clear any old localStorage that might contain sensitive data
      localStorage.removeItem('userTransactions');
      localStorage.removeItem('userMetrics');
      localStorage.removeItem('allUserTransactions');
      localStorage.removeItem('aggregatedMetrics');
      localStorage.removeItem('encrypted_transactions');
      localStorage.removeItem('encrypted_metrics');
    }
  }, [user, authLoading]);

  // Real-time transaction updates using Supabase Realtime
  React.useEffect(() => {
    if (!user || !session) return;

    secureLogger.info('StatementContext', 'Setting up real-time transaction subscription');

    // Subscribe to transaction updates for the current user
    const channel = supabase
      .channel('transaction-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          secureLogger.info('StatementContext', 'Real-time transaction update received', {
            transactionId: payload.new.id,
            category: payload.new.category,
            status: payload.new.status
          });

          const updatedTransaction = payload.new as Transaction;

          // Update allTransactions array (in-memory only)
          setAllTransactions(prev => {
            const index = prev.findIndex(t => t.id === updatedTransaction.id);
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = updatedTransaction;
              return updated;
            }
            return prev;
          });

          // Update paginated transactions array if present (in-memory only)
          setTransactions(prev => {
            const index = prev.findIndex(t => t.id === updatedTransaction.id);
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = updatedTransaction;
              return updated;
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        secureLogger.info('StatementContext', `Real-time subscription status: ${status}`);
      });

    // Cleanup subscription on unmount
    return () => {
      secureLogger.info('StatementContext', 'Cleaning up real-time transaction subscription');
      supabase.removeChannel(channel);
    };
  }, [user, session]);

  return (
    <StatementContext.Provider value={{
      // Data
      transactions,
      setTransactions,
      allTransactions,
      setAllTransactions,
      metrics,
      setMetrics,
      aggregatedMetrics,
      setAggregatedMetrics,
      statements,
      setStatements,

      // Bank Filter
      selectedBank,
      availableBanks,
      filteredTransactions,
      selectBank,
      fetchAvailableBanks,
      isBanksLoading,

      // View Mode
      viewMode,
      setViewMode,

      // Pagination
      currentPage,
      totalPages,
      hasNextPage,
      hasPreviousPage,

      // Filters & Sorting
      filters,
      sortBy,
      sortOrder,

      // Actions
      loadTransactions,
      loadAllTransactions,
      initializeUserData,
      clearCacheAndReload,
      updateFilters,
      updateSort,
      selectStatement,

      // Loading State
      isLoading,
      isUploading,
      setIsUploading,
      error,
    }}>
      {children}
    </StatementContext.Provider>
  );
};

export const useStatementContext = () => {
  const context = useContext(StatementContext);
  if (context === undefined) {
    throw new Error('useStatementContext must be used within a StatementProvider');
  }
  return context;
};