// src/styles/colors.ts
// Central color system for the entire application
// Follow Revolut's design principles: clean, minimal, consistent

/**
 * Primary Color Palette
 * Based on Material Design Blue palette
 */
export const colors = {
  // Primary Blues
  primary: {
    dark: '#174EA6',      // Primary text, active states, important elements
    main: '#4285F4',      // Accent color, buttons, interactive elements
    light: '#D2E3FC',     // Backgrounds, borders, highlights
    lighter: '#E8F0FE',   // Hover states, subtle backgrounds
  },

  // Backgrounds
  background: {
    primary: '#F1F3F4',   // Main background
    secondary: '#FFFFFF',  // Card backgrounds, elevated surfaces
    tertiary: '#FAFBFC',  // Alternative light background
  },

  // Text
  text: {
    primary: '#174EA6',   // Main text color
    secondary: '#5F6368', // Secondary text, labels
    tertiary: '#80868B',  // Disabled text, placeholders
    inverse: '#FFFFFF',   // Text on dark backgrounds
  },

  // Borders
  border: {
    light: '#D2E3FC',     // Light borders
    main: '#4285F4',      // Active borders
    subtle: '#E8F0FE',    // Very subtle borders
  },

  // Status Colors
  status: {
    success: '#10B981',   // Success states
    error: '#EF4444',     // Error states
    warning: '#F59E0B',   // Warning states
    info: '#4285F4',      // Info states
  },

  // Semantic Colors
  semantic: {
    income: '#10B981',    // Income/inflow
    expense: '#EF4444',   // Expense/outflow
    balance: '#174EA6',   // Balance
    cashFlow: '#4285F4', // Cash flow
  },

  // Overlay & Effects
  overlay: {
    light: 'rgba(255, 255, 255, 0.95)',
    medium: 'rgba(255, 255, 255, 0.8)',
    dark: 'rgba(23, 78, 166, 0.1)',
    backdrop: 'rgba(0, 0, 0, 0.5)',  // Modal backdrop
  },
} as const;

/**
 * Color utilities for consistent usage
 */
export const getColor = (path: string): string => {
  const keys = path.split('.');
  let value: any = colors;

  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      // Production: Silently fail for missing color paths
      return colors.primary.main;
    }
  }

  return value;
};

/**
 * Opacity utilities
 */
export const withOpacity = (color: string, opacity: number): string => {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Gradient utilities
 */
export const gradients = {
  primary: `linear-gradient(135deg, ${colors.primary.dark} 0%, ${colors.primary.main} 100%)`,
  light: `linear-gradient(180deg, ${colors.background.primary} 0%, ${colors.background.secondary} 100%)`,
  card: `linear-gradient(145deg, ${colors.background.secondary} 0%, ${colors.primary.light} 10%)`,
  overlay: `linear-gradient(to right, ${withOpacity(colors.primary.main, 0.03)} 0%, transparent 50%, ${withOpacity(colors.primary.light, 0.05)} 100%)`,
} as const;

/**
 * Shadow utilities
 */
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
} as const;

export default colors;
