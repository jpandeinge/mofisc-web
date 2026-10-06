import type { Notification } from '../types/Notification';

export interface NotificationDestination {
  to: string;
  label: string;
  kind: 'transaction' | 'subscription' | 'budget' | 'goal' | 'activity' | 'details';
}

const asIdentifier = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
};
const buildPath = (
  pathname: string,
  params: Record<string, string>
): string => {
  const search = new URLSearchParams(params);
  return `${pathname}?${search.toString()}`;
};

const isSafeInternalPath = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.includes('\\');

/**
 * Resolve a notification to a stable in-app destination.
 *
 * Entity IDs deliberately take precedence over legacy action URLs. This
 * upgrades existing notifications that were stored with a generic destination
 * such as `/app?section=subscriptions`.
 */
export const getNotificationDestination = (
  notification: Pick<Notification, 'type' | 'data' | 'action_url'>
): NotificationDestination | null => {
  const data = notification.data || {};
  const transactionId = asIdentifier(data.transaction_id);
  if (transactionId) {
    return {
      to: buildPath('/app', {
        section: 'transactions',
        transaction_id: transactionId,
      }),
      label: 'View transaction',
      kind: 'transaction',
    };
  }

  const subscriptionId = asIdentifier(data.subscription_id);
  if (subscriptionId) {
    return {
      to: buildPath('/app', {
        section: 'subscriptions',
        subscription_id: subscriptionId,
      }),
      label: 'View subscription',
      kind: 'subscription',
    };
  }

  const budgetId = asIdentifier(data.budget_id);
  if (budgetId) {
    return {
      to: buildPath('/planning', {
        tab: 'budgets',
        budget_id: budgetId,
      }),
      label: 'View budget',
      kind: 'budget',
    };
  }

  const goalId = asIdentifier(data.goal_id);
  if (goalId) {
    return {
      to: buildPath('/planning', {
        tab: 'goals',
        goal_id: goalId,
      }),
      label: 'View goal',
      kind: 'goal',
    };
  }

  const statementId = asIdentifier(data.statement_id);
  if (statementId) {
    return {
      to: buildPath('/app', {
        section: 'transactions',
        statement_id: statementId,
      }),
      label: 'View transactions',
      kind: 'transaction',
    };
  }

  const achievementId = asIdentifier(data.achievement_id);
  if (achievementId) {
    return {
      to: buildPath('/activity', {
        achievement_id: achievementId,
      }),
      label: 'View achievement',
      kind: 'activity',
    };
  }

  if (isSafeInternalPath(notification.action_url)) {
    return {
      to: notification.action_url,
      label: 'View details',
      kind: 'details',
    };
  }

  return null;
};
