// src/components/Overview/TransactionsTable.tsx

import { AlertCircle, ChevronDown, FileSpreadsheet, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { FaRegFilePdf } from "react-icons/fa";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { downloadExcel, downloadPDF } from '../../utils/downloadUtils';
import { format, startOfDay } from 'date-fns';
import { useStatementContext } from '../../context/StatementContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CategoryFilter from './CategoryFilter';
import DateRangePicker from '../Common/DateRangePicker';
import { colors, withOpacity } from '../../styles/colors';
import TransactionRow from '../Transactions/TransactionRow';
import { transactionEditService } from '../../services/transactionEditService';
import '../../styles/TransactionsTable.css';

interface TransactionsTableProps {
  transactions?: Transaction[]; // Make optional since we'll get from context
  focusTransactionId?: string | null;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions: propTransactions,
  focusTransactionId = null,
}) => {
  const {
    transactions: contextTransactions,
    allTransactions,
    viewMode,
    setViewMode,
    selectedBank,
    loadTransactions,
    loadAllTransactions,
  } = useStatementContext();
  const { user } = useAuth();
  const { usage, effectivePlan, subscription } = useSubscription();
  const navigate = useNavigate();
  const hiddenTransactions = usage?.hiddenTransactions ?? 0;
  const usageLimit = usage?.transactionsLimit;
  const totalTransactions = usage?.totalTransactions ?? 0;
  const visibleCap = usageLimit === undefined || usageLimit === 999999
    ? (totalTransactions || (propTransactions ? propTransactions.length : allTransactions.length))
    : usageLimit;

  // Use prop transactions if provided, otherwise use context transactions based on view mode
  const baseTransactions = propTransactions || (viewMode === 'aggregated' ? allTransactions : contextTransactions);

  // Local state for optimistic updates when editing
  const [transactions, setTransactions] = useState<Transaction[]>(baseTransactions);
  const [focusedTransaction, setFocusedTransaction] = useState<Transaction | null>(null);
  const [focusStatus, setFocusStatus] = useState<'idle' | 'loading' | 'ready' | 'missing'>('idle');

  // Update local transactions when base transactions change
  useEffect(() => {
    setTransactions(baseTransactions);
  }, [baseTransactions]);

  useEffect(() => {
    if (!focusTransactionId) {
      setFocusedTransaction(null);
      setFocusStatus('idle');
      return;
    }

    const localMatch = baseTransactions.find(
      (transaction) => String(transaction.id) === focusTransactionId
    );
    if (localMatch) {
      setFocusedTransaction(localMatch);
      setFocusStatus('ready');
      return;
    }

    let active = true;
    setFocusStatus('loading');
    void transactionEditService
      .getTransaction(focusTransactionId)
      .then((transaction) => {
        if (!active) return;
        setFocusedTransaction(transaction);
        setFocusStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setFocusedTransaction(null);
        setFocusStatus('missing');
      });

    return () => {
      active = false;
    };
  }, [baseTransactions, focusTransactionId]);

  // Listen for transaction updates from batch operations
  useEffect(() => {
    const handleBatchTransactionsUpdated = async (_event: Event) => {
      try {
        // Revolut-style: Seamlessly refresh transactions from server
        if (viewMode === 'aggregated') {
          await loadAllTransactions();
        } else {
          await loadTransactions(1);
        }
      } catch (_error) {
        // Silently handle errors - batch update already succeeded
        // Error tracking handled by Sentry
      }
    };

    window.addEventListener('transactionsBatchUpdated', handleBatchTransactionsUpdated);

    return () => {
      window.removeEventListener('transactionsBatchUpdated', handleBatchTransactionsUpdated);
    };
  }, [viewMode, loadTransactions, loadAllTransactions]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null
  });
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transaction;
    direction: 'asc' | 'desc';
  }>({ key: 'transaction_date', direction: 'desc' });

  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Handle transaction updates from inline editing
  const handleTransactionUpdate = (updatedTransaction: Transaction) => {
    setTransactions(prevTransactions =>
      prevTransactions.map(t =>
        t.id === updatedTransaction.id ? updatedTransaction : t
      )
    );
  };

  const categories = Array.from(new Set(transactions.map(t => t.category)));

  // Calculate date boundaries from actual transaction data
  const dateBoundaries = useMemo(() => {
    if (!transactions.length) return { minDate: '', maxDate: '' };

    const dates = transactions.map(t => new Date(t.transaction_date));
    return {
      minDate: format(Math.min(...dates.map(d => d.getTime())), 'yyyy-MM-dd'),
      maxDate: format(Math.max(...dates.map(d => d.getTime())), 'yyyy-MM-dd')
    };
  }, [transactions]);

  const handleSort = (key: keyof Transaction) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter(transaction => {
      const matchesSearch = Object.values(transaction).some(value =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesCategory = !selectedCategory || transaction.category === selectedCategory;

      // Parse transaction date and normalize to start of day for comparison
      const transactionDateOnly = startOfDay(new Date(transaction.transaction_date));

      // Check if transaction date falls within the selected date range (inclusive)
      let matchesDateRange = true;

      if (dateRange.startDate) {
        const startDateOnly = startOfDay(dateRange.startDate);
        matchesDateRange = matchesDateRange && transactionDateOnly >= startDateOnly;
      }

      if (dateRange.endDate) {
        const endDateOnly = startOfDay(dateRange.endDate);
        matchesDateRange = matchesDateRange && transactionDateOnly <= endDateOnly;
      }

      return matchesSearch && matchesCategory && matchesDateRange;
    });

    return filtered;
  }, [transactions, searchTerm, selectedCategory, dateRange])
    .sort((a, b) => {
      if (sortConfig.key === 'transaction_amount' || sortConfig.key === 'balance') {
        return sortConfig.direction === 'asc'
          ? a[sortConfig.key] - b[sortConfig.key]
          : b[sortConfig.key] - a[sortConfig.key];
      }
      return sortConfig.direction === 'asc'
        ? String(a[sortConfig.key]).localeCompare(String(b[sortConfig.key]))
        : String(b[sortConfig.key]).localeCompare(String(a[sortConfig.key]));
    });

  const displayedTransactions = useMemo(
    () =>
      focusTransactionId
        ? focusedTransaction
          ? [focusedTransaction]
          : []
        : filteredTransactions,
    [filteredTransactions, focusTransactionId, focusedTransaction]
  );

  const handleDownload = async (type: 'pdf' | 'excel') => {
    const tableData = [
      ['Date', 'Description', 'Merchant', 'Category', 'Amount', 'Balance'],
      ...filteredTransactions.map(transaction => [
        format(new Date(transaction.transaction_date), 'dd-MMM-yyyy'),
        transaction.transaction_description,
        transaction.merchant_name || '',
        transaction.category,
        formatCurrency(transaction.transaction_amount),
        formatCurrency(transaction.balance)
      ])
    ];

    if (type === 'pdf') {
      const plan = (effectivePlan || subscription?.plan || 'free').toLowerCase();
      const basePlanLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
      const planLabel =
        (subscription?.isTrial === true || subscription?.status === 'trialing') && plan !== 'free'
          ? `${basePlanLabel} Trial`
          : basePlanLabel;
      const bankLabel = selectedBank ? selectedBank.toUpperCase() : undefined;
      const userName =
        (user as any)?.profile?.full_name ||
        (user as any)?.user_metadata?.full_name ||
        (user?.email ? user.email.split('@')[0] : undefined);

      const displayedDates = filteredTransactions
        .map((t) => new Date(t.transaction_date))
        .filter((d) => !Number.isNaN(d.getTime()));
      const dataMin = displayedDates.length > 0 ? new Date(Math.min(...displayedDates.map((d) => d.getTime()))) : null;
      const dataMax = displayedDates.length > 0 ? new Date(Math.max(...displayedDates.map((d) => d.getTime()))) : null;

      const periodStart = dateRange.startDate || dataMin || undefined;
      const periodEnd = dateRange.endDate || dataMax || undefined;

      const filters: string[] = [];
      if (selectedCategory) filters.push(`Category: ${selectedCategory}`);
      if (searchTerm.trim()) filters.push('Search applied');
      if (viewMode === 'aggregated') filters.push('All data');
      if (usageLimit && usageLimit !== 999999) filters.push(`Plan cap: ${usageLimit}`);

      await downloadPDF(tableData, 'transactions', true, {
        reportTitle: 'Transactions',
        accountLabel: 'Personal Account',
        userName,
        planLabel,
        bankLabel,
        periodStart,
        periodEnd,
        filters,
        generatedAt: new Date(),
      });
    } else {
      downloadExcel(tableData, 'transactions', true);
    }
  };

  const handleDateRangeChange = (newRange: { startDate: Date | null; endDate: Date | null }) => {
    setDateRange(newRange);
  };

  // Reset scroll position when filters change
  useEffect(() => {
    if (tableContainerRef.current) {
      // Force immediate scroll reset
      tableContainerRef.current.scrollTop = 0;

      // Also use requestAnimationFrame to ensure it happens after render
      requestAnimationFrame(() => {
        if (tableContainerRef.current) {
          tableContainerRef.current.scrollTop = 0;
        }
      });
    }
  }, [filteredTransactions.length, searchTerm, selectedCategory, dateRange, sortConfig]);

  useEffect(() => {
    if (!focusTransactionId || focusStatus !== 'ready') return;
    requestAnimationFrame(() => {
      document
        .getElementById(`transaction-${focusTransactionId}`)
        ?.focus({ preventScroll: true });
    });
  }, [focusStatus, focusTransactionId]);

  return (
    <div className="transactions-table-container relative overflow-hidden backdrop-blur-lg bg-gradient-to-br from-[#F1F3F4]/90 to-[#FFFFFF]/90 rounded-xl border border-[#5F6368]/20 h-full flex flex-col">
      {/* Ambient background effects */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#4285F4]/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#4285F4]/20 rounded-full blur-3xl" />

      <div className="relative z-50 p-3 border-b border-[#5F6368]/20 bg-gradient-to-r from-[#F1F3F4]/50 to-[#FFFFFF]/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <h3 className="text-xs font-semibold text-[#174EA6]">
              {viewMode === 'aggregated' ? 'All Transactions' : 'Recent Transactions'}
            </h3>
            {!propTransactions && (
              <div className="flex items-center space-x-2">
                <span className="text-2xs text-[#5F6368]">
                  {viewMode === 'paginated' ? 'Paginated' : 'All Data'}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode(viewMode === 'aggregated' ? 'paginated' : 'aggregated')}
                  className="p-1 rounded transition-colors"
                  title={`Switch to ${viewMode === 'aggregated' ? 'paginated' : 'aggregated'} view`}
                >
                  {viewMode === 'aggregated' ? (
                    <ToggleRight className="w-4 h-4 text-[#4285F4]" />
                  ) : (
                    <ToggleLeft className="w-4 h-4 text-[#5F6368]" />
                  )}
                </motion.button>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => void handleDownload('excel')}
              className="p-1.5 rounded-lg bg-[#FFFFFF]/50 hover:bg-[#5F6368]/20 transition-colors backdrop-blur-sm"
              title="Download Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => void handleDownload('pdf')}
              className="p-1.5 rounded-lg bg-[#FFFFFF]/50 hover:bg-[#5F6368]/20 transition-colors backdrop-blur-sm"
              title="Download PDF"
            >
              <FaRegFilePdf className="w-3.5 h-3.5 text-red-500" />
            </motion.button>
          </div>
        </div>

        {hiddenTransactions > 0 && (
          <div
            className="mt-2 flex items-center justify-between p-3 rounded-lg"
            style={{
              backgroundColor: withOpacity(colors.status.warning, 0.08),
              border: `1px solid ${withOpacity(colors.status.warning, 0.2)}`,
            }}
          >
            <p className="text-xs font-medium mr-3" style={{ color: colors.status.warning }}>
              Showing the most recent {visibleCap || 'your plan'} transactions. {hiddenTransactions} older transactions are hidden until you upgrade.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/settings/billing')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg"
              style={{ backgroundColor: colors.primary.main, color: colors.text.inverse }}
            >
              Upgrade
            </motion.button>
          </div>
        )}

        {focusTransactionId && (
          <div
            className="mb-3 flex items-start justify-between gap-3 rounded-lg p-3"
            role="status"
            style={{
              backgroundColor:
                focusStatus === 'missing'
                  ? withOpacity(colors.status.warning, 0.08)
                  : withOpacity(colors.primary.main, 0.08),
              border: `1px solid ${
                focusStatus === 'missing'
                  ? withOpacity(colors.status.warning, 0.25)
                  : withOpacity(colors.primary.main, 0.2)
              }`,
            }}
          >
            <div className="flex min-w-0 items-start gap-2">
              <AlertCircle
                className="mt-0.5 h-4 w-4 flex-shrink-0"
                style={{
                  color:
                    focusStatus === 'missing'
                      ? colors.status.warning
                      : colors.primary.main,
                }}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold" style={{ color: colors.text.primary }}>
                  {focusStatus === 'loading' && 'Loading transaction…'}
                  {focusStatus === 'ready' && 'Transaction opened from your notification'}
                  {focusStatus === 'missing' && 'Transaction unavailable'}
                </p>
                {focusStatus === 'ready' && focusedTransaction && (
                  <p className="mt-0.5 truncate text-xs" style={{ color: colors.text.secondary }}>
                    {focusedTransaction.merchant_name ||
                      focusedTransaction.transaction_description ||
                      'Transaction'}{' '}
                    · {formatCurrency(Math.abs(focusedTransaction.transaction_amount))}
                  </p>
                )}
                {focusStatus === 'missing' && (
                  <p className="mt-0.5 text-xs" style={{ color: colors.text.secondary }}>
                    It may have been removed or is no longer available to this account.
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app', { replace: true })}
              className="flex-shrink-0 rounded-md px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4285F4]"
              style={{ color: colors.primary.main }}
            >
              Show all
            </button>
          </div>
        )}

        {/* Search */}
        <div className={`flex flex-col sm:flex-row gap-2 ${focusTransactionId ? 'opacity-60' : ''}`}>
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[#5F6368]" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={Boolean(focusTransactionId)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#FFFFFF]/50 border border-[#5F6368]/20 rounded-lg text-2xs focus:outline-none focus:border-[#4285F4]/50 transition-colors backdrop-blur-sm text-[#174EA6]"
            />
          </div>
          {/* Date range picker and filters */}
          <div className="flex items-center gap-2">
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              minDate={dateBoundaries.minDate ? new Date(dateBoundaries.minDate) : undefined}
              maxDate={dateBoundaries.maxDate ? new Date(dateBoundaries.maxDate) : undefined}
              placeholder="Filter by date range"
              size="sm"
              className="w-52"
            />
            {/* Category filter */}
            <div className="relative" style={{ zIndex: 9999 }}>
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Table */}
      <div ref={tableContainerRef} className="table-section flex-1 overflow-auto">
        {focusStatus === 'loading' ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-xs text-[#5F6368]">Loading transaction…</p>
          </div>
        ) : focusStatus === 'missing' ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-xs text-[#5F6368]">No transaction details are available.</p>
          </div>
        ) : transactions.length === 0 && !focusedTransaction ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-[#5F6368] text-xs">
              {viewMode === 'aggregated' ? 'No transactions available. Upload bank statements to see aggregated data.' : 'No transactions found for current page.'}
            </p>
          </div>
        ) : (
          <table
            key={`table-${focusTransactionId || 'all'}-${searchTerm}-${selectedCategory}-${dateRange.startDate?.getTime()}-${dateRange.endDate?.getTime()}-${sortConfig.key}-${sortConfig.direction}`}
            className="w-full"
          >
            <thead className="sticky top-0 bg-[#FFFFFF]/95 backdrop-blur-sm">
              <tr>
                {['Date', 'Description', 'Merchant', 'Category', 'Amount', 'Balance', 'History'].map((header) => {
                  // Map header to transaction key for sorting
                  const keyMap: { [key: string]: keyof Transaction } = {
                    'Date': 'transaction_date',
                    'Description': 'transaction_description',
                    'Merchant': 'merchant_name',
                    'Category': 'category',
                    'Amount': 'transaction_amount',
                    'Balance': 'balance',
                    'History': 'edit_count'
                  };
                  const key = keyMap[header];
                  const isSortable = header !== 'History';

                  return (
                    <th
                      key={header}
                      onClick={() => isSortable && handleSort(key)}
                      className={`px-3 py-2 text-left text-2xs font-medium text-[#5F6368] uppercase tracking-wider ${
                        isSortable ? 'cursor-pointer hover:text-[#4285F4]' : ''
                      } ${header === 'History' ? 'text-center' : ''} transition-colors`}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{header}</span>
                        {isSortable && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 transform transition-transform ${
                              sortConfig.key === key && sortConfig.direction === 'desc' ? 'rotate-180' : ''
                            }`}
                          />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="table-content">
              {displayedTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  onTransactionUpdate={handleTransactionUpdate}
                  isHighlighted={
                    Boolean(focusTransactionId) &&
                    String(transaction.id) === focusTransactionId
                  }
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TransactionsTable;
