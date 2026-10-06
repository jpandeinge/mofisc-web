// src/components/Activity/RealChallenges.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Target,
} from 'lucide-react';
import { UserChallengeFull } from '../../types/gamification';
import { colors, withOpacity } from '../../styles/colors';
import { paginateItems } from '../../utils/pagination';
import ActivityPagination from './activity-pagination';

const expiryDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

interface RealChallengesProps {
  challenges: UserChallengeFull[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onCompleteChallenge: (challengeId: string) => Promise<void>;
}

const challengeTypeColour = (type?: string): string => {
  switch ((type || '').toLowerCase()) {
    case 'savings':
      return colors.status.success;
    case 'spending':
      return colors.status.warning;
    case 'tracking':
      return colors.primary.main;
    case 'wellness':
      return '#06B6D4';
    default:
      return colors.primary.main;
  }
};

const isExpired = (expiresAt?: string): boolean => {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
};

const formatExpiry = (expiresAt?: string): string => {
  if (!expiresAt) return 'No expiry';
  const expiresOn = new Date(expiresAt);
  return Number.isNaN(expiresOn.getTime())
    ? 'No expiry'
    : expiryDateFormatter.format(expiresOn);
};

const RealChallenges: React.FC<RealChallengesProps> = ({
  challenges,
  isLoading = false,
  page,
  pageSize,
  onPageChange,
  onCompleteChallenge,
}) => {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const sortedChallenges = useMemo(() => {
    return [...challenges].sort((a, b) => {
      if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
      const aExpiry = new Date(a.challenge?.expires_at || 0).getTime();
      const bExpiry = new Date(b.challenge?.expires_at || 0).getTime();
      return aExpiry - bExpiry;
    });
  }, [challenges]);
  const {
    items: visibleChallenges,
    page: currentPage,
    totalPages,
    startIndex,
    endIndex,
  } = paginateItems(sortedChallenges, page, pageSize);

  useEffect(() => {
    if (page !== currentPage) {
      onPageChange(currentPage);
    }
  }, [currentPage, onPageChange, page]);

  const handleClaim = async (challengeId: string) => {
    setClaimingId(challengeId);
    try {
      await onCompleteChallenge(challengeId);
    } finally {
      setClaimingId(null);
    }
  };

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="space-y-3">
        <span className="sr-only">Loading challenges…</span>
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className={`h-24 rounded-xl ${shouldReduceMotion ? '' : 'animate-pulse'}`}
            style={{ background: withOpacity(colors.text.secondary, 0.08) }}
          />
        ))}
      </div>
    );
  }

  if (!sortedChallenges.length) {
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
            color: colors.primary.main,
            background: withOpacity(colors.primary.main, 0.1),
          }}
        >
          <Target className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>
          You’re All Caught Up
        </p>
        <p className="mt-1 max-w-sm text-xs leading-5">
          New challenges appear automatically as your activity updates.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="space-y-3">
        {visibleChallenges.map((challenge) => {
          const challengeMeta = challenge.challenge;
          const targetValue = Number(challengeMeta?.target_value || 0);
          const progressValue = Number(challenge.progress || 0);
          const progressPercent =
            targetValue > 0
              ? Math.max(0, Math.min(100, (progressValue / targetValue) * 100))
              : 0;
          const expired = isExpired(challengeMeta?.expires_at);
          const completed = Boolean(challenge.is_completed);
          const canClaim = !completed && !expired && targetValue > 0 && progressValue >= targetValue;
          // Completion endpoints operate on the user's challenge assignment,
          // not the shared daily challenge definition.
          const userChallengeId = challenge.id || '';
          const accent = challengeTypeColour(challengeMeta?.challenge_type);

          return (
            <motion.article
              key={challenge.id || challenge.challenge_id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
              className="rounded-xl border p-3.5"
              style={{
                borderColor: colors.border.light,
                background: colors.background.secondary,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: withOpacity(accent, 0.12),
                      color: accent,
                    }}
                  >
                    <Target className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold" style={{ color: colors.text.primary }}>
                      {challengeMeta?.title || 'Challenge'}
                    </h3>
                    <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: colors.text.secondary }}>
                      {challengeMeta?.description || 'Complete this challenge to earn points.'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold tabular-nums" style={{ color: colors.primary.main }}>
                    +{challengeMeta?.points || 0} pts
                  </p>
                  <p className="mt-1 text-[11px] tabular-nums" style={{ color: colors.text.tertiary }}>
                    {Math.round(progressPercent)}%
                  </p>
                </div>
              </div>

              <div className="mt-2.5">
                <div
                  role="progressbar"
                  aria-label={`${challengeMeta?.title || 'Challenge'} progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progressPercent)}
                  className="h-1.5 overflow-hidden rounded-full"
                  style={{ background: colors.border.light }}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{
                      width: `${progressPercent}%`,
                      background: completed ? colors.status.success : accent,
                    }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-[11px] tabular-nums" style={{ color: colors.text.secondary }}>
                    {progressValue.toFixed(0)} / {targetValue.toFixed(0)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: colors.text.tertiary }}>
                      {expired
                        ? <AlertTriangle aria-hidden="true" className="h-3 w-3" />
                        : <Clock3 aria-hidden="true" className="h-3 w-3" />}
                      {formatExpiry(challengeMeta?.expires_at)}
                    </span>

                    {completed ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold"
                        style={{
                          background: withOpacity(colors.status.success, 0.12),
                          color: colors.status.success,
                        }}
                      >
                        <CheckCircle2 aria-hidden="true" className="h-3 w-3" />
                        Completed
                      </span>
                    ) : expired ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold"
                        style={{
                          background: withOpacity(colors.status.warning, 0.12),
                          color: colors.status.warning,
                        }}
                      >
                        <CalendarClock aria-hidden="true" className="h-3 w-3" />
                        Expired
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleClaim(userChallengeId)}
                        disabled={
                          !userChallengeId
                          || !canClaim
                          || claimingId === userChallengeId
                        }
                        className="min-h-8 touch-manipulation rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                          background: canClaim
                            ? colors.primary.main
                            : withOpacity(colors.text.secondary, 0.12),
                          color: canClaim ? colors.text.inverse : colors.text.secondary,
                        }}
                      >
                        {claimingId === userChallengeId ? 'Claiming…' : canClaim ? 'Claim Reward' : 'In Progress'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      <ActivityPagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={sortedChallenges.length}
        itemLabel="Challenge"
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default RealChallenges;
