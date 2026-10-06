// src/utils/secureStorage.ts

import { Session } from '@supabase/supabase-js';
import { Metrics, Transaction } from '../types';
import { logEvent } from './errorHandling';
import { encrypt, decrypt } from './encryption';

// Define storage keys as constants to prevent typos and ensure consistency
const STORAGE_KEYS = {
  SESSION: 'app_session',
  TRANSACTIONS: 'encrypted_transactions',
  METRICS: 'encrypted_metrics'
} as const;

export const secureStorage = {
  // Session management (AES-GCM encrypted)
  async setSession(session: Session): Promise<void> {
    try {
      const ciphertext = await encrypt(JSON.stringify(session));
      sessionStorage.setItem(STORAGE_KEYS.SESSION, ciphertext);
    } catch {
      logEvent('Failed to store session');
    }
  },

  async getSession(): Promise<Session | null> {
    try {
      const ciphertext = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      if (!ciphertext) return null;

      const plaintext = await decrypt(ciphertext);
      if (!plaintext) return null;

      return JSON.parse(plaintext);
    } catch {
      logEvent('Failed to retrieve session');
      return null;
    }
  },

  clearSession(): void {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  // Transaction and metrics storage (AES-GCM encrypted)
  async setTransactions(transactions: Transaction[]): Promise<void> {
    try {
      const ciphertext = await encrypt(JSON.stringify(transactions));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, ciphertext);
    } catch {
      logEvent('Failed to store transactions');
    }
  },

  async getTransactions(): Promise<Transaction[] | null> {
    try {
      const ciphertext = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!ciphertext) return null;

      const plaintext = await decrypt(ciphertext);
      if (!plaintext) return null;

      return JSON.parse(plaintext);
    } catch {
      logEvent('Failed to retrieve transactions');
      return null;
    }
  },

  async setMetrics(metrics: Metrics): Promise<void> {
    try {
      const ciphertext = await encrypt(JSON.stringify(metrics));
      localStorage.setItem(STORAGE_KEYS.METRICS, ciphertext);
    } catch {
      logEvent('Failed to store metrics');
    }
  },

  async getMetrics(): Promise<Metrics | null> {
    try {
      const ciphertext = localStorage.getItem(STORAGE_KEYS.METRICS);
      if (!ciphertext) return null;

      const plaintext = await decrypt(ciphertext);
      if (!plaintext) return null;

      return JSON.parse(plaintext);
    } catch {
      logEvent('Failed to retrieve metrics');
      return null;
    }
  },

  // Clear all financial data
  clearFinancialData(): void {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.METRICS);
  },

  // Clear everything (session and financial data)
  clearAll(): void {
    this.clearSession();
    this.clearFinancialData();
  }
};