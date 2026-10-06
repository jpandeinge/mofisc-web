// src/components/Overview/EnhancedCashFlow.tsx
// Intelligent date range filtering that adapts to statement period - Revolut-style UX

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO, subDays, subMonths, isBefore, isAfter, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Info } from 'lucide-react';
import type { CashFlowData, Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { colors, withOpacity } from '../../styles/colors';
import '../../styles/CashFlow.css';

interface EnhancedCashFlowProps {
  transactions: Transaction[];
  backendMetrics?: {
    total_savings: number;
    total_income: number;
    total_expenses: number;
    avg_daily_spending: number;
  };
  className?: string;
}

type DateRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

// Range configuration with days required for meaningful display
const RANGE_CONFIG: Record<DateRange, { label: string; days: number }> = {
  '1W': { label: '1W', days: 7 },
  '1M': { label: '1M', days: 30 },
  '3M': { label: '3M', days: 90 },
  '6M': { label: '6M', days: 180 },
  '1Y': { label: '1Y', days: 365 },
  'ALL': { label: 'All', days: 0 }
};

const EnhancedCashFlow: React.FC<EnhancedCashFlowProps> = ({ transactions, backendMetrics }) => {
  const [selectedRange, setSelectedRange] = useState<DateRange>('ALL');

  // Calculate statement bounds and available data span
  const { dateRangeBounds, dataSpanDays, statementPeriodText } = useMemo(() => {
    if (transactions.length === 0) {
      return {
        dateRangeBounds: { start: new Date(), end: new Date() },
        dataSpanDays: 0,
        statementPeriodText: 'No data'
      };
    }

    const dates = transactions.map(t => parseISO(t.transaction_date));
    const start = startOfDay(new Date(Math.min(...dates.map(d => d.getTime()))));
    const end = endOfDay(new Date(Math.max(...dates.map(d => d.getTime()))));
    const spanDays = differenceInDays(end, start) + 1;

    // Format the statement period in a human-readable way
    const periodText = `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')} (${spanDays} days)`;

    return {
      dateRangeBounds: { start, end },
      dataSpanDays: spanDays,
      statementPeriodText: periodText
    };
  }, [transactions]);

  // Determine which ranges are available and their coverage
  const rangeAvailability = useMemo(() => {
    const availability: Record<DateRange, { available: boolean; coverage: number; showsAllData: boolean }> = {
      '1W': { available: false, coverage: 0, showsAllData: false },
      '1M': { available: false, coverage: 0, showsAllData: false },
      '3M': { available: false, coverage: 0, showsAllData: false },
      '6M': { available: false, coverage: 0, showsAllData: false },
      '1Y': { available: false, coverage: 0, showsAllData: false },
      'ALL': { available: true, coverage: 100, showsAllData: true }
    };

    if (dataSpanDays === 0) return availability;

    // Calculate availability for each range
    // A range is "available" if we have at least 50% of its required days
    // Ranges smaller than our data span show all data
    (Object.keys(RANGE_CONFIG) as DateRange[]).forEach(range => {
      if (range === 'ALL') return;

      const requiredDays = RANGE_CONFIG[range].days;
      const coverage = Math.min((dataSpanDays / requiredDays) * 100, 100);
      const showsAllData = dataSpanDays <= requiredDays;

      // Available if we have at least 50% coverage OR if this range shows all our data
      availability[range] = {
        available: coverage >= 50 || showsAllData,
        coverage: Math.round(coverage),
        showsAllData
      };
    });

    return availability;
  }, [dataSpanDays]);

  // Auto-select the best default range on mount or when data changes
  useEffect(() => {
    if (dataSpanDays === 0) {
      setSelectedRange('ALL');
      return;
    }

    // Find the smallest range that shows all data (most granular useful view)
    // If none, show ALL
    const orderedRanges: DateRange[] = ['1W', '1M', '3M', '6M', '1Y', 'ALL'];

    for (const range of orderedRanges) {
      if (range === 'ALL') {
        setSelectedRange('ALL');
        break;
      }

      const requiredDays = RANGE_CONFIG[range].days;
      if (dataSpanDays <= requiredDays && rangeAvailability[range].available) {
        setSelectedRange(range);
        break;
      }
    }
  }, [dataSpanDays, rangeAvailability]);

  // Get available ranges to display (filter out obviously unavailable ones)
  const displayRanges = useMemo(() => {
    const ranges: DateRange[] = [];

    // Always show ranges up to the one that covers our data, plus one more for context
    let foundCoveringRange = false;
    (Object.keys(RANGE_CONFIG) as DateRange[]).forEach(range => {
      if (range === 'ALL') {
        ranges.push(range);
        return;
      }

      if (rangeAvailability[range].available) {
        ranges.push(range);
        if (rangeAvailability[range].showsAllData && !foundCoveringRange) {
          foundCoveringRange = true;
        }
      } else if (!foundCoveringRange) {
        // Show one unavailable range to indicate data limits
        ranges.push(range);
        foundCoveringRange = true;
      }
    });

    return ranges;
  }, [rangeAvailability]);

  const { cashFlowData, metrics } = useMemo(() => {
    const getDateRangeStart = (range: DateRange, endDate: Date) => {
      if (range === 'ALL') return dateRangeBounds.start;

      const potentialStart = (() => {
        switch (range) {
          case '1W': return subDays(endDate, 7);
          case '1M': return subMonths(endDate, 1);
          case '3M': return subMonths(endDate, 3);
          case '6M': return subMonths(endDate, 6);
          case '1Y': return subMonths(endDate, 12);
          default: return dateRangeBounds.start;
        }
      })();

      // Clamp to actual data bounds
      return isBefore(potentialStart, dateRangeBounds.start)
        ? dateRangeBounds.start
        : potentialStart;
    };

    const rangeStart = getDateRangeStart(selectedRange, dateRangeBounds.end);

    const filteredTransactions = transactions.filter(t => {
      const date = parseISO(t.transaction_date);
      return !isBefore(date, rangeStart) && !isAfter(date, dateRangeBounds.end);
    });

    const dailyData = filteredTransactions.reduce((acc, t) => {
      const date = t.transaction_date.split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date: format(parseISO(date), 'MMM dd'),
          rawDate: parseISO(date),
          inflow: 0,
          outflow: 0,
          cashFlow: 0,
          balance: 0,
          balanceChange: 0,
          transactionCount: 0
        };
      }

      const amount = t.transaction_amount;
      if (t.transaction_type.toLowerCase() === 'credit') {
        acc[date].inflow += amount;
      } else {
        acc[date].outflow += amount;
      }
      acc[date].transactionCount++;
      return acc;
    }, {} as Record<string, CashFlowData>);

    let runningBalance = 0;
    const data = Object.values(dailyData)
      .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())
      .map(day => {
        day.cashFlow = day.inflow - day.outflow;
        runningBalance += day.cashFlow;
        day.balance = runningBalance;
        return day;
      });

    // Calculate metrics: use backend data for "ALL" view (most accurate),
    // otherwise calculate from filtered transactions for the selected range
    const calculatedInflow = data.reduce((sum, day) => sum + day.inflow, 0);
    const calculatedOutflow = data.reduce((sum, day) => sum + day.outflow, 0);
    const calculatedNetChange = calculatedInflow - calculatedOutflow;

    // For "ALL" view, prefer backend metrics if available (more accurate)
    const useBackendMetrics = selectedRange === 'ALL' && backendMetrics;

    const totalInflow = useBackendMetrics ? backendMetrics.total_income : calculatedInflow;
    const totalOutflow = useBackendMetrics ? backendMetrics.total_expenses : calculatedOutflow;
    const netChange = useBackendMetrics ? backendMetrics.total_savings : calculatedNetChange;
    const avgDaily = useBackendMetrics
      ? backendMetrics.avg_daily_spending
      : (data.length ? calculatedNetChange / data.length : 0);

    return {
      cashFlowData: data,
      metrics: {
        totalInflow,
        totalOutflow,
        netChange,
        avgDailyChange: avgDaily
      }
    };
  }, [transactions, selectedRange, dateRangeBounds, backendMetrics]);

  return (
    <div
      className="relative overflow-hidden rounded-xl p-4"
      style={{
        background: `linear-gradient(135deg, ${withOpacity(colors.background.primary, 0.9)} 0%, ${withOpacity(colors.background.secondary, 0.9)} 100%)`,
        border: `1px solid ${colors.border.light}`
      }}
    >
      {/* Ambient background effects */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl"
        style={{ background: withOpacity(colors.primary.main, 0.15) }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl"
        style={{ background: withOpacity(colors.primary.main, 0.15) }}
      />

      <div className="relative z-10">
        {/* Header - Responsive with Statement Period */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-medium" style={{ color: colors.text.primary }}>
                Cash Flow Analysis
              </h2>
              {/* Show statement period - Revolut-style transparency */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3 h-3" style={{ color: colors.text.tertiary }} />
                <p className="text-xs" style={{ color: colors.text.tertiary }}>
                  {statementPeriodText}
                </p>
              </div>
            </div>

            {/* Smart Date Range Buttons - Only shows meaningful options */}
            <div
              className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {displayRanges.map((range) => {
                const isSelected = selectedRange === range;
                const availability = rangeAvailability[range];
                const isDisabled = !availability.available;

                return (
                  <button
                    key={range}
                    onClick={() => !isDisabled && setSelectedRange(range)}
                    disabled={isDisabled}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all flex-shrink-0"
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${colors.primary.main}, ${colors.primary.dark})`
                        : 'transparent',
                      color: isDisabled
                        ? colors.text.tertiary
                        : isSelected
                          ? colors.text.inverse
                          : colors.text.secondary,
                      border: isSelected
                        ? 'none'
                        : `1px solid ${isDisabled ? colors.border.subtle : colors.border.light}`,
                      opacity: isDisabled ? 0.5 : 1,
                      cursor: isDisabled ? 'not-allowed' : 'pointer'
                    }}
                    title={
                      isDisabled
                        ? `Not enough data for ${RANGE_CONFIG[range].label} view`
                        : `View ${RANGE_CONFIG[range].label} of data`
                    }
                  >
                    {RANGE_CONFIG[range].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Data filter message - only show when the selected range cuts off some data */}
          {selectedRange !== 'ALL' && rangeAvailability[selectedRange] && !rangeAvailability[selectedRange].showsAllData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{
                background: withOpacity(colors.status.info, 0.1),
                border: `1px solid ${withOpacity(colors.status.info, 0.2)}`
              }}
            >
              <Info className="w-3 h-3 flex-shrink-0" style={{ color: colors.status.info }} />
              <span className="text-xs" style={{ color: colors.text.secondary }}>
                Viewing last {RANGE_CONFIG[selectedRange].days} days • {dataSpanDays - RANGE_CONFIG[selectedRange].days} older days hidden
              </span>
            </motion.div>
          )}
        </div>

        {/* Metrics Cards - Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <MetricCard
            title="Total Inflow"
            value={formatCurrency(metrics.totalInflow)}
            icon={TrendingUp}
            variant="success"
          />
          <MetricCard
            title="Total Outflow"
            value={formatCurrency(metrics.totalOutflow)}
            icon={TrendingDown}
            variant="danger"
          />
          <MetricCard
            title="Net Change"
            value={formatCurrency(metrics.netChange)}
            icon={DollarSign}
            variant={metrics.netChange >= 0 ? "success" : "danger"}
          />
          <MetricCard
            title="Daily Average"
            value={formatCurrency(Math.abs(metrics.avgDailyChange))}
            icon={Calendar}
            variant={metrics.avgDailyChange >= 0 ? "success" : "danger"}
          />
        </div>

        {/* Chart */}
        <div className="relative h-[180px] sm:h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={cashFlowData}
              margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="areaBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.primary.dark} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={colors.primary.dark} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="areaCashFlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.primary.main} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={colors.primary.main} stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: colors.text.secondary }}
                dy={10}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: colors.text.secondary }}
                tickFormatter={(value) => {
                  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return value.toString();
                }}
                width={45}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div
                      className="p-3 rounded-lg shadow-lg"
                      style={{
                        background: withOpacity(colors.background.secondary, 0.95),
                        border: `1px solid ${colors.border.light}`,
                        backdropFilter: 'blur(8px)'
                      }}
                    >
                      <p className="text-xs font-medium mb-2" style={{ color: colors.text.primary }}>
                        {format(data.rawDate, 'MMMM d, yyyy')}
                      </p>
                      <div className="space-y-1">
                        <p className="text-xs" style={{ color: colors.text.secondary }}>
                          Balance: <span className="font-semibold" style={{ color: colors.text.primary }}>{formatCurrency(data.balance)}</span>
                        </p>
                        <p className="text-xs" style={{ color: colors.text.secondary }}>
                          Daily: <span className="font-semibold" style={{ color: colors.primary.main }}>{formatCurrency(data.cashFlow)}</span>
                        </p>
                        <div className="border-t pt-1 mt-1" style={{ borderColor: colors.border.light }}>
                          <p className="text-xs" style={{ color: colors.text.secondary }}>
                            In: <span className="font-medium" style={{ color: colors.status.success }}>{formatCurrency(data.inflow)}</span>
                          </p>
                          <p className="text-xs" style={{ color: colors.text.secondary }}>
                            Out: <span className="font-medium" style={{ color: colors.status.error }}>{formatCurrency(data.outflow)}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke={colors.primary.dark}
                fill="url(#areaBalance)"
                strokeWidth={2.5}
                name="Running Balance"
              />
              <Area
                type="monotone"
                dataKey="cashFlow"
                stroke={colors.primary.main}
                fill="url(#areaCashFlow)"
                strokeWidth={2}
                name="Daily Cash Flow"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend - Responsive */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-4">
          <div
            className="flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full"
            style={{
              background: withOpacity(colors.primary.dark, 0.1),
              border: `1px solid ${withOpacity(colors.primary.dark, 0.2)}`
            }}
          >
            <div
              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-1.5 sm:mr-2"
              style={{ background: colors.primary.dark }}
            />
            <span className="text-[10px] sm:text-xs font-medium" style={{ color: colors.text.primary }}>
              Running Balance
            </span>
          </div>
          <div
            className="flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full"
            style={{
              background: withOpacity(colors.primary.main, 0.1),
              border: `1px solid ${withOpacity(colors.primary.main, 0.2)}`
            }}
          >
            <div
              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-1.5 sm:mr-2"
              style={{ background: colors.primary.main }}
            />
            <span className="text-[10px] sm:text-xs font-medium" style={{ color: colors.text.primary }}>
              Daily Cash Flow
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  variant: 'success' | 'danger' | 'neutral';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  variant
}) => {
  const getVariantColor = () => {
    switch (variant) {
      case 'success': return colors.status.success;
      case 'danger': return colors.status.error;
      default: return colors.text.secondary;
    }
  };

  const variantColor = getVariantColor();

  return (
    <motion.div
      whileHover={{ scale: 1.02, translateY: -2 }}
      className="relative overflow-hidden rounded-lg p-3"
      style={{
        background: `linear-gradient(135deg, ${withOpacity(colors.background.secondary, 0.6)} 0%, ${withOpacity(colors.background.tertiary, 0.6)} 100%)`,
        border: `1px solid ${colors.border.light}`
      }}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <Icon className="w-4 h-4" style={{ color: variantColor }} />
        </div>
        <p className="text-sm font-semibold truncate" style={{ color: colors.text.primary }}>
          {value}
        </p>
        <p className="text-xs truncate" style={{ color: colors.text.secondary }}>
          {title}
        </p>
      </div>
    </motion.div>
  );
};

export default EnhancedCashFlow;
