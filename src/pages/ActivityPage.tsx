// src/pages/ActivityPage.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import {
  Flame, Trophy, Award, AlertTriangle, TrendingUp, TrendingDown,
  Target, FileText, Zap, Star, BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserMetrics } from '../context/UserMetricsContext';
import { useAppContext } from '../context/AppContext';
import { useGamification } from '../context/GamificationContext';
import { useLoading } from '../context/LoadingContext';
import { useStatementContext } from '../context/StatementContext';
import { achievementService } from '../services/achievementService';
import { formatCurrency } from '../utils/formatters';
import {
  ActivitySnapshot,
  UserAchievementFull,
  UserChallengeFull,
} from '../types/gamification';
import { secureLogger } from '../utils/secureLogger';
import {
  activityHealthStatus,
  calculateLocalActivityMetrics,
  mergeActivityAchievements,
  needsGamificationCollectionRecovery,
  nextStreakMilestone,
  normalizeSavingsRatePercentage,
  resolveActivityLevelSnapshot,
  streakMilestoneProgress,
} from '../utils/activityMetrics';
import { resolvePageDataState } from '../utils/pageDataState';
import { colors, withOpacity } from '../styles/colors';
import RealAchievements from '../components/Activity/activity-achievements';
import RealChallenges from '../components/Activity/activity-challenges';
import EmptyState from '../components/Common/EmptyState';
import LoadingState from '../components/Common/LoadingState';
import ComingSoonPage from './ComingSoonPage';
import { useActivityCollectionCapacity } from '../hooks/useActivityCollectionCapacity';

const integerFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const ActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const collectionCapacity = useActivityCollectionCapacity();
  const { user } = useAuth();
  const { currentBankAccount } = useAppContext();
  const { isProcessing, processingVariant, isPersistentLoading } = useLoading();
  const {
    transactions,
    allTransactions,
    filteredTransactions,
    selectedBank,
    viewMode,
    isLoading: isContextLoading,
  } = useStatementContext();
  const { state: gamificationState, refreshGameData, completeChallenge } = useGamification();
  const { state: userMetricsState, fetchMetrics } = useUserMetrics();
  const latestRequestRef = useRef(0);
  const [isGamificationLoading, setIsGamificationLoading] = useState(false);
  const [loadedActivityScope, setLoadedActivityScope] = useState<string | null>(null);
  const [activitySnapshot, setActivitySnapshot] = useState<ActivitySnapshot | null>(null);
  const [activitySnapshotScope, setActivitySnapshotScope] = useState<string | null>(null);
  const [userAchievements, setUserAchievements] = useState<UserAchievementFull[]>([]);
  const [recoveredChallenges, setRecoveredChallenges] = useState<UserChallengeFull[]>([]);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  const activeProgressTab = searchParams.get('tab') === 'achievements'
    ? 'achievements'
    : 'challenges';
  const achievementPageParam = Number(searchParams.get('achievementPage'));
  const achievementPage = Number.isSafeInteger(achievementPageParam) && achievementPageParam > 0
    ? achievementPageParam
    : 1;
  const challengePageParam = Number(searchParams.get('challengePage'));
  const challengePage = Number.isSafeInteger(challengePageParam) && challengePageParam > 0
    ? challengePageParam
    : 1;
  const activityScopeKey = user
    ? `${user.id}:${selectedBank || '__all_banks__'}`
    : null;

  const handleProgressTabChange = useCallback((value: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (value === 'achievements') {
      nextSearchParams.set('tab', 'achievements');
      nextSearchParams.delete('challengePage');
    } else {
      nextSearchParams.delete('tab');
      nextSearchParams.delete('achievementPage');
    }
    setSearchParams(nextSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleChallengePageChange = useCallback((page: number) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('tab');
    nextSearchParams.delete('achievementPage');
    if (page <= 1) {
      nextSearchParams.delete('challengePage');
    } else {
      nextSearchParams.set('challengePage', String(page));
    }
    setSearchParams(nextSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleAchievementPageChange = useCallback((page: number) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set('tab', 'achievements');
    nextSearchParams.delete('challengePage');
    if (page <= 1) {
      nextSearchParams.delete('achievementPage');
    } else {
      nextSearchParams.set('achievementPage', String(page));
    }
    setSearchParams(nextSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const currentTransactions = selectedBank
    ? filteredTransactions
    : viewMode === 'aggregated'
      ? allTransactions
      : transactions;

  const localMetrics = useMemo(
    () => calculateLocalActivityMetrics(currentTransactions),
    [currentTransactions]
  );

  const loadActivityCollections = useCallback(async () => {
    const [
      challengesResult,
      achievementsResult,
      progressResult,
    ] = await Promise.all([
      achievementService.getDailyChallenges(),
      achievementService.getAchievements(),
      achievementService.getUserAchievements(),
    ]);

    return {
      challenges: challengesResult,
      achievements: mergeActivityAchievements(
        achievementsResult,
        progressResult
      ),
    };
  }, []);

  const loadGamificationSnapshot = useCallback(async ({
    bypassCache = false,
  }: {
    bypassCache?: boolean;
  } = {}) => {
    if (!user) return;

    const requestedScopeKey = `${user.id}:${selectedBank || '__all_banks__'}`;
    const requestId = ++latestRequestRef.current;
    setIsGamificationLoading(true);
    setSnapshotError(null);

    try {
      const snapshot = await achievementService.getActivitySnapshot({
        bankName: selectedBank,
        cacheScope: user.id,
        bypassCache,
      });
      if (requestId !== latestRequestRef.current) return;

      setActivitySnapshot(snapshot);
      setActivitySnapshotScope(requestedScopeKey);
      if (snapshot.achievements.length > 0) {
        setUserAchievements(snapshot.achievements);
      }
      setLoadedActivityScope(requestedScopeKey);

      if (needsGamificationCollectionRecovery(snapshot)) {
        const recovered = await loadActivityCollections();
        if (requestId !== latestRequestRef.current) return;

        const reconciledSnapshot = {
          ...snapshot,
          achievements: recovered.achievements.length > 0
            ? recovered.achievements
            : snapshot.achievements,
          active_challenges: recovered.challenges.length > 0
            ? recovered.challenges
            : snapshot.active_challenges,
        };
        setActivitySnapshot(reconciledSnapshot);
        setUserAchievements(reconciledSnapshot.achievements);
        setRecoveredChallenges(recovered.challenges);
      } else {
        setUserAchievements(snapshot.achievements);
        setRecoveredChallenges([]);
      }
    } catch (error) {
      if (requestId !== latestRequestRef.current) return;

      const message = error instanceof Error
        ? error.message
        : 'We could not load your activity data.';
      secureLogger.error('ActivityPage', 'Failed to load activity snapshot', error);

      // Keep the page useful if the aggregate endpoint is temporarily
      // unavailable. These independent requests run together to avoid a
      // serial fallback waterfall.
      const [, , collectionsResult] = await Promise.allSettled([
        fetchMetrics(false, selectedBank),
        refreshGameData(),
        loadActivityCollections(),
      ]);

      if (requestId !== latestRequestRef.current) return;

      setSnapshotError(message);
      if (collectionsResult.status === 'fulfilled') {
        setUserAchievements(collectionsResult.value.achievements);
        setRecoveredChallenges(collectionsResult.value.challenges);
      }
      setLoadedActivityScope(requestedScopeKey);
    } finally {
      if (requestId === latestRequestRef.current) {
        setIsGamificationLoading(false);
      }
    }
  }, [
    user,
    selectedBank,
    fetchMetrics,
    refreshGameData,
    loadActivityCollections,
  ]);

  const handleCompleteChallenge = useCallback(
    async (challengeId: string) => {
      try {
        await completeChallenge(challengeId);
        await loadGamificationSnapshot({ bypassCache: true });
      } catch (error) {
        secureLogger.error('ActivityPage', `Failed to complete challenge ${challengeId}`, error);
      }
    },
    [completeChallenge, loadGamificationSnapshot]
  );

  useEffect(() => {
    if (!user) {
      navigate('/signin');
    }
  }, [user, navigate]);

  // Listen for gamification notifications to refresh metrics in realtime (debounced)
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;

    const handleNotification = (event: CustomEvent) => {
      const payload = event.detail;
      const notificationType = payload?.data?.notification_type;

      // Refresh metrics when achievement/level-related notifications arrive
      const gamificationTypes = [
        'achievement_unlocked',
        'level_up',
        'streak_milestone',
        'challenge_completed',
        'points_earned'
      ];

      if (gamificationTypes.includes(notificationType)) {
        // Debounce to prevent multiple rapid refetches
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          loadGamificationSnapshot({ bypassCache: true });
        }, 2000); // Wait 2 seconds to batch multiple notifications
      }
    };

    window.addEventListener('notification-received', handleNotification as EventListener);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('notification-received', handleNotification as EventListener);
    };
  }, [loadGamificationSnapshot]);

  useEffect(() => {
    if (!user) return;

    if (isContextLoading) return;

    if (currentTransactions.length === 0) {
      latestRequestRef.current += 1;
      setIsGamificationLoading(false);
      setSnapshotError(null);
      return;
    }

    loadGamificationSnapshot();

    return () => {
      latestRequestRef.current += 1;
    };
  }, [
    user,
    selectedBank,
    isContextLoading,
    currentTransactions.length,
    loadGamificationSnapshot,
  ]);

  if (currentBankAccount === 'Bank Account') {
    return <ComingSoonPage />;
  }

  if (!user) return null;

  const currentActivitySnapshot = activitySnapshotScope === activityScopeKey
    ? activitySnapshot
    : null;
  const hasLoadedCurrentActivityScope = loadedActivityScope === activityScopeKey;

  // Render useful transaction-derived values immediately. Remote metrics
  // enrich this object when available without blocking the entire page.
  const metrics = {
    ...localMetrics,
    ...((!selectedBank || snapshotError) && userMetricsState.metrics
      ? userMetricsState.metrics
      : {}),
    ...(currentActivitySnapshot?.metrics || {}),
  };

  const pageDataState = resolvePageDataState(
    currentTransactions.length > 0,
    isPersistentLoading || isProcessing || isContextLoading
  );

  if (pageDataState === 'loading') {
    return <LoadingState variant={processingVariant} />;
  }

  if (pageDataState === 'empty') {
    return (
      <EmptyState
        sectionLabel="Activity"
        title="No Progress Data Yet"
        icon={<Trophy className="h-5 w-5" />}
        description={(
          <>
            Upload your first statement from <strong className="font-semibold text-[color:var(--text-primary)]">New Statement</strong> to activate streaks, challenges, and achievements.
          </>
        )}
      />
    );
  }

  const quickStats = currentActivitySnapshot?.quick_stats;
  const completedAchievementsCount = quickStats?.completed_achievements ?? userAchievements.filter(
    (achievement) => achievement.is_completed
  ).length;
  const totalAchievementsCount = quickStats?.total_achievements ?? userAchievements.length;
  const totalRealAchievements = totalAchievementsCount
    ? completedAchievementsCount
    : (metrics.completed_achievements || metrics.total_real_achievements || 0);

  const shouldShowProgressSkeleton = (
    !currentActivitySnapshot
    && (!hasLoadedCurrentActivityScope || isGamificationLoading)
  );
  const progressUnavailable = (
    !currentActivitySnapshot
    && hasLoadedCurrentActivityScope
    && Boolean(snapshotError)
    && !isGamificationLoading
  );
  const currentSavingsStreak = currentActivitySnapshot?.streak.current_savings_streak ?? (
    hasLoadedCurrentActivityScope && !snapshotError
      ? (gamificationState.streaks.savings?.currentStreak || 0)
      : 0
  );
  const fallbackTotalPoints = gamificationState.points || metrics.total_points || 0;
  const levelSnapshot = resolveActivityLevelSnapshot(
    currentActivitySnapshot?.level,
    hasLoadedCurrentActivityScope && !snapshotError,
    fallbackTotalPoints
  );
  const totalPoints = levelSnapshot?.total_points ?? 0;
  const currentLevel = levelSnapshot?.current_level ?? 1;
  const financialScore = currentActivitySnapshot?.health.financial_score ?? metrics.financial_score ?? 0;
  const transactionCount = Math.max(
    quickStats?.transaction_count ?? 0,
    metrics.transaction_count ?? 0,
    currentTransactions.length
  );
  const savingsRate = quickStats?.savings_rate_percentage ?? normalizeSavingsRatePercentage(
    metrics.savings_rate,
    (metrics as any).savings_rate_percentage
  );
  const spendingTrend = quickStats?.spending_trend ?? metrics.spending_trend ?? 'stable';
  const netFlow = quickStats?.net_flow ?? metrics.total_savings ?? 0;
  const avgDailySpending = quickStats?.avg_daily_spending ?? metrics.avg_daily_spending ?? 0;

  // XP progress (must match backend level formula)
  const pointsToNextLevel = levelSnapshot?.points_to_next_level ?? 0;
  const levelProgressPercent = levelSnapshot?.level_progress_percent ?? 0;

  // Streak milestones
  const nextMilestone = currentActivitySnapshot?.streak.next_milestone
    ?? nextStreakMilestone(currentSavingsStreak);
  const nextMilestonePercent = currentActivitySnapshot?.streak.next_milestone_progress_percent
    ?? streakMilestoneProgress(currentSavingsStreak, nextMilestone);
  const healthStatus = currentActivitySnapshot?.health.status
    || activityHealthStatus(financialScore);
  const displayedChallenges = currentActivitySnapshot?.active_challenges.length
    ? currentActivitySnapshot.active_challenges
    : (
      !currentActivitySnapshot
      || currentActivitySnapshot.warnings?.includes('gamification_unavailable')
    )
      ? (
        recoveredChallenges.length > 0
          ? recoveredChallenges
          : gamificationState.dailyChallenges
      )
      : [];
  const healthAccent = financialScore >= 80
    ? colors.status.success
    : financialScore >= 60
      ? colors.status.warning
      : colors.status.error;
  const isChallengesLoading = (
    !currentActivitySnapshot
    && (!hasLoadedCurrentActivityScope || isGamificationLoading)
    && gamificationState.dailyChallenges.length === 0
  );

  return (
    <motion.main
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
      className="flex min-h-[calc(100dvh-7rem)] flex-col gap-4"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
            Progress
          </p>
          <h1 className="mt-1 text-pretty text-2xl font-semibold tracking-tight text-[color:var(--text-primary)]">
            Activity
          </h1>
          <p className="mt-1 text-pretty text-sm text-[color:var(--text-secondary)]">
            A focused view of your momentum, goals, and rewards.
          </p>
        </div>

        {selectedBank && (
          <span className="max-w-48 truncate rounded-full border border-[color:var(--border-color)] bg-[color:var(--bg-secondary)] px-3 py-1.5 text-xs font-medium text-[color:var(--text-secondary)]">
            {selectedBank}
          </span>
        )}
      </div>

      {(snapshotError || currentActivitySnapshot?.is_partial) && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: withOpacity(colors.status.warning, 0.25),
            background: withOpacity(colors.status.warning, 0.08),
            color: colors.text.secondary,
          }}
        >
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" style={{ color: colors.status.warning }} />
          <p className="text-pretty">
            {snapshotError
              ? 'Live activity could not be refreshed. Showing available transaction metrics.'
              : 'Some supporting activity services are delayed. The available data is shown.'}
          </p>
        </div>
      )}

      <motion.section
        aria-labelledby="activity-overview-title"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
        className="overflow-hidden rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--bg-secondary)] shadow-sm"
      >
        <h2 id="activity-overview-title" className="sr-only">Progress Overview</h2>
        <div className="grid grid-cols-1 divide-y divide-[color:var(--border-color)] lg:grid-cols-[1.35fr_1fr_1fr] lg:divide-x lg:divide-y-0">
          <article className="p-5" aria-busy={shouldShowProgressSkeleton}>
            {shouldShowProgressSkeleton ? (
              <ProgressCardSkeleton
                label="Loading level progress…"
                shouldReduceMotion={shouldReduceMotion}
              />
            ) : progressUnavailable || !levelSnapshot ? (
              <ProgressCardUnavailable label="Level" />
            ) : (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <div
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      color: colors.text.inverse,
                      background: `linear-gradient(135deg, ${colors.primary.main}, ${colors.primary.dark})`,
                    }}
                  >
                    <Star className="h-5 w-5" fill="currentColor" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
                      Level
                    </p>
                    <p className="text-2xl font-semibold tabular-nums text-[color:var(--text-primary)]">
                      {currentLevel}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xl font-semibold tabular-nums" style={{ color: colors.primary.main }}>
                      {integerFormatter.format(totalPoints)}
                    </p>
                    <p className="text-xs text-[color:var(--text-secondary)]">XP earned</p>
                  </div>
                </div>

                <div className="flex justify-between gap-3 text-xs text-[color:var(--text-secondary)]">
                  <span className="truncate">
                    {integerFormatter.format(pointsToNextLevel)} XP to Level {currentLevel + 1}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums" style={{ color: colors.primary.main }}>
                    {Math.round(levelProgressPercent)}%
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`Level ${currentLevel} progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(levelProgressPercent)}
                  className="mt-2 h-2 overflow-hidden rounded-full"
                  style={{ background: colors.primary.light }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${levelProgressPercent}%`,
                      background: `linear-gradient(90deg, ${colors.primary.main}, ${colors.status.success})`,
                    }}
                  />
                </div>
              </>
            )}
          </article>

          <article className="p-5" aria-busy={shouldShowProgressSkeleton}>
            {shouldShowProgressSkeleton ? (
              <ProgressCardSkeleton
                label="Loading savings streak…"
                shouldReduceMotion={shouldReduceMotion}
              />
            ) : progressUnavailable ? (
              <ProgressCardUnavailable label="Savings Streak" />
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      color: currentSavingsStreak > 0 ? '#FF6B35' : colors.text.tertiary,
                      background: currentSavingsStreak > 0
                        ? withOpacity('#FF6B35', 0.1)
                        : colors.background.tertiary,
                    }}
                  >
                    <Flame className="h-5 w-5" fill={currentSavingsStreak > 0 ? 'currentColor' : 'none'} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
                      Savings Streak
                    </p>
                    <p className="text-2xl font-semibold tabular-nums text-[color:var(--text-primary)]">
                      {currentSavingsStreak} <span className="text-sm font-normal text-[color:var(--text-secondary)]">days</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-between gap-3 text-xs text-[color:var(--text-secondary)]">
                  <span>Next milestone: {nextMilestone} days</span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {Math.round(nextMilestonePercent)}%
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Savings streak milestone progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(nextMilestonePercent)}
                  className="mt-2 h-2 overflow-hidden rounded-full"
                  style={{ background: colors.border.light }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${nextMilestonePercent}%`,
                      background: currentSavingsStreak > 0 ? '#FF6B35' : colors.text.tertiary,
                    }}
                  />
                </div>
              </>
            )}
          </article>

          <article className="p-5">
            <div className="flex items-center gap-3">
              <div
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ color: healthAccent, background: withOpacity(healthAccent, 0.1) }}
              >
                <Target className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
                  Health Score
                </p>
                <p className="text-2xl font-semibold tabular-nums" style={{ color: healthAccent }}>
                  {Math.round(financialScore)}
                  <span className="text-sm font-normal text-[color:var(--text-secondary)]"> / 100</span>
                </p>
              </div>
              <span
                className="ml-auto rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ color: healthAccent, background: withOpacity(healthAccent, 0.1) }}
              >
                {healthStatus}
              </span>
            </div>
            <p className="mt-4 text-xs leading-5 text-[color:var(--text-secondary)]">
              Based on cash flow, savings rate, and spending stability.
            </p>
          </article>
        </div>
      </motion.section>

      <motion.section
        aria-labelledby="quick-stats-title"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.25, delay: shouldReduceMotion ? 0 : 0.05 }}
      >
        <h2 id="quick-stats-title" className="mb-2 flex items-center gap-2 text-sm font-semibold text-[color:var(--text-primary)]">
          <BarChart3 aria-hidden="true" className="h-4 w-4" style={{ color: colors.primary.main }} />
          Quick Stats
        </h2>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            icon={<Trophy className="h-4 w-4" style={{ color: colors.status.warning }} />}
            value={
              totalAchievementsCount > 0
                ? `${completedAchievementsCount}/${totalAchievementsCount}`
                : totalRealAchievements
            }
            label="Achievements"
            accentColor={colors.status.warning}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" style={{ color: colors.status.success }} />}
            value={`${Math.round(savingsRate)}%`}
            label="Savings Rate"
            accentColor={colors.status.success}
          />
          <StatCard
            icon={<FileText className="h-4 w-4" style={{ color: colors.primary.main }} />}
            value={integerFormatter.format(transactionCount)}
            label="Transactions"
            accentColor={colors.primary.main}
          />
          <StatCard
            icon={spendingTrend === 'down'
              ? <TrendingDown className="h-4 w-4" style={{ color: colors.status.success }} />
              : spendingTrend === 'up'
                ? <TrendingUp className="h-4 w-4" style={{ color: colors.status.error }} />
                : <Target className="h-4 w-4" style={{ color: colors.text.secondary }} />
            }
            value={spendingTrend.charAt(0).toUpperCase() + spendingTrend.slice(1)}
            label="Trend"
            accentColor={spendingTrend === 'down' ? colors.status.success : spendingTrend === 'up' ? colors.status.error : colors.text.secondary}
          />
          <StatCard
            icon={<Zap className="h-4 w-4" style={{ color: netFlow >= 0 ? colors.status.success : colors.status.error }} />}
            value={formatCurrency(netFlow)}
            label="Net Flow"
            accentColor={netFlow >= 0 ? colors.status.success : colors.status.error}
          />
          <StatCard
            icon={<Award className="h-4 w-4" style={{ color: colors.status.warning }} />}
            value={formatCurrency(avgDailySpending)}
            label="Avg Daily"
            accentColor={colors.status.warning}
          />
        </div>
      </motion.section>

      <motion.section
        aria-labelledby="goals-rewards-title"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.25, delay: shouldReduceMotion ? 0 : 0.1 }}
        className="flex min-h-[20rem] flex-1 flex-col overflow-hidden rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--bg-secondary)] shadow-sm sm:min-h-[22rem]"
      >
        <Tabs.Root
          value={activeProgressTab}
          onValueChange={handleProgressTabChange}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="shrink-0 flex flex-col gap-4 border-b border-[color:var(--border-color)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <h2 id="goals-rewards-title" className="text-base font-semibold text-[color:var(--text-primary)]">
                Goals & Rewards
              </h2>
              <p className="mt-0.5 text-pretty text-xs text-[color:var(--text-secondary)]">
                Focus on today’s actions or review your long-term milestones.
              </p>
            </div>

            <Tabs.List
              aria-label="Activity progress views"
              className="inline-flex w-full rounded-xl bg-[color:var(--color-bg-tertiary)] p-1 sm:w-auto"
            >
              <Tabs.Trigger
                value="challenges"
                className="inline-flex min-h-10 flex-1 touch-manipulation items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 data-[state=active]:bg-[color:var(--bg-secondary)] data-[state=active]:text-[color:var(--text-primary)] data-[state=active]:shadow-sm sm:flex-none"
              >
                <Target aria-hidden="true" className="h-4 w-4" />
                Challenges
                <span className="rounded-full bg-[color:var(--color-primary-lighter)] px-1.5 py-0.5 text-[11px] tabular-nums text-[color:var(--text-primary)]">
                  {displayedChallenges.length}
                </span>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="achievements"
                className="inline-flex min-h-10 flex-1 touch-manipulation items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 data-[state=active]:bg-[color:var(--bg-secondary)] data-[state=active]:text-[color:var(--text-primary)] data-[state=active]:shadow-sm sm:flex-none"
              >
                <Trophy aria-hidden="true" className="h-4 w-4" />
                Achievements
                <span className="rounded-full bg-[color:var(--color-primary-lighter)] px-1.5 py-0.5 text-[11px] tabular-nums text-[color:var(--text-primary)]">
                  {completedAchievementsCount}/{totalAchievementsCount}
                </span>
              </Tabs.Trigger>
            </Tabs.List>
          </div>

          <Tabs.Content
            value="challenges"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5"
          >
            <RealChallenges
              challenges={displayedChallenges}
              isLoading={isChallengesLoading}
              page={challengePage}
              pageSize={collectionCapacity.challenges}
              onPageChange={handleChallengePageChange}
              onCompleteChallenge={handleCompleteChallenge}
            />
          </Tabs.Content>
          <Tabs.Content
            value="achievements"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5"
          >
            <RealAchievements
              achievements={userAchievements}
              isLoading={(
                !currentActivitySnapshot
                && (!hasLoadedCurrentActivityScope || isGamificationLoading)
                && userAchievements.length === 0
              )}
              page={achievementPage}
              pageSize={collectionCapacity.achievements}
              onPageChange={handleAchievementPageChange}
            />
          </Tabs.Content>
        </Tabs.Root>
      </motion.section>
    </motion.main>
  );
};

interface ProgressCardSkeletonProps {
  label: string;
  shouldReduceMotion: boolean | null;
}

const ProgressCardSkeleton: React.FC<ProgressCardSkeletonProps> = ({
  label,
  shouldReduceMotion,
}) => (
  <div role="status" aria-live="polite" className="min-h-[5.75rem]">
    <span className="sr-only">{label}</span>
    <div
      aria-hidden="true"
      className={shouldReduceMotion ? '' : 'animate-pulse'}
    >
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 shrink-0 rounded-2xl bg-[color:var(--color-bg-primary)]" />
        <div className="min-w-0 flex-1">
          <div className="h-3 w-20 rounded-full bg-[color:var(--color-bg-primary)]" />
          <div className="mt-2 h-6 w-12 rounded-lg bg-[color:var(--color-primary-lighter)]" />
        </div>
        <div className="h-6 w-16 rounded-lg bg-[color:var(--color-bg-primary)]" />
      </div>
      <div className="mt-4 h-3 w-36 rounded-full bg-[color:var(--color-bg-primary)]" />
      <div className="mt-2 h-2 w-full rounded-full bg-[color:var(--color-primary-lighter)]" />
    </div>
  </div>
);

const ProgressCardUnavailable: React.FC<{ label: string }> = ({ label }) => (
  <div role="status" className="flex min-h-[5.75rem] items-center gap-3">
    <div
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--color-bg-tertiary)] text-[color:var(--color-text-tertiary)]"
    >
      <AlertTriangle className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[color:var(--text-primary)]">
        Temporarily unavailable
      </p>
      <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
        Progress will update automatically when the service reconnects.
      </p>
    </div>
  </div>
);

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  accentColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, accentColor }) => (
  <div
    className="min-w-0 rounded-xl border p-3"
    style={{
      background: colors.background.secondary,
      border: `1px solid ${colors.border.light}`
    }}
  >
    <div className="flex items-center gap-3">
      <div
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: withOpacity(accentColor, 0.1) }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold tabular-nums" style={{ color: colors.text.primary }}>
          {value}
        </div>
        <div className="truncate text-[11px]" style={{ color: colors.text.secondary }}>
          {label}
        </div>
      </div>
    </div>
  </div>
);

export default ActivityPage;
