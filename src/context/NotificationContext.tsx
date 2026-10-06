// src/context/NotificationContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { notificationService } from '../services/notificationService';
import { toast } from 'react-toastify';
import { secureLogger } from '../utils/secureLogger';
import { useAuth } from './AuthContext';
import { useUser } from './UserContext';
import { resolveNotificationPreferences } from '../config/notificationConstants';
import { useNavigate } from 'react-router-dom';
import { getNotificationDestination } from '../utils/notificationNavigation';
import type {
  NotificationReceivedDetail,
  NotificationRealtimeStatus,
} from '../types/Notification';

interface NotificationContextType {
  isInitialized: boolean;
  fcmToken: string | null;
  unreadCount: number;
  realtimeStatus: NotificationRealtimeStatus;
  initializeNotifications: () => Promise<boolean>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [realtimeStatus, setRealtimeStatus] =
    useState<NotificationRealtimeStatus>('CLOSED');
  const { user } = useAuth();
  const { profile } = useUser();
  const userId = user?.id;
  const inAppEnabled = resolveNotificationPreferences(
    (profile?.preferences as any)?.notifications
  ).in_app;

  const refreshUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      secureLogger.error('Notifications', 'Failed to refresh unread count', error);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const handleNotification = (event: Event) => {
      const detail = (event as CustomEvent<NotificationReceivedDetail>).detail;
      void refreshUnreadCount();

      const notification = detail?.notification;
      if (
        inAppEnabled &&
        notification &&
        document.visibilityState === 'visible'
      ) {
        const destination = getNotificationDestination(notification);
        toast.info(
          notification.body
            ? `${notification.title}: ${notification.body}`
            : notification.title,
          {
            toastId: `notification-${notification.id}`,
            onClick: destination
              ? () => {
                  navigate(destination.to);
                }
              : undefined,
          }
        );
      }
    };

    window.addEventListener('notification-received', handleNotification);
    return () => {
      window.removeEventListener('notification-received', handleNotification);
    };
  }, [inAppEnabled, navigate, refreshUnreadCount, userId]);

  useEffect(() => {
    if (!userId) {
      setRealtimeStatus('CLOSED');
      setIsInitialized(false);
      setFcmToken(null);
      setUnreadCount(0);
      notificationService.stopBackgroundPush();
      return;
    }

    let active = true;
    setRealtimeStatus('CONNECTING');
    const unsubscribeRealtime =
      notificationService.subscribeToInAppNotifications(
        userId,
        undefined,
        (status) => {
          if (!active) return;
          setRealtimeStatus(status);
          if (status === 'SUBSCRIBED') {
            void refreshUnreadCount();
          }
        }
      );

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshUnreadCount();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Low-frequency reconciliation protects the badge if Realtime is
    // temporarily unavailable without recreating per-component polling loops.
    const reconciliationInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshUnreadCount();
      }
    }, 300_000);

    // Background push is optional. Initialize it only when the user has
    // already granted permission; first-time permission remains user-driven.
    void notificationService.initialize().then((initialized) => {
      if (!active) return;
      setIsInitialized(initialized);
      setFcmToken(notificationService.getFcmToken());
    });

    return () => {
      active = false;
      unsubscribeRealtime();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(reconciliationInterval);
    };
  }, [refreshUnreadCount, userId]);

  const initializeNotifications = useCallback(async () => {
    try {
      const success = await notificationService.requestPermissionAndInitialize();
      setIsInitialized(success);

      if (success) {
        const token = notificationService.getFcmToken();
        setFcmToken(token);
        await refreshUnreadCount();
      } else {
        toast.warning(
          'Push notifications are unavailable or permission was denied',
          { toastId: 'notif-permission-denied' }
        );
      }
      return success;
    } catch (error) {
      secureLogger.error('Notifications', 'Failed to initialize notifications', error);
      toast.error('Failed to enable notifications', { toastId: 'notif-enable-failed' });
      return false;
    }
  }, [refreshUnreadCount]);

  const value: NotificationContextType = {
    isInitialized,
    fcmToken,
    unreadCount,
    realtimeStatus,
    initializeNotifications,
    refreshUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
