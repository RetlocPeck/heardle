import DailyChallengeStorage from '@/lib/services/dailyChallengeStorage';
import { StatisticsStorage } from '@/lib/services/statisticsStorage';

/**
 * Debug utilities for testing daily challenge persistence
 * These functions are only for development/testing purposes
 */

// Clear all daily challenges
export function clearAllDailyChallenges() {
  if (typeof window === 'undefined') return;
  
  const storage = DailyChallengeStorage.getInstance();
  storage.clearAllDailyChallenges();
}

// Show daily challenge stats
export function showDailyChallengeStats(artistId: string = 'twice') {
  if (typeof window === 'undefined') return;
  
  const storage = DailyChallengeStorage.getInstance();
  storage.getCompletionStats(artistId);
  // Stats available for inspection in console
}

// Check if today's challenge is completed
export function checkTodayCompletion(artistId: string) {
  if (typeof window === 'undefined') return;
  
  const storage = DailyChallengeStorage.getInstance();
  const isCompleted = storage.isDailyChallengeCompleted(artistId);
  const challenge = storage.loadDailyChallenge(artistId);
  
  // Status available for inspection in console
  return { isCompleted, challenge };
}

// Simulate a completed challenge
export function simulateCompletedChallenge(artistId: string, hasWon: boolean = true, tries: number = 3) {
  if (typeof window === 'undefined') return;
  
  const statsStorage = StatisticsStorage.getInstance();
  
  // Record statistics
  statsStorage.recordDailyChallenge(artistId, hasWon, tries);
}

// Statistics debugging utilities
export function showStatistics(artistId?: string) {
  if (typeof window === 'undefined') return;
  
  const statsStorage = StatisticsStorage.getInstance();
  
  if (artistId) {
    const artistStats = statsStorage.getArtistStats(artistId);
    return artistStats;
  } else {
    const globalStats = statsStorage.getGlobalStats();
    return globalStats;
  }
}

// Clear all statistics
export function clearAllStatistics() {
  if (typeof window === 'undefined') return;
  
  const statsStorage = StatisticsStorage.getInstance();
  statsStorage.clearAllStats();
}

// Simulate practice mode games
export function simulatePracticeGames(artistId: string, count: number = 5) {
  if (typeof window === 'undefined') return;
  
  const statsStorage = StatisticsStorage.getInstance();
  
  for (let i = 0; i < count; i++) {
    const hasWon = Math.random() > 0.3; // 70% win rate
    const tries = hasWon ? Math.floor(Math.random() * 6) + 1 : 6; // 1-6 tries for wins, 6 for losses
    
    statsStorage.recordPracticeGame(artistId, hasWon, tries);
  }
}

// Generate sample statistics for testing
export function generateSampleStatistics() {
  if (typeof window === 'undefined') return;
  
  const statsStorage = StatisticsStorage.getInstance();
  const artists = ['twice', 'lesserafim', 'itzy', 'bts'];
  
  // Generate sample data for each artist
  artists.forEach(artistId => {
    // Daily challenges
    for (let i = 0; i < 30; i++) {
      const hasWon = Math.random() > 0.2; // 80% win rate
      const tries = hasWon ? Math.floor(Math.random() * 6) + 1 : 6;
      statsStorage.recordDailyChallenge(artistId, hasWon, tries);
    }
    
    // Practice games
    for (let i = 0; i < 50; i++) {
      const hasWon = Math.random() > 0.3; // 70% win rate
      const tries = hasWon ? Math.floor(Math.random() * 6) + 1 : 6;
      statsStorage.recordPracticeGame(artistId, hasWon, tries);
    }
  });
}

// Check iTunes pagination for debugging
export function checkITunesPagination(artistId?: string) {
  if (typeof window === 'undefined') return;
  
  const itunesService = (window as any).itunesService;
  if (itunesService) {
    if (artistId) {
      itunesService.checkArtistPagination(artistId);
    } else {
      // Check all artists
      const artists = itunesService.getAvailableArtists();
      artists.forEach((artist: any) => {
        itunesService.checkArtistPagination(artist.id);
      });
    }
  }
}

// Refresh iTunes songs for debugging
export function refreshITunesSongs(artistId: string) {
  if (typeof window === 'undefined') return;
  
  const itunesService = (window as any).itunesService;
  if (itunesService) {
    itunesService.refreshSongs(artistId);
  }
}

// Clear all iTunes song cache for debugging
export function clearITunesCache() {
  if (typeof window === 'undefined') return;
  
  const itunesService = (window as any).itunesService;
  if (itunesService) {
    itunesService.clearAllCache();
  }
}

// Make functions available globally for debugging in development only
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugUtils = {
    clearAllDailyChallenges,
    showDailyChallengeStats,
    checkTodayCompletion,
    simulateCompletedChallenge,
    showStatistics,
    clearAllStatistics,
    simulatePracticeGames,
    clearITunesCache,
    generateSampleStatistics,
    checkITunesPagination,
    refreshITunesSongs
  };
}
