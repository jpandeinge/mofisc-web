// src/pages/PlanningPage.tsx

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, DollarSign, Calculator } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';
import { useStatementContext } from '../context/StatementContext';
import { useAppContext } from '../context/AppContext';
import LoadingState from '../components/Common/LoadingState';
import EmptyState from '../components/Common/EmptyState';
import EnhancedGoalsOverview from '../components/Planning/EnhancedGoalsOverview';
import BudgetOverview from '../components/Planning/BudgetOverview';
import LoanAffordabilityCalculator from '../components/Planning/LoanAffordabilityCalculator';
import { resolvePageDataState } from '../utils/pageDataState';
import ComingSoonPage from './ComingSoonPage';

type TabType = 'goals' | 'budgets' | 'tools';

const PlanningPage: React.FC = () => {
  const location = useLocation();
  const { currentBankAccount } = useAppContext();
  const { isProcessing, processingVariant, isPersistentLoading } = useLoading();
  const {
    transactions,
    allTransactions,
    filteredTransactions,
    selectedBank,
    viewMode,
    isLoading: isContextLoading,
  } = useStatementContext();

  const defaultTab = useMemo<TabType>(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'goals' || tab === 'budgets' || tab === 'tools') {
      return tab;
    }
    return 'goals';
  }, [location.search]);

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Show Coming Soon page if Bank Account is selected
  if (currentBankAccount === 'Bank Account') {
    return <ComingSoonPage />;
  }

  // Use filtered transactions when a bank is selected, otherwise use view mode logic
  const currentTransactions = selectedBank
    ? filteredTransactions
    : viewMode === 'aggregated'
    ? allTransactions
    : transactions;

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
        sectionLabel="Planning"
        title="Planning Starts with Data"
        icon={<Target className="h-5 w-5" />}
        description={(
          <>
            Upload a statement from <strong className="font-semibold text-[color:var(--text-primary)]">New Statement</strong> to unlock budgets, goals, and affordability tools.
          </>
        )}
      />
    );
  }

  const tabs = [
    {
      id: 'goals' as TabType,
      label: 'Goals',
      icon: Target,
      component: <EnhancedGoalsOverview />,
    },
    {
      id: 'budgets' as TabType,
      label: 'Budgets',
      icon: DollarSign,
      component: <BudgetOverview />,
    },
    {
      id: 'tools' as TabType,
      label: 'Tools',
      icon: Calculator,
      component: <LoanAffordabilityCalculator />,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Tab Navigation */}
      <div className="glass-card p-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 whitespace-nowrap rounded-xl px-6 py-3 font-medium transition-[color,background-color,box-shadow] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  isActive
                    ? 'text-white'
                    : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--background-tertiary)]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl shadow-lg"
                    style={{ background: 'var(--gradient-primary)' }}
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
                <Icon aria-hidden="true" className="relative z-10 h-5 w-5" />
                <span className="text-sm relative z-10">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {tabs.find((tab) => tab.id === activeTab)?.component}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PlanningPage;
