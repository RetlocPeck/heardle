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

export class StatisticsStorage {
  private static instance: StatisticsStorage;
  private readonly STORAGE_KEY = 'twice-heardle-stats';

  private constructor() {}

  static getInstance(): StatisticsStorage {
    if (!StatisticsStorage.instance) {
      StatisticsStorage.instance = new StatisticsStorage();
    }
    return StatisticsStorage.instance;
  }

  private getStoredStats(): GlobalStats {
    if (typeof window === 'undefined') {
      return this.getDefaultStats();
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure all required properties exist
        return this.mergeWithDefaults(parsed);
      }
    } catch (error) {
      console.error('Error reading statistics from localStorage:', error);
    }

    return this.getDefaultStats();
  }

  private getDefaultStats(): GlobalStats {
    return {
      daily: this.getDefaultGameStats(),
      practice: this.getDefaultGameStats(),
      byArtist: {}
    };
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

  private mergeWithDefaults(stored: any): GlobalStats {
    const defaultStats = this.getDefaultStats();
    
    // Ensure all artists have complete stats
    if (stored.byArtist) {
      Object.keys(stored.byArtist).forEach(artistId => {
        if (!stored.byArtist[artistId]) {
          stored.byArtist[artistId] = defaultStats;
        } else {
          stored.byArtist[artistId].daily = { ...defaultStats.daily, ...stored.byArtist[artistId].daily };
          stored.byArtist[artistId].practice = { ...defaultStats.practice, ...stored.byArtist[artistId].practice };
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
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent('statistics-updated', { detail: stats }));
    } catch (error) {
      console.error('Error saving statistics to localStorage:', error);
    }
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
    
    // Calculate win percentage
    const totalWins = Object.values(newStats.winsByTries).reduce((sum, count) => sum + count, 0);
    newStats.winPercentage = newStats.totalGames > 0 ? Math.round((totalWins / newStats.totalGames) * 100) : 0;
    
    // Calculate average tries
    let totalTries = 0;
    let totalWinGames = 0;
    Object.entries(newStats.winsByTries).forEach(([triesStr, count]) => {
      totalTries += parseInt(triesStr) * count;
      totalWinGames += count;
    });
    newStats.averageTries = totalWinGames > 0 ? Math.round((totalTries / totalWinGames) * 10) / 10 : 0;

    return newStats;
  }

  // Record a daily challenge result
  recordDailyChallenge(artistId: string, isWin: boolean, tries: number): void {
    const stats = this.getStoredStats();
    
    // Update global daily stats
    stats.daily = this.updateGameStats(stats.daily, isWin, tries);
    
    // Update artist-specific daily stats
    if (!stats.byArtist[artistId]) {
      stats.byArtist[artistId] = {
        daily: this.getDefaultGameStats(),
        practice: this.getDefaultGameStats()
      };
    }
    stats.byArtist[artistId].daily = this.updateGameStats(stats.byArtist[artistId].daily, isWin, tries);
    
    this.saveStats(stats);
  }

  // Record a practice mode result
  recordPracticeGame(artistId: string, isWin: boolean, tries: number): void {
    const stats = this.getStoredStats();
    
    // Update global practice stats
    stats.practice = this.updateGameStats(stats.practice, isWin, tries);
    
    // Update artist-specific practice stats
    if (!stats.byArtist[artistId]) {
      stats.byArtist[artistId] = {
        daily: this.getDefaultGameStats(),
        practice: this.getDefaultGameStats()
      };
    }
    stats.byArtist[artistId].practice = this.updateGameStats(stats.byArtist[artistId].practice, isWin, tries);
    
    this.saveStats(stats);
  }

  // Get global statistics
  getGlobalStats(): GlobalStats {
    return this.getStoredStats();
  }

  // Get artist-specific statistics
  getArtistStats(artistId: string): ArtistStats {
    const stats = this.getStoredStats();
    return stats.byArtist[artistId] || {
      daily: this.getDefaultGameStats(),
      practice: this.getDefaultGameStats()
    };
  }

  // Clear all statistics
  clearAllStats(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('statistics-updated', { detail: this.getDefaultStats() }));
    } catch (error) {
      console.error('Error clearing statistics:', error);
    }
  }

  // Clear statistics for a specific artist
  clearArtistStats(artistId: string): void {
    const stats = this.getStoredStats();
    if (stats.byArtist[artistId]) {
      delete stats.byArtist[artistId];
      this.saveStats(stats);
    }
  }
}
