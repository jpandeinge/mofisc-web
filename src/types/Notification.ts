// src/types/Notification.ts

/**
 * Notification types matching backend NotificationType enum
 */
export type NotificationType =
  | 'transaction_created'
  | 'transaction_updated'
  | 'budget_exceeded'
  | 'budget_warning'
  | 'goal_milestone'
  | 'goal_completed'
  | 'payment_due'
  | 'security_alert'
  | 'account_verification'
  | 'password_changed'
  | 'login_alert'
  | 'system_alert'
  | 'achievement_unlocked'
  | 'level_up'
  | 'streak_milestone'
  | 'badge_earned'
  | 'challenge_completed'
  | 'leaderboard_position'
  | 'daily_challenge_available'
  | 'reward_earned'
  // Subscription reminder notifications (Revolut-style)
  | 'subscription_due_tomorrow'
  | 'subscription_due_week'
  | 'subscription_charged';

/**
 * Notification priority levels matching backend
 */
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Notification channel types
 */
export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

/**
 * Notification interface matching backend Notification model
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, any>;
  is_read: boolean;
  read_at: string | null;
  delivered_via: Partial<Record<NotificationChannel, boolean>>;
  action_url?: string;
  icon?: string;
  priority: NotificationPriority;
  created_at: string;
}

/**
 * Notification history response from backend
 */
export interface NotificationHistory {
  notifications: Notification[];
  total: number;
  limit: number;
  offset: number;
  unread_count: number;
}

/**
 * Device registration request
 */
export interface RegisterDeviceRequest {
  device_token: string;
  device_type: 'ios' | 'android' | 'web';
  device_name?: string;
}

/**
 * Device registration response
 */
export interface RegisterDeviceResponse {
  success: boolean;
  message: string;
  device_id: string;
}

/**
 * Send notification request
 */
export interface SendNotificationRequest {
  notification_type: NotificationType;
  data: Record<string, any>;
  priority?: NotificationPriority;
}

/**
 * Test notification request
 */
export interface TestNotificationRequest {
  channels?: NotificationChannel[];
  message?: string;
}

/**
 * Provider status response
 */
export interface ProviderStatus {
  providers: {
    in_app: {
      configured: boolean;
      provider: string;
    };
    email: {
      configured: boolean;
      provider: string;
    };
    sms: {
      configured: boolean;
      provider: string;
    };
    push: {
      configured: boolean;
      provider: string;
    };
  };
  any_configured: boolean;
}

export type NotificationRealtimeStatus =
  | 'CONNECTING'
  | 'SUBSCRIBED'
  | 'TIMED_OUT'
  | 'CHANNEL_ERROR'
  | 'CLOSED';

export interface NotificationReceivedDetail {
  source: 'realtime' | 'fcm';
  notification?: Notification;
  payload?: unknown;
}

/**
 * Mark notifications as read request
 */
export interface MarkReadRequest {
  notification_ids: string[];
}

/**
 * Unread count response
 */
export interface UnreadCountResponse {
  unread_count: number;
}
