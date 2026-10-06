// src/context/BudgetContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  alertThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BudgetStatus {
  budgetId: string;
  category: string;
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
  remaining: number;
  thresholdExceeded: boolean;
  status: 'healthy' | 'on_track' | 'warning' | 'critical' | 'exceeded';
}

interface SpendingInsight {
  totalSpent: number;
  period: string;
  startDate: string;
  endDate: string;
  categories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  insights: Array<{
    type: string;
    message: string;
    detail: string;
    icon: string;
  }>;
}

interface BudgetContextType {
  budgets: Budget[];
  budgetStatuses: BudgetStatus[];
  spendingInsights: SpendingInsight | null;
  loading: boolean;
  createBudget: (budgetData: Partial<Budget>) => Promise<void>;
  updateBudget: (budgetId: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
  fetchBudgetStatus: () => Promise<void>;
  fetchSpendingInsights: (period?: string) => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetStatuses, setBudgetStatuses] = useState<BudgetStatus[]>([]);
  const [spendingInsights, setSpendingInsights] = useState<SpendingInsight | null>(null);
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
    };
  }, []);

  const fetchBudgets = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/v1/budgets`, { headers });

      if (!response.ok) throw new Error('Failed to fetch budgets');

      const result = await response.json();
      if (result.success && result.data) {
        // Transform snake_case to camelCase
        const transformedBudgets = result.data.map((b: any) => ({
          id: b.id,
          category: b.category,
          amount: b.amount,
          period: b.period,
          startDate: b.start_date,
          endDate: b.end_date,
          alertThreshold: b.alert_threshold,
          isActive: b.is_active,
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        }));
        setBudgets(transformedBudgets);
      }
    } catch (error) {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders]);

  const fetchBudgetStatus = useCallback(async () => {
    if (!user) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/v1/budgets/status`, { headers });

      if (!response.ok) throw new Error('Failed to fetch budget status');

      const result = await response.json();
      if (result.success && result.data) {
        // Transform snake_case to camelCase
        const transformedStatuses = result.data.map((s: any) => ({
          budgetId: s.budget_id,
          category: s.category,
          budgetAmount: s.budget_amount,
          spentAmount: s.spent_amount,
          percentage: s.percentage,
          remaining: s.remaining,
          thresholdExceeded: s.threshold_exceeded,
          status: s.status,
        }));
        setBudgetStatuses(transformedStatuses);
      }
    } catch (error) {
      // Silently fail - budgets will still show without status
    }
  }, [user, getAuthHeaders]);

  const fetchSpendingInsights = useCallback(async (period: string = 'monthly') => {
    if (!user) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/v1/budgets/insights?period=${period}`,
        { headers }
      );

      if (!response.ok) throw new Error('Failed to fetch insights');

      const result = await response.json();
      if (result.success) {
        setSpendingInsights(result.data);
      }
    } catch (error) {
      toast.error('Failed to load spending insights');
    }
  }, [user, getAuthHeaders]);

  const createBudget = useCallback(async (budgetData: Partial<Budget>) => {
    if (!user) return;

    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/v1/budgets`, {
        method: 'POST',
        headers,
        body: JSON.stringify(budgetData),
      });

      if (!response.ok) throw new Error('Failed to create budget');

      const result = await response.json();
      if (result.success) {
        await fetchBudgets();
        await fetchBudgetStatus();
      }
    } catch (error) {
      toast.error('Failed to create budget');
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, fetchBudgets, fetchBudgetStatus]);

  const updateBudget = useCallback(async (budgetId: string, updates: Partial<Budget>) => {
    if (!user) return;

    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/v1/budgets/${budgetId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update budget');

      const result = await response.json();
      if (result.success) {
        await fetchBudgets();
        await fetchBudgetStatus();
      }
    } catch (error) {
      toast.error('Failed to update budget');
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, fetchBudgets, fetchBudgetStatus]);

  const deleteBudget = useCallback(async (budgetId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/v1/budgets/${budgetId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) throw new Error('Failed to delete budget');

      const result = await response.json();
      if (result.success) {
        await fetchBudgets();
        await fetchBudgetStatus();
      }
    } catch (error) {
      toast.error('Failed to delete budget');
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, fetchBudgets, fetchBudgetStatus]);

  useEffect(() => {
    if (user) {
      fetchBudgets();
      fetchBudgetStatus();
      fetchSpendingInsights();
    }
  }, [user?.id]);

  const value = {
    budgets,
    budgetStatuses,
    spendingInsights,
    loading,
    createBudget,
    updateBudget,
    deleteBudget,
    fetchBudgetStatus,
    fetchSpendingInsights,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};
