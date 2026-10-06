// src/types/goals.ts

export interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: Date;
    category: GoalCategory;
    color: string;
    status: GoalStatus;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export type GoalCategory = 'emergency' | 'vacation' | 'house' | 'car' | 'education' | 'other';
  export type GoalStatus = 'active' | 'completed' | 'archived' | 'deleted';
  export type GoalEventType = 'created' | 'updated' | 'completed' | 'archived' | 'unarchived' | 'deleted' | 'contribution';

  export interface GoalHistory {
    id: string;
    goalId: string;
    userId: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: Date;
    category: GoalCategory;
    color: string;
    status: GoalStatus;
    eventType: GoalEventType;
    eventTimestamp: Date;
    metadata?: {
      contributionAmount?: number;
      previousValues?: Partial<Goal>;
    };
  }

  export interface GoalHistoryResponse {
    histories: GoalHistory[];
    currentGoal: Goal;
  }

  export interface GoalContribution {
    goalId: string;
    amount: number;
  }