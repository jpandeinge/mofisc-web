// src/services/notificationService.ts
import axios from 'axios';
import { requestNotificationPermission, subscribeToMessages } from '../config/firebase';
import { supabase } from '../lib/supabase';
import { secureLogger } from '../utils/secureLogger';
import type {
  Notification as AppNotification,
  NotificationHistory,
  NotificationReceivedDetail,
  NotificationRealtimeStatus,
  ProviderStatus
} from '../types/Notification';

const LOG_CONTEXT = 'NotificationService';
const NOTIFICATION_REQUEST_TIMEOUT_MS = 15000;

export const resolveNotificationApiBase = (configuredUrl?: string): string => {
  const root = (
    configuredUrl?.trim() || 'http://localhost:8000/api'
  ).replace(/\/+$/, '');

  if (root.endsWith('/api/v1')) {
    return root;
  }
  if (root.endsWith('/api')) {
    return `${root}/v1`;
  }
  return `${root}/api/v1`;
};

const API_V1_URL = resolveNotificationApiBase(process.env.REACT_APP_API_URL);

export const toAppNotification = (
  record: Record<string, any>
): AppNotification => ({
  id: String(record.id),
  type: record.notification_type ?? record.type,
  title: record.title ?? 'New notification',
  body: record.body ?? '',
  data: record.data ?? {},
  is_read:
    typeof record.is_read === 'boolean'
      ? record.is_read
      : Boolean(record.read_at),
  read_at: record.read_at ?? null,
  delivered_via: record.delivered_via ?? {},
  action_url: record.action_url ?? undefined,
  icon: record.icon ?? undefined,
  priority: record.priority ?? 'medium',
  created_at: record.created_at ?? new Date().toISOString(),
});

// Re-export types for convenience
export type { AppNotification as Notification, NotificationHistory };

class NotificationService {
  private fcmToken: string | null = null;
  private messageUnsubscribe: (() => void) | null = null;
  private recentMessageIds: Map<string, number> = new Map();
  private readonly tabId: string;
  private readonly primaryTabKey = 'notification_primary_tab';

  constructor() {
    this.tabId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this.initPrimaryTabCoordination();
  }

  /**
   * Initialize notification service.
   * Only requests permission if already granted (to avoid browser warnings).
   * For first-time permission request, use requestPermissionAndInitialize() from a user gesture.
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if permission is already granted before requesting
      // This avoids the browser warning about requesting permission outside user gesture
      if ('Notification' in window && Notification.permission === 'granted') {
        // Permission already granted - safe to get token
        const tokenPromise = requestNotificationPermission();
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 3000)
        );

        const token = await Promise.race([tokenPromise, timeoutPromise]);

        if (token) {
          this.fcmToken = token;
          this.persistToken(token);
          this.registerDevice(token).catch(() => {});
          this.setupMessageListener();
          return true;
        }
      } else {
        // Permission not granted - don't request automatically
        // User should click a button to enable notifications
        secureLogger.info(LOG_CONTEXT, 'Notifications not enabled - permission not granted');
      }

      return false;
    } catch (error) {
      secureLogger.warn(LOG_CONTEXT, 'Failed to initialize notification service (non-critical)', error);
      return false;
    }
  }

  /**
   * Request notification permission and initialize.
   * MUST be called from a user gesture (click handler) to avoid browser warnings.
   */
  async requestPermissionAndInitialize(): Promise<boolean> {
    try {
      const tokenPromise = requestNotificationPermission();
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 5000) // 5 second timeout for user interaction
      );

      const token = await Promise.race([tokenPromise, timeoutPromise]);

      if (token) {
        this.fcmToken = token;
        this.persistToken(token);
        this.registerDevice(token).catch(() => {});
        this.setupMessageListener();
        return true;
      }

      return false;
    } catch (error) {
      secureLogger.warn(LOG_CONTEXT, 'Failed to request notification permission', error);
      return false;
    }
  }

  /**
   * Register device token with backend
   */
  async registerDevice(token: string, deviceName?: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.post(
        `${API_V1_URL}/notifications/devices/register`,
        {
          device_token: token,
          device_type: 'web',
          device_name: deviceName || this.getDeviceName()
        },
        {
          headers,
          timeout: 30000 // 30 second timeout - allow time for backend processing
        }
      );

      secureLogger.info(LOG_CONTEXT, 'Device registered', {
        status: response.status,
        deviceType: 'web'
      });
    } catch (error) {
      // Log as warning instead of error - notifications are optional
      secureLogger.warn(LOG_CONTEXT, 'Failed to register device (non-critical)', error);
      // Don't throw - allow app to continue without notifications
    }
  }

  /**
   * Unregister device
   */
  async unregisterDevice(deviceId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.delete(
        `${API_V1_URL}/notifications/devices/${deviceId}`,
        { headers }
      );

      secureLogger.info(LOG_CONTEXT, 'Device unregistered', { deviceId });
    } catch (error) {
      secureLogger.error(LOG_CONTEXT, 'Failed to unregister device', error);
      throw error;
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(
    limit: number = 50,
    offset: number = 0,
    unreadOnly: boolean = false
  ): Promise<NotificationHistory> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get<NotificationHistory>(
        `${API_V1_URL}/notifications/history`,
        {
          params: { limit, offset, unread_only: unreadOnly },
          headers,
          timeout: NOTIFICATION_REQUEST_TIMEOUT_MS,
        }
      );

      return response.data;
    } catch (error) {
      secureLogger.error(LOG_CONTEXT, 'Failed to get notification history', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get<{ unread_count: number }>(
        `${API_V1_URL}/notifications/unread-count`,
        { headers, timeout: NOTIFICATION_REQUEST_TIMEOUT_MS }
      );

      return response.data.unread_count;
    } catch (error) {
      secureLogger.error(LOG_CONTEXT, 'Failed to get unread count', error);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[]): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.post(
        `${API_V1_URL}/notifications/mark-read`,
        { notification_ids: notificationIds },
        { headers, timeout: NOTIFICATION_REQUEST_TIMEOUT_MS }
      );
    } catch (error) {
      secureLogger.error(LOG_CONTEXT, 'Failed to mark notifications as read', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.post(
        `${API_V1_URL}/notifications/mark-all-read`,
        {},
        { headers, timeout: NOTIFICATION_REQUEST_TIMEOUT_MS }
      );
    } catch (error) {
      secureLogger.error(LOG_CONTEXT, 'Failed to mark all notifications as read', error);
      throw error;
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(
    channels?: string[],
    message?: string
  ): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.post(
        `${API_V1_URL}/notifications/test`,
        { channels, message },
        { headers }
      );
    } catch (error) {
      secureLogger.error(LOG_CONTEXT, 'Failed to send test notification', error);
      throw error;
    }
  }

  /**
   * Check notification provider status
   */
  async getProviderStatus(): Promise<ProviderStatus> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get<ProviderStatus>(
        `${API_V1_URL}/notifications/status`,
        { headers }
      );

      return response.data;
    } catch (error) {
      secureLogger.error(LOG_CONTEXT, 'Failed to get provider status', error);
      throw error;
    }
  }

  /**
   * Subscribe to inserts in the user's RLS-protected notification stream.
   * The database remains the source of truth; callers should refresh history
   * whenever the channel (re)subscribes to reconcile any missed events.
   */
  subscribeToInAppNotifications(
    userId: string,
    onNotification?: (notification: AppNotification) => void,
    onStatus?: (status: NotificationRealtimeStatus) => void
  ): () => void {
    const channel = supabase
      .channel(`notifications:${userId}:${this.tabId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = toAppNotification(
            payload.new as Record<string, any>
          );

          if (this.rememberMessageId(notification.id)) {
            return;
          }

          onNotification?.(notification);
          this.dispatchNotificationReceived({
            source: 'realtime',
            notification,
          });
        }
      )
      .subscribe((status) => {
        onStatus?.(status as NotificationRealtimeStatus);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }

  /**
   * Set up foreground message listener
   */
  private setupMessageListener(): void {
    if (this.messageUnsubscribe) {
      return;
    }

    this.messageUnsubscribe = subscribeToMessages((payload) => {
      this.handleForegroundMessage(payload);
    });
  }

  private handleForegroundMessage(payload: any): void {
    if (!this.shouldHandleMessages()) {
      return;
    }

    const messageId =
      payload?.data?.notification_id ||
      payload?.data?.id ||
      payload?.messageId ||
      payload?.message_id;

    if (messageId && this.rememberMessageId(String(messageId))) {
      return;
    }

    secureLogger.info(LOG_CONTEXT, 'Received foreground message', {
      hasNotificationPayload: Boolean(payload?.notification),
      hasDataPayload: Boolean(payload?.data)
    });

    // Data-only messages: title and body are in payload.data
    // This prevents duplicate notifications from FCM auto-display
    const title = payload.data?.title || payload.notification?.title;
    const body = payload.data?.body || payload.notification?.body;

    if (title || body) {
      this.showNotification(
        title || 'New Notification',
        body || '',
        payload.data
      );
    }

    this.dispatchNotificationReceived({
      source: 'fcm',
      payload,
    });
  }

  private rememberMessageId(messageId: string): boolean {
    const now = Date.now();
    const lastSeen = this.recentMessageIds.get(messageId);
    if (lastSeen && now - lastSeen < 30000) {
      return true;
    }

    this.recentMessageIds.set(messageId, now);
    this.pruneRecentMessageIds(now);
    return false;
  }

  private dispatchNotificationReceived(
    detail: NotificationReceivedDetail
  ): void {
    window.dispatchEvent(
      new CustomEvent<NotificationReceivedDetail>('notification-received', {
        detail,
      })
    );
  }

  private pruneRecentMessageIds(now: number): void {
    const maxAgeMs = 5 * 60 * 1000;
    this.recentMessageIds.forEach((timestamp, id) => {
      if (now - timestamp > maxAgeMs) {
        this.recentMessageIds.delete(id);
      }
    });
  }

  private initPrimaryTabCoordination(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const claimPrimaryIfVisible = () => {
      if (document.visibilityState === 'visible') {
        this.claimPrimaryTab();
      }
    };

    window.addEventListener('focus', claimPrimaryIfVisible);
    document.addEventListener('visibilitychange', claimPrimaryIfVisible);
    window.addEventListener('beforeunload', () => {
      const record = this.getPrimaryTabRecord();
      if (record?.id === this.tabId) {
        window.localStorage.removeItem(this.primaryTabKey);
      }
    });

    claimPrimaryIfVisible();
  }

  private shouldHandleMessages(): boolean {
    if (typeof window === 'undefined') {
      return true;
    }

    if (document.visibilityState !== 'visible') {
      return false;
    }

    return this.isPrimaryTab();
  }

  private isPrimaryTab(): boolean {
    const now = Date.now();
    const record = this.getPrimaryTabRecord();
    if (!record || now - record.ts > 15000) {
      this.setPrimaryTabRecord({ id: this.tabId, ts: now });
      return true;
    }

    return record.id === this.tabId;
  }

  private claimPrimaryTab(): void {
    const now = Date.now();
    const record = this.getPrimaryTabRecord();
    if (!record || now - record.ts > 15000 || record.id === this.tabId) {
      this.setPrimaryTabRecord({ id: this.tabId, ts: now });
    }
  }

  private getPrimaryTabRecord(): { id: string; ts: number } | null {
    try {
      const raw = window.localStorage.getItem(this.primaryTabKey);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!parsed?.id || typeof parsed.ts !== 'number') {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private setPrimaryTabRecord(record: { id: string; ts: number }): void {
    try {
      window.localStorage.setItem(this.primaryTabKey, JSON.stringify(record));
    } catch (error) {
      secureLogger.warn(LOG_CONTEXT, 'Failed to persist primary tab state', error);
    }
  }

  private persistToken(token: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const storedToken = window.localStorage.getItem('fcm_token');
      if (storedToken !== token) {
        window.localStorage.setItem('fcm_token', token);
      }
    } catch (error) {
      secureLogger.warn(LOG_CONTEXT, 'Failed to access localStorage for FCM token', error);
    }
  }

  /**
   * Show browser notification
   */
  private showNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data
      });

      notification.onclick = () => {
        // Handle notification click
        if (data?.action_url) {
          window.location.href = data.action_url;
        }
        notification.close();
      };
    }
  }

  /**
   * Get auth headers with Supabase session token
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        secureLogger.error(LOG_CONTEXT, 'Failed to get session', error);
        throw new Error('Failed to get authentication session');
      }

      if (!session?.access_token) {
        secureLogger.error(LOG_CONTEXT, 'No access token in session', new Error('Missing token'));
        throw new Error('No authentication token found');
      }

      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      };
    } catch (error) {
      secureLogger.error(LOG_CONTEXT, 'Authentication error', error);
      throw error;
    }
  }

  /**
   * Get device name
   */
  private getDeviceName(): string {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown Browser';

    if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
    } else if (userAgent.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
    } else if (userAgent.indexOf('Safari') > -1) {
      browserName = 'Safari';
    } else if (userAgent.indexOf('Edge') > -1) {
      browserName = 'Edge';
    }

    const platform = navigator.platform || 'Unknown Platform';

    return `${browserName} on ${platform}`;
  }

  /**
   * Get FCM token
   */
  getFcmToken(): string | null {
    return this.fcmToken;
  }

  stopBackgroundPush(): void {
    this.messageUnsubscribe?.();
    this.messageUnsubscribe = null;
    this.fcmToken = null;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
