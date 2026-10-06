// src/components/Insights/TransactionOverTimeChart.tsx

import React, { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';

type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface TransactionOverTimeChartProps {
  transactions: Transaction[];
}

const TransactionOverTimeChart: React.FC<TransactionOverTimeChartProps> = ({ transactions }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');

  const { data } = useMemo(() => {
    if (!transactions.length) return { data: [] };

    const dates = transactions.map(t => parseISO(t.transaction_date));
    const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));

    let startDate = latestDate;
    switch (timeRange) {
      case '1W': startDate = new Date(latestDate.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '1M': startDate = new Date(latestDate.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case '3M': startDate = new Date(latestDate.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case '6M': startDate = new Date(latestDate.getTime() - 180 * 24 * 60 * 60 * 1000); break;
      case '1Y': startDate = new Date(latestDate.getTime() - 365 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    }

    const dailyData = new Map();
    const days = eachDayOfInterval({ start: startDate, end: latestDate });
    days.forEach(day => {
      dailyData.set(format(day, 'yyyy-MM-dd'), {
        date: format(day, 'yyyy-MM-dd'),
        debit: 0,
        credit: 0
      });
    });

    transactions.forEach(t => {
      const date = format(parseISO(t.transaction_date), 'yyyy-MM-dd');
      if (dailyData.has(date)) {
        const amount = t.transaction_amount;
        const entry = dailyData.get(date);
        if (t.transaction_type.toLowerCase() === 'debit') {
          entry.debit += amount;
        } else {
          entry.credit += amount;
        }
      }
    });

    return {
      data: Array.from(dailyData.values())
    };
  }, [transactions, timeRange]);

  return (
    <div className="relative overflow-hidden backdrop-blur-lg bg-gradient-to-br from-[#F1F3F4]/90 to-[#FFFFFF]/90 rounded-xl border border-[#5F6368]/20 p-4 w-full" style={{ height: '380px' }}>
      {/* Ambient background effects */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#4285F4]/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#4285F4]/20 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-base font-medium text-[#174EA6]">Debit and Credit Amounts</h2>
            <p className="text-xs text-[#5F6368]">Daily transaction value over time</p>
          </div>
          <div className="flex gap-1">
            {(['1W', '1M', '3M', '6M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`
                  px-2.5 py-1 rounded-full text-xs font-medium transition-all
                  ${timeRange === range
                    ? 'bg-gradient-to-r from-[#4285F4] to-[#4285F4] text-white'
                    : 'text-[#5F6368] hover:text-[#174EA6] hover:bg-[#FFFFFF]/50'
                  }
                `}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="relative h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="creditGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4285F4" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4285F4" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="debitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#5F6368" opacity={0.1} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#5F6368' }}
                tickFormatter={(tick) => format(parseISO(tick), 'dd MMM')}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#5F6368' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                dx={-10}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="backdrop-blur-md bg-[#FFFFFF]/90 p-3 rounded-lg border border-[#5F6368]/20 shadow-lg">
                      <p className="text-xs font-medium text-[#174EA6] mb-2">
                        {format(parseISO(data.date), 'MMMM d, yyyy')}
                      </p>
                      <div className="space-y-1">
                        <p className="text-xs text-[#5F6368]">
                          Credits: <span className="text-emerald-400">{formatCurrency(data.credit)}</span>
                        </p>
                        <p className="text-xs text-[#5F6368]">
                          Debits: <span className="text-rose-400">{formatCurrency(data.debit)}</span>
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="credit"
                stroke="#4285F4"
                fill="url(#creditGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="debit"
                stroke="#F43F5E"
                fill="url(#debitGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TransactionOverTimeChart;