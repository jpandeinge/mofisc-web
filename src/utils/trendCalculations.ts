// src/utils/trendCalculations.ts

import { Transaction } from '../types';
import { startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from 'date-fns';

export const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return Number(change.toFixed(1));
};

export const calculateMonthlyTrends = (transactions: Transaction[]) => {
  // Sort transactions by date
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  );

  if (sortedTransactions.length === 0) return null;

  // Get the latest transaction date as reference
  const latestDate = parseISO(sortedTransactions[0].transaction_date);

  // Define current and previous month periods
  const currentPeriod = {
    start: startOfMonth(latestDate),
    end: endOfMonth(latestDate)
  };

  const previousPeriod = {
    start: startOfMonth(subMonths(latestDate, 1)),
    end: endOfMonth(subMonths(latestDate, 1))
  };

  // Filter transactions by period
  const filterTransactionsByPeriod = (period: { start: Date; end: Date }) => {
    return sortedTransactions.filter(t =>
      isWithinInterval(parseISO(t.transaction_date), period)
    );
  };

  const currentMonthTransactions = filterTransactionsByPeriod(currentPeriod);
  const previousMonthTransactions = filterTransactionsByPeriod(previousPeriod);

  // Calculate totals for different transaction types
  const calculatePeriodMetrics = (periodTransactions: Transaction[]) => {
    return periodTransactions.reduce((acc, t) => {
      const amount = t.transaction_amount;
      if (t.transaction_type.toLowerCase() === 'credit') {
        acc.income += amount;
      } else {
        acc.expenses += amount;
      }
      acc.transactionCount += 1;
      return acc;
    }, {
      income: 0,
      expenses: 0,
      transactionCount: 0,
      balance: periodTransactions[0]?.balance ?? 0
    });
  };

  const currentMetrics = calculatePeriodMetrics(currentMonthTransactions);
  const previousMetrics = calculatePeriodMetrics(previousMonthTransactions);

  // Log for debugging
//   console.log('Current Period Metrics:', {
//     period: `${currentPeriod.start.toISOString()} - ${currentPeriod.end.toISOString()}`,
//     ...currentMetrics
//   });
//   console.log('Previous Period Metrics:', {
//     period: `${previousPeriod.start.toISOString()} - ${previousPeriod.end.toISOString()}`,
//     ...previousMetrics
//   });

  return {
    balance: {
      currentValue: currentMetrics.balance,
      previousValue: previousMetrics.balance,
      percentageChange: calculateTrend(currentMetrics.balance, previousMetrics.balance)
    },
    income: {
      currentValue: currentMetrics.income,
      previousValue: previousMetrics.income,
      percentageChange: calculateTrend(currentMetrics.income, previousMetrics.income)
    },
    expenses: {
      currentValue: currentMetrics.expenses,
      previousValue: previousMetrics.expenses,
      percentageChange: calculateTrend(currentMetrics.expenses, previousMetrics.expenses)
    },
    transactionCount: {
      currentValue: currentMetrics.transactionCount,
      previousValue: previousMetrics.transactionCount,
      percentageChange: calculateTrend(
        currentMetrics.transactionCount,
        previousMetrics.transactionCount
      )
    }
  };
};