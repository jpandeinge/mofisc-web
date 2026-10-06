import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  resolveNotificationPreferences,
} from './notificationConstants';

describe('notification preferences', () => {
  it('uses the same safe defaults for every notification surface', () => {
    expect(resolveNotificationPreferences()).toEqual(
      DEFAULT_NOTIFICATION_PREFERENCES
    );
  });

  it('merges stored preferences without losing new channel defaults', () => {
    expect(
      resolveNotificationPreferences({
        email: true,
        push: true,
      })
    ).toEqual({
      in_app: true,
      email: true,
      push: true,
      sms: false,
    });
  });
});
