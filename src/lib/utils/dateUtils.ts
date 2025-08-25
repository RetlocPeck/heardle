/**
 * Utility functions for date manipulation
 */

/**
 * Get today's date in YYYY-MM-DD format for daily song consistency
 * Uses local timezone to ensure song changes at local midnight
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date string for a specific date in local timezone
 */
export function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string back to a Date object
 * Creates date at local midnight
 */
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Check if a date string is today
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayString();
}

/**
 * Check if a date string is in the past
 */
export function isPastDate(dateString: string): boolean {
  return dateString < getTodayString();
}

/**
 * Check if a date string is in the future
 */
export function isFutureDate(dateString: string): boolean {
  return dateString > getTodayString();
}

/**
 * Get the number of days between two dates
 */
export function daysDifference(date1: string, date2: string): number {
  const d1 = parseDateString(date1);
  const d2 = parseDateString(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format a date for display
 */
export function formatDateForDisplay(dateString: string): string {
  const date = parseDateString(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Get the start of the week for a given date (Sunday)
 */
export function getWeekStart(dateString: string): string {
  const date = parseDateString(dateString);
  const day = date.getDay();
  const diff = date.getDate() - day;
  const weekStart = new Date(date.setDate(diff));
  return getDateString(weekStart);
}

/**
 * Check if two dates are in the same week
 */
export function isSameWeek(date1: string, date2: string): boolean {
  return getWeekStart(date1) === getWeekStart(date2);
}

/**
 * Get the next day's date string
 */
export function getNextDayString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getDateString(tomorrow);
}

/**
 * Get the previous day's date string
 */
export function getPreviousDayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateString(yesterday);
}

/**
 * Check if a date string represents today in the user's local timezone
 * This is the main function used throughout the app for daily song consistency
 */
export function isTodayInLocalTimezone(dateString: string): boolean {
  return dateString === getTodayString();
}

/**
 * Get the current local time in HH:MM format for debugging
 */
export function getCurrentLocalTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Get the time until next midnight in milliseconds
 */
export function getTimeUntilMidnight(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
}

/**
 * Get a local timezone-based puzzle number for daily challenges
 * This ensures puzzle rollover happens at local midnight, not UTC
 * Works similarly to getTodayString() but returns a number for easy comparison
 */
export function getLocalPuzzleNumber(now: Date = new Date()): number {
  const startDateString = process.env.NEXT_PUBLIC_HEARDLE_START_DATE_UTC ?? '2025-08-17T00:00:00Z';
  
  // Parse the start date but convert it to local timezone equivalent
  const startDate = new Date(startDateString);
  const localStartDate = new Date(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
  
  // Get local midnight dates for accurate day calculation
  const nowLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startLocal = new Date(localStartDate.getFullYear(), localStartDate.getMonth(), localStartDate.getDate());
  
  // Calculate days difference
  const msPerDay = 86_400_000;
  const days = Math.floor((nowLocal.getTime() - startLocal.getTime()) / msPerDay);
  
  return days + 1;
}