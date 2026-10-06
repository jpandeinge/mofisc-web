import { getNotificationDestination } from './notificationNavigation';
import type { Notification } from '../types/Notification';

const notification = (
  overrides: Partial<Notification>
): Pick<Notification, 'type' | 'data' | 'action_url'> => ({
  type: 'system_alert',
  data: {},
  ...overrides,
});

describe('notification navigation', () => {
  it('upgrades a legacy generic URL to the exact transaction', () => {
    expect(
      getNotificationDestination(
        notification({
          type: 'transaction_updated',
          data: { transaction_id: 'transaction 42' },
          action_url: '/app',
        })
      )
    ).toEqual({
      to: '/app?section=transactions&transaction_id=transaction+42',
      label: 'View transaction',
      kind: 'transaction',
    });
  });

  it('opens the exact subscription for an existing reminder', () => {
    expect(
      getNotificationDestination(
        notification({
          type: 'subscription_due_tomorrow',
          data: { subscription_id: 'sub-1' },
          action_url: '/app?section=subscriptions',
        })
      )
    ).toEqual({
      to: '/app?section=subscriptions&subscription_id=sub-1',
      label: 'View subscription',
      kind: 'subscription',
    });
  });

  it('keeps a safe internal action URL when there is no entity ID', () => {
    expect(
      getNotificationDestination(
        notification({ action_url: '/planning?tab=budgets' })
      )
    ).toEqual({
      to: '/planning?tab=budgets',
      label: 'View details',
      kind: 'details',
    });
  });

  it('does not navigate to external or protocol-relative action URLs', () => {
    expect(
      getNotificationDestination(
        notification({ action_url: 'https://malicious.example' })
      )
    ).toBeNull();
    expect(
      getNotificationDestination(
        notification({ action_url: '//malicious.example' })
      )
    ).toBeNull();
  });
});
