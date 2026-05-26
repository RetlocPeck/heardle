import { GameState } from '@/lib/game';
import { getTodayString, isTodayInLocalTimezone, getLocalPuzzleNumber } from '@/lib/utils/dateUtils';
import { emitDailyChallengeUpdated } from '@/lib/utils/customEvents';
import { Logger } from '@/lib/utils/logger';

export interface DailyChallengeData {
  date: string; // YYYY-MM-DD format
  artistId: string;
  songId: string;
  gameState: GameState;
  completed: boolean;
  puzzleNumber: number;
  savedAt: string; // ISO timestamp
}

const KEY_PREFIX = 'kpop-heardle-daily-challenges';

/**
 * Standalone localStorage helpers used only by this class.
 * DailyChallengeStorage manages per-artist-date keys directly,
 * so it does not fit the single-key model of BaseStorageService.
 */
function isBrowser(): boolean { return typeof window !== 'undefined'; }

function lsGet(key: string): string | null {
  if (!isBrowser()) return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function lsSet(key: string, value: string): void {
  if (!isBrowser()) return;
  try { localStorage.setItem(key, value); } catch (e) {
    Logger.error(`Error writing ${key}:`, e);
  }
}

function lsRemove(key: string): void {
  if (!isBrowser()) return;
  try { localStorage.removeItem(key); } catch (e) {
    Logger.error(`Error removing ${key}:`, e);
  }
}

function lsKeysByPrefix(prefix: string): string[] {
  if (!isBrowser()) return [];
  try { return Object.keys(localStorage).filter(k => k.startsWith(prefix)); } catch { return []; }
}

export class DailyChallengeStorage {
  private static instance: DailyChallengeStorage;

  private constructor() {}

  static getInstance(): DailyChallengeStorage {
    if (!DailyChallengeStorage.instance) {
      DailyChallengeStorage.instance = new DailyChallengeStorage();
    }
    return DailyChallengeStorage.instance;
  }

  private getStorageKey(artistId: string, date: string): string {
    return `${KEY_PREFIX}-${artistId}-${date}`;
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
      savedAt: new Date().toISOString(),
    };

    lsSet(this.getStorageKey(artistId, today), JSON.stringify(data));
    emitDailyChallengeUpdated({ artistId, date: today, completed: data.completed });
    Logger.debug(`Saved daily challenge for ${artistId} on ${today}`);
  }

  loadDailyChallenge(artistId: string): DailyChallengeData | null {
    try {
      const today = getTodayString();
      const stored = lsGet(this.getStorageKey(artistId, today));
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
    lsRemove(this.getStorageKey(artistId, today));
    Logger.debug(`Cleared daily challenge for ${artistId} on ${today}`);
  }

  clearAllDailyChallenges(): void {
    const keys = lsKeysByPrefix(KEY_PREFIX);
    keys.forEach(lsRemove);
    Logger.debug(`Cleared ${keys.length} daily challenges`);
  }

  getCompletionStats(artistId: string): { completed: number; total: number } {
    const keys = lsKeysByPrefix(`${KEY_PREFIX}-${artistId}-`);
    let completed = 0;
    let total = 0;

    keys.forEach(key => {
      try {
        const stored = lsGet(key);
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
