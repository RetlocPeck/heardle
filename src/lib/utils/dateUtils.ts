/**
 * Utility functions for date manipulation
 */

/**
 * Get today's date in YYYY-MM-DD format for daily song consistency
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date string for a specific date
 */
export function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse a date string back to a Date object
 */
export function parseDateString(dateString: string): Date {
  return new Date(dateString + 'T00:00:00.000Z');
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
