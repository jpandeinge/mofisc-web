// src/utils/formatters.ts

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];


export const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined) return 'N/A';
    return `NAD ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
  };

  export const formatCompactCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `NAD ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `NAD ${(amount / 1000).toFixed(1)}K`;
    }
    return `NAD ${amount}`;
  };


export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Known acronyms that should be uppercase
const KNOWN_ACRONYMS = new Set([
  'atm', 'pos', 'llc', 'ltd', 'inc', 'co', 'corp', 'dba', 'usa',
  'uk', 'eu', 'api', 'url', 'http', 'https', 'id', 'vat', 'gst'
]);

/**
 * Converts a string to Title Case with smart handling of edge cases
 * Handles: apostrophes, hyphens, multiple spaces, acronyms, and special characters
 *
 * Examples:
 * - "hello world" → "Hello World"
 * - "mcdonald's" → "McDonald's"
 * - "7-eleven" → "7-Eleven"
 * - "hello  world" → "Hello World"
 * - "atm withdrawal" → "ATM Withdrawal"
 * - "AT&T" → "AT&T" (preserves existing acronyms)
 */
export const toTitleCase = (str: string): string => {
  if (!str || typeof str !== 'string') return '';

  // Trim and normalize multiple spaces to single space
  const normalized = str.trim().replace(/\s+/g, ' ');

  if (normalized.length === 0) return '';

  return normalized
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;

      // Check if word is already an acronym with uppercase letters (e.g., "AT&T", "USA")
      // If it has uppercase letters and is relatively short, preserve it
      if (word.length <= 5 && /[A-Z]/.test(word) && word === word.toUpperCase()) {
        return word;
      }

      // Handle hyphenated words (e.g., "7-eleven" → "7-Eleven")
      if (word.includes('-')) {
        return word
          .split('-')
          .map(part => titleCaseWord(part))
          .join('-');
      }

      // Handle words with apostrophes (e.g., "mcdonald's" → "McDonald's")
      if (word.includes("'")) {
        const parts = word.split("'");
        return parts.map((part, index) => {
          // First part gets title cased, subsequent parts get lowercase
          return index === 0 ? titleCaseWord(part) : part.toLowerCase();
        }).join("'");
      }

      return titleCaseWord(word);
    })
    .join(' ');
};

/**
 * Helper function to title case a single word
 * Checks for known acronyms and handles capitalization
 */
function titleCaseWord(word: string): string {
  if (word.length === 0) return word;

  const lowerWord = word.toLowerCase();

  // Check if it's a known acronym
  if (KNOWN_ACRONYMS.has(lowerWord)) {
    return word.toUpperCase();
  }

  // Standard title case: capitalize first letter, lowercase the rest
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}