// src/services/transactionEditService.ts

import { api } from '../lib/api';
import { Transaction, TransactionEditHistory } from '../types';

export interface TransactionUpdatePayload {
  category?: string;
  merchant_name?: string;
}

export interface TransactionUpdateResponse {
  success: boolean;
  message: string;
  fields_updated: string[];
  transaction: Transaction;
}

export interface TransactionDetailResponse {
  success: boolean;
  transaction: Transaction;
}

export interface SimilarTransaction {
  id: string;
  transaction_date: string;
  transaction_description: string;
  merchant_name: string | null;
  category: string | null;
  transaction_amount: number;
  similarity_score: number;
}

export interface SimilarTransactionsResponse {
  similar_transactions: SimilarTransaction[];
  count: number;
  field: 'merchant_name' | 'category';
  original_value: string | null;
  new_value: string;
}

export interface BatchUpdateResponse {
  success: boolean;
  updated_count: number;
  failed_count: number;
  updated_transactions: Array<{
    id: string;
    merchant_name: string | null;
    category: string | null;
    edit_count: number;
  }>;
  errors: any[];
}

/**
 * Service for editing transactions (category and merchant_name only).
 * Following Revolut-style secure transaction editing with full audit trail.
 */
export const transactionEditService = {
  /**
   * Get one transaction for a notification deep link.
   */
  async getTransaction(
    transactionId: string | number
  ): Promise<Transaction> {
    const response = await api.get<TransactionDetailResponse>(
      `/v1/transactions/${transactionId}`
    );
    return response.data.transaction;
  },

  /**
   * Edit transaction category and/or merchant_name
   */
  async updateTransaction(
    transactionId: string | number,
    updates: TransactionUpdatePayload
  ): Promise<TransactionUpdateResponse> {
    const response = await api.patch<TransactionUpdateResponse>(
      `/v1/transactions/${transactionId}/edit`,
      updates
    );
    return response.data;
  },

  /**
   * Get edit history for a transaction (Revolut-style)
   */
  async getEditHistory(transactionId: string | number): Promise<TransactionEditHistory[]> {
    const response = await api.get<TransactionEditHistory[]>(
      `/v1/transactions/${transactionId}/edit-history`
    );
    return response.data;
  },

  /**
   * Revert category to original ML-classified value
   */
  async revertCategoryToOriginal(transactionId: string | number): Promise<{
    success: boolean;
    message: string;
    original_category: string;
  }> {
    const response = await api.post(
      `/v1/transactions/${transactionId}/revert-category`
    );
    return response.data;
  },

  /**
   * Find similar transactions based on fuzzy string matching
   * Useful for batch updating transactions with similar merchant names or categories
   */
  async findSimilarTransactions(
    transactionId: string | number,
    field: 'merchant_name' | 'category',
    value: string,
    threshold?: number
  ): Promise<SimilarTransactionsResponse> {
    const params = new URLSearchParams({
      field,
      value,
      ...(threshold && { threshold: threshold.toString() }),
    });

    const response = await api.get<SimilarTransactionsResponse>(
      `/v1/transactions/${transactionId}/similar?${params}`
    );
    return response.data;
  },

  /**
   * Batch update multiple transactions at once
   * All transactions will be updated with the same values
   */
  async batchUpdateTransactions(
    transactionIds: (string | number)[],
    updates: { merchant_name?: string; category?: string }
  ): Promise<BatchUpdateResponse> {
    const response = await api.patch<BatchUpdateResponse>(
      '/v1/transactions/batch-edit',
      {
        transaction_ids: transactionIds.map(String),
        updates,
      }
    );
    return response.data;
  },
};
