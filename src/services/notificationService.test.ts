jest.mock('../config/firebase', () => ({
  auth: {},
  initializeFirebase: jest.fn(),
  isFirebaseInitialized: jest.fn(() => false),
  messaging: null,
}));

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

import {
  notificationService,
  resolveNotificationApiBase,
  toAppNotification,
} from './notificationService';
import { supabase } from '../lib/supabase';

describe('notification service helpers', () => {
  describe('resolveNotificationApiBase', () => {
    it.each([
      [undefined, 'http://localhost:8000/api/v1'],
      ['https://api.example.com', 'https://api.example.com/api/v1'],
      ['https://api.example.com/api', 'https://api.example.com/api/v1'],
      ['https://api.example.com/api/v1/', 'https://api.example.com/api/v1'],
    ])('normalizes %s to %s', (configuredUrl, expected) => {
      expect(resolveNotificationApiBase(configuredUrl)).toBe(expected);
    });
  });

  it('maps a realtime database record to the application model', () => {
    expect(
      toAppNotification({
        id: 'notification-1',
        user_id: 'user-1',
        notification_type: 'challenge_completed',
        title: 'Challenge completed',
        body: 'You completed your challenge.',
        priority: 'high',
        image_url: null,
        action_url: '/challenges/1',
        action_data: { challenge_id: '1' },
        read_at: null,
        created_at: '2026-07-27T10:00:00.000Z',
        scheduled_for: null,
        sent_at: '2026-07-27T10:00:01.000Z',
        delivered_via: { in_app: true },
        data: { points: 10 },
      })
    ).toEqual({
      id: 'notification-1',
      type: 'challenge_completed',
      title: 'Challenge completed',
      body: 'You completed your challenge.',
      data: { points: 10 },
      is_read: false,
      read_at: null,
      delivered_via: { in_app: true },
      action_url: '/challenges/1',
      icon: undefined,
      priority: 'high',
      created_at: '2026-07-27T10:00:00.000Z',
    });
  });

  it('subscribes to only the authenticated user notification inserts', () => {
    const channel: Record<string, jest.Mock> = {};
    const subscribe = jest.fn().mockImplementation((onStatus) => {
      onStatus('SUBSCRIBED');
      return channel;
    });
    const on = jest.fn().mockReturnValue({ subscribe });
    channel.on = on;
    channel.subscribe = subscribe;
    const channelMock = supabase.channel as jest.Mock;
    const removeChannelMock = supabase.removeChannel as jest.Mock;
    channelMock.mockReturnValue(channel);

    const onNotification = jest.fn();
    const onStatus = jest.fn();
    const receivedEvent = jest.fn();
    window.addEventListener('notification-received', receivedEvent);

    const unsubscribe = notificationService.subscribeToInAppNotifications(
      'user-1',
      onNotification,
      onStatus
    );

    expect(channelMock).toHaveBeenCalledWith(
      expect.stringMatching(/^notifications:user-1:/)
    );
    expect(on).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: 'user_id=eq.user-1',
      },
      expect.any(Function)
    );
    expect(onStatus).toHaveBeenCalledWith('SUBSCRIBED');

    const handleInsert = on.mock.calls[0][2];
    handleInsert({
      new: {
        id: 'realtime-1',
        notification_type: 'budget_warning',
        title: 'Budget warning',
        body: 'You are nearing your limit.',
        created_at: '2026-07-27T10:00:00.000Z',
      },
    });

    expect(onNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'realtime-1',
        type: 'budget_warning',
      })
    );
    expect(receivedEvent).toHaveBeenCalledTimes(1);

    unsubscribe();
    expect(removeChannelMock).toHaveBeenCalledWith(channel);
    window.removeEventListener('notification-received', receivedEvent);
  });
});
