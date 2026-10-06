// src/services/subscriptionService.ts

import { Transaction } from '../types';
import { Subscription, SubscriptionValidation } from '../types/Subscriptions';
import { getSubscriptionInfo, subscriptionPlatforms } from '../config/subscriptionConfig';

export class SubscriptionService {
  /**
   * Extracts subscriptions from transactions, handling first payment dates
   * and subscription validation.
   */
  static extractSubscriptions(transactions: Transaction[]): Subscription[] {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    // Group transactions by subscription name first
    const subscriptionGroups = new Map<string, Transaction[]>();

    transactions.forEach(transaction => {
      if (transaction.transaction_type.toLowerCase() === 'debit') {
        const subscriptionInfo = getSubscriptionInfo(transaction.transaction_description);

        if (subscriptionInfo) {
          const { name } = subscriptionInfo;
          if (!subscriptionGroups.has(name)) {
            subscriptionGroups.set(name, []);
          }
          subscriptionGroups.get(name)!.push(transaction);
        }
      }
    });

    // Now process each subscription group to find the most common billing date
    const subscriptions: Subscription[] = [];

    subscriptionGroups.forEach((txns, name) => {
      // Sort by date ascending
      const sortedTxns = txns.sort((a, b) =>
        new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
      );

      // Get subscription info from first transaction
      const subscriptionInfo = getSubscriptionInfo(sortedTxns[0].transaction_description);
      if (!subscriptionInfo) return;

      const { icon, category } = subscriptionInfo;

      // Calculate the most common billing day of month
      const dayFrequency = new Map<number, number>();
      sortedTxns.forEach(txn => {
        const day = new Date(txn.transaction_date).getDate();
        dayFrequency.set(day, (dayFrequency.get(day) || 0) + 1);
      });

      // Find the most common day
      let mostCommonDay = new Date(sortedTxns[0].transaction_date).getDate();
      let maxFrequency = 0;
      dayFrequency.forEach((freq, day) => {
        if (freq > maxFrequency) {
          maxFrequency = freq;
          mostCommonDay = day;
        }
      });

      // Calculate total spent and average amount
      const totalSpent = sortedTxns.reduce((sum, txn) => sum + txn.transaction_amount, 0);
      const avgAmount = totalSpent / sortedTxns.length;

      // Get first and most recent transaction dates
      const firstPaymentDate = new Date(sortedTxns[0].transaction_date);
      const startDate = new Date(sortedTxns[0].transaction_date);

      subscriptions.push({
        id: `${name}-${mostCommonDay}`,
        name,
        amount: avgAmount,
        dueDate: mostCommonDay,
        icon: icon,
        category: category,
        startDate: startDate,
        firstPaymentDate: firstPaymentDate,
        totalSpent: totalSpent
      });
    });

    return subscriptions.sort((a, b) => {
      // Sort by date and then by name for consistent ordering
      if (a.dueDate === b.dueDate) {
        return a.name.localeCompare(b.name);
      }
      return a.dueDate - b.dueDate;
    });
  }

  /**
   * Validates if a subscription transaction date is valid based on the first payment date
   */
  private static isValidSubscriptionDate(transactionDate: Date, firstPaymentDate: Date): boolean {
    return transactionDate >= firstPaymentDate;
  }

  /**
   * Validates a specific date for a subscription
   */
  static validateSubscriptionDate(subscription: Subscription, date: Date): SubscriptionValidation {
    if (!subscription.firstPaymentDate) {
      return { isValid: true }; // If no first payment date is set, assume valid
    }

    if (date < subscription.firstPaymentDate) {
      return {
        isValid: false,
        message: `${subscription.name} subscription started on ${subscription.firstPaymentDate.toLocaleDateString()}`
      };
    }
    return { isValid: true };
  }

  /**
   * Calculates the total monthly spend across all subscriptions
   */
  static getMonthlySpend(subscriptions: Subscription[]): number {
    return subscriptions.reduce((total, sub) => total + sub.amount, 0);
  }

  /**
   * Groups subscriptions by their categories
   */
  static groupSubscriptionsByCategory(subscriptions: Subscription[]): Map<string, Subscription[]> {
    return subscriptions.reduce((groups, subscription) => {
      const category = subscription.category || 'Other';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(subscription);
      return groups;
    }, new Map<string, Subscription[]>());
  }

  /**
   * Gets valid subscriptions for a specific month
   */
  static getValidSubscriptionsForMonth(subscriptions: Subscription[], month: Date): Subscription[] {
    return subscriptions.filter(sub => {
      const validation = this.validateSubscriptionDate(sub, month);
      return validation.isValid;
    });
  }

  /**
   * Gets the monthly cost breakdown by category
   */
  static getCategoryBreakdown(subscriptions: Subscription[]): Array<{category: string; amount: number; percentage: number}> {
    const groupedSubs = this.groupSubscriptionsByCategory(subscriptions);
    const totalSpend = this.getMonthlySpend(subscriptions);

    return Array.from(groupedSubs.entries()).map(([category, subs]) => {
      const amount = subs.reduce((sum, sub) => sum + sub.amount, 0);
      return {
        category,
        amount,
        percentage: (amount / totalSpend) * 100
      };
    }).sort((a, b) => b.amount - a.amount);
  }

  /**
   * Checks if a transaction description matches any known subscription platform
   */
  static isKnownSubscription(description: string): boolean {
    return subscriptionPlatforms.some(platform =>
      platform.keywords.some(keyword =>
        description.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Gets subscription statistics for reporting
   */
  static getSubscriptionStats(subscriptions: Subscription[]) {
    const totalMonthly = this.getMonthlySpend(subscriptions);
    const categoryBreakdown = this.getCategoryBreakdown(subscriptions);
    const uniquePlatforms = new Set(subscriptions.map(s => s.name)).size;

    return {
      totalMonthly,
      uniquePlatforms,
      categoryBreakdown,
      averagePerSubscription: totalMonthly / subscriptions.length || 0,
    };
  }
}