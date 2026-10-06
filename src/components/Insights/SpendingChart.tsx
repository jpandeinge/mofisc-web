// src/components/Insights/SpendingChart.tsx

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PeriodOption, generateColors, getPeriodStart, periodOptions } from '../../utils/chartUtils';
import React, { useMemo, useState } from 'react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface SpendingDataItem {
  category: string;
  amount: number;
  percentage: number;
}

interface SpendingChartProps {
  onToggleView: () => void;
  transactions: Transaction[];
}

const SpendingChart: React.FC<SpendingChartProps> = ({ onToggleView, transactions }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('1w');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const { spendingData, dateRange, totalSpent, monthOverMonthChange } = useMemo(() => {
    if (transactions.length === 0) {
      return {
        spendingData: [],
        dateRange: { start: new Date(), end: new Date() },
        totalSpent: 0,
        monthOverMonthChange: 0
      };
    }

    const sortedTransactions = [...transactions].sort((a, b) =>
      new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    const startDate = parseISO(sortedTransactions[0].transaction_date);
    const endDate = parseISO(sortedTransactions[sortedTransactions.length - 1].transaction_date);

    const periodStart = getPeriodStart(selectedPeriod, endDate, startDate);
    const filteredTransactions = sortedTransactions.filter((t: Transaction) =>
      isWithinInterval(parseISO(t.transaction_date), { start: periodStart, end: endDate }) &&
      t.transaction_type.toLowerCase() === 'debit'
    );

    const spendingByCategory = filteredTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.transaction_amount;
      return acc;
    }, {} as Record<string, number>);

    const totalSpent = Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0);

    const previousPeriodStart = new Date(periodStart);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
    const previousTransactions = sortedTransactions.filter((t: Transaction) =>
      isWithinInterval(parseISO(t.transaction_date), { start: previousPeriodStart, end: periodStart }) &&
      t.transaction_type.toLowerCase() === 'debit'
    );
    const previousTotal = previousTransactions.reduce((sum, t) => sum + t.transaction_amount, 0);
    const monthOverMonthChange = previousTotal ? ((totalSpent - previousTotal) / previousTotal) * 100 : 0;

    const spendingData: SpendingDataItem[] = Object.entries(spendingByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalSpent) * 100
      }))
      .sort((a, b) => b.amount - a.amount);

    return { spendingData, dateRange: { start: periodStart, end: endDate }, totalSpent, monthOverMonthChange };
  }, [transactions, selectedPeriod]);

  const COLORS = useMemo(() => generateColors(spendingData.length), [spendingData]);

  return (
    <div className="relative overflow-hidden backdrop-blur-lg bg-gradient-to-br from-[#F1F3F4]/90 to-[#FFFFFF]/90 rounded-xl border border-[#5F6368]/20 p-4 w-full" style={{ height: '380px' }}>
      {/* Ambient background effects */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-medium text-[#174EA6]">Spending Analysis</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-[#5F6368]">
                {format(dateRange.start, 'dd MMM yyyy')} - {format(dateRange.end, 'dd MMM yyyy')}
              </p>
              <div className={`flex items-center gap-1 text-xs ${
                monthOverMonthChange >= 0 ? 'text-rose-500' : 'text-emerald-500'
              }`}>
                {monthOverMonthChange >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(monthOverMonthChange).toFixed(1)}% vs last period
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* <button
              className="p-2 rounded-lg hover:bg-[#FFFFFF]/50 transition-colors"
              title="Download data"
            >
              <Download className="w-4 h-4 text-[#5F6368]" />
            </button> */}

            <div className="flex rounded-full overflow-hidden border border-[#5F6368]/20">
              <button className="bg-rose-500 text-white px-4 py-1.5 text-xs font-medium">
                Spending
              </button>
              <button
                onClick={onToggleView}
                className="bg-[#FFFFFF] text-[#174EA6] px-4 py-1.5 text-xs font-medium hover:bg-[#FFFFFF]/70"
              >
                Income
              </button>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 mb-4 flex-shrink-0">
          {periodOptions.map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedPeriod === period
                  ? 'bg-rose-500 text-white shadow-lg'
                  : 'bg-[#FFFFFF]/30 text-[#5F6368] hover:text-[#174EA6] hover:bg-[#FFFFFF]/50'
              }`}
            >
              {period === 'all' ? 'ALL' : period.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Pie Chart */}
          <div className="relative aspect-square">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {spendingData.map((entry, index) => (
                      <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS[index]} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={COLORS[index]} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={spendingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={"65%"}
                    outerRadius={"85%"}
                    paddingAngle={3}
                    dataKey="amount"
                    onMouseEnter={(_, index) => setHoveredCategory(spendingData[index].category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    cornerRadius={4}
                  >
                    {spendingData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#gradient-${index})`}
                        stroke={COLORS[index]}
                        strokeWidth={2}
                        opacity={hoveredCategory ? (hoveredCategory === entry.category ? 1 : 0.3) : 1}
                        style={{
                          filter: hoveredCategory === entry.category ?
                            'drop-shadow(0px 0px 8px rgba(225, 29, 72, 0.5))' :
                            'none',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    wrapperStyle={{ zIndex: 100 }} // Ensure tooltip appears above center content
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="backdrop-blur-md bg-[#FFFFFF]/90 p-3 rounded-lg border border-[#5F6368]/20 shadow-lg">
                          <p className="text-xs font-medium text-[#174EA6] mb-1">
                            {data.category}
                          </p>
                          <p className="text-sm font-bold text-rose-500">
                            {formatCurrency(data.amount)}
                          </p>
                          <p className="text-xs text-[#5F6368]">
                            {data.percentage.toFixed(1)}% of total
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Center Content */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ zIndex: 1 }} // Lower z-index to allow tooltip to appear above
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#F1F3F4]/90 to-[#FFFFFF]/90 blur-md"></div>
                <div className="relative px-6 py-4 rounded-2xl">
                  <p className="text-xs text-[#5F6368] mb-1 text-center">Total Spent</p>
                  <p className="text-md font-bold text-rose-500">{formatCurrency(totalSpent)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Breakdown */}
          <div className="flex flex-col h-full">
            <div className="text-xs font-medium text-[#174EA6] mb-2 flex-shrink-0">Categories</div>
            <div className="overflow-y-auto custom-scrollbar pr-2 flex-1" style={{ maxHeight: 'calc(520px - 2rem - 4rem)' }}>
              {spendingData.map((item, index) => (
                <div
                  key={item.category}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#FFFFFF]/30 transition-colors mb-1.5"
                  onMouseEnter={() => setHoveredCategory(item.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-[#174EA6] truncate">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-medium text-rose-500 ml-2">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-[#FFFFFF]/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: COLORS[index],
                          opacity: hoveredCategory === item.category ? 1 : 0.7
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-[9px] text-[#5F6368] min-w-[28px] text-right">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingChart;