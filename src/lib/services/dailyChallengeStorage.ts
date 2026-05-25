import { GameState } from '@/lib/game';
import { getTodayString, isTodayInLocalTimezone, getLocalPuzzleNumber } from '@/lib/utils/dateUtils';
import { DAILY_CHALLENGE_UPDATED_EVENT } from '@/lib/constants';
import { BaseStorageService } from './baseStorageService';
import { Logger } from '@/lib/utils/logger';

export interface DailyChallengeData {
  date: string; // YYYY-MM-DD format
  artistId: string;
  songId: string;
  gameState: GameState;
  completed: boolean;
  puzzleNumber: number; // Local timezone-based puzzle number for consistent tracking
  savedAt: string; // ISO timestamp
}

export class DailyChallengeStorage extends BaseStorageService<never> {
  private static instance: DailyChallengeStorage;

  // Used as a prefix for per-artist-date keys; getStored/save/clear are not called
  protected readonly STORAGE_KEY = 'kpop-heardle-daily-challenges';
  protected getDefault(): never { return null as never; }

  private constructor() { super(); }

  static getInstance(): DailyChallengeStorage {
    if (!DailyChallengeStorage.instance) {
      DailyChallengeStorage.instance = new DailyChallengeStorage();
    }
    return DailyChallengeStorage.instance;
  }

  private getStorageKey(artistId: string, date: string): string {
    return `${this.STORAGE_KEY}-${artistId}-${date}`;
  }

  saveDailyChallenge(artistId: string, songId: string, gameState: GameState, puzzleNumber: number = getLocalPuzzleNumber()): void {
    const today = getTodayString();
    const data: DailyChallengeData = {
      date: today,
      artistId,
      songId,
      gameState,
      completed: gameState.isGameOver,
      puzzleNumber,
      savedAt: new Date().toISOString()
    };

    this.setItem(this.getStorageKey(artistId, today), JSON.stringify(data));
    this.dispatchEvent(DAILY_CHALLENGE_UPDATED_EVENT, { artistId, date: today, completed: data.completed });
    Logger.debug(`Saved daily challenge for ${artistId} on ${today}`);
  }

  loadDailyChallenge(artistId: string): DailyChallengeData | null {
    try {
      const today = getTodayString();
      const stored = this.getItem(this.getStorageKey(artistId, today));

      if (!stored) return null;

      const data: DailyChallengeData = JSON.parse(stored);

      const currentPuzzleNumber = getLocalPuzzleNumber();
      if (!isTodayInLocalTimezone(data.date) || (data.puzzleNumber && data.puzzleNumber !== currentPuzzleNumber)) {
        Logger.debug(`Clearing outdated daily challenge for ${artistId} (date: ${data.date}, puzzle: ${data.puzzleNumber} vs current: ${currentPuzzleNumber})`);
        this.clearDailyChallenge(artistId);
        return null;
      }

      Logger.debug(`Loaded daily challenge for ${artistId} on ${today} (puzzle ${currentPuzzleNumber})`);
      return data;
    } catch (error) {
      Logger.error('Failed to load daily challenge:', error);
      return null;
    }
  }

  isDailyChallengeCompleted(artistId: string): boolean {
    return this.loadDailyChallenge(artistId)?.completed ?? false;
  }

  hasDailyChallenge(artistId: string): boolean {
    return this.loadDailyChallenge(artistId) !== null;
  }

  clearDailyChallenge(artistId: string): void {
    const today = getTodayString();
    this.removeItem(this.getStorageKey(artistId, today));
    Logger.debug(`Cleared daily challenge for ${artistId} on ${today}`);
  }

  clearAllDailyChallenges(): void {
    const keys = this.getKeysByPrefix(this.STORAGE_KEY);
    keys.forEach(key => this.removeItem(key));
    Logger.debug(`Cleared ${keys.length} daily challenges`);
  }

  getCompletionStats(artistId: string): { completed: number; total: number } {
    const keys = this.getKeysByPrefix(`${this.STORAGE_KEY}-${artistId}-`);

    let completed = 0;
    let total = 0;

    keys.forEach(key => {
      try {
        const stored = this.getItem(key);
        if (!stored) return;
        const data: DailyChallengeData = JSON.parse(stored);
        if (data.artistId === artistId) {
          total++;
          if (data.completed) completed++;
        }
      } catch {
        // skip invalid entries
      }
    });

    return { completed, total };
  }
}

export default DailyChallengeStorage;
