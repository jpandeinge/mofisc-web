import { useSyncExternalStore } from 'react';

type ActivityCapacityMode = 'narrow' | 'compact' | 'medium' | 'tall';

export interface ActivityCollectionCapacity {
  achievements: number;
  challenges: number;
}

const MEDIA_QUERIES = {
  desktop: '(min-width: 1024px)',
  mediumHeight: '(min-height: 960px)',
  tallHeight: '(min-height: 1180px)',
} as const;

const CAPACITY_BY_MODE: Record<ActivityCapacityMode, ActivityCollectionCapacity> = {
  narrow: { achievements: 3, challenges: 2 },
  compact: { achievements: 4, challenges: 3 },
  medium: { achievements: 8, challenges: 4 },
  tall: { achievements: 12, challenges: 6 },
};

const getCapacityMode = (): ActivityCapacityMode => {
  if (typeof window === 'undefined') return 'medium';

  if (!window.matchMedia(MEDIA_QUERIES.desktop).matches) {
    return 'narrow';
  }
  if (window.matchMedia(MEDIA_QUERIES.tallHeight).matches) {
    return 'tall';
  }
  if (window.matchMedia(MEDIA_QUERIES.mediumHeight).matches) {
    return 'medium';
  }
  return 'compact';
};

const subscribeToCapacityChanges = (onStoreChange: () => void): (() => void) => {
  const mediaQueries = Object.values(MEDIA_QUERIES).map((query) => (
    window.matchMedia(query)
  ));

  mediaQueries.forEach((mediaQuery) => {
    mediaQuery.addEventListener('change', onStoreChange);
  });

  return () => {
    mediaQueries.forEach((mediaQuery) => {
      mediaQuery.removeEventListener('change', onStoreChange);
    });
  };
};

export const useActivityCollectionCapacity = (): ActivityCollectionCapacity => {
  const mode = useSyncExternalStore<ActivityCapacityMode>(
    subscribeToCapacityChanges,
    getCapacityMode,
    (): ActivityCapacityMode => 'medium'
  );

  return CAPACITY_BY_MODE[mode];
};
