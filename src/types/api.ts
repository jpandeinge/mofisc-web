// src/types/api.ts

import { Transaction, Metrics, StatementMetadata } from './index';

export interface APIResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface TransactionResponseMetadata {
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
  total_records: number;
  statements: StatementMetadata[];
}

export interface TransactionResponse {
  transactions: Transaction[];
  metrics: Metrics;
  metadata: TransactionResponseMetadata;
}

export interface MetricsResponse {
  total_transactions: number;
  total_income: number;
  total_expenses: number;
  balance: number;
}

export interface StatementResponse {
  statements: StatementMetadata[];
}