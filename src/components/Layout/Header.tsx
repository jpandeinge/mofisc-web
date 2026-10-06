// src/components/Layout/Header.tsx

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell,
  FiSettings,
  FiCreditCard,
  FiAlertTriangle,
  FiTarget,
  FiTrendingUp,
  FiShield,
  FiAward,
  FiZap,
  FiStar,
  FiCheckCircle,
  FiBarChart2,
  FiGift,
  FiLogOut,
  FiCheck,
  FiLoader
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useUser } from '../../context/UserContext';
import { Link } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import type { Notification as AppNotification } from '../../types/Notification';
import { Button } from '../UI/button';
import { cn } from '../../lib/utils';
import { colors, withOpacity } from '../../styles/colors';
import { secureLogger } from '../../utils/secureLogger';
import { useNotifications } from '../../context/NotificationContext';
import { getNotificationDestination } from '../../utils/notificationNavigation';
import { useLogout } from '../../hooks/useLogout';

export const Header = () => {
  const { user } = useAuth();
  const { isSigningOut, logout } = useLogout();
  const { effectivePlan, subscription } = useSubscription();
  const { profile } = useUser();
  const { unreadCount, refreshUnreadCount } = useNotifications();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationError, setNotificationError] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const getInitials = (email: string | undefined) => {
    if (!email) return '??';
    const parts = email.split('@')[0].split(/[._-]/);
    return parts.map(part => part[0]?.toUpperCase() || '').join('').slice(0, 2);
  };

  const planLabel = (() => {
    const plan = (effectivePlan || subscription?.plan || 'free').toLowerCase();
    const base = plan.charAt(0).toUpperCase() + plan.slice(1);
    const isTrial = subscription?.isTrial === true || subscription?.status === 'trialing';
    return isTrial && plan !== 'free' ? `${base} Trial` : base;
  })();

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationOpen(false);
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();

      const handleNewNotification = () => {
        fetchNotifications();
      };

      window.addEventListener('notification-received', handleNewNotification);

      return () => {
        window.removeEventListener('notification-received', handleNewNotification);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const history = await notificationService.getNotificationHistory(10, 0, false);
      setNotifications(history.notifications);
      setNotificationError(false);
    } catch (error) {
      setNotificationError(true);
      secureLogger.warn('Header', 'Failed to fetch notifications', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead([notificationId]);
      fetchNotifications();
      void refreshUnreadCount();
    } catch (error) {
      secureLogger.warn('Header', 'Failed to mark notification as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
      void refreshUnreadCount();
    } catch (error) {
      secureLogger.warn('Header', 'Failed to mark all as read', error);
    }
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
      transaction_created: { icon: FiCreditCard, color: colors.primary.main, bg: colors.primary.light },
      transaction_updated: { icon: FiCreditCard, color: colors.primary.main, bg: colors.primary.light },
      budget_exceeded: { icon: FiAlertTriangle, color: colors.status.error, bg: withOpacity(colors.status.error, 0.1) },
      budget_warning: { icon: FiZap, color: colors.status.warning, bg: withOpacity(colors.status.warning, 0.1) },
      goal_milestone: { icon: FiTarget, color: colors.primary.main, bg: colors.primary.light },
      goal_completed: { icon: FiTrendingUp, color: colors.status.success, bg: withOpacity(colors.status.success, 0.1) },
      security_alert: { icon: FiShield, color: colors.status.error, bg: withOpacity(colors.status.error, 0.1) },
      system_alert: { icon: FiAlertTriangle, color: colors.status.warning, bg: withOpacity(colors.status.warning, 0.1) },
      achievement_unlocked: { icon: FiAward, color: colors.status.warning, bg: withOpacity(colors.status.warning, 0.1) },
      level_up: { icon: FiTrendingUp, color: colors.status.success, bg: withOpacity(colors.status.success, 0.1) },
      streak_milestone: { icon: FiZap, color: colors.status.warning, bg: withOpacity(colors.status.warning, 0.1) },
      badge_earned: { icon: FiStar, color: colors.status.warning, bg: withOpacity(colors.status.warning, 0.1) },
      challenge_completed: { icon: FiCheckCircle, color: colors.status.success, bg: withOpacity(colors.status.success, 0.1) },
      leaderboard_position: { icon: FiBarChart2, color: colors.primary.main, bg: colors.primary.light },
      daily_challenge_available: { icon: FiTarget, color: colors.primary.main, bg: colors.primary.light },
      reward_earned: { icon: FiGift, color: colors.primary.main, bg: colors.primary.light },
      payment_due: { icon: FiCreditCard, color: colors.status.warning, bg: withOpacity(colors.status.warning, 0.1) },
      subscription_due_tomorrow: { icon: FiCreditCard, color: colors.status.warning, bg: withOpacity(colors.status.warning, 0.1) },
      subscription_due_week: { icon: FiCreditCard, color: colors.primary.main, bg: colors.primary.light },
      subscription_charged: { icon: FiCheckCircle, color: colors.status.success, bg: withOpacity(colors.status.success, 0.1) }
    };

    return iconMap[type] || { icon: FiCreditCard, color: colors.text.tertiary, bg: colors.background.tertiary };
  };

  return (
    <div className="relative z-50">
      <header
        className="relative backdrop-blur-xl border-b"
        style={{
          background: `linear-gradient(to bottom right, ${withOpacity(colors.background.secondary, 0.95)}, ${withOpacity(colors.background.primary, 0.9)}, ${withOpacity(colors.background.secondary, 0.95)})`,
          borderColor: withOpacity(colors.border.light, 0.3)
        }}
      >
        {/* Subtle gradient overlay to match sidebar */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom right, ${withOpacity(colors.primary.main, 0.03)}, transparent, ${withOpacity(colors.primary.light, 0.05)})`
          }}
        />
        <div
          className="absolute inset-y-0 left-0 w-px"
          style={{
            background: `linear-gradient(to bottom, transparent, ${withOpacity(colors.border.light, 0.4)}, transparent)`
          }}
        />

        {/* Main header content */}
        <div className="relative px-3 py-3 sm:px-4 md:px-6 flex items-center justify-between">
          {/* Center navigation */}
          <nav className="hidden items-center gap-6 sm:flex">
            <Link
              to="/insights"
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: colors.text.secondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.text.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.text.secondary}
            >
              Insights
            </Link>
            <Link
              to="/pricing"
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: colors.text.secondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.text.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.text.secondary}
            >
              Pricing
            </Link>
          </nav>

          {/* Right section with navigation and profile */}
          <div className="ml-auto flex items-center gap-4">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative transition-colors"
                    aria-label={
                      unreadCount > 0
                        ? `Notifications, ${unreadCount} unread`
                        : 'Notifications'
                    }
                    aria-expanded={isNotificationOpen}
                    aria-controls="notification-menu"
                    style={{
                      color: isNotificationOpen ? colors.text.primary : colors.text.secondary,
                      backgroundColor: isNotificationOpen ? withOpacity(colors.primary.light, 0.3) : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = colors.text.primary;
                      if (!isNotificationOpen) e.currentTarget.style.backgroundColor = withOpacity(colors.primary.light, 0.3);
                    }}
                    onMouseLeave={(e) => {
                      if (!isNotificationOpen) {
                        e.currentTarget.style.color = colors.text.secondary;
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <FiBell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold leading-none text-white bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-lg shadow-red-500/50"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </motion.span>
                    )}
                  </Button>

                  <AnimatePresence>
                    {isNotificationOpen && (
                      <motion.div
                        id="notification-menu"
                        role="dialog"
                        aria-label="Notifications"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed left-20 right-2 top-14 mt-0 w-auto max-w-none rounded-xl backdrop-blur-2xl border shadow-2xl overflow-hidden sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-[420px] sm:max-w-[420px]"
                        style={{
                          backgroundColor: colors.background.secondary,
                          borderColor: colors.border.main,
                          boxShadow: `0 20px 60px -15px ${withOpacity(colors.primary.dark, 0.3)}`
                        }}
                      >
                        {/* Header */}
                        <div
                          className="px-4 py-2 border-b flex items-center justify-between"
                          style={{
                            borderColor: withOpacity(colors.border.light, 0.4),
                            background: `linear-gradient(to right, ${withOpacity(colors.primary.main, 0.05)}, ${withOpacity(colors.primary.light, 0.1)})`
                          }}
                        >
                          <div>
                            <h3 className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                              Notifications
                            </h3>
                            {unreadCount > 0 && (
                              <p className="text-xs mt-0.5" style={{ color: colors.text.secondary }}>{unreadCount} unread</p>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-xs font-semibold transition-all"
                              style={{ color: colors.primary.main }}
                              onMouseEnter={(e) => e.currentTarget.style.color = colors.text.primary}
                              onMouseLeave={(e) => e.currentTarget.style.color = colors.primary.main}
                            >
                              Mark all read
                            </button>
                          )}
                        </div>

                        {/* Notifications list */}
                        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                          {notificationError ? (
                            <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
                              <FiAlertTriangle size={18} style={{ color: colors.status.warning }} />
                              <p className="mt-2 text-sm font-medium" style={{ color: colors.text.primary }}>
                                Notifications unavailable
                              </p>
                              <button
                                type="button"
                                onClick={() => void fetchNotifications()}
                                className="mt-2 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4285F4]"
                                style={{ color: colors.primary.main }}
                              >
                                Try again
                              </button>
                            </div>
                          ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                                style={{ backgroundColor: colors.background.primary }}
                              >
                                <FiBell size={18} style={{ color: colors.text.secondary }} />
                              </div>
                              <p className="text-sm font-medium" style={{ color: colors.text.primary }}>No notifications</p>
                              <p className="text-xs mt-0.5" style={{ color: colors.text.secondary }}>You're all caught up</p>
                            </div>
                          ) : (
                            notifications.map((notification, index) => {
                              const iconConfig = getNotificationIcon(notification.type);
                              const Icon = iconConfig.icon;
                              const destination = getNotificationDestination(notification);

                              return (
                                <motion.div
                                  key={notification.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.03 }}
                                  className="relative px-4 py-1.5 transition-all duration-200 group border-l-4"
                                  style={{
                                    backgroundColor: !notification.is_read ? withOpacity(colors.primary.light, 0.1) : 'transparent',
                                    borderLeftColor: !notification.is_read ? colors.primary.main : 'transparent',
                                    borderBottomWidth: index !== notifications.length - 1 ? '1px' : '0',
                                    borderBottomColor: withOpacity(colors.border.light, 0.3)
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.background.primary;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = !notification.is_read ? withOpacity(colors.primary.light, 0.1) : 'transparent';
                                  }}
                                >
                                  <div className="flex items-start gap-2">
                                    <div
                                      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                                      style={{ backgroundColor: iconConfig.bg }}
                                    >
                                      <Icon size={14} style={{ color: iconConfig.color }} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <h4
                                        className="text-xs font-semibold mb-0.5"
                                        style={{ color: notification.is_read ? colors.text.secondary : colors.text.primary }}
                                      >
                                        {notification.title}
                                      </h4>
                                      <p
                                        className="text-xs leading-tight mb-0.5"
                                        style={{ color: notification.is_read ? withOpacity(colors.text.secondary, 0.8) : colors.text.secondary }}
                                      >
                                        {notification.body}
                                      </p>
                                      <p className="text-xs" style={{ color: withOpacity(colors.text.secondary, 0.7) }}>
                                        {formatNotificationTime(notification.created_at)}
                                      </p>
                                      {destination && (
                                        <Link
                                          to={destination.to}
                                          onClick={() => {
                                            setIsNotificationOpen(false);
                                            if (!notification.is_read) {
                                              void handleMarkAsRead(notification.id);
                                            }
                                          }}
                                          className="mt-1 inline-flex rounded text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4285F4]"
                                          style={{ color: colors.primary.main }}
                                        >
                                          {destination.label} →
                                        </Link>
                                      )}
                                    </div>

                                    {!notification.is_read && (
                                      <div className="flex-shrink-0 flex items-center gap-1.5">
                                        <motion.button
                                          whileHover={{ scale: 1.08 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            void handleMarkAsRead(notification.id);
                                          }}
                                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]"
                                          style={{
                                            background: `linear-gradient(to bottom right, ${colors.status.success}, ${withOpacity(colors.status.success, 0.8)})`,
                                            boxShadow: `0 2px 8px ${withOpacity(colors.status.success, 0.3)}`
                                          }}
                                          title="Mark as read"
                                          aria-label={`Mark “${notification.title}” as read`}
                                        >
                                          <FiCheck size={12} style={{ color: colors.text.inverse }} strokeWidth={3} />
                                        </motion.button>

                                        <div
                                          className="w-1.5 h-1.5 rounded-full shadow-sm"
                                          style={{ backgroundColor: colors.primary.main }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })
                          )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                          <div
                            className="px-4 py-2 border-t text-center"
                            style={{
                              borderColor: withOpacity(colors.border.light, 0.4),
                              background: `linear-gradient(to right, ${withOpacity(colors.primary.main, 0.05)}, ${withOpacity(colors.primary.light, 0.1)})`
                            }}
                          >
                            <Link
                              to="/notifications"
                              className="text-xs font-semibold transition-all"
                              style={{ color: colors.primary.main }}
                              onMouseEnter={(e) => e.currentTarget.style.color = colors.text.primary}
                              onMouseLeave={(e) => e.currentTarget.style.color = colors.primary.main}
                              onClick={() => setIsNotificationOpen(false)}
                            >
                              View all notifications →
                            </Link>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile button */}
                <div className="relative" ref={profileRef}>
                  <Button
                    variant="ghost"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    aria-label={isProfileOpen ? 'Close account menu' : 'Open account menu'}
                    aria-expanded={isProfileOpen}
                    aria-controls="account-menu"
                    className={cn(
                      "flex items-center gap-2 rounded-full hover:bg-white/5 transition-all p-1.5",
                      isProfileOpen && "bg-white/5"
                    )}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-semibold shadow-md"
                      style={{
                        background: `linear-gradient(to bottom right, ${colors.primary.dark}, ${colors.primary.main})`,
                        color: colors.text.inverse
                      }}
                    >
                      {user && getInitials(user.email)}
                    </div>
                  </Button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        id="account-menu"
                        role="menu"
                        aria-label="Account"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-72 rounded-xl backdrop-blur-2xl border shadow-2xl overflow-hidden"
                        style={{
                          backgroundColor: colors.background.secondary,
                          borderColor: colors.border.main,
                          boxShadow: `0 20px 60px -15px ${withOpacity(colors.primary.dark, 0.3)}`
                        }}
                      >
                        {/* User info header */}
                        <div
                          className="px-4 py-2 border-b"
                          style={{
                            borderColor: withOpacity(colors.border.light, 0.4),
                            background: `linear-gradient(to right, ${withOpacity(colors.primary.main, 0.05)}, ${withOpacity(colors.primary.light, 0.1)})`
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shadow-md"
                              style={{
                                background: `linear-gradient(to bottom right, ${colors.primary.dark}, ${colors.primary.main})`,
                                color: colors.text.inverse
                              }}
                            >
                              {user && getInitials(user.email)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: colors.text.primary }}>{user.email}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="max-w-32 truncate text-xs" style={{ color: colors.text.secondary }}>
                                  {profile?.user_type === 'organisation'
                                    ? profile.organisation_name || 'Organisation workspace'
                                    : 'Personal Account'}
                                </p>
                                <span
                                  className="px-2 py-0.5 rounded-full text-2xs font-semibold whitespace-nowrap"
                                  style={{
                                    backgroundColor: withOpacity(colors.primary.main, 0.1),
                                    color: colors.primary.main,
                                    border: `1px solid ${withOpacity(colors.primary.main, 0.15)}`,
                                  }}
                                >
                                  {planLabel}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <nav className="py-1">
                          <Link
                            to="/settings"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm transition-all duration-200 group"
                            style={{ color: colors.text.secondary }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = colors.text.primary;
                              e.currentTarget.style.backgroundColor = colors.background.primary;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = colors.text.secondary;
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                              style={{ backgroundColor: withOpacity(colors.primary.light, 0.3) }}
                            >
                              <FiSettings className="w-3.5 h-3.5" style={{ color: colors.primary.main }} />
                            </div>
                            <span className="font-medium">Settings</span>
                          </Link>

                          <div
                            className="mx-3 my-1 h-px"
                            style={{ background: `linear-gradient(to right, transparent, ${withOpacity(colors.border.light, 0.4)}, transparent)` }}
                          />

                          <button
                            type="button"
                            role="menuitem"
                            disabled={isSigningOut}
                            aria-busy={isSigningOut}
                            onClick={() => {
                              setIsProfileOpen(false);
                              void logout();
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm transition-all duration-200 group"
                            style={{ color: colors.status.error }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = withOpacity(colors.status.error, 0.1);
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                              style={{ backgroundColor: withOpacity(colors.status.error, 0.1) }}
                            >
                              {isSigningOut ? (
                                <FiLoader className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" style={{ color: colors.status.error }} aria-hidden="true" />
                              ) : (
                                <FiLogOut className="w-3.5 h-3.5" style={{ color: colors.status.error }} aria-hidden="true" />
                              )}
                            </div>
                            <span className="font-medium">{isSigningOut ? 'Signing Out…' : 'Sign Out'}</span>
                          </button>
                        </nav>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/signin">
                  <Button
                    variant="ghost"
                    className="text-[#5F6368] hover:text-[#174EA6] hover:bg-[#D2E3FC]/30"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-gradient-to-r from-[#174EA6] to-[#4285F4] hover:opacity-90 text-white shadow-md">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
