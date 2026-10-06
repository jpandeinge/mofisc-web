export interface NotificationPreferences {
  in_app: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  in_app: true,
  email: false,
  push: false,
  sms: false,
};

export const resolveNotificationPreferences = (
  value?: unknown
): NotificationPreferences => {
  if (!value || typeof value !== 'object') {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(value as Partial<NotificationPreferences>),
  };
};
