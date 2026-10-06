import {
  activityHealthStatus,
  calculateLevelSnapshot,
  calculateLocalActivityMetrics,
  mergeActivityAchievements,
  needsGamificationCollectionRecovery,
  nextStreakMilestone,
  normalizeSavingsRatePercentage,
  resolveActivityLevelSnapshot,
  streakMilestoneProgress,
} from './activityMetrics';
import { Transaction } from '../types';
import {
  Achievement,
  ActivitySnapshot,
  UserAchievementFull,
} from '../types/gamification';

const transaction = (
  id: number,
  type: string,
  amount: number,
  date: string
): Transaction => ({
  id,
  statement_id: 'statement-1',
  transaction_date: date,
  transaction_description: `Transaction ${id}`,
  transaction_amount: amount,
  transaction_type: type,
  balance: 0,
  category: 'Other',
});

describe('Activity calculations', () => {
  it('keeps level boundaries consistent with the backend', () => {
    expect(calculateLevelSnapshot(-5).current_level).toBe(1);
    expect(calculateLevelSnapshot(Number.NaN).total_points).toBe(0);
    expect(calculateLevelSnapshot(99).current_level).toBe(1);
    expect(calculateLevelSnapshot(100)).toMatchObject({
      current_level: 2,
      points_to_next_level: 300,
      level_progress_percent: 0,
    });
    expect(calculateLevelSnapshot(399).points_to_next_level).toBe(1);
    expect(calculateLevelSnapshot(400).current_level).toBe(3);
  });

  it('does not expose a fallback level before the current snapshot scope loads', () => {
    expect(resolveActivityLevelSnapshot(null, false, 400)).toBeNull();
    expect(resolveActivityLevelSnapshot(null, true, 400)?.current_level).toBe(3);

    const authoritativeLevel = calculateLevelSnapshot(284);
    expect(resolveActivityLevelSnapshot(
      authoritativeLevel,
      true,
      400
    )).toBe(authoritativeLevel);
  });

  it('normalizes percentage variants and health bands', () => {
    expect(normalizeSavingsRatePercentage(0.25)).toBe(25);
    expect(normalizeSavingsRatePercentage(-0.1)).toBe(-10);
    expect(normalizeSavingsRatePercentage(0.25, 12.5)).toBe(12.5);
    expect(activityHealthStatus(79.9)).toBe('Excellent');
    expect(activityHealthStatus(60)).toBe('Good');
    expect(activityHealthStatus(40)).toBe('Fair');
  });

  it('always selects a future streak milestone', () => {
    expect(nextStreakMilestone(90)).toBe(365);
    expect(nextStreakMilestone(365)).toBe(730);
    expect(nextStreakMilestone(800)).toBe(1095);
    expect(streakMilestoneProgress(365, 730)).toBe(50);
  });

  it('derives an immediate, safe transaction fallback', () => {
    const metrics = calculateLocalActivityMetrics([
      transaction(1, 'credit', 1000, '2026-07-20'),
      transaction(2, 'debit', -200, '2026-07-20T12:00:00Z'),
      transaction(3, 'DEBIT', 100, '2026-07-21'),
      transaction(4, 'unknown', Number.NaN, 'not-a-date'),
    ]);

    expect(metrics).toMatchObject({
      total_income: 1000,
      total_expenses: 300,
      total_savings: 700,
      savings_rate_percentage: 70,
      avg_daily_spending: 150,
      transaction_count: 4,
      days_active: 2,
      most_active_day: '2026-07-20',
      most_active_day_count: 2,
    });
  });

  it('recovers linked achievements from split endpoint data', () => {
    const achievement = {
      id: 'achievement-1',
      title: 'First Step',
    } as Achievement;
    const progress = {
      achievement_id: achievement.id,
      is_completed: true,
    } as UserAchievementFull;

    expect(mergeActivityAchievements([achievement], [progress])).toEqual([
      expect.objectContaining({
        achievement_id: achievement.id,
        achievement,
      }),
    ]);
  });

  it('detects a partial snapshot that discarded gamification collections', () => {
    const snapshot = {
      warnings: ['gamification_unavailable'],
      achievements: [],
      active_challenges: [],
      quick_stats: { total_achievements: 24 },
    } as unknown as ActivitySnapshot;

    expect(needsGamificationCollectionRecovery(snapshot)).toBe(true);
    expect(needsGamificationCollectionRecovery({
      ...snapshot,
      warnings: [],
      achievements: [{ achievement_id: 'achievement-1' } as UserAchievementFull],
    })).toBe(false);
  });
});
