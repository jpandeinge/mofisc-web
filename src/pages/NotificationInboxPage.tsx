// Production notification inbox with stable entity deep links.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiAlertTriangle,
  FiAward,
  FiBarChart2,
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiCreditCard,
  FiFilter,
  FiGift,
  FiShield,
  FiStar,
  FiTarget,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { Link, useSearchParams } from 'react-router-dom';
import { notificationService } from '../services/notificationService';
import type { Notification, NotificationHistory } from '../types/Notification';
import { useAppContext } from '../context/AppContext';
import { useNotifications } from '../context/NotificationContext';
import ComingSoonPage from './ComingSoonPage';
import { secureLogger } from '../utils/secureLogger';
import { colors, withOpacity } from '../styles/colors';
import { getNotificationDestination } from '../utils/notificationNavigation';

const PAGE_SIZE = 25;

const iconMap: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  transaction_created: {
    icon: FiCreditCard,
    color: colors.primary.main,
    bg: colors.primary.light,
  },
  transaction_updated: {
    icon: FiCreditCard,
    color: colors.primary.main,
    bg: colors.primary.light,
  },
  budget_exceeded: {
    icon: FiAlertTriangle,
    color: colors.status.error,
    bg: withOpacity(colors.status.error, 0.1),
  },
  budget_warning: {
    icon: FiZap,
    color: colors.status.warning,
    bg: withOpacity(colors.status.warning, 0.1),
  },
  goal_milestone: {
    icon: FiTarget,
    color: colors.primary.main,
    bg: colors.primary.light,
  },
  goal_completed: {
    icon: FiTrendingUp,
    color: colors.status.success,
    bg: withOpacity(colors.status.success, 0.1),
  },
  security_alert: {
    icon: FiShield,
    color: colors.status.error,
    bg: withOpacity(colors.status.error, 0.1),
  },
  system_alert: {
    icon: FiAlertTriangle,
    color: colors.status.warning,
    bg: withOpacity(colors.status.warning, 0.1),
  },
  achievement_unlocked: {
    icon: FiAward,
    color: colors.status.warning,
    bg: withOpacity(colors.status.warning, 0.1),
  },
  level_up: {
    icon: FiTrendingUp,
    color: colors.status.success,
    bg: withOpacity(colors.status.success, 0.1),
  },
  streak_milestone: {
    icon: FiZap,
    color: colors.status.warning,
    bg: withOpacity(colors.status.warning, 0.1),
  },
  badge_earned: {
    icon: FiStar,
    color: colors.status.warning,
    bg: withOpacity(colors.status.warning, 0.1),
  },
  challenge_completed: {
    icon: FiCheckCircle,
    color: colors.status.success,
    bg: withOpacity(colors.status.success, 0.1),
  },
  leaderboard_position: {
    icon: FiBarChart2,
    color: colors.primary.main,
    bg: colors.primary.light,
  },
  daily_challenge_available: {
    icon: FiTarget,
    color: colors.primary.main,
    bg: colors.primary.light,
  },
  reward_earned: {
    icon: FiGift,
    color: colors.primary.main,
    bg: colors.primary.light,
  },
  subscription_due_tomorrow: {
    icon: FiCreditCard,
    color: colors.status.warning,
    bg: withOpacity(colors.status.warning, 0.1),
  },
  subscription_due_week: {
    icon: FiCreditCard,
    color: colors.primary.main,
    bg: colors.primary.light,
  },
  subscription_charged: {
    icon: FiCheckCircle,
    color: colors.status.success,
    bg: withOpacity(colors.status.success, 0.1),
  },
  payment_due: {
    icon: FiCreditCard,
    color: colors.status.warning,
    bg: withOpacity(colors.status.warning, 0.1),
  },
};

const defaultIcon = {
  icon: FiBell,
  color: colors.text.tertiary,
  bg: colors.background.tertiary,
};

const notificationTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return formatDistanceToNow(date, { addSuffix: true });
};

const NotificationsPage: React.FC = () => {
  const { setCurrentPage, currentBankAccount } = useAppContext();
  const { refreshUnreadCount } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get('filter') === 'unread' ? 'unread' : 'all';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage('Notifications');
  }, [setCurrentPage]);

  const fetchNotifications = useCallback(
    async (
      offset = 0,
      append = false,
      options: { silent?: boolean } = {}
    ) => {
      if (append) {
        setLoadingMore(true);
      } else if (!options.silent) {
        setLoading(true);
      }
      setError(null);

      try {
        let history: NotificationHistory;
        let overall: NotificationHistory | null = null;

        if (filter === 'unread' && offset === 0) {
          [history, overall] = await Promise.all([
            notificationService.getNotificationHistory(PAGE_SIZE, 0, true),
            notificationService.getNotificationHistory(1, 0, false),
          ]);
        } else {
          history = await notificationService.getNotificationHistory(
            PAGE_SIZE,
            offset,
            filter === 'unread'
          );
        }

        setNotifications((current) => {
          if (!append) return history.notifications;
          const existingIds = new Set(current.map((item) => item.id));
          return [
            ...current,
            ...history.notifications.filter((item) => !existingIds.has(item.id)),
          ];
        });
        setFilteredTotal(history.total);
        setUnreadCount(history.unread_count);
        if (overall) {
          setTotalCount(overall.total);
        } else if (filter === 'all') {
          setTotalCount(history.total);
        }
      } catch (fetchError) {
        secureLogger.error(
          'Failed to fetch notifications',
          'NotificationsPage',
          fetchError
        );
        setError('Notifications could not be loaded. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handleNotification = () => {
      void fetchNotifications(0, false, { silent: true });
    };
    window.addEventListener('notification-received', handleNotification);
    return () => {
      window.removeEventListener('notification-received', handleNotification);
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    const target = notifications.find((item) => item.id === notificationId);
    if (!target || target.is_read) return;

    try {
      await notificationService.markAsRead([notificationId]);
      setNotifications((current) =>
        filter === 'unread'
          ? current.filter((item) => item.id !== notificationId)
          : current.map((item) =>
              item.id === notificationId
                ? {
                    ...item,
                    is_read: true,
                    read_at: new Date().toISOString(),
                  }
                : item
            )
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      if (filter === 'unread') {
        setFilteredTotal((count) => Math.max(0, count - 1));
      }
      void refreshUnreadCount();
    } catch (markError) {
      secureLogger.error(
        'Failed to mark notification as read',
        'NotificationsPage',
        markError
      );
      setError('The notification could not be marked as read.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((current) =>
        filter === 'unread'
          ? []
          : current.map((item) => ({
              ...item,
              is_read: true,
              read_at: new Date().toISOString(),
            }))
      );
      setUnreadCount(0);
      if (filter === 'unread') setFilteredTotal(0);
      void refreshUnreadCount();
    } catch (markError) {
      secureLogger.error(
        'Failed to mark all notifications as read',
        'NotificationsPage',
        markError
      );
      setError('Notifications could not be marked as read.');
    }
  };

  const setFilter = (nextFilter: 'all' | 'unread') => {
    setSearchParams(nextFilter === 'unread' ? { filter: 'unread' } : {});
  };

  const readCount = Math.max(0, totalCount - unreadCount);
  const hasMore = notifications.length < filteredTotal;
  const statCards = useMemo(
    () => [
      {
        label: 'Total notifications',
        value: totalCount,
        icon: FiBell,
        color: colors.primary.main,
      },
      {
        label: 'Unread',
        value: unreadCount,
        icon: FiZap,
        color: colors.status.warning,
      },
      {
        label: 'Read',
        value: readCount,
        icon: FiCheck,
        color: colors.status.success,
      },
    ],
    [readCount, totalCount, unreadCount]
  );

  if (currentBankAccount === 'Bank Account') {
    return <ComingSoonPage />;
  }

  return (
    <main
      className="min-h-screen"
      style={{
        background: `linear-gradient(to bottom right, ${colors.background.primary}, ${colors.background.secondary})`,
      }}
    >
      <div className="mx-auto max-w-6xl p-4 sm:p-6 md:p-8 lg:p-10">
        <header className="mb-6 flex items-center gap-3">
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${colors.primary.dark}, ${colors.primary.main})`,
            }}
          >
            <FiBell className="h-6 w-6" style={{ color: colors.text.inverse }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: colors.text.primary }}>
              Notifications
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: colors.text.secondary }}>
              Financial activity, reminders, and account updates
            </p>
          </div>
        </header>

        <section
          className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"
          aria-label="Notification summary"
        >
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-xl border p-4 shadow-sm"
              style={{
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.light,
              }}
            >
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: withOpacity(color, 0.1) }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <p className="text-xs" style={{ color: colors.text.secondary }}>
                {label}
              </p>
              <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                {value}
              </p>
            </div>
          ))}
        </section>

        <section
          className="mb-4 rounded-xl border p-3 shadow-sm sm:p-4"
          style={{
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.light,
          }}
          aria-label="Notification filters"
        >
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <FiFilter className="h-4 w-4" style={{ color: colors.text.secondary }} />
              <span className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                Show
              </span>
              {(['all', 'unread'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:ring-offset-2"
                  style={
                    filter === value
                      ? {
                          backgroundColor: colors.primary.main,
                          color: colors.text.inverse,
                        }
                      : {
                          backgroundColor: colors.background.tertiary,
                          color: colors.text.secondary,
                        }
                  }
                >
                  {value === 'all' ? 'All' : `Unread${unreadCount ? ` (${unreadCount})` : ''}`}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAllAsRead()}
                className="flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#4285F4]"
                style={{
                  color: colors.status.success,
                  borderColor: withOpacity(colors.status.success, 0.3),
                  backgroundColor: withOpacity(colors.status.success, 0.08),
                }}
              >
                <FiCheck className="h-4 w-4" />
                Mark all as read
              </button>
            )}
          </div>
        </section>

        {error && (
          <div
            className="mb-4 flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
            role="alert"
            style={{
              color: colors.status.error,
              borderColor: withOpacity(colors.status.error, 0.3),
              backgroundColor: withOpacity(colors.status.error, 0.07),
            }}
          >
            <span className="text-sm font-medium">{error}</span>
            <button
              type="button"
              onClick={() => void fetchNotifications()}
              className="rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Try again
            </button>
          </div>
        )}

        <section
          className="overflow-hidden rounded-xl border shadow-sm"
          style={{
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.light,
          }}
          aria-busy={loading}
          aria-live="polite"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div
                className="h-10 w-10 animate-spin rounded-full border-4"
                style={{
                  borderColor: withOpacity(colors.primary.main, 0.2),
                  borderTopColor: colors.primary.main,
                }}
              />
              <p className="mt-3 text-sm font-medium" style={{ color: colors.text.secondary }}>
                Loading notifications…
              </p>
            </div>
          ) : !error && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div
                className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: colors.primary.light }}
              >
                <FiBell className="h-7 w-7" style={{ color: colors.primary.main }} />
              </div>
              <p className="font-bold" style={{ color: colors.text.primary }}>
                {filter === 'unread' ? 'You’re all caught up' : 'No notifications yet'}
              </p>
              <p className="mt-1 text-sm" style={{ color: colors.text.secondary }}>
                {filter === 'unread'
                  ? 'There are no unread updates.'
                  : 'New financial updates will appear here.'}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: colors.border.light }}>
              {notifications.map((notification) => {
                const iconConfig = iconMap[notification.type] || defaultIcon;
                const Icon = iconConfig.icon;
                const destination = getNotificationDestination(notification);

                return (
                  <article
                    key={notification.id}
                    className="relative border-l-4 px-4 py-4 sm:px-5"
                    style={{
                      backgroundColor: notification.is_read
                        ? 'transparent'
                        : withOpacity(colors.primary.light, 0.1),
                      borderLeftColor: notification.is_read
                        ? 'transparent'
                        : colors.primary.main,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: iconConfig.bg }}
                      >
                        <Icon className="h-4 w-4" style={{ color: iconConfig.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2
                              className="text-sm font-bold"
                              style={{
                                color: notification.is_read
                                  ? colors.text.secondary
                                  : colors.text.primary,
                              }}
                            >
                              {notification.title}
                            </h2>
                            <p
                              className="mt-1 text-sm leading-5"
                              style={{ color: colors.text.secondary }}
                            >
                              {notification.body}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <button
                              type="button"
                              aria-label={`Mark “${notification.title}” as read`}
                              title="Mark as read"
                              onClick={() => void handleMarkAsRead(notification.id)}
                              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#4285F4]"
                              style={{
                                color: colors.status.success,
                                backgroundColor: withOpacity(colors.status.success, 0.1),
                              }}
                            >
                              <FiCheck className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <time
                            dateTime={notification.created_at}
                            className="text-xs"
                            style={{ color: colors.text.tertiary }}
                          >
                            {notificationTime(notification.created_at)}
                          </time>
                          {destination && (
                            <Link
                              to={destination.to}
                              onClick={() => {
                                if (!notification.is_read) {
                                  void handleMarkAsRead(notification.id);
                                }
                              }}
                              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:ring-offset-2"
                              style={{
                                color: colors.text.inverse,
                                backgroundColor: colors.primary.main,
                              }}
                            >
                              {destination.label} →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && hasMore && (
            <div className="border-t p-4 text-center" style={{ borderColor: colors.border.light }}>
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void fetchNotifications(notifications.length, true)}
                className="min-h-10 rounded-lg border px-5 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#4285F4] disabled:cursor-wait disabled:opacity-60"
                style={{
                  color: colors.primary.main,
                  borderColor: withOpacity(colors.primary.main, 0.3),
                }}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default NotificationsPage;
