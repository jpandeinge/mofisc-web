// src/components/Overview/SubscriptionCalendar.tsx

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday
} from 'date-fns';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { formatCurrency } from '../../utils/formatters';
import SubscriptionIcon from './SubscriptionIcon';
import { Subscription } from '../../types/Subscriptions';
import { SubscriptionService } from '../../services/subscriptionService';
import SubscriptionDoughnutChart from './SubscriptionDoughnutChart';
import { SubscriptionManagementModal } from '../Subscriptions/SubscriptionManagementModal';
import '../../styles/SubscriptionCalendar.css';

interface SubscriptionCalendarProps {
  subscriptions: Subscription[];
  monthlySpend: number;
  subscriptionStats: {
    totalMonthly: number;
    uniquePlatforms: number;
    categoryBreakdown: Array<{category: string; amount: number; percentage: number}>;
    averagePerSubscription: number;
  };
  className?: string;
  onRefresh?: () => void;
  focusSubscriptionId?: string | null;
}

const SubscriptionCalendar: React.FC<SubscriptionCalendarProps> = ({
  subscriptions,
  monthlySpend: _monthlySpend,
  subscriptionStats: _subscriptionStats,
  className: _className,
  onRefresh,
  focusSubscriptionId = null,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{x: number, y: number} | null>(null);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [managedSubscription, setManagedSubscription] = useState<Subscription | null>(null);
  const _iconRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const handledFocusRef = useRef<string | null>(null);

  const focusedSubscription = useMemo(
    () =>
      focusSubscriptionId
        ? subscriptions.find(
            (subscription) => String(subscription.id) === focusSubscriptionId
          ) || null
        : null,
    [focusSubscriptionId, subscriptions]
  );

  useEffect(() => {
    if (!focusSubscriptionId || !focusedSubscription) return;
    if (handledFocusRef.current === focusSubscriptionId) return;

    handledFocusRef.current = focusSubscriptionId;
    setManagedSubscription(focusedSubscription);
    setShowManagementModal(true);
  }, [focusSubscriptionId, focusedSubscription]);

  const validSubscriptionsForMonth = useMemo(() => {
    return SubscriptionService.getValidSubscriptionsForMonth(subscriptions, currentMonth);
  }, [subscriptions, currentMonth]);

  const currentMonthSpend = useMemo(() => {
    return validSubscriptionsForMonth.reduce((total, sub) => total + sub.amount, 0);
  }, [validSubscriptionsForMonth]);

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleMouseEnter = (sub: Subscription, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (!containerRect) return;

    const tooltipWidth = 180;
    const tooltipHeight = 120;
    const margin = 10;

    // Calculate optimal position relative to icon
    let x = rect.left + rect.width / 2 - tooltipWidth / 2;
    let y = rect.top - tooltipHeight - 8;

    // Constrain to component boundaries
    const minX = containerRect.left + margin;
    const maxX = containerRect.right - tooltipWidth - margin;
    const minY = containerRect.top + margin;
    const maxY = containerRect.bottom - tooltipHeight - margin;

    // Adjust horizontal position
    if (x < minX) x = minX;
    if (x > maxX) x = maxX;

    // Adjust vertical position - flip below if needed
    if (y < minY) {
      y = rect.bottom + 8;
      // If still doesn't fit below, position at bottom of container
      if (y > maxY) y = maxY;
    }

    setTooltipPosition({ x, y });
    setSelectedSubscription(sub);
  };

  const handleMouseLeave = () => {
    setTooltipPosition(null);
    setSelectedSubscription(null);
  };

  const getOrdinalSuffix = (day: number): string => {
    const j = day % 10;
    const k = day % 100;
    if (j === 1 && k !== 11) return `${day}st`;
    if (j === 2 && k !== 12) return `${day}nd`;
    if (j === 3 && k !== 13) return `${day}rd`;
    return `${day}th`;
  };

  const UpcomingPayments = () => {
    const upcomingPayments = useMemo(() => {
      return validSubscriptionsForMonth
        .map(sub => {
          const nextPaymentDate = new Date();
          nextPaymentDate.setDate(sub.dueDate);
          if (nextPaymentDate < new Date()) {
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
          }
          return {
            ...sub,
            daysUntilPayment: Math.ceil((nextPaymentDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          };
        })
        .sort((a, b) => a.daysUntilPayment - b.daysUntilPayment);
    }, [validSubscriptionsForMonth]);

    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-[#174EA6]">Coming Up Next</h3>
          <span className="text-xs text-[#5F6368]">Next payment dates</span>
        </div>
        <div className="flex gap-3 overflow-x-auto upcoming-payments-scroll">
          {upcomingPayments.map((payment) => (
            <div
              key={payment.id}
              className={`relative group p-3 pb-4 rounded-lg bg-[#F1F3F4]/30 border hover:border-[#4285F4]/50 transition-all duration-200 min-w-[160px] flex-shrink-0 ${
                focusSubscriptionId && String(payment.id) === focusSubscriptionId
                  ? 'border-[#4285F4] ring-2 ring-[#4285F4]/30'
                  : 'border-[#5F6368]/20'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="relative">
                  <SubscriptionIcon subscription={payment} />
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#F1F3F4] flex items-center justify-center">
                    <div className={`w-2 h-2 rounded-full ${
                      payment.daysUntilPayment <= 3 ? 'bg-red-400' :
                      payment.daysUntilPayment <= 7 ? 'bg-yellow-400' :
                      'bg-green-400'
                    }`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#174EA6] truncate">
                    {payment.name}
                    {payment.isPaused && (
                      <span className="ml-1 text-xs text-yellow-600">(Paused)</span>
                    )}
                  </p>
                  <p className="text-xs text-[#5F6368]">
                    {payment.daysUntilPayment === 0 ? 'Due today' :
                     payment.daysUntilPayment === 1 ? 'Due tomorrow' :
                     `Due in ${payment.daysUntilPayment} days`}
                  </p>
                </div>
              </div>
              <div className="flex items-end justify-between mb-1">
                <div className="text-xs font-medium text-[#174EA6]">
                  {formatCurrency(payment.amount)}
                </div>
                <div className="text-xs text-[#5F6368]">
                  {format(new Date().setDate(payment.dueDate), 'MMM d')}
                </div>
              </div>

              {/* Manage button - shows on hover */}
              <button
                onClick={() => {
                  setManagedSubscription(payment);
                  setShowManagementModal(true);
                }}
                className="w-full mt-2 px-2 py-1 text-xs text-[#4285F4] hover:text-[#174EA6] hover:bg-[#4285F4]/10 rounded transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
              >
                Manage
              </button>

              {/* Spotify-like progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#5F6368]/20 rounded-b-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#4285F4] to-[#4285F4] rounded-lg transition-all duration-300"
                  style={{
                    width: `${100 - (payment.daysUntilPayment / 30 * 100)}%`,
                    opacity: payment.daysUntilPayment <= 7 ? '0.8' : '0.4'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(monthEnd);
    while (endDate.getDay() !== 6) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const dateArray = eachDayOfInterval({ start: startDate, end: endDate });

    return dateArray.map((day) => {
      const dayNumber = day.getDate();
      const isCurrentMonth = isSameMonth(day, currentMonth);
      const isCurrentDay = isToday(day);
      const daySubscriptions = validSubscriptionsForMonth
        .filter(sub => sub.dueDate === dayNumber && isCurrentMonth);


      return (
        <div
          key={day.toISOString()}
          className={`calendar-day ${isCurrentMonth ? '' : 'other-month'} ${isCurrentDay ? 'current-day' : ''}`}
        >
          <span className="day-number">{dayNumber}</span>
          <div className="subscription-icons">
            {daySubscriptions.map((sub) => (
              <div
                key={sub.id}
                className={`subscription-icon-wrapper ${sub.isPaused ? 'opacity-50 grayscale' : ''}`}
                onMouseEnter={(e) => handleMouseEnter(sub, e)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="subscription-icon relative">
                  <SubscriptionIcon subscription={sub} />
                  {sub.isPaused && (
                    <div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border border-white"
                      title="Paused"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden overflow-y-auto p-4 backdrop-blur-lg bg-gradient-to-br from-[#F1F3F4]/90 to-[#FFFFFF]/90 rounded-xl border border-[#5F6368]/20 h-full">
      {/* Ambient background effects */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#4285F4]/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#4285F4]/20 rounded-full blur-3xl" />

      <div className="relative z-10">
        {focusSubscriptionId && !focusedSubscription && subscriptions.length > 0 && (
          <div
            className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800"
            role="status"
          >
            This subscription is no longer available.
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 items-start justify-items-center lg:justify-items-start">
          <div className="subscription-calendar w-full max-w-[320px] lg:max-w-[280px]" style={{position: 'relative', zIndex: 10}}>
            <h3 className="main-title">Subscriptions</h3>
            <div className="calendar-header">
              <div className="calendar-header-row">
                <div className="month-navigation">
                  <button onClick={goToPreviousMonth} className="nav-button">
                    <FaChevronLeft />
                  </button>
                  <h2 className="month-year">{format(currentMonth, 'MMMM yyyy')}</h2>
                  <button onClick={goToNextMonth} className="nav-button">
                    <FaChevronRight />
                  </button>
                </div>
                <div className="monthly-spend">
                  <span className="spend-label">Monthly Spend</span>
                  <span className="spend-amount">{formatCurrency(currentMonthSpend)}</span>
                </div>
              </div>
            </div>
            <div className="days-of-week">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                <div key={day} className="day-of-week">{day}</div>
              ))}
            </div>
            <div className="calendar-grid">
              {renderCalendarDays()}
            </div>
          </div>

          <div className="subscription-doughnut-container w-full max-w-[320px] lg:max-w-none lg:w-auto flex items-center justify-center lg:justify-start lg:items-start">
            <div className="subscription-doughnut-wrapper">
              <SubscriptionDoughnutChart
                subscriptions={validSubscriptionsForMonth}
                monthlySpend={currentMonthSpend}
                selectedSubscription={selectedSubscription}
                currentMonth={currentMonth}
              />
            </div>
          </div>
        </div>

        {/* Upcoming payments */}
        <UpcomingPayments />
      </div>

      {/* Portal-based tooltip */}
      {selectedSubscription && tooltipPosition && createPortal(
        <div
          className="subscription-details-portal"
          style={{
            position: 'fixed',
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            width: '180px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '8px',
            zIndex: 9999,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            pointerEvents: 'auto'
          }}
          onMouseEnter={() => {
            // Keep tooltip open when hovering over it
          }}
          onMouseLeave={handleMouseLeave}
        >
          <div className="subscription-details-content">
            <SubscriptionIcon subscription={selectedSubscription} />
            <span className="subscription-name">
              {selectedSubscription.name}
              {selectedSubscription.isPaused && (
                <span className="ml-1 text-xs text-yellow-600 font-medium">(Paused)</span>
              )}
            </span>
            <span className="subscription-amount">{formatCurrency(selectedSubscription.amount)}</span>
            <span className="subscription-frequency">
              Every month on the {getOrdinalSuffix(selectedSubscription.dueDate)}
            </span>
            <span className="subscription-next-payment">Next payment</span>
            <span className="subscription-total">
              Total since {format(selectedSubscription.startDate, 'MM/yy')}
            </span>
            <span className="subscription-total-amount">
              {formatCurrency(selectedSubscription.totalSpent)}
            </span>
            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setManagedSubscription(selectedSubscription);
                  setShowManagementModal(true);
                  setTooltipPosition(null);
                  setSelectedSubscription(null);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Manage
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Subscription Management Modal */}
      <SubscriptionManagementModal
        isOpen={showManagementModal}
        onClose={() => {
          setShowManagementModal(false);
          setManagedSubscription(null);
        }}
        subscription={managedSubscription}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};

export default SubscriptionCalendar;
