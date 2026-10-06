// src/context/GamificationContext.ts

import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import {
  GamificationState,
  GamificationAction,
  UserGameStats,
  AchievementWithDisplay
} from '../types/gamification';
import { useAuth } from './AuthContext';
import { useStatementContext } from './StatementContext';
import { achievementService } from '../services/achievementService';
import { secureLogger, logDevDetails } from '../utils/secureLogger';
import {
  Award,
  Calendar,
  DollarSign,
  FileText,
  Grid,
  LogIn,
  PiggyBank,
  Shield,
  Star,
  Tag,
  TrendingDown,
  TrendingUp,
  Trophy,
  Unlock,
  Zap,
  Briefcase,
  Calculator,
  Compass,
  UserCheck,
  BarChart2
} from 'lucide-react';

const initialState: GamificationState = {
  points: 0,
  level: 1,
  achievements: [],
  dailyChallenges: [],
  streaks: {
    savings: {
      currentStreak: 0,
      bestStreak: 0,
      lastUpdated: new Date(),
      milestones: [
        { days: 7, isAchieved: false, reward: 100 },
        { days: 30, isAchieved: false, reward: 500 },
        { days: 100, isAchieved: false, reward: 2000 },
      ]
    },
    login: {
      currentStreak: 0,
      bestStreak: 0,
      lastUpdated: new Date(),
      milestones: [
        { days: 3, isAchieved: false, reward: 50 },
        { days: 7, isAchieved: false, reward: 150 },
        { days: 30, isAchieved: false, reward: 1000 },
      ]
    },
    tracking: {
      currentStreak: 0,
      bestStreak: 0,
      lastUpdated: new Date(),
      milestones: [
        { days: 5, isAchieved: false, reward: 75 },
        { days: 15, isAchieved: false, reward: 300 },
        { days: 50, isAchieved: false, reward: 1500 },
      ]
    }
  },
  isLoading: false,
  error: null
};

const GamificationContext = createContext<{
  state: GamificationState;
  dispatch: React.Dispatch<GamificationAction>;
  trackAchievement: (eventType: string, value?: number) => Promise<void>;
  updateStreak: (streakType: 'login' | 'savings' | 'tracking') => Promise<void>;
  completeChallenge: (challengeId: string) => Promise<void>;
  refreshGameData: () => Promise<void>;
} | undefined>(undefined);

// Map icon string to React component
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'PiggyBank': <PiggyBank className="w-5 h-5" />,
    'Trophy': <Trophy className="w-5 h-5" />,
    'TrendingUp': <TrendingUp className="w-5 h-5" />,
    'Award': <Award className="w-5 h-5" />,
    'FileText': <FileText className="w-5 h-5" />,
    'Tag': <Tag className="w-5 h-5" />,
    'BarChart2': <BarChart2 className="w-5 h-5" />,
    'Calendar': <Calendar className="w-5 h-5" />,
    'DollarSign': <DollarSign className="w-5 h-5" />,
    'Grid': <Grid className="w-5 h-5" />,
    'Briefcase': <Briefcase className="w-5 h-5" />,
    'TrendingDown': <TrendingDown className="w-5 h-5" />,
    'LogIn': <LogIn className="w-5 h-5" />,
    'UserCheck': <UserCheck className="w-5 h-5" />,
    'Compass': <Compass className="w-5 h-5" />,
    'Star': <Star className="w-5 h-5" />,
    'Shield': <Shield className="w-5 h-5" />,
    'Calculator': <Calculator className="w-5 h-5" />,
    'Unlock': <Unlock className="w-5 h-5" />,
    'Zap': <Zap className="w-5 h-5" />
  };

  return iconMap[iconName] || <Trophy className="w-5 h-5" />;
};

// Map backend data to frontend state
const mapGameStatsToState = (gameStats: UserGameStats): Partial<GamificationState> => {
  // Log mapping status without exposing sensitive data
  logDevDetails('GamificationContext', 'Mapping game stats to state', {
    achievementCount: gameStats.achievements?.recent_unlocks?.length || 0
  });

  // Ensure achievements array is always valid
  const achievements: AchievementWithDisplay[] = (gameStats.achievements?.recent_unlocks?.map(ua => {
    if (!ua || !ua.achievement) {
      secureLogger.warn('GamificationContext', 'Invalid user achievement structure detected - skipping entry');
      return null;
    }

    return {
      ...ua.achievement,
      progress: ua.progress || 0,
      isUnlocked: ua.is_completed || false,
      unlockedAt: ua.completed_at ? new Date(ua.completed_at) : undefined,
      iconComponent: getIconComponent(ua.achievement.icon || 'Trophy')
    };
  }).filter(Boolean) as AchievementWithDisplay[]) || [];

  logDevDetails('GamificationContext', 'Mapped achievements', { count: achievements.length });

  // Ensure streaks object exists with all required properties
  const _defaultStreakState = {
    currentStreak: 0,
    bestStreak: 0,
    lastUpdated: new Date(),
    milestones: []
  };

  const streaks = {
    savings: {
      currentStreak: gameStats.streaks?.savings?.current_count || 0,
      bestStreak: gameStats.streaks?.savings?.highest_count || 0,
      lastUpdated: gameStats.streaks?.savings?.last_tracked_date
        ? new Date(gameStats.streaks.savings.last_tracked_date)
        : new Date(),
      milestones: [
        { days: 7, isAchieved: (gameStats.streaks?.savings?.highest_count || 0) >= 7, reward: 100 },
        { days: 30, isAchieved: (gameStats.streaks?.savings?.highest_count || 0) >= 30, reward: 500 },
        { days: 100, isAchieved: (gameStats.streaks?.savings?.highest_count || 0) >= 100, reward: 2000 },
      ]
    },
    login: {
      currentStreak: gameStats.streaks?.login?.current_count || 0,
      bestStreak: gameStats.streaks?.login?.highest_count || 0,
      lastUpdated: gameStats.streaks?.login?.last_tracked_date
        ? new Date(gameStats.streaks.login.last_tracked_date)
        : new Date(),
      milestones: [
        { days: 3, isAchieved: (gameStats.streaks?.login?.highest_count || 0) >= 3, reward: 50 },
        { days: 7, isAchieved: (gameStats.streaks?.login?.highest_count || 0) >= 7, reward: 150 },
        { days: 30, isAchieved: (gameStats.streaks?.login?.highest_count || 0) >= 30, reward: 1000 },
      ]
    },
    tracking: {
      currentStreak: gameStats.streaks?.tracking?.current_count || 0,
      bestStreak: gameStats.streaks?.tracking?.highest_count || 0,
      lastUpdated: gameStats.streaks?.tracking?.last_tracked_date
        ? new Date(gameStats.streaks.tracking.last_tracked_date)
        : new Date(),
      milestones: [
        { days: 5, isAchieved: (gameStats.streaks?.tracking?.highest_count || 0) >= 5, reward: 75 },
        { days: 15, isAchieved: (gameStats.streaks?.tracking?.highest_count || 0) >= 15, reward: 300 },
        { days: 50, isAchieved: (gameStats.streaks?.tracking?.highest_count || 0) >= 50, reward: 1500 },
      ]
    }
  };

  return {
    points: gameStats.points?.points || 0,
    level: gameStats.points?.level || 1,
    achievements,
    dailyChallenges: gameStats.active_challenges || [],
    streaks
  };
};

function gamificationReducer(state: GamificationState, action: GamificationAction): GamificationState {
  switch (action.type) {
    case 'FETCH_DATA_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case 'FETCH_DATA_SUCCESS': {
      const newState = mapGameStatsToState(action.payload);
      return {
        ...state,
        ...newState,
        isLoading: false,
        error: null
      };
    }

    case 'FETCH_DATA_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };

    case 'UPDATE_ACHIEVEMENTS':
      return {
        ...state,
        achievements: action.payload
      };

    case 'UPDATE_CHALLENGES':
      return {
        ...state,
        dailyChallenges: action.payload
      };

    case 'UPDATE_STREAK':
      const { type, streak } = action.payload;
      const streakData = state.streaks[type as keyof typeof state.streaks];
      if (!streakData) return state;

      const updatedStreaks = {
        ...state.streaks,
        [type]: {
          ...streakData,
          currentStreak: streak.current_count,
          bestStreak: streak.highest_count,
          lastUpdated: new Date(streak.last_tracked_date)
        }
      };
      return {
        ...state,
        streaks: updatedStreaks
      };

    case 'UNLOCK_ACHIEVEMENT':
      const { achievementId, completedAt } = action.payload;
      const updatedAchievements = state.achievements.map(ach =>
        ach.id === achievementId
          ? { ...ach, isUnlocked: true, unlockedAt: new Date(completedAt) }
          : ach
      );
      return {
        ...state,
        achievements: updatedAchievements
      };

    case 'COMPLETE_CHALLENGE':
      const challengeId = action.payload;
      const updatedChallenges = state.dailyChallenges.map(challenge =>
        challenge.challenge_id === challengeId
          ? { ...challenge, is_completed: true, completed_at: new Date().toISOString() }
          : challenge
      );
      return {
        ...state,
        dailyChallenges: updatedChallenges
      };

    default:
      return state;
  }
}

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gamificationReducer, initialState);
  const { user } = useAuth();
  const { allTransactions } = useStatementContext(); // Get transactions to check availability
  const isFetchingRef = useRef(false);

  // Load gamification data when user logs in
  const fetchGameData = useCallback(async () => {
    if (!user || isFetchingRef.current) return;

    isFetchingRef.current = true;

    try {
      dispatch({ type: 'FETCH_DATA_START' });
      const gameStats = await achievementService.getUserGameStats();

      // Log only non-sensitive summary (don't log full object)
      logDevDetails('GamificationContext', 'Game stats loaded successfully', {
        hasPoints: !!gameStats.points,
        achievementCount: gameStats.achievements?.recent_unlocks?.length || 0,
        challengeCount: gameStats.active_challenges?.length || 0,
        hasStreaks: !!gameStats.streaks
      });

      // Always ensure we have a valid data structure
      const sanitizedData = {
        points: gameStats.points || { points: 0, level: 1 },
        achievements: {
          ...gameStats.achievements,
          recent_unlocks: gameStats.achievements?.recent_unlocks || []
        },
        active_challenges: gameStats.active_challenges || [],
        streaks: gameStats.streaks || {}
      };

      dispatch({ type: 'FETCH_DATA_SUCCESS', payload: sanitizedData });
    } catch (error: any) {
      secureLogger.error('Gamification', 'Error fetching game data', error);
      dispatch({
        type: 'FETCH_DATA_FAILURE',
        payload: error instanceof Error ? error.message : 'Failed to load gamification data'
      });
    } finally {
      isFetchingRef.current = false;
    }
  }, [user]);

  // Update login streak when user logs in (only if they have transactions)
  useEffect(() => {
    if (!user) return;

    // Check if user has transactions before making gamification API calls
    const checkTransactionsAndFetch = async () => {
      try {
        // Get transactions from StatementContext if available
        const hasTransactions = allTransactions && allTransactions.length > 0;

        if (!hasTransactions) {
          logDevDetails('GamificationContext', 'No transactions available yet - skipping gamification data fetch');
          return;
        }

        // User has transactions - proceed with gamification
        try {
          await achievementService.updateStreak('login');
        } catch (error) {
          secureLogger.error('GamificationContext', 'Failed to update login streak', error);
        }

        // Fetch game data
        await fetchGameData();
      } catch (error) {
        secureLogger.error('Gamification', 'Error in gamification fetch', error);
      }
    };

    checkTransactionsAndFetch();
  }, [user, allTransactions, fetchGameData]);

  // Periodically check for and fetch new challenges (only if user has transactions)
  useEffect(() => {
    if (!user) return;

    // Only fetch challenges if user has transactions
    const hasTransactions = allTransactions && allTransactions.length > 0;
    if (!hasTransactions) {
      logDevDetails('GamificationContext', 'No transactions available - skipping periodic challenge fetch');
      return;
    }

    const fetchChallenges = async () => {
      if (isFetchingRef.current) return;

      try {
        const challenges = await achievementService.getDailyChallenges();
        dispatch({ type: 'UPDATE_CHALLENGES', payload: challenges });
      } catch (error) {
        secureLogger.error('Gamification', 'Failed to fetch challenges', error);
      }
    };

    fetchChallenges();
    const interval = setInterval(fetchChallenges, 1000 * 60 * 60); // Check hourly

    return () => clearInterval(interval);
  }, [user, allTransactions]);

  // Track an achievement
  const trackAchievement = async (eventType: string, value: number = 1) => {
    if (!user) return;

    try {
      const updatedAchievements = await achievementService.trackAchievementProgress(eventType, value);

      // Check for newly completed achievements
      for (const ach of updatedAchievements) {
        if (ach.is_completed && ach.completed_at) {
          dispatch({
            type: 'UNLOCK_ACHIEVEMENT',
            payload: {
              achievementId: ach.achievement_id,
              completedAt: ach.completed_at || new Date().toISOString()
            }
          });
        }
      }

      // Refresh all data to ensure everything is in sync
      fetchGameData();
    } catch (error) {
      secureLogger.error('Gamification', `Failed to track achievement for event ${eventType}`, error);
    }
  };

  // Update a streak
  const updateStreak = async (streakType: 'login' | 'savings' | 'tracking') => {
    if (!user) return;

    try {
      const updatedStreak = await achievementService.updateStreak(streakType);
      dispatch({
        type: 'UPDATE_STREAK',
        payload: {
          type: streakType,
          streak: updatedStreak
        }
      });
    } catch (error) {
      secureLogger.error('Gamification', `Failed to update ${streakType} streak`, error);
    }
  };

  // Complete a challenge
  const completeChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      await achievementService.completeChallenge(challengeId);
      dispatch({ type: 'COMPLETE_CHALLENGE', payload: challengeId });
    } catch (error) {
      secureLogger.error('Gamification', `Failed to complete challenge ${challengeId}`, error);
      throw error;
    }
  };

  const refreshGameData = useCallback(async () => {
    await fetchGameData();
  }, [fetchGameData]);

  const contextValue = {
    state,
    dispatch,
    trackAchievement,
    updateStreak,
    completeChallenge,
    refreshGameData
  };

  return (
    <GamificationContext.Provider value={contextValue}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
