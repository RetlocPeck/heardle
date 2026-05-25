/**
 * Utility functions for string manipulation used throughout the app
 */

/**
 * Normalize a string for comparison (used in game logic)
 * Removes special characters, normalizes whitespace, converts to lowercase
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Check if two strings match when normalized
 * This function is used for game logic to determine if a guess is correct
 * 
 * Examples:
 * - "Golden" vs "Golden (Extended)" → false (partial match not allowed)
 * - "Golden" vs "Golden" → true (exact match)
 * - "golden" vs "Golden" → true (case-insensitive)
 * - "Run BTS" vs "Run BTS" → true (exact match)
 * - "RUN" vs "Run BTS" → false (partial match not allowed)
 */
export function normalizedStringMatch(str1: string, str2: string): boolean {
  // First try exact match (case-insensitive)
  if (str1.toLowerCase() === str2.toLowerCase()) {
    return true;
  }
  
  // Then try normalized match (removes special characters but keeps structure)
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);
  
  // For game logic, we want EXACT matches after normalization
  // This prevents partial matches like "Golden" matching "Golden (Extended)"
  return normalized1 === normalized2;
}

/**
 * Generate a hash code from a string (used for daily song selection)
 */
export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

