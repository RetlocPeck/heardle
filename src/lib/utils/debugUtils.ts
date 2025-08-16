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
  console.log('🧹 All daily challenges cleared');
}

// Show daily challenge stats
export function showDailyChallengeStats(artistId: string = 'twice') {
  if (typeof window === 'undefined') return;
  
  const storage = DailyChallengeStorage.getInstance();
  const stats = storage.getCompletionStats(artistId);
  console.log('📊 Daily Challenge Stats:', stats);
}

// Check if today's challenge is completed
export function checkTodayCompletion(artistId: string) {
  if (typeof window === 'undefined') return;
  
  const storage = DailyChallengeStorage.getInstance();
  const isCompleted = storage.isDailyChallengeCompleted(artistId);
  const challenge = storage.loadDailyChallenge(artistId);
  
  console.log(`🎯 ${artistId} Daily Challenge Status:`, {
    isCompleted,
    hasWon: challenge?.gameState.hasWon || false,
    currentTry: challenge?.gameState.currentTry || 0,
    isGameOver: challenge?.gameState.isGameOver || false
  });
}

// Simulate a completed challenge
export function simulateCompletedChallenge(artistId: string, hasWon: boolean = true, tries: number = 3) {
  if (typeof window === 'undefined') return;
  
  const storage = DailyChallengeStorage.getInstance();
  const statsStorage = StatisticsStorage.getInstance();
  
  // Record statistics
  statsStorage.recordDailyChallenge(artistId, hasWon, tries);
  
  console.log(`🎭 Simulated ${artistId} daily challenge: ${hasWon ? 'WON' : 'FAILED'} in ${tries} tries`);
}

// Statistics debugging utilities
export function showStatistics(artistId?: string) {
  if (typeof window === 'undefined') return;
  
  const statsStorage = StatisticsStorage.getInstance();
  
  if (artistId) {
    const artistStats = statsStorage.getArtistStats(artistId);
    console.log(`📊 ${artistId} Statistics:`, artistStats);
  } else {
    const globalStats = statsStorage.getGlobalStats();
    console.log('📊 Global Statistics:', globalStats);
  }
}

// Clear all statistics
export function clearAllStatistics() {
  if (typeof window === 'undefined') return;
  
  const statsStorage = StatisticsStorage.getInstance();
  statsStorage.clearAllStats();
  console.log('🧹 All statistics cleared');
}

// Simulate practice mode games
export function simulatePracticeGames(artistId: string, count: number = 5) {
  if (typeof window === 'undefined') return;
  
  const statsStorage = StatisticsStorage.getInstance();
  
  for (let i = 0; i < count; i++) {
    const hasWon = Math.random() > 0.3; // 70% win rate
    const tries = hasWon ? Math.floor(Math.random() * 6) + 1 : 6; // 1-6 tries for wins, 6 for losses
    
    statsStorage.recordPracticeGame(artistId, hasWon, tries);
    console.log(`🎭 Simulated practice game ${i + 1}: ${hasWon ? 'WON' : 'FAILED'} in ${tries} tries`);
  }
}

// Generate sample statistics for testing
export function generateSampleStatistics() {
  if (typeof window === 'undefined') return;
  
  const statsStorage = StatisticsStorage.getInstance();
  const artists = ['twice', 'lesserafim', 'itzy', 'bts'];
  
  console.log('🎲 Generating sample statistics for testing...');
  
  artists.forEach(artistId => {
    // Generate daily challenge stats
    for (let i = 0; i < 10; i++) {
      const hasWon = Math.random() > 0.2; // 80% win rate for daily
      const tries = hasWon ? Math.floor(Math.random() * 6) + 1 : 6;
      statsStorage.recordDailyChallenge(artistId, hasWon, tries);
    }
    
    // Generate practice mode stats
    for (let i = 0; i < 15; i++) {
      const hasWon = Math.random() > 0.3; // 70% win rate for practice
      const tries = hasWon ? Math.floor(Math.random() * 6) + 1 : 6;
      statsStorage.recordPracticeGame(artistId, hasWon, tries);
    }
    
    console.log(`✅ Generated sample stats for ${artistId}`);
  });
  
  console.log('🎉 Sample statistics generated! Check the statistics modal to see the data.');
}

// iTunes debugging utilities
export function checkITunesPagination(artistId: string = 'twice') {
  if (typeof window === 'undefined') return;
  
  const itunesService = (window as any).itunesService;
  if (itunesService) {
    itunesService.checkArtistPagination(artistId);
  } else {
    console.log('🔧 iTunes service not available. Use window.itunesService.* to access it.');
  }
}

export function refreshITunesSongs(artistId: string = 'twice') {
  if (typeof window === 'undefined') return;
  
  const itunesService = (window as any).itunesService;
  if (itunesService) {
    console.log(`🔄 Refreshing iTunes songs for ${artistId}...`);
    itunesService.refreshSongs(artistId).then((songs: any[]) => {
      console.log(`✅ Refreshed ${songs.length} songs for ${artistId}`);
    });
  } else {
    console.log('🔧 iTunes service not available. Use window.itunesService.* to access it.');
  }
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugUtils = {
    clearAllDailyChallenges,
    showDailyChallengeStats,
    checkTodayCompletion,
    simulateCompletedChallenge,
    showStatistics,
    clearAllStatistics,
    simulatePracticeGames,
    generateSampleStatistics,
    checkITunesPagination,
    refreshITunesSongs
  };
  
  console.log('🔧 Debug utilities loaded. Use window.debugUtils.* to access them.');
  console.log('Available functions:');
  console.log('- clearAllDailyChallenges()');
  console.log('- showDailyChallengeStats(artistId?)');
  console.log('- checkTodayCompletion(artistId)');
  console.log('- simulateCompletedChallenge(artistId, hasWon, tries)');
  console.log('- showStatistics(artistId?)');
  console.log('- clearAllStatistics()');
  console.log('- simulatePracticeGames(artistId, count)');
  console.log('- generateSampleStatistics()');
  console.log('- checkITunesPagination(artistId?)');
  console.log('- refreshITunesSongs(artistId?)');
}
