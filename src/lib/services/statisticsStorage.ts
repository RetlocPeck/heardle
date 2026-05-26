import { BaseStorageService } from './baseStorageService';
import { STORAGE_KEYS } from '@/lib/constants';
import { emitStatisticsUpdated } from '@/lib/utils/customEvents';
import { Logger } from '@/lib/utils/logger';

export interface GameStats {
  winsByTries: Record<number, number>; // 1-6 tries
  failedGames: number;
  totalGames: number;
  winPercentage: number;
  averageTries: number;
  currentStreak: number;
  bestStreak: number;
}

export interface ArtistStats {
  daily: GameStats;
  practice: GameStats;
}

export interface GlobalStats {
  daily: GameStats;
  practice: GameStats;
  byArtist: Record<string, ArtistStats>;
}

export class StatisticsStorage extends BaseStorageService<GlobalStats> {
  private static instance: StatisticsStorage;

  protected readonly STORAGE_KEY = STORAGE_KEYS.STATISTICS;

  private constructor() { super(); }

  static getInstance(): StatisticsStorage {
    if (!StatisticsStorage.instance) {
      StatisticsStorage.instance = new StatisticsStorage();
    }
    return StatisticsStorage.instance;
  }

  protected getDefault(): GlobalStats {
    return {
      daily: this.getDefaultGameStats(),
      practice: this.getDefaultGameStats(),
      byArtist: {}
    };
  }

  protected parseStored(stored: string): GlobalStats {
    return this.mergeWithDefaults(JSON.parse(stored));
  }

  private getDefaultGameStats(): GameStats {
    return {
      winsByTries: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      failedGames: 0,
      totalGames: 0,
      winPercentage: 0,
      averageTries: 0,
      currentStreak: 0,
      bestStreak: 0
    };
  }

  private mergeWithDefaults(stored: Partial<GlobalStats>): GlobalStats {
    const defaultStats = this.getDefault();

    if (stored.byArtist) {
      Object.keys(stored.byArtist).forEach(artistId => {
        const artist = stored.byArtist![artistId];
        if (!artist) {
          stored.byArtist![artistId] = { daily: this.getDefaultGameStats(), practice: this.getDefaultGameStats() };
        } else {
          artist.daily = { ...defaultStats.daily, ...artist.daily };
          artist.practice = { ...defaultStats.practice, ...artist.practice };
        }
      });
    }

    return {
      daily: { ...defaultStats.daily, ...stored.daily },
      practice: { ...defaultStats.practice, ...stored.practice },
      byArtist: stored.byArtist || {}
    };
  }

  private saveStats(stats: GlobalStats): void {
    this.save(stats);
    emitStatisticsUpdated(stats);
  }

  private updateGameStats(gameStats: GameStats, isWin: boolean, tries: number): GameStats {
    const newStats = { ...gameStats };

    if (isWin) {
      newStats.winsByTries[tries] = (newStats.winsByTries[tries] || 0) + 1;
      newStats.currentStreak = newStats.currentStreak + 1;
      newStats.bestStreak = Math.max(newStats.bestStreak, newStats.currentStreak);
    } else {
      newStats.failedGames = newStats.failedGames + 1;
      newStats.currentStreak = 0;
    }

    newStats.totalGames = newStats.totalGames + 1;

    const totalWins = Object.values(newStats.winsByTries).reduce((sum, count) => sum + count, 0);
    newStats.winPercentage = newStats.totalGames > 0 ? Math.round((totalWins / newStats.totalGames) * 100) : 0;

    let totalTries = 0;
    let totalWinGames = 0;
    Object.entries(newStats.winsByTries).forEach(([triesStr, count]) => {
      totalTries += parseInt(triesStr) * count;
      totalWinGames += count;
    });
    newStats.averageTries = totalWinGames > 0 ? Math.round((totalTries / totalWinGames) * 10) / 10 : 0;

    return newStats;
  }

  recordDailyChallenge(artistId: string, isWin: boolean, tries: number): void {
    const stats = this.getStored();
    stats.daily = this.updateGameStats(stats.daily, isWin, tries);
    if (!stats.byArtist[artistId]) {
      stats.byArtist[artistId] = { daily: this.getDefaultGameStats(), practice: this.getDefaultGameStats() };
    }
    stats.byArtist[artistId].daily = this.updateGameStats(stats.byArtist[artistId].daily, isWin, tries);
    this.saveStats(stats);
  }

  recordPracticeGame(artistId: string, isWin: boolean, tries: number): void {
    const stats = this.getStored();
    stats.practice = this.updateGameStats(stats.practice, isWin, tries);
    if (!stats.byArtist[artistId]) {
      stats.byArtist[artistId] = { daily: this.getDefaultGameStats(), practice: this.getDefaultGameStats() };
    }
    stats.byArtist[artistId].practice = this.updateGameStats(stats.byArtist[artistId].practice, isWin, tries);
    this.saveStats(stats);
  }

  getGlobalStats(): GlobalStats {
    return this.getStored();
  }

  getArtistStats(artistId: string): ArtistStats {
    const stats = this.getStored();
    return stats.byArtist[artistId] || {
      daily: this.getDefaultGameStats(),
      practice: this.getDefaultGameStats()
    };
  }

  clearAllStats(): void {
    this.clear();
    emitStatisticsUpdated(this.getDefault());
    Logger.debug('Cleared all statistics');
  }

  clearArtistStats(artistId: string): void {
    const stats = this.getStored();
    if (stats.byArtist[artistId]) {
      delete stats.byArtist[artistId];
      this.saveStats(stats);
    }
  }
}
