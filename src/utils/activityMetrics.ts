import {
  Achievement,
  ActivityLevelSnapshot,
  ActivitySnapshot,
  UserAchievementFull,
} from '../types/gamification';
import { Transaction } from '../types';

export const LEVEL_CALCULATION_BASE = 100;
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 365] as const;

export const finiteNumber = (value: unknown, fallback = 0): number => {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const normalizeSavingsRatePercentage = (
  rate?: number,
  explicitPercentage?: number
): number => {
  if (Number.isFinite(explicitPercentage)) return explicitPercentage as number;
  const normalizedRate = finiteNumber(rate);
  return Math.abs(normalizedRate) <= 1 ? normalizedRate * 100 : normalizedRate;
};

export const calculateLevelSnapshot = (totalPoints: unknown): ActivityLevelSnapshot => {
  const points = Math.max(0, Math.trunc(finiteNumber(totalPoints)));
  const currentLevel = Math.max(
    1,
    Math.floor(Math.sqrt(points / LEVEL_CALCULATION_BASE)) + 1
  );
  const nextLevelPoints = currentLevel ** 2 * LEVEL_CALCULATION_BASE;
  const currentLevelStartPoints = (currentLevel - 1) ** 2 * LEVEL_CALCULATION_BASE;
  const pointsWithinLevel = Math.max(0, points - currentLevelStartPoints);
  const pointsNeededThisLevel = Math.max(1, nextLevelPoints - currentLevelStartPoints);

  return {
    total_points: points,
    current_level: currentLevel,
    points_to_next_level: Math.max(0, nextLevelPoints - points),
    next_level_points: nextLevelPoints,
    current_level_start_points: currentLevelStartPoints,
    points_within_level: pointsWithinLevel,
    points_needed_this_level: pointsNeededThisLevel,
    level_progress_percent: Math.min(
      100,
      Math.max(0, pointsWithinLevel / pointsNeededThisLevel * 100)
    ),
  };
};

export const resolveActivityLevelSnapshot = (
  authoritativeSnapshot: ActivityLevelSnapshot | null | undefined,
  hasLoadedCurrentScope: boolean,
  fallbackTotalPoints: unknown
): ActivityLevelSnapshot | null => {
  if (authoritativeSnapshot) return authoritativeSnapshot;
  if (!hasLoadedCurrentScope) return null;
  return calculateLevelSnapshot(fallbackTotalPoints);
};

export const nextStreakMilestone = (currentStreak: unknown): number => {
  const streak = Math.max(0, Math.trunc(finiteNumber(currentStreak)));
  const milestone = STREAK_MILESTONES.find((target) => target > streak);
  return milestone ?? (Math.floor(streak / 365) + 1) * 365;
};

export const streakMilestoneProgress = (
  currentStreak: unknown,
  milestone: unknown
): number => {
  const streak = Math.max(0, finiteNumber(currentStreak));
  const target = Math.max(1, finiteNumber(milestone, 1));
  return Math.min(100, Math.max(0, streak / target * 100));
};

export const activityHealthStatus = (financialScore: unknown): string => {
  const score = Math.min(100, Math.max(0, Math.round(finiteNumber(financialScore))));
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Work';
};

export const mergeActivityAchievements = (
  achievements: Achievement[],
  progressRecords: UserAchievementFull[]
): UserAchievementFull[] => {
  const achievementById = new Map(
    achievements.map((achievement) => [achievement.id, achievement])
  );

  return progressRecords
    .map((progress) => {
      const achievement = progress.achievement
        || achievementById.get(progress.achievement_id);
      return achievement ? { ...progress, achievement } : null;
    })
    .filter((item): item is UserAchievementFull => item !== null);
};

export const needsGamificationCollectionRecovery = (
  snapshot: ActivitySnapshot
): boolean => {
  const warnings = snapshot.warnings || [];
  return (
    warnings.includes('gamification_unavailable')
    || (
      snapshot.achievements.length === 0
      && snapshot.quick_stats.total_achievements > 0
    )
  );
};

export interface LocalActivityMetrics {
  total_income: number;
  total_expenses: number;
  total_savings: number;
  savings_rate: number;
  savings_rate_percentage: number;
  avg_daily_spending: number;
  spending_trend: 'stable';
  transaction_count: number;
  days_active: number;
  avg_transactions_per_day: number;
  most_active_day: string | null;
  most_active_day_count: number;
  recent_activity: boolean;
}

export const calculateLocalActivityMetrics = (
  transactions: Transaction[]
): LocalActivityMetrics => {
  let totalIncome = 0;
  let totalExpenses = 0;
  const activityByDay = new Map<string, number>();
  const spendingDays = new Set<string>();

  transactions.forEach((transaction) => {
    const amount = Math.abs(finiteNumber(transaction.transaction_amount));
    const type = String(transaction.transaction_type || '').trim().toLowerCase();
    const parsedDate = new Date(transaction.transaction_date);
    const day = Number.isNaN(parsedDate.getTime())
      ? null
      : parsedDate.toISOString().slice(0, 10);

    if (day) activityByDay.set(day, (activityByDay.get(day) || 0) + 1);
    if (type === 'credit') totalIncome += amount;
    if (type === 'debit') {
      totalExpenses += amount;
      if (day) spendingDays.add(day);
    }
  });

  const netFlow = totalIncome - totalExpenses;
  const savingsRatePercentage = totalIncome > 0
    ? netFlow / totalIncome * 100
    : 0;
  const mostActive = Array.from(activityByDay.entries()).sort(
    ([leftDay, leftCount], [rightDay, rightCount]) =>
      rightCount - leftCount || leftDay.localeCompare(rightDay)
  )[0];
  const daysActive = activityByDay.size;

  return {
    total_income: totalIncome,
    total_expenses: totalExpenses,
    total_savings: netFlow,
    savings_rate: savingsRatePercentage / 100,
    savings_rate_percentage: savingsRatePercentage,
    avg_daily_spending: totalExpenses / Math.max(1, spendingDays.size),
    spending_trend: 'stable',
    transaction_count: transactions.length,
    days_active: daysActive,
    avg_transactions_per_day: transactions.length / Math.max(1, daysActive),
    most_active_day: mostActive?.[0] ?? null,
    most_active_day_count: mostActive?.[1] ?? 0,
    recent_activity: activityByDay.size > 0,
  };
};
