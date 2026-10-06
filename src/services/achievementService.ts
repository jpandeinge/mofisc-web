import { api } from '../lib/api';
import {
  ActivitySnapshot,
  Achievement,
  UserAchievementFull,
  UserChallengeFull,
  UserStreak,
  UserGameStats
} from '../types/gamification';
import { secureLogger } from '../utils/secureLogger';

const ACTIVITY_CACHE_TTL_MS = 30_000;
const ACTIVITY_CACHE_MAX_ENTRIES = 25;
const activitySnapshotCache = new Map<string, {
  snapshot: ActivitySnapshot;
  expiresAt: number;
}>();
const activitySnapshotRequests = new Map<string, Promise<ActivitySnapshot>>();
const activitySnapshotVersions = new Map<string, number>();

export interface ActivitySnapshotRequestOptions {
  forceRecalculate?: boolean;
  bankName?: string | null;
  cacheScope?: string;
  bypassCache?: boolean;
}

const activityCacheKey = (
  scope: string | undefined,
  bankName: string | null | undefined
): string | null => scope ? `${scope}::${bankName || 'all'}` : null;

const storeActivitySnapshot = (key: string, snapshot: ActivitySnapshot) => {
  activitySnapshotCache.delete(key);
  activitySnapshotCache.set(key, {
    snapshot,
    expiresAt: Date.now() + (
      snapshot.is_partial ? 5_000 : ACTIVITY_CACHE_TTL_MS
    ),
  });

  while (activitySnapshotCache.size > ACTIVITY_CACHE_MAX_ENTRIES) {
    const oldestKey = activitySnapshotCache.keys().next().value;
    if (!oldestKey) break;
    activitySnapshotCache.delete(oldestKey);
    activitySnapshotVersions.delete(oldestKey);
  }
};

/**
 * Achievement Service - Handles all achievement-related API interactions
 */
export const achievementService = {
  /**
   * Get the full ActivityPage snapshot from one backend aggregation endpoint.
   */
  getActivitySnapshot: async ({
    forceRecalculate = false,
    bankName,
    cacheScope,
    bypassCache = false,
  }: ActivitySnapshotRequestOptions = {}): Promise<ActivitySnapshot> => {
    const cacheKey = activityCacheKey(cacheScope, bankName);
    const requestKey = cacheKey
      ? `${cacheKey}::${
          forceRecalculate ? 'recalculate' : bypassCache ? 'refresh' : 'normal'
        }`
      : null;

    if (cacheKey && !forceRecalculate && !bypassCache) {
      const cached = activitySnapshotCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.snapshot;
      }
      if (cached) activitySnapshotCache.delete(cacheKey);
    }

    if (requestKey) {
      const existingRequest = activitySnapshotRequests.get(requestKey);
      if (existingRequest) return existingRequest;
    }

    const requestVersion = cacheKey
      ? (activitySnapshotVersions.get(cacheKey) || 0) + 1
      : 0;
    if (cacheKey) activitySnapshotVersions.set(cacheKey, requestVersion);

    const request = (async () => {
      const params = new URLSearchParams();
      if (forceRecalculate) params.append('force_recalculate', 'true');
      if (bankName) params.append('bank_name', bankName);

      const response = await api.get(
        `/v1/achievements/user/activity${params.toString() ? `?${params.toString()}` : ''}`,
        {
          // The page renders local metrics immediately; cap background work so
          // a degraded dependency cannot occupy the client indefinitely.
          timeout: 30000,
          retry: 0,
        } as any
      );
      if (response.data && response.data.success) {
        if (response.data.data) {
          const snapshot = response.data.data as ActivitySnapshot;
          if (
            cacheKey
            && activitySnapshotVersions.get(cacheKey) === requestVersion
          ) {
            storeActivitySnapshot(cacheKey, snapshot);
          }
          return snapshot;
        }
        throw new Error('Activity data was empty');
      }
      throw new Error(response.data?.message || 'Failed to fetch activity snapshot');
    })();

    if (requestKey) activitySnapshotRequests.set(requestKey, request);

    try {
      return await request;
    } catch (error: any) {
      secureLogger.error('achievementService', 'Error fetching activity snapshot', error);
      throw error instanceof Error ? error : new Error('Failed to fetch activity snapshot');
    } finally {
      if (requestKey && activitySnapshotRequests.get(requestKey) === request) {
        activitySnapshotRequests.delete(requestKey);
      }
    }
  },

  /**
   * Get all available achievements
   */
  getAchievements: async (): Promise<Achievement[]> => {
    try {
      const response = await api.get('/v1/achievements');
      if (response.data && response.data.success) {
        return response.data.data || [];
      }
      throw new Error(response.data?.message || 'Failed to fetch achievements');
    } catch (error: any) {
      secureLogger.error('achievementService', 'Error fetching achievements', error);
      // Return empty array instead of throwing to prevent UI disruption
      return [];
    }
  },

  /**
   * Get a specific achievement by ID
   */
  getAchievement: async (achievementId: string): Promise<Achievement | null> => {
    try {
      const response = await api.get(`/v1/achievements/${achievementId}`);
      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data?.message || 'Failed to fetch achievement');
    } catch (error: any) {
      secureLogger.error('achievementService', `Error fetching achievement ${achievementId}`, error);
      return null;
    }
  },

  /**
   * Get current user's achievements with progress
   */
  getUserAchievements: async (): Promise<UserAchievementFull[]> => {
    try {
      const response = await api.get('/v1/achievements/user/achievements');
      if (response.data && response.data.success) {
        return response.data.data || [];
      }
      throw new Error(response.data?.message || 'Failed to fetch user achievements');
    } catch (error: any) {
      secureLogger.error('achievementService', 'Error fetching user achievements', error);
      // Return empty array instead of throwing to prevent UI disruption
      return [];
    }
  },

  /**
   * Get user progress for a specific achievement
   */
  getUserAchievement: async (achievementId: string): Promise<UserAchievementFull | null> => {
    try {
      const response = await api.get(`/v1/achievements/user/achievements/${achievementId}`);
      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data?.message || 'Failed to fetch user achievement');
    } catch (error: any) {
      secureLogger.error('achievementService', `Error fetching user achievement ${achievementId}`, error);
      return null;
    }
  },

  /**
   * Track progress for an achievement
   */
  trackAchievementProgress: async (eventType: string, value: number = 1): Promise<UserAchievementFull[]> => {
    try {
      const response = await api.post('/v1/achievements/user/progress', {
        event_type: eventType,
        value: value
      });
      if (response.data && response.data.success) {
        return response.data.data || [];
      }
      throw new Error(response.data?.message || 'Failed to track achievement progress');
    } catch (error: any) {
      secureLogger.error('achievementService', 'Error tracking achievement progress', error);
      return [];
    }
  },

  /**
   * Get active daily challenges
   */
  getDailyChallenges: async (): Promise<UserChallengeFull[]> => {
    try {
      const response = await api.get('/v1/achievements/challenges');
      if (response.data && response.data.success) {
        return response.data.data || [];
      }
      throw new Error(response.data?.message || 'Failed to fetch daily challenges');
    } catch (error: any) {
      secureLogger.error('achievementService', 'Error fetching daily challenges', error);
      return [];
    }
  },

  /**
   * Update progress for a challenge
   */
  updateChallengeProgress: async (challengeId: string, value: number = 1): Promise<UserChallengeFull | null> => {
    try {
      const response = await api.post(`/v1/achievements/challenges/${challengeId}/progress`, { value });
      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data?.message || 'Failed to update challenge progress');
    } catch (error: any) {
      secureLogger.error('achievementService', `Error updating challenge ${challengeId} progress`, error);
      return null;
    }
  },

  /**
   * Mark a challenge as completed and claim rewards
   */
  completeChallenge: async (challengeId: string): Promise<UserChallengeFull> => {
    try {
      const response = await api.post(`/v1/achievements/challenges/${challengeId}/complete`);
      if (response.data && response.data.success) {
        if (response.data.data) return response.data.data;
        throw new Error('Challenge completion data was empty');
      }
      throw new Error(response.data?.message || 'Failed to complete challenge');
    } catch (error: any) {
      secureLogger.error('achievementService', `Error completing challenge ${challengeId}`, error);
      throw error instanceof Error ? error : new Error('Failed to complete challenge');
    }
  },

  /**
   * Update a user streak for a specific activity
   */
  updateStreak: async (streakType: 'login' | 'savings' | 'tracking'): Promise<UserStreak> => {
    try {
      const response = await api.post(`/v1/achievements/streaks/${streakType}`);
      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data?.message || 'Failed to update streak');
    } catch (error: any) {
      secureLogger.error('achievementService', `Error updating ${streakType} streak`, error);
      // Return a fallback streak object to prevent UI errors
      const fallbackStreak: UserStreak = {
        id: 'fallback-streak',
        user_id: '',
        streak_type: streakType,
        current_count: 0,
        highest_count: 0,
        last_tracked_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      return fallbackStreak;
    }
  },

  /**
   * Get comprehensive game stats for the current user
   */
  getUserGameStats: async (): Promise<UserGameStats> => {
    try {
      const response = await api.get('/v1/achievements/user/stats');

      // Data validation and fallbacks
      if (!response.data || !response.data.success) {
        secureLogger.error('achievementService', 'Failed API response for user game stats', {
          status: response.status,
          success: response.data?.success
        });
        throw new Error(response.data?.message || 'Failed to fetch user game stats');
      }

      const data = response.data.data || {};

      // Ensure we have a valid data structure with fallbacks
      return {
        points: data.points || {
          points: 0,
          level: 1,
          user_id: '',
          id: '',
          created_at: new Date().toISOString()
        },
        achievements: data.achievements || {
          total_achievements: 0,
          completed_achievements: 0,
          total_points: 0,
          current_level: 1,
          recent_unlocks: []
        },
        active_challenges: data.active_challenges || [],
        streaks: data.streaks || {}
      };
    } catch (error: any) {
      secureLogger.error('achievementService', 'Error fetching user game stats', error);
      // Create minimal valid object structure instead of throwing
      return {
        points: {
          points: 0,
          level: 1,
          user_id: '',
          id: '',
          created_at: new Date().toISOString()
        },
        achievements: {
          total_achievements: 0,
          completed_achievements: 0,
          total_points: 0,
          current_level: 1,
          recent_unlocks: []
        },
        active_challenges: [],
        streaks: {
          login: {
            id: '',
            user_id: '',
            streak_type: 'login',
            current_count: 0,
            highest_count: 0,
            last_tracked_date: new Date().toISOString(),
            created_at: new Date().toISOString()
          },
          savings: {
            id: '',
            user_id: '',
            streak_type: 'savings',
            current_count: 0,
            highest_count: 0,
            last_tracked_date: new Date().toISOString(),
            created_at: new Date().toISOString()
          },
          tracking: {
            id: '',
            user_id: '',
            streak_type: 'tracking',
            current_count: 0,
            highest_count: 0,
            last_tracked_date: new Date().toISOString(),
            created_at: new Date().toISOString()
          }
        }
      };
    }
  }
};
