// Galahad App Colors - Centralized for Remotion compositions
// Based on the main app's color system

export const colors = {
  // Primary Blues
  primary: {
    dark: '#174EA6',
    main: '#4285F4',
    light: '#D2E3FC',
    lighter: '#E8F0FE',
  },

  // Backgrounds
  background: {
    primary: '#F1F3F4',
    secondary: '#FFFFFF',
    tertiary: '#FAFBFC',
  },

  // Text
  text: {
    primary: '#174EA6',
    secondary: '#5F6368',
    tertiary: '#80868B',
    inverse: '#FFFFFF',
  },

  // Status Colors
  status: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#4285F4',
  },

  // Semantic Colors
  semantic: {
    income: '#10B981',
    expense: '#EF4444',
    balance: '#174EA6',
  },
} as const;

// Gradient utilities
export const gradients = {
  primary: `linear-gradient(135deg, ${colors.primary.dark} 0%, ${colors.primary.main} 100%)`,
  light: `linear-gradient(180deg, ${colors.background.primary} 0%, ${colors.background.secondary} 100%)`,
  card: `linear-gradient(145deg, ${colors.background.secondary} 0%, ${colors.primary.lighter} 100%)`,
} as const;
