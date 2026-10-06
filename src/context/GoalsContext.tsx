// src/context/GoalsContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Goal, GoalCategory, GoalHistory, GoalStatus, GoalEventType } from '../types/goals';
import { useAuth } from './AuthContext';
import { handleError } from '../utils/errorHandling';
import type { Database } from '../types/supabase';

export interface GoalContextType {
  goals: Goal[];
  goalHistories: Record<string, GoalHistory[]>;
  loading: boolean;
  addGoal: (goalData: Omit<Goal, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<Goal>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<Goal>;
  deleteGoal: (goalId: string) => Promise<boolean>;
  archiveGoal: (goalId: string) => Promise<Goal>;
  unarchiveGoal: (goalId: string) => Promise<Goal>;
  addContribution: (goalId: string, amount: number) => Promise<Goal>;
  getGoalHistory: (goalId: string) => Promise<GoalHistory[]>;
  loadingHistoryForGoal: Record<string, boolean>;
}

export const GoalsContext = createContext<GoalContextType | undefined>(undefined);

export interface GoalsProviderProps {
  children: ReactNode;
}

export const GoalsProvider: React.FC<GoalsProviderProps> = ({ children }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalHistories, setGoalHistories] = useState<Record<string, GoalHistory[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingHistoryForGoal, setLoadingHistoryForGoal] = useState<Record<string, boolean>>({});
  const { user } = useAuth();

  const fetchGoals = useCallback(async () => {
    if (!user?.id) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedGoals: Goal[] = data.map((goal) => ({
        id: goal.id,
        name: goal.name,
        targetAmount: goal.target_amount,
        currentAmount: goal.current_amount,
        deadline: new Date(goal.deadline),
        category: goal.category as GoalCategory,
        color: goal.color,
        status: goal.status as GoalStatus,
        createdAt: new Date(goal.created_at),
        updatedAt: goal.updated_at ? new Date(goal.updated_at) : new Date(goal.created_at)
      }));

      setGoals(transformedGoals);
    } catch (error) {
      handleError(error, 'data', 'Failed to load your goals');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchGoals();
    } else {
      setGoals([]);
      setLoading(false);
    }
  }, [user, fetchGoals]);

  const addGoal = async (goalData: Omit<Goal, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Goal> => {
    try {
      // Make sure we have the user
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      const goal = {
        name: goalData.name,
        target_amount: goalData.targetAmount,
        current_amount: goalData.currentAmount || 0,
        deadline: goalData.deadline.toISOString().split('T')[0],
        category: goalData.category,
        color: goalData.color,
        status: 'active' as const,
        user_id: user.id
      };


      const { data, error } = await supabase
        .from('goals')
        .insert([goal])
        .select()
        .single();

      if (error) throw error;

      const newGoal: Goal = {
        id: data.id,
        name: data.name,
        targetAmount: data.target_amount,
        currentAmount: data.current_amount,
        deadline: new Date(data.deadline),
        category: data.category as GoalCategory,
        color: data.color,
        status: data.status as GoalStatus,
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(data.created_at)
      };

      setGoals(prevGoals => [newGoal, ...prevGoals]);
      return newGoal;
    } catch (error) {
      handleError(error, 'data', 'Failed to create goal');
      throw error;
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>): Promise<Goal> => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      // Convert frontend model to database model
      const dbUpdates: Database['public']['Tables']['goals']['Update'] = {};

      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount;
      if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount;
      if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline.toISOString().split('T')[0];
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const { data, error } = await supabase
        .from('goals')
        .update(dbUpdates)
        .eq('id', goalId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedGoal: Goal = {
        id: data.id,
        name: data.name,
        targetAmount: data.target_amount,
        currentAmount: data.current_amount,
        deadline: new Date(data.deadline),
        category: data.category as GoalCategory,
        color: data.color,
        status: data.status as GoalStatus,
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(data.created_at)
      };

      setGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId ? updatedGoal : goal
        )
      );

      return updatedGoal;
    } catch (error) {
      handleError(error, 'data', 'Failed to update goal');
      throw error;
    }
  };

  const deleteGoal = async (goalId: string): Promise<boolean> => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      // Soft delete - update status to 'deleted'
      const { error } = await supabase
        .from('goals')
        .update({ status: 'deleted' })
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove from local state
      setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
      return true;
    } catch (error) {
      handleError(error, 'data', 'Failed to delete goal');
      throw error;
    }
  };

  const archiveGoal = async (goalId: string): Promise<Goal> => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('goals')
        .update({ status: 'archived' })
        .eq('id', goalId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const archivedGoal: Goal = {
        id: data.id,
        name: data.name,
        targetAmount: data.target_amount,
        currentAmount: data.current_amount,
        deadline: new Date(data.deadline),
        category: data.category as GoalCategory,
        color: data.color,
        status: data.status as GoalStatus,
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(data.created_at)
      };

      setGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId ? archivedGoal : goal
        )
      );

      return archivedGoal;
    } catch (error) {
      handleError(error, 'data', 'Failed to archive goal');
      throw error;
    }
  };

  const unarchiveGoal = async (goalId: string): Promise<Goal> => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('goals')
        .update({ status: 'active' })
        .eq('id', goalId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const unarchivedGoal: Goal = {
        id: data.id,
        name: data.name,
        targetAmount: data.target_amount,
        currentAmount: data.current_amount,
        deadline: new Date(data.deadline),
        category: data.category as GoalCategory,
        color: data.color,
        status: data.status as GoalStatus,
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(data.created_at)
      };

      setGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId ? unarchivedGoal : goal
        )
      );

      return unarchivedGoal;
    } catch (error) {
      handleError(error, 'data', 'Failed to unarchive goal');
      throw error;
    }
  };

  const addContribution = async (goalId: string, amount: number): Promise<Goal> => {
    try {
      // Use RPC to call our database function
      const { data, error } = await supabase
        .rpc('add_goal_contribution', {
          p_goal_id: goalId,
          p_amount: amount
        });

      if (error) throw error;

      // Transform response to our Goal type
      const updatedGoal: Goal = {
        id: data.id,
        name: data.name,
        targetAmount: data.target_amount,
        currentAmount: data.current_amount,
        deadline: new Date(data.deadline),
        category: data.category as GoalCategory,
        color: data.color,
        status: data.status as GoalStatus,
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(data.created_at)
      };

      // Update local state
      setGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId ? updatedGoal : goal
        )
      );

      return updatedGoal;
    } catch (error) {
      handleError(error, 'data', 'Failed to add contribution');
      throw error;
    }
  };

  const getGoalHistory = async (goalId: string): Promise<GoalHistory[]> => {
    if (!user?.id) return [];

    setLoadingHistoryForGoal(prev => ({ ...prev, [goalId]: true }));
    try {
      const { data, error } = await supabase
        .from('goals_history')
        .select('*')
        .eq('goal_id', goalId)
        .eq('user_id', user.id)
        .order('event_timestamp', { ascending: true });

      if (error) throw error;

      // Transform data to match our GoalHistory type
      const transformedHistories: GoalHistory[] = data.map((history) => ({
        id: history.id,
        goalId: history.goal_id,
        userId: history.user_id,
        name: history.name,
        targetAmount: history.target_amount,
        currentAmount: history.current_amount,
        deadline: new Date(history.deadline),
        category: history.category as GoalCategory,
        color: history.color,
        status: history.status as GoalStatus,
        eventType: history.event_type as GoalEventType,
        eventTimestamp: new Date(history.event_timestamp),
        // Transform metadata keys from snake_case to camelCase
        metadata: history.metadata ? {
          contributionAmount: history.metadata.contribution_amount,
          previousValues: history.metadata.previous_values
        } : undefined
      }));

      // Update state
      setGoalHistories(prev => ({
        ...prev,
        [goalId]: transformedHistories
      }));

      return transformedHistories;
    } catch (error) {
      handleError(error, 'data', 'Failed to load goal history');
      return [];
    } finally {
      setLoadingHistoryForGoal(prev => ({ ...prev, [goalId]: false }));
    }
  };

  const value = {
    goals,
    goalHistories,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    archiveGoal,
    unarchiveGoal,
    addContribution,
    getGoalHistory,
    loadingHistoryForGoal
  };

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
};

export const useGoals = () => {
  const context = useContext(GoalsContext);
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
};
