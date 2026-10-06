// src/types/index.ts

export interface Transaction {
  id: number;
  statement_id: string;
  bank_name?: string; // Bank that issued this transaction
  transaction_date: string;
  transaction_description: string;
  transaction_amount: number;
  transaction_type: string;
  balance: number;
  category: string;

  // Merchant name fields (migration 023)
  merchant_name?: string;
  original_merchant_name?: string;
  original_category?: string;

  // Edit tracking fields (migration 023)
  user_edited_fields?: string[];
  last_edited_at?: string;
  edit_count?: number;
}

export interface TransactionEditHistory {
  id: string;
  field_name: 'category' | 'merchant_name';
  old_value: string | null;
  new_value: string | null;
  edited_at: string;
}

// Bank info from /v1/metrics/banks API
export interface BankInfo {
  name: string;
  display_name: string;
  transaction_count: number;
}

export interface Metrics {
  total_transactions: number;
  balance: number;
  total_income: number;
  total_expenses: number;
}

export interface StatementMetadata {
  statement_id: string;
  start_date: string;
  end_date: string;
  transaction_count: number;
  total_credits: number;
  total_debits: number;
}

export interface TransactionFilters {
  statementId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  category: string | null;
}

export interface CashFlowData {
  date: string;
  rawDate: Date;
  cashFlow: number;
  balance: number;
  inflow: number;
  outflow: number;
  balanceChange: number;
  transactionCount: number;
}


export interface CashFlowMetrics {
  totalInflow: number;
  totalOutflow: number;
  netChange: number;
  avgDailyChange: number;
}


export interface CategorySpending {
  category: string;
  amount: number;
}