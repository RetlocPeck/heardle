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
 * Check if a date string represents today in the user's local timezone
 * This is the main function used throughout the app for daily song consistency
 */
export function isTodayInLocalTimezone(dateString: string): boolean {
  return dateString === getTodayString();
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
/**
 * Validate that a date string is reasonable compared to current date
 * Prevents timezone change bugs where dates can jump unexpectedly
 */
export function isValidClientDate(clientDateString: string): boolean {
  if (!clientDateString || !/^\d{4}-\d{2}-\d{2}$/.test(clientDateString)) {
    return false;
  }
  
  try {
    const serverDate = new Date();
    const clientDate = new Date(clientDateString + 'T12:00:00');
    const timeDiff = Math.abs(clientDate.getTime() - serverDate.getTime());
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    // Allow up to 1.5 days difference for timezone variations
    return daysDiff <= 1.5;
  } catch {
    return false;
  }
}

/**
 * Get a safe date string that accounts for timezone changes
 * Falls back to server calculation if client date seems invalid
 */
export function getSafeDateString(clientDate?: string | null): string {
  if (clientDate && isValidClientDate(clientDate)) {
    return clientDate;
  }
  return getTodayString();
}
