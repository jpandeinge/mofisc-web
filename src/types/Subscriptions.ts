// src/types/Subscriptions.ts

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  dueDate: number;
  icon: string;
  category: string;
  startDate: Date;
  totalSpent: number;
  firstPaymentDate: Date;

  // Management fields
  isPaused?: boolean;
  pausedAt?: string;
  resumeDate?: string;
  userDisplayName?: string;
  lastSyncedMerchantName?: string;
  canManage?: boolean;
}

export interface SubscriptionValidation {
  isValid: boolean;
  message?: string;
}