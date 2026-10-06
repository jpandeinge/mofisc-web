// src/types/gamification.ts

import { ReactNode } from 'react';

// Achievement Types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'savings' | 'spending' | 'streak' | 'tracking' | 'wellness' | 'engagement' | 'investment';
  level: number;
  points: number;
  icon: string;
  target_value: number;
  trigger_event: string;
  is_repeatable: boolean;
  is_hidden: boolean;
  requires_achievement_id?: string;
  created_at: string;
}

export interface UserAchievement {
  id: string | null;
  user_id: string;
  achievement_id: string;
  progress: number;
  current_value: number;
  is_completed: boolean;
  completed_at?: string;
  created_at?: string;
}

export interface UserAchievementFull extends UserAchievement {
  achievement: Achievement;
}

// For frontend rendering
export interface AchievementWithDisplay extends Achievement {
  progress: number;
  iconComponent?: React.ReactNode;
  isUnlocked: boolean;
  unlockedAt?: Date;
}

// Daily Challenge Types
export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  points: number;
  target_value: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export interface UserChallenge {
  id: string | null;
  user_id: string;
  challenge_id: string;
  progress: number;
  is_completed: boolean;
  completed_at?: string;
  created_at?: string;
}

export interface UserChallengeFull extends UserChallenge {
  challenge: DailyChallenge;
}

// Streak Types
export interface UserStreak {
  id: string;
  user_id: string;
  streak_type: string;
  current_count: number;
  highest_count: number;
  last_tracked_date: string;
  created_at: string;
}

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastUpdated: Date;
  milestones: Array<{
    days: number;
    isAchieved: boolean;
    reward: number;
  }>;
}

// Points Type
export interface UserPoints {
  id: string;
  user_id: string;
  points: number;
  level: number;
  created_at: string;
}

// Achievement Summary Type
export interface UserAchievementSummary {
  total_achievements: number;
  completed_achievements: number;
  total_points: number;
  current_level: number;
  recent_unlocks: UserAchievementFull[];
}

// Combined Game Stats
export interface UserGameStats {
  points: UserPoints;
  achievements: UserAchievementSummary;
  active_challenges: UserChallengeFull[];
  streaks: Record<string, UserStreak>;
}

export interface ActivityLevelSnapshot {
  total_points: number;
  current_level: number;
  points_to_next_level: number;
  next_level_points: number;
  current_level_start_points: number;
  points_within_level: number;
  points_needed_this_level: number;
  level_progress_percent: number;
}

export interface ActivityStreakSnapshot {
  current_savings_streak: number;
  longest_streak: number;
  next_milestone: number;
  next_milestone_progress_percent: number;
  streaks: Record<string, {
    current_count: number;
    highest_count: number;
    last_tracked_date?: string;
  }>;
}

export interface ActivityHealthSnapshot {
  financial_score: number;
  status: string;
  component_scores: Record<string, unknown>;
}

export interface ActivityQuickStatsSnapshot {
  completed_achievements: number;
  total_achievements: number;
  savings_rate: number;
  savings_rate_percentage: number;
  transaction_count: number;
  spending_trend: 'up' | 'down' | 'stable' | string;
  net_flow: number;
  avg_daily_spending: number;
  total_income: number;
  total_expenses: number;
  days_active: number;
  avg_transactions_per_day: number;
  most_active_day?: string | null;
  most_active_day_count: number;
  recent_activity: boolean;
}

export interface ActivitySnapshot {
  level: ActivityLevelSnapshot;
  streak: ActivityStreakSnapshot;
  health: ActivityHealthSnapshot;
  quick_stats: ActivityQuickStatsSnapshot;
  achievements: UserAchievementFull[];
  active_challenges: UserChallengeFull[];
  metrics: Record<string, any>;
  generated_at: string;
  last_calculated?: string | null;
  calculation_source?: string | null;
  bank_name?: string | null;
  is_partial?: boolean;
  warnings?: string[];
  calculation_duration_ms?: number;
}

// Gamification State
export interface GamificationState {
  points: number;
  level: number;
  achievements: AchievementWithDisplay[];
  dailyChallenges: UserChallengeFull[];
  streaks: {
    savings: StreakData;
    login: StreakData;
    tracking: StreakData;
  };
  isLoading: boolean;
  error: string | null;
}

// Gamification Actions
export type GamificationAction =
  | { type: 'FETCH_DATA_START' }
  | { type: 'FETCH_DATA_SUCCESS'; payload: UserGameStats }
  | { type: 'FETCH_DATA_FAILURE'; payload: string }
  | { type: 'UPDATE_ACHIEVEMENTS'; payload: AchievementWithDisplay[] }
  | { type: 'UPDATE_CHALLENGES'; payload: UserChallengeFull[] }
  | { type: 'UPDATE_STREAK'; payload: { type: string; streak: UserStreak } }
  | { type: 'COMPLETE_CHALLENGE'; payload: string }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: { achievementId: string; completedAt: string } };
