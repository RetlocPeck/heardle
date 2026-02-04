import { GameState } from '@/lib/game/gameLogic';
import { getTodayString, isTodayInLocalTimezone, getLocalPuzzleNumber } from '@/lib/utils/dateUtils';
import { DAILY_CHALLENGE_UPDATED_EVENT } from '@/lib/constants/game';

export interface DailyChallengeData {
  date: string; // YYYY-MM-DD format
  artistId: string;
  songId: string;
  gameState: GameState;
  completed: boolean;
  puzzleNumber: number; // Local timezone-based puzzle number for consistent tracking
  savedAt: string; // ISO timestamp
}

export class DailyChallengeStorage {
  private static instance: DailyChallengeStorage;
  private readonly STORAGE_KEY = 'kpop-heardle-daily-challenges';

  private constructor() {}

  static getInstance(): DailyChallengeStorage {
    if (!DailyChallengeStorage.instance) {
      DailyChallengeStorage.instance = new DailyChallengeStorage();
    }
    return DailyChallengeStorage.instance;
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  private getTodayDate(): string {
    return getTodayString();
  }

  /**
   * Check if a date is today
   */
  private isToday(date: string): boolean {
    return isTodayInLocalTimezone(date);
  }

  /**
   * Get the storage key for a specific artist and date
   */
  private getStorageKey(artistId: string, date: string): string {
    return `${this.STORAGE_KEY}-${artistId}-${date}`;
  }

  /**
   * Save daily challenge data
   */
  saveDailyChallenge(artistId: string, songId: string, gameState: GameState, puzzleNumber: number = getLocalPuzzleNumber()): void {
    try {
      const today = this.getTodayDate();
      const data: DailyChallengeData = {
        date: today,
        artistId,
        songId,
        gameState,
        completed: gameState.isGameOver,
        puzzleNumber,
        savedAt: new Date().toISOString()
      };

      const key = this.getStorageKey(artistId, today);
      localStorage.setItem(key, JSON.stringify(data));
      
      // Dispatch custom event to notify components of the update
      if (typeof window !== 'undefined') {
        const event = new CustomEvent(DAILY_CHALLENGE_UPDATED_EVENT, {
          detail: { artistId, date: today, completed: data.completed }
        });
        window.dispatchEvent(event);
        console.log(`📡 Dispatched ${DAILY_CHALLENGE_UPDATED_EVENT} event for ${artistId}:`, event.detail);
      }
      
      console.log(`💾 Saved daily challenge for ${artistId} on ${today}`);
    } catch (error) {
      console.error('Failed to save daily challenge:', error);
    }
  }

  /**
   * Load today's daily challenge data for an artist
   */
  loadDailyChallenge(artistId: string): DailyChallengeData | null {
    try {
      const today = this.getTodayDate();
      const key = this.getStorageKey(artistId, today);
      const stored = localStorage.getItem(key);

      if (!stored) {
        return null;
      }

      const data: DailyChallengeData = JSON.parse(stored);
      
      // Verify the data is for today (both date and puzzle number)
      const currentPuzzleNumber = getLocalPuzzleNumber();
      if (!this.isToday(data.date) || (data.puzzleNumber && data.puzzleNumber !== currentPuzzleNumber)) {
        console.log(`🗑️ Clearing outdated daily challenge data for ${artistId} (date: ${data.date}, puzzle: ${data.puzzleNumber} vs current: ${currentPuzzleNumber})`);
        this.clearDailyChallenge(artistId);
        return null;
      }

      console.log(`📂 Loaded daily challenge for ${artistId} on ${today} (puzzle ${currentPuzzleNumber})`);
      return data;
    } catch (error) {
      console.error('Failed to load daily challenge:', error);
      return null;
    }
  }

  /**
   * Check if today's daily challenge is completed for an artist
   */
  isDailyChallengeCompleted(artistId: string): boolean {
    const data = this.loadDailyChallenge(artistId);
    return data?.completed || false;
  }

  /**
   * Check if today's daily challenge exists for an artist
   */
  hasDailyChallenge(artistId: string): boolean {
    const data = this.loadDailyChallenge(artistId);
    return data !== null;
  }

  /**
   * Clear daily challenge data for an artist
   */
  clearDailyChallenge(artistId: string): void {
    try {
      const today = this.getTodayDate();
      const key = this.getStorageKey(artistId, today);
      localStorage.removeItem(key);
      console.log(`🗑️ Cleared daily challenge for ${artistId} on ${today}`);
    } catch (error) {
      console.error('Failed to clear daily challenge:', error);
    }
  }

  /**
   * Clear all daily challenge data (useful for testing or reset)
   */
  clearAllDailyChallenges(): void {
    try {
      const keys = Object.keys(localStorage);
      const dailyKeys = keys.filter(key => key.startsWith(this.STORAGE_KEY));
      
      dailyKeys.forEach(key => localStorage.removeItem(key));
      console.log(`🗑️ Cleared ${dailyKeys.length} daily challenges`);
    } catch (error) {
      console.error('Failed to clear all daily challenges:', error);
    }
  }

  /**
   * Get completion statistics for an artist
   */
  getCompletionStats(artistId: string): { completed: number; total: number } {
    try {
      const keys = Object.keys(localStorage);
      const artistKeys = keys.filter(key => 
        key.startsWith(`${this.STORAGE_KEY}-${artistId}-`)
      );

      let completed = 0;
      let total = 0;

      artistKeys.forEach(key => {
        try {
          const data: DailyChallengeData = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.artistId === artistId) {
            total++;
            if (data.completed) {
              completed++;
            }
          }
        } catch {
          // Skip invalid entries
        }
      });

      return { completed, total };
    } catch (error) {
      console.error('Failed to get completion stats:', error);
      return { completed: 0, total: 0 };
    }
  }
}

export default DailyChallengeStorage;
