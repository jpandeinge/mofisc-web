// src/components/Insights/CashFlowChart.tsx

import React, { useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';

type PeriodOption = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const getPeriodStart = (period: PeriodOption, endDate: Date, defaultStartDate: Date): Date => {
  const start = new Date(endDate);
  switch (period) {
    case '1W':
      start.setDate(start.getDate() - 7);
      break;
    case '1M':
      start.setMonth(start.getMonth() - 1);
      break;
    case '3M':
      start.setMonth(start.getMonth() - 3);
      break;
    case '6M':
      start.setMonth(start.getMonth() - 6);
      break;
    case '1Y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    case 'ALL':
      return defaultStartDate;
  }
  return start > defaultStartDate ? start : defaultStartDate;
};

interface CashFlowChartProps {
  transactions: Transaction[];
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ transactions }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('1M');

  const { cashFlowData, dateRange, netCashflow } = useMemo(() => {
    if (transactions.length === 0) {
      return {
        cashFlowData: [],
        dateRange: { start: new Date(), end: new Date() },
        netCashflow: 0
      };
    }

    const sortedTransactions = [...transactions].sort((a, b) =>
      new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    const defaultStartDate = parseISO(sortedTransactions[0].transaction_date);
    const endDate = parseISO(sortedTransactions[sortedTransactions.length - 1].transaction_date);
    const startDate = getPeriodStart(selectedPeriod, endDate, defaultStartDate);

    const filteredTransactions = sortedTransactions.filter(t => {
      const date = parseISO(t.transaction_date);
      return isWithinInterval(date, { start: startDate, end: endDate });
    });

    const data = filteredTransactions.reduce((acc, t) => {
      const dateKey = format(parseISO(t.transaction_date), 'MMM dd');
      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, inflow: 0, outflow: 0 };
      }

      if (t.transaction_type.toLowerCase() === 'credit') {
        acc[dateKey].inflow += t.transaction_amount;
      } else {
        acc[dateKey].outflow += t.transaction_amount;
      }
      return acc;
    }, {} as Record<string, any>);

    const totalInflow = filteredTransactions
      .filter(t => t.transaction_type.toLowerCase() === 'credit')
      .reduce((sum, t) => sum + t.transaction_amount, 0);

    const totalOutflow = filteredTransactions
      .filter(t => t.transaction_type.toLowerCase() === 'debit')
      .reduce((sum, t) => sum + t.transaction_amount, 0);

    return {
      cashFlowData: Object.values(data),
      dateRange: { start: startDate, end: endDate },
      netCashflow: totalInflow - totalOutflow
    };
  }, [transactions, selectedPeriod]);

  return (
    <div className="relative overflow-hidden backdrop-blur-lg bg-gradient-to-br from-[#F1F3F4]/90 to-[#FFFFFF]/90 rounded-xl border border-[#5F6368]/20 p-4 w-full" style={{ height: '500px' }}>
      {/* Ambient background effects remain the same */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#4285F4]/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#4285F4]/20 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-medium text-[#174EA6]">Net Cashflow</h2>
            <div className="flex flex-col">
              <p className="text-xs text-[#5F6368]">
                {format(dateRange.start, 'dd MMM yyyy')} - {format(dateRange.end, 'dd MMM yyyy')}
              </p>
              <p className={`text-base font-bold ${netCashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(netCashflow)}
              </p>
            </div>
          </div>

          <div className="flex gap-1">
            {(['1W', '1M', '3M', '6M', '1Y', 'ALL'] as PeriodOption[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-gradient-to-r from-[#4285F4] to-[#4285F4] text-white'
                    : 'text-[#5F6368] hover:text-[#174EA6] hover:bg-[#FFFFFF]/50'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={cashFlowData}
            barSize={20}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }} >
              <defs>
                <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4285F4" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#4285F4" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="outflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#5F6368' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#5F6368' }}
                tickFormatter={(value) => `${value / 1000}k`}
                dx={-10}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="backdrop-blur-md bg-[#FFFFFF]/90 p-3 rounded-lg border border-[#5F6368]/20 shadow-lg">
                      <p className="text-xs font-medium text-[#174EA6]">
                        {data.date}
                      </p>
                      <div className="space-y-1">
                        <p className="text-xs text-[#5F6368]">
                          Inflow: <span className="text-emerald-400">{formatCurrency(data.inflow)}</span>
                        </p>
                        <p className="text-xs text-[#5F6368]">
                          Outflow: <span className="text-rose-400">{formatCurrency(data.outflow)}</span>
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="inflow"
                fill="url(#inflowGradient)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="outflow"
                fill="url(#outflowGradient)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center px-3 py-1 rounded-full bg-[#FFFFFF]/30">
            <div className="w-2 h-2 rounded-full bg-[#4285F4] mr-2" />
            <span className="text-xs text-[#174EA6]">Cash Inflow</span>
          </div>
          <div className="flex items-center px-3 py-1 rounded-full bg-[#FFFFFF]/30">
            <div className="w-2 h-2 rounded-full bg-[#EF4444] mr-2" />
            <span className="text-xs text-[#174EA6]">Cash Outflow</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowChart;