// src/utils/chartUtils.ts

import { startOfMonth, format, parseISO } from 'date-fns';
import { Transaction } from '../types';

export type PeriodOption = '1w' | '1m' | '6m' | '1y' | 'all';

export interface CashFlowDataPoint {
  date: string;
  inflow: number;
  outflow: number;
}

export const generateColors = (count: number): string[] => {
  const goldenRatio = 0.618033988749895;
  const saturationRange = [50, 95];
  const lightnessRange = [25, 65];

  return Array.from({ length: count }, (_, i) => {
    const hue = (i * goldenRatio * 360) % 360;
    const saturation = saturationRange[0] + (i % 2) * (saturationRange[1] - saturationRange[0]);
    const lightness = lightnessRange[0] + (i % 3) * ((lightnessRange[1] - lightnessRange[0]) / 2);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  });
};

export const getPeriodStart = (period: PeriodOption, endDate: Date, startDate: Date) => {
  const start = new Date(startDate);
  switch (period) {
    case '1w':
      const weekStart = new Date(endDate);
      weekStart.setDate(weekStart.getDate() - 7);
      return weekStart;
    case '1m':
      const monthStart = new Date(endDate);
      monthStart.setMonth(monthStart.getMonth() - 1);
      return monthStart;
    case '6m':
      const sixMonthStart = new Date(endDate);
      sixMonthStart.setMonth(sixMonthStart.getMonth() - 6);
      return sixMonthStart;
    case '1y':
      const yearStart = new Date(endDate);
      yearStart.setFullYear(yearStart.getFullYear() - 1);
      return yearStart;
    default:
      return start;
  }
};

export const generateCashFlowData = (transactions: Transaction[]): CashFlowDataPoint[] => {
  if (!transactions.length) return [];

  // Group transactions by month
  const groupedTransactions = transactions.reduce((acc: { [key: string]: Transaction[] }, transaction) => {
    const date = startOfMonth(parseISO(transaction.transaction_date));
    const monthKey = format(date, 'MMM yyyy');

    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(transaction);
    return acc;
  }, {});

  // Calculate inflow and outflow for each month
  return Object.entries(groupedTransactions).map(([date, monthTransactions]) => {
    const inflow = monthTransactions
      .filter(t => t.transaction_type.toLowerCase() === 'credit')
      .reduce((sum, t) => sum + t.transaction_amount, 0);

    const outflow = monthTransactions
      .filter(t => t.transaction_type.toLowerCase() === 'debit')
      .reduce((sum, t) => sum + t.transaction_amount, 0);

    return {
      date,
      inflow,
      outflow
    };
  }).sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
};

export const periodOptions: PeriodOption[] = ['1w', '1m', '6m', '1y', 'all'];