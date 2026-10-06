// src/utils/financialCalculations.ts

import { CashFlowData, CategorySpending, Transaction } from '../types';
import { eachDayOfInterval, format, parseISO } from 'date-fns';

interface FinancialMetrics {
  dtiScore: number;
  savingsScore: number;
  cashFlowScore: number;
  behaviorScore: number;
}

export const calculateFinancialHealthScore = (transactions: Transaction[]): number => {
  // Helper function to categorize transactions by month
  const categorizeByMonth = (trans: Transaction[]) => {
    return trans.reduce((acc, t) => {
      const month = new Date(t.transaction_date).toISOString().slice(0, 7);
      if (!acc[month]) acc[month] = [];
      acc[month].push(t);
      return acc;
    }, {} as { [key: string]: Transaction[] });
  };

  // Calculate monthly metrics
  const monthlyData = categorizeByMonth(transactions);
  const metrics = Object.values(monthlyData).map(monthTrans => {
    const income = monthTrans
      .filter(t => t.transaction_type.toLowerCase() === 'credit')
      .reduce((sum, t) => sum + t.transaction_amount, 0);

    const expenses = monthTrans
      .filter(t => t.transaction_type.toLowerCase() === 'debit')
      .reduce((sum, t) => sum + t.transaction_amount, 0);

    const debtPayments = monthTrans
      .filter(t => [
        "Home Loan", "Credit Card", "Loan", "Furniture Account",
        "Vehicle Finance", "Student Loan", "Clothing Account"
      ].includes(t.category) && t.transaction_type.toLowerCase() === 'debit')
      .reduce((sum, t) => sum + t.transaction_amount, 0);

    return {
      income,
      expenses,
      debtPayments,
      savingsRate: income > 0 ? (income - expenses) / income : 0,
      dti: income > 0 ? debtPayments / income : 1,
      cashFlowRatio: expenses > 0 ? income / expenses : 2
    };
  });

  // Calculate component scores
  const dtiScore = metrics.reduce((sum, m) => sum + (1 - m.dti * 2.33), 0) / metrics.length * 100;
  const savingsScore = metrics.reduce((sum, m) => sum + m.savingsRate * 5, 0) / metrics.length * 100;
  const cashFlowScore = metrics.reduce((sum, m) => sum + (m.cashFlowRatio / 1.5), 0) / metrics.length * 100;

  // Calculate behavior score
  let behaviorScore = 100;
  const hasOverdrafts = transactions.some(t => t.balance < 0);
  if (hasOverdrafts) behaviorScore -= 20;

  const avgExpenses = metrics.reduce((sum, m) => sum + m.expenses, 0) / metrics.length;
  const expenseVolatility = metrics.reduce((sum, m) =>
    sum + Math.pow(m.expenses - avgExpenses, 2), 0) / metrics.length;

  if (expenseVolatility > avgExpenses * 0.5) behaviorScore -= 15;
  if (expenseVolatility > avgExpenses) behaviorScore -= 15;

  // Calculate final weighted score
  const finalScore = Math.round(
    Math.max(0, Math.min(100,
      dtiScore * 0.25 +
      savingsScore * 0.25 +
      cashFlowScore * 0.25 +
      behaviorScore * 0.25
    ))
  );

  // Store context for UI usage
  const scoreContext = {
    score: finalScore,
    metrics: {
      dtiScore: Math.min(100, Math.max(0, dtiScore)),
      savingsScore: Math.min(100, Math.max(0, savingsScore)),
      cashFlowScore: Math.min(100, Math.max(0, cashFlowScore)),
      behaviorScore: Math.min(100, Math.max(0, behaviorScore))
    },
    interpretation: interpretScore(finalScore),
    recommendations: generateRecommendations({
      dtiScore, savingsScore, cashFlowScore, behaviorScore
    })
  };

  localStorage.setItem('financialHealthContext', JSON.stringify(scoreContext));

  return finalScore;
};

// Helper functions for score interpretation
const interpretScore = (score: number): string => {
  if (score >= 90) return 'Excellent financial health';
  if (score >= 80) return 'Very good financial health';
  if (score >= 70) return 'Good financial health';
  if (score >= 60) return 'Fair financial health';
  return 'Needs improvement';
};

const generateRecommendations = (metrics: FinancialMetrics): string[] => {
  const recommendations: string[] = [];

  if (metrics.dtiScore < 70) {
    recommendations.push('Consider debt consolidation or accelerated debt repayment');
  }
  if (metrics.savingsScore < 70) {
    recommendations.push('Increase monthly savings rate to at least 20% of income');
  }
  if (metrics.cashFlowScore < 70) {
    recommendations.push('Review and optimize monthly expenses to improve cash flow');
  }
  if (metrics.behaviorScore < 70) {
    recommendations.push('Work on maintaining consistent spending and saving patterns');
  }

  return recommendations;
};

// Maintain existing exports
export const calculateDTI = (transactions: Transaction[]): number => {
  const debtCategories = ["Home Loan", "Credit Card", "Loan", "Furniture Account", "Vehicle Finance", "Student Loan", "Clothing Account"];
  const incomeCategories = ["Salary", "Investment Income", "Rental Income", "Other Income"];

  const totalDebt = transactions
    .filter(t => debtCategories.includes(t.category) && t.transaction_type.toLowerCase() === 'debit')
    .reduce((sum, t) => sum + t.transaction_amount, 0);

  const totalIncome = transactions
    .filter(t => incomeCategories.includes(t.category) && t.transaction_type.toLowerCase() === 'credit')
    .reduce((sum, t) => sum + t.transaction_amount, 0);

  return totalIncome > 0 ? totalDebt / totalIncome : 0;
};

export const generateCashFlowData = (transactions: Transaction[]): CashFlowData[] => {
  if (transactions.length === 0) return [];

  const startDate = parseISO(transactions[0].transaction_date);
  const endDate = parseISO(transactions[transactions.length - 1].transaction_date);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  let runningBalance = 0;
  let previousDayBalance = 0;

  return days.map(day => {
    const dayTransactions = transactions.filter(t =>
      format(parseISO(t.transaction_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    );

    const inflow = dayTransactions
      .filter(t => t.transaction_type.toLowerCase() === 'credit')
      .reduce((sum, t) => sum + t.transaction_amount, 0);

    const outflow = dayTransactions
      .filter(t => t.transaction_type.toLowerCase() === 'debit')
      .reduce((sum, t) => sum + t.transaction_amount, 0);

    const netFlow = inflow - outflow;
    runningBalance += netFlow;

    // Calculate day-over-day change
    const balanceChange = runningBalance - previousDayBalance;
    previousDayBalance = runningBalance;

    return {
      date: format(day, 'MMM dd'),
      rawDate: day,
      cashFlow: netFlow,
      balance: runningBalance,
      inflow: inflow,
      outflow: outflow,
      balanceChange: balanceChange,
      transactionCount: dayTransactions.length
    };
  });
};

export const generateCategorySpendings = (transactions: Transaction[]): CategorySpending[] => {
  const spendings = transactions
    .filter(t => t.transaction_type.toLowerCase() === 'debit')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.transaction_amount;
      return acc;
    }, {} as {[key: string]: number});

  return Object.entries(spendings)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }));
};