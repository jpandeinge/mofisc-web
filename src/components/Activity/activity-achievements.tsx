// src/components/Activity/RealAchievements.tsx

import React, { useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  FileText,
  Lock,
  PiggyBank,
  Shield,
  Tag,
  TrendingDown,
  Trophy,
  UserCheck,
  Zap,
} from 'lucide-react';
import { UserAchievementFull } from '../../types/gamification';
import { colors, withOpacity } from '../../styles/colors';
import { paginateItems } from '../../utils/pagination';
import ActivityPagination from './activity-pagination';

const pointsFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

interface RealAchievementsProps {
  achievements: UserAchievementFull[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const iconForAchievement = (iconName?: string): React.ReactNode => {
  switch (iconName) {
    case 'PiggyBank':
      return <PiggyBank className="w-4 h-4" />;
    case 'FileText':
      return <FileText className="w-4 h-4" />;
    case 'Tag':
      return <Tag className="w-4 h-4" />;
    case 'TrendingDown':
      return <TrendingDown className="w-4 h-4" />;
    case 'Zap':
      return <Zap className="w-4 h-4" />;
    case 'Shield':
      return <Shield className="w-4 h-4" />;
    case 'UserCheck':
      return <UserCheck className="w-4 h-4" />;
    case 'Award':
      return <Award className="w-4 h-4" />;
    default:
      return <Trophy className="w-4 h-4" />;
  }
};

const normaliseProgress = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

const RealAchievements: React.FC<RealAchievementsProps> = ({
  achievements,
  isLoading = false,
  page,
  pageSize,
  onPageChange,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const sortedAchievements = useMemo(() => {
    return [...achievements].sort((a, b) => {
      if (a.is_completed !== b.is_completed) {
        return a.is_completed ? -1 : 1;
      }

      const completedAtA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const completedAtB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      if (completedAtA !== completedAtB) {
        return completedAtB - completedAtA;
      }

      return (b.progress || 0) - (a.progress || 0);
    });
  }, [achievements]);

  const completedCount = sortedAchievements.filter((item) => item.is_completed).length;
  const totalPointsEarned = sortedAchievements
    .filter((item) => item.is_completed)
    .reduce((sum, item) => sum + (item.achievement?.points || 0), 0);
  const {
    items: visibleAchievements,
    page: currentPage,
    totalPages,
    startIndex: firstVisibleIndex,
    endIndex: lastVisibleIndex,
  } = paginateItems(sortedAchievements, page, pageSize);

  useEffect(() => {
    if (page !== currentPage) {
      onPageChange(currentPage);
    }
  }, [currentPage, onPageChange, page]);

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="space-y-3">
        <span className="sr-only">Loading achievements…</span>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className={`h-16 rounded-xl ${shouldReduceMotion ? '' : 'animate-pulse'}`}
            style={{ background: withOpacity(colors.text.secondary, 0.08) }}
          />
        ))}
      </div>
    );
  }

  if (!sortedAchievements.length) {
    return (
      <div
        role="status"
        className="flex min-h-72 flex-col items-center justify-center rounded-xl border p-6 text-center"
        style={{
          background: colors.background.tertiary,
          borderColor: colors.border.light,
          color: colors.text.secondary,
        }}
      >
        <div
          aria-hidden="true"
          className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            color: colors.status.warning,
            background: withOpacity(colors.status.warning, 0.1),
          }}
        >
          <Trophy className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>
          Your First Reward Awaits
        </p>
        <p className="mt-1 max-w-sm text-xs leading-5">
          Achievement progress appears automatically as you use the app.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div
        className="grid grid-cols-2 divide-x divide-[color:var(--border-color)] rounded-xl border px-1 py-2"
        style={{
          borderColor: colors.border.light,
          background: colors.background.tertiary,
        }}
      >
        <div className="px-3">
          <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: colors.text.secondary }}>
            Unlocked
          </p>
          <p className="mt-0.5 text-base font-semibold tabular-nums" style={{ color: colors.text.primary }}>
            {completedCount}/{sortedAchievements.length}
          </p>
        </div>
        <div className="px-3 text-right">
          <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: colors.text.secondary }}>
            XP Earned
          </p>
          <p className="mt-0.5 text-base font-semibold tabular-nums" style={{ color: colors.primary.main }}>
            {pointsFormatter.format(totalPointsEarned)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {visibleAchievements.map((item) => {
          const progress = normaliseProgress(item.progress || 0);
          const isUnlocked = item.is_completed;

          return (
            <motion.article
              key={item.id || `${item.user_id}-${item.achievement_id}`}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
              className="rounded-xl border p-3.5"
              style={{
                borderColor: colors.border.light,
                background: isUnlocked
                  ? withOpacity(colors.status.success, 0.05)
                  : colors.background.secondary,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: isUnlocked
                        ? withOpacity(colors.status.success, 0.12)
                        : withOpacity(colors.primary.main, 0.1),
                      color: isUnlocked ? colors.status.success : colors.primary.main,
                    }}
                  >
                    {iconForAchievement(item.achievement?.icon)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold" style={{ color: colors.text.primary }}>
                      {item.achievement?.title || 'Achievement'}
                    </h3>
                    <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: colors.text.secondary }}>
                      {item.achievement?.description || 'Progress tracked by the gamification engine.'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold tabular-nums" style={{ color: colors.primary.main }}>
                    +{item.achievement?.points || 0} XP
                  </p>
                  <div className="mt-1 flex items-center justify-end gap-1">
                    {isUnlocked ? (
                      <>
                        <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" style={{ color: colors.status.success }} />
                        <span className="text-[11px]" style={{ color: colors.status.success }}>
                          Unlocked
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock aria-hidden="true" className="h-3.5 w-3.5" style={{ color: colors.text.tertiary }} />
                        <span className="text-[11px]" style={{ color: colors.text.tertiary }}>
                          Locked
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {!isUnlocked && (
                <div className="mt-2.5">
                  <div
                    role="progressbar"
                    aria-label={`${item.achievement?.title || 'Achievement'} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress)}
                    className="h-1.5 overflow-hidden rounded-full"
                    style={{ background: colors.border.light }}
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{
                        width: `${progress}%`,
                        background: colors.primary.main,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-right text-[11px] tabular-nums" style={{ color: colors.text.secondary }}>
                    {Math.round(progress)}% complete
                  </p>
                </div>
              )}
            </motion.article>
          );
        })}
      </div>

      <ActivityPagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={firstVisibleIndex}
        endIndex={lastVisibleIndex}
        totalItems={sortedAchievements.length}
        itemLabel="Achievement"
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default RealAchievements;
