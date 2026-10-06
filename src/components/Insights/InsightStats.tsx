// src/components/Insights/InsightStats.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { ChartBarIcon, ArrowTrendingUpIcon, BanknotesIcon, CircleStackIcon, FolderIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/formatters';
import { Transaction } from '../../types';
import { getSubscriptionInfo } from '../../config/subscriptionConfig';

// Known recurring payment categories with subcategories
const RECURRING_CATEGORIES = {
  DEBT: ['Loan', 'Home Loan', 'Vehicle Finance', 'Credit Card', 'Clothing Account', 'Furniture Account'],
  UTILITIES: ['Utilities', 'Water & Electricity', 'E-Water EB', 'E&Water'],
  INSURANCE: ['Insurance', 'Life Insurance', 'Medical Aid', 'Health Insurance'],
  SUBSCRIPTIONS: ['Subscriptions', 'DSTV', 'Netflix', 'Spotify', 'Apple Music', '1Password', 'Amazon Prime'],
  SERVICES: ['Security Service', 'Internet Service', 'Mobile Service', 'Gym Membership'],
  SAVINGS: ['Investment', 'Savings', 'Pension', 'Retirement Fund'],
  HOUSING: ['Rent', 'Mortgage', 'Property Management', 'Body Corporate']
};

interface InsightStatsProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

interface RecurringPayment {
  category: string;
  description: string;
  amount: number;
  count: number;
  lastDate: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  trend?: number;
  gradient: string;
  isLoading?: boolean;
}

const isRecurringCategory = (category: string): boolean => {
  return Object.values(RECURRING_CATEGORIES).some(cats =>
    cats.some(c => category.toLowerCase().includes(c.toLowerCase()))
  );
};

const getCategoryGroup = (category: string): string => {
  for (const [group, categories] of Object.entries(RECURRING_CATEGORIES)) {
    if (categories.some(c => category.toLowerCase().includes(c.toLowerCase()))) {
      return group;
    }
  }
  return 'OTHER';
};

const getRecurringPayments = (transactions: Transaction[]): RecurringPayment[] => {
  const paymentMap = new Map<string, { amounts: number[], dates: string[], category: string }>();

  // Sort transactions by date
  const sortedTransactions = [...transactions].sort((a, b) =>
    new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
  );

  sortedTransactions.forEach(transaction => {
    if (transaction.transaction_type.toLowerCase() === 'debit') {
      // Check known categories first
      if (isRecurringCategory(transaction.category)) {
        const categoryGroup = getCategoryGroup(transaction.category);
        const key = `${categoryGroup}_${transaction.category}_${transaction.transaction_description}`;
        if (!paymentMap.has(key)) {
          paymentMap.set(key, { amounts: [], dates: [], category: categoryGroup });
        }
        paymentMap.get(key)!.amounts.push(transaction.transaction_amount);
        paymentMap.get(key)!.dates.push(transaction.transaction_date);
        return;
      }

      // Check subscriptions
      const subscriptionInfo = getSubscriptionInfo(transaction.transaction_description);
      if (subscriptionInfo) {
        const key = `SUBSCRIPTION_${subscriptionInfo.name}`;
        if (!paymentMap.has(key)) {
          paymentMap.set(key, { amounts: [], dates: [], category: 'SUBSCRIPTIONS' });
        }
        paymentMap.get(key)!.amounts.push(transaction.transaction_amount);
        paymentMap.get(key)!.dates.push(transaction.transaction_date);
        return;
      }

      // Pattern detection for unlisted recurring payments
      const cleanDescription = transaction.transaction_description
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanDescription.length < 5) return;

      // Check for key recurring payment indicators
      const recurringIndicators = ['premium', 'subscription', 'monthly', 'payment', 'service'];
      if (recurringIndicators.some(indicator => cleanDescription.includes(indicator))) {
        const key = `OTHER_${cleanDescription}`;
        if (!paymentMap.has(key)) {
          paymentMap.set(key, { amounts: [], dates: [], category: 'OTHER' });
        }
        paymentMap.get(key)!.amounts.push(transaction.transaction_amount);
        paymentMap.get(key)!.dates.push(transaction.transaction_date);
      }
    }
  });

  // Analyze patterns
  const recurringPayments: RecurringPayment[] = [];
  paymentMap.forEach((data, key) => {
    const { amounts, dates, category } = data;

    if (amounts.length < 2) return;

    // Check for amount consistency (within 10% variance)
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const amountConsistent = amounts.every(amount =>
      Math.abs(amount - avgAmount) / avgAmount <= 0.1
    );

    // Check for regular intervals
    const dateIntervals = dates.slice(1).map((date, i) => {
      const days = (new Date(date).getTime() - new Date(dates[i]).getTime()) / (1000 * 60 * 60 * 24);
      return days;
    });

    const isRegularInterval = dateIntervals.every(interval =>
      Math.abs(interval - dateIntervals[0]) <= 5
    );

    if (amountConsistent && isRegularInterval) {
      const [_paymentType, ...descParts] = key.split('_');
      recurringPayments.push({
        category: category,
        description: descParts.join('_'),
        amount: avgAmount,
        count: amounts.length,
        lastDate: dates[dates.length - 1]
      });
    }
  });

  return recurringPayments;
};

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, description, trend, gradient, isLoading = false }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`relative overflow-hidden rounded-lg border backdrop-blur-lg p-3 ${gradient}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-2xs font-medium text-[color:var(--text-secondary)]">{title}</span>
        <div className="p-1.5 rounded-lg bg-white/10">
          {icon}
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        {isLoading ? (
          <div className="h-5 w-20 bg-white/10 rounded animate-pulse" />
        ) : (
          <motion.span
            key={value}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-semibold text-[color:var(--text-primary)]"
          >
            {value}
          </motion.span>
        )}
        {!isLoading && trend && (
          <span className={`text-2xs font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="mt-0.5 h-3 w-24 bg-white/5 rounded animate-pulse" />
      ) : (
        <p className="mt-0.5 text-2xs text-[color:var(--text-secondary)]">{description}</p>
      )}
    </div>
  </motion.div>
);

const InsightStats: React.FC<InsightStatsProps> = ({ transactions, isLoading = false }) => {
  const stats = React.useMemo(() => {
    const recurringPayments = getRecurringPayments(transactions);
    const recurringTotal = recurringPayments.reduce((sum, p) => sum + p.amount, 0);

    const totalIncome = transactions
      .filter(t => t.transaction_type.toLowerCase() === 'credit')
      .reduce((sum, t) => sum + t.transaction_amount, 0);

    const totalDebt = recurringPayments
      .filter(p => p.category === 'DEBT')
      .reduce((sum, p) => sum + p.amount, 0);

    const debtRatio = totalIncome > 0 ? (totalDebt / totalIncome) * 100 : 0;

    const avgTransaction = transactions.length > 0
      ? transactions.reduce((sum, t) => sum + t.transaction_amount, 0) / transactions.length
      : 0;

    const categoryCounts = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])[0];

    return {
      avgTransaction,
      debtRatio,
      totalDebt,
      recurringPayments: {
        count: recurringPayments.length,
        amount: recurringTotal,
        byCategory: Object.fromEntries(
          Object.keys(RECURRING_CATEGORIES).map(category => [
            category,
            recurringPayments.filter(p => p.category === category).length
          ])
        )
      },
      topCategory: topCategory ? topCategory[0] : 'N/A',
      topCategoryCount: topCategory ? topCategory[1] : 0
    };
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      <MetricCard
        title="Average Transaction"
        value={formatCurrency(stats.avgTransaction)}
        icon={<ChartBarIcon className="w-3.5 h-3.5 text-blue-400" />}
        description="Mean transaction value across all activities"
        gradient="from-blue-500/10 to-blue-600/5 border-blue-500/20"
        isLoading={isLoading}
      />

      <MetricCard
        title="Debt Service Ratio"
        value={`${stats.debtRatio.toFixed(1)}%`}
        icon={<ArrowTrendingUpIcon className="w-3.5 h-3.5 text-blue-400" />}
        description="Percentage of income used for debt payments"
        gradient="from-blue-500/10 to-blue-600/5 border-blue-500/20"
        isLoading={isLoading}
      />

      <MetricCard
        title="Total Debt Payments"
        value={formatCurrency(stats.totalDebt)}
        icon={<BanknotesIcon className="w-3.5 h-3.5 text-emerald-400" />}
        description={`${stats.recurringPayments.byCategory.DEBT || 0} active debts`}
        gradient="from-emerald-500/10 to-emerald-600/5 border-emerald-500/20"
        isLoading={isLoading}
      />

      <MetricCard
        title="Recurring Payments"
        value={`${stats.recurringPayments.count}`}
        icon={<CircleStackIcon className="w-3.5 h-3.5 text-amber-400" />}
        description={`${formatCurrency(stats.recurringPayments.amount)} monthly`}
        gradient="from-amber-500/10 to-amber-600/5 border-amber-500/20"
        isLoading={isLoading}
      />

      <MetricCard
        title="Top Category"
        value={stats.topCategory}
        icon={<FolderIcon className="w-3.5 h-3.5 text-rose-400" />}
        description={`${stats.topCategoryCount} transactions`}
        gradient="from-rose-500/10 to-rose-600/5 border-rose-500/20"
        isLoading={isLoading}
      />
    </div>
  );
};

export default InsightStats;