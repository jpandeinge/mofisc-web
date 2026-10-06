// src/pages/InsightsPage.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import CashFlowChart from '../components/Insights/CashFlowChart';
import CashFlowCalendar from '../components/Insights/CashFlowCalendar';
import IncomeChart from '../components/Insights/IncomeChart';
import IncomeExpenseTable from '../components/Insights/IncomeExpenseTable';
import SpendingChart from '../components/Insights/SpendingChart';
import TransactionOverTimeChart from '../components/Insights/TransactionOverTimeChart';
import InsightStats from '../components/Insights/InsightStats';
import SpendingVisualization from '../components/Insights/SpendingVisualization';
import { useLoading } from '../context/LoadingContext';
import LoadingState from '../components/Common/LoadingState';
import EmptyState from '../components/Common/EmptyState';
import { useStatementContext } from '../context/StatementContext';
import { useUserMetrics } from '../context/UserMetricsContext';
import { useAppContext } from '../context/AppContext';
import { resolvePageDataState } from '../utils/pageDataState';
import ComingSoonPage from './ComingSoonPage';

type ChartView = 'spending' | 'income';

const InsightsPage: React.FC = () => {
  const { currentBankAccount } = useAppContext();
  const { isProcessing, processingVariant, isPersistentLoading } = useLoading();
  const { state: userMetricsState } = useUserMetrics();
  const {
    transactions,
    allTransactions,
    filteredTransactions,
    selectedBank,
    viewMode,
    isLoading: isContextLoading
  } = useStatementContext();
  const [chartView, setChartView] = useState<ChartView>('spending');

  // Track filter loading for smooth transitions
  const isFilterLoading = userMetricsState.isLoading;

  // Show Coming Soon page if Bank Account is selected
  if (currentBankAccount === 'Bank Account') {
    return <ComingSoonPage />;
  }

  // Use filtered transactions when a bank is selected, otherwise use view mode logic
  const currentTransactions = selectedBank
    ? filteredTransactions
    : (viewMode === 'aggregated' ? allTransactions : transactions);

  const pageDataState = resolvePageDataState(
    currentTransactions.length > 0,
    isPersistentLoading || isProcessing || isContextLoading
  );

  if (pageDataState === 'loading') {
    return <LoadingState variant={processingVariant} />;
  }

  if (pageDataState === 'empty') {
    return (
      <EmptyState
        sectionLabel="Insights"
        title="Nothing to Analyze Yet"
        icon={<BarChart3 className="h-5 w-5" />}
        description={(
          <>
            Upload your first statement from <strong className="font-semibold text-[color:var(--text-primary)]">New Statement</strong> to activate trends, categories, and cash-flow intelligence.
          </>
        )}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 bg-[color:var(--bg-secondary)]"
    >
      <InsightStats transactions={currentTransactions} isLoading={isFilterLoading} />

      <div className="flex flex-col gap-5 mt-6">
        {/* Row 1: Transaction Timeline + Income/Expense Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <TransactionOverTimeChart transactions={currentTransactions} />
          <IncomeExpenseTable transactions={currentTransactions} />
        </div>

        {/* Row 2: Cash Flow Chart + Calendar - equal width */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <CashFlowChart transactions={currentTransactions} />
          <CashFlowCalendar transactions={currentTransactions} />
        </div>

        {/* Row 3: Spending/Income Analysis + Interactive Visualization - side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {chartView === 'spending'
            ? <SpendingChart onToggleView={() => setChartView('income')} transactions={currentTransactions} />
            : <IncomeChart onToggleView={() => setChartView('spending')} transactions={currentTransactions} />
          }
          <SpendingVisualization transactions={currentTransactions} />
        </div>
      </div>
    </motion.div>
  );
};

export default InsightsPage;
