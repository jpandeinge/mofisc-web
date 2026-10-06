// src/components/Insights/CashFlowCalendar.tsx

import React, { useMemo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { colors, withOpacity } from '../../styles/colors';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface CashFlowCalendarProps {
  transactions: Transaction[];
}

interface DailyCashFlow {
  date: string;
  income: number;
  expense: number;
  netFlow: number;
}

const CashFlowCalendar: React.FC<CashFlowCalendarProps> = ({ transactions }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();
  const monthNumber = monthIndex + 1;

  const daysInMonth = useMemo(
    () => new Date(year, monthIndex + 1, 0).getDate(),
    [year, monthIndex]
  );

  const getDateKey = useCallback(
    (day: number): string => {
      const mm = String(monthNumber).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      return `${year}-${mm}-${dd}`;
    },
    [year, monthNumber]
  );

  const todayKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const monthYearDisplay = useMemo(
    () => currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
    [currentDate]
  );

  // Build daily cashflow map
  const dailyCashFlow = useMemo(() => {
    const flowMap = new Map<string, DailyCashFlow>();

    for (const t of transactions) {
      const date = t.transaction_date?.split('T')[0];
      if (!date) continue;

      const existing = flowMap.get(date) || { date, income: 0, expense: 0, netFlow: 0 };
      const amount = Math.abs(t.transaction_amount || 0);
      const type = t.transaction_type?.toLowerCase();

      if (type === 'credit') existing.income += amount;
      else if (type === 'debit') existing.expense += amount;

      existing.netFlow = existing.income - existing.expense;
      flowMap.set(date, existing);
    }

    return flowMap;
  }, [transactions]);

  // Calendar grid
  const calendarData = useMemo(() => {
    const firstDay = new Date(year, monthIndex, 1);
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    return days;
  }, [year, monthIndex, daysInMonth]);

  const goToPreviousMonth = () => setCurrentDate(new Date(year, monthIndex - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, monthIndex + 1, 1));

  // Compact format for cell display
  const formatCompact = (amount: number) => {
    const abs = Math.abs(amount);
    const sign = amount >= 0 ? '+' : '-';
    if (abs >= 1000000) return `${sign}${(abs / 1000000).toFixed(1)}M`;
    if (abs >= 100000) return `${sign}${(abs / 1000).toFixed(0)}k`;
    if (abs >= 10000) return `${sign}${(abs / 1000).toFixed(1)}k`;
    if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(2)}k`;
    return `${sign}${abs.toFixed(0)}`;
  };

  // Monthly totals
  const monthlyTotals = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const key = getDateKey(d);
      const flow = dailyCashFlow.get(key);
      if (!flow) continue;
      income += flow.income;
      expense += flow.expense;
    }

    return { income, expense, netFlow: income - expense };
  }, [daysInMonth, getDateKey, dailyCashFlow]);

  const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden h-full flex flex-col"
      style={{
        background: colors.background.secondary,
        border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
        height: '500px',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: `1px solid ${withOpacity(colors.text.secondary, 0.2)}` }}
      >
        <div>
          <h3 className="text-base font-semibold" style={{ color: colors.text.primary }}>
            Daily Cash Flow
          </h3>
          <p className="text-xs mt-0.5" style={{ color: colors.text.secondary }}>
            Track daily income & expenses
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            style={{
              border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
              color: colors.text.secondary,
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            className="px-4 py-2 rounded-lg text-sm font-medium min-w-[140px] text-center"
            style={{
              border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
              background: withOpacity(colors.background.primary, 0.5),
              color: colors.text.primary,
            }}
          >
            {monthYearDisplay}
          </div>

          <button
            onClick={goToNextMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            style={{
              border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
              color: colors.text.secondary,
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="px-4 py-3 flex-1 flex flex-col overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayHeaders.map((d, idx) => (
            <div
              key={idx}
              className="text-center text-[10px] font-semibold py-1"
              style={{ color: colors.text.tertiary }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarData.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-[46px]" />;
            }

            const dateKey = getDateKey(day);
            const flow = dailyCashFlow.get(dateKey);
            const net = flow?.netFlow ?? 0;
            const hasData = net !== 0;
            const isPositive = net > 0;
            const isToday = dateKey === todayKey;
            const isHovered = hoveredDay === dateKey;

            return (
              <div key={dateKey} className="relative">
                <motion.div
                  onMouseEnter={() => setHoveredDay(dateKey)}
                  onMouseLeave={() => setHoveredDay(null)}
                  whileHover={{ scale: 1.04, zIndex: 10 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="h-[46px] rounded-md flex flex-col items-center justify-center cursor-pointer relative"
                  style={{
                    background: hasData
                      ? isPositive
                        ? withOpacity(colors.semantic.income, isHovered ? 0.2 : 0.1)
                        : withOpacity(colors.semantic.expense, isHovered ? 0.2 : 0.1)
                      : isHovered ? withOpacity(colors.text.secondary, 0.05) : 'transparent',
                    border: isToday
                      ? `2px solid ${colors.primary.main}`
                      : hasData
                      ? `1px solid ${isPositive
                          ? withOpacity(colors.semantic.income, isHovered ? 0.4 : 0.2)
                          : withOpacity(colors.semantic.expense, isHovered ? 0.4 : 0.2)
                        }`
                      : `1px solid ${withOpacity(colors.text.secondary, isHovered ? 0.15 : 0.08)}`,
                    boxShadow: isHovered && hasData
                      ? isPositive
                        ? `0 4px 12px ${withOpacity(colors.semantic.income, 0.3)}`
                        : `0 4px 12px ${withOpacity(colors.semantic.expense, 0.3)}`
                      : 'none',
                    transition: 'background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  <span
                    className="text-xs font-semibold leading-none"
                    style={{
                      color: isToday
                        ? colors.primary.main
                        : hasData
                        ? isPositive
                          ? colors.semantic.income
                          : colors.semantic.expense
                        : colors.text.primary,
                    }}
                  >
                    {day}
                  </span>

                  {hasData && (
                    <span
                      className="text-[8px] font-bold mt-1 leading-none whitespace-nowrap"
                      style={{
                        color: isPositive ? colors.semantic.income : colors.semantic.expense,
                      }}
                    >
                      {formatCompact(net)}
                    </span>
                  )}
                </motion.div>

                {/* Custom Tooltip */}
                <AnimatePresence>
                  {isHovered && flow && (() => {
                    // Calculate position based on cell location
                    const colIndex = idx % 7;
                    const rowIndex = Math.floor(idx / 7);

                    // Position tooltip based on cell location
                    const isTopRow = rowIndex <= 1;
                    const isLeftEdge = colIndex <= 1;
                    const isRightEdge = colIndex >= 5;

                    // Horizontal position
                    let horizontalClass = 'left-1/2 -translate-x-1/2';
                    let arrowHorizontalClass = 'left-1/2 -translate-x-1/2';
                    if (isLeftEdge) {
                      horizontalClass = 'left-0';
                      arrowHorizontalClass = 'left-4';
                    } else if (isRightEdge) {
                      horizontalClass = 'right-0';
                      arrowHorizontalClass = 'right-4';
                    }

                    // Vertical position - show below for top rows
                    const showBelow = isTopRow;
                    const verticalClass = showBelow ? 'top-full mt-2' : 'bottom-full mb-2';
                    const arrowVerticalClass = showBelow ? '-top-1' : '-bottom-1';
                    const arrowRotation = showBelow ? 'rotate-[225deg]' : 'rotate-45';

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: showBelow ? -5 : 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: showBelow ? -5 : 5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute z-50 ${horizontalClass} ${verticalClass} pointer-events-none`}
                        style={{ minWidth: '130px' }}
                      >
                        <div
                          className="rounded-lg px-2.5 py-2 shadow-lg"
                          style={{
                            background: colors.background.secondary,
                            border: `1px solid ${withOpacity(colors.text.secondary, 0.15)}`,
                          }}
                        >
                          <p className="text-[9px] font-medium mb-1" style={{ color: colors.text.primary }}>
                            {new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                          <div className="space-y-0.5">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-[8px]" style={{ color: colors.text.secondary }}>Income</span>
                              <span className="text-[8px] font-semibold" style={{ color: colors.semantic.income }}>
                                +{formatCurrency(flow.income).replace('NAD ', '')}
                              </span>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-[8px]" style={{ color: colors.text.secondary }}>Expense</span>
                              <span className="text-[8px] font-semibold" style={{ color: colors.semantic.expense }}>
                                -{formatCurrency(flow.expense).replace('NAD ', '')}
                              </span>
                            </div>
                            <div
                              className="flex justify-between items-center gap-2 pt-1 mt-0.5"
                              style={{ borderTop: `1px solid ${withOpacity(colors.text.secondary, 0.1)}` }}
                            >
                              <span className="text-[8px] font-medium" style={{ color: colors.text.primary }}>Net</span>
                              <span
                                className="text-[9px] font-bold"
                                style={{ color: flow.netFlow >= 0 ? colors.semantic.income : colors.semantic.expense }}
                              >
                                {flow.netFlow >= 0 ? '+' : ''}{formatCurrency(flow.netFlow).replace('NAD ', '')}
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Tooltip Arrow */}
                        <div
                          className={`absolute ${arrowHorizontalClass} ${arrowVerticalClass} w-2 h-2 ${arrowRotation}`}
                          style={{
                            background: colors.background.secondary,
                            borderRight: `1px solid ${withOpacity(colors.text.secondary, 0.15)}`,
                            borderBottom: `1px solid ${withOpacity(colors.text.secondary, 0.15)}`,
                          }}
                        />
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Monthly Summary */}
        <div
          className="mt-3 pt-3 grid grid-cols-3 gap-2 flex-shrink-0"
          style={{ borderTop: `1px solid ${withOpacity(colors.text.secondary, 0.2)}` }}
        >
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-wider font-medium" style={{ color: colors.text.tertiary }}>
              Income
            </p>
            <p className="text-xs font-bold mt-0.5" style={{ color: colors.semantic.income }}>
              +{monthlyTotals.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="text-center">
            <p className="text-[9px] uppercase tracking-wider font-medium" style={{ color: colors.text.tertiary }}>
              Expense
            </p>
            <p className="text-xs font-bold mt-0.5" style={{ color: colors.semantic.expense }}>
              -{monthlyTotals.expense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="text-center">
            <p className="text-[9px] uppercase tracking-wider font-medium" style={{ color: colors.text.tertiary }}>
              Net Flow
            </p>
            <p
              className="text-xs font-bold mt-0.5"
              style={{
                color: monthlyTotals.netFlow >= 0 ? colors.semantic.income : colors.semantic.expense,
              }}
            >
              {monthlyTotals.netFlow >= 0 ? '+' : ''}
              {monthlyTotals.netFlow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CashFlowCalendar;
