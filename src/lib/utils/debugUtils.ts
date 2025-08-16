import DailyChallengeStorage from '@/lib/services/dailyChallengeStorage';

/**
 * Debug utilities for testing daily challenge persistence
 * These functions are only for development/testing purposes
 */

export const debugUtils = {
  /**
   * Clear all daily challenges (for testing)
   */
  clearAllDailyChallenges: () => {
    const storage = DailyChallengeStorage.getInstance();
    storage.clearAllDailyChallenges();
    console.log('🗑️ All daily challenges cleared for testing');
  },

  /**
   * Show daily challenge stats for an artist
   */
  showDailyChallengeStats: (artistId: string) => {
    const storage = DailyChallengeStorage.getInstance();
    const stats = storage.getCompletionStats(artistId);
    console.log(`📊 Daily Challenge Stats for ${artistId}:`, stats);
    return stats;
  },

  /**
   * Check if today's challenge is completed for an artist
   */
  checkTodayCompletion: (artistId: string) => {
    const storage = DailyChallengeStorage.getInstance();
    const isCompleted = storage.isDailyChallengeCompleted(artistId);
    const hasChallenge = storage.hasDailyChallenge(artistId);
    console.log(`🔍 ${artistId} today: hasChallenge=${hasChallenge}, isCompleted=${isCompleted}`);
    return { hasChallenge, isCompleted };
  },

  /**
   * Simulate a completed daily challenge (for testing)
   */
  simulateCompletedChallenge: (artistId: string, songId: string) => {
    const storage = DailyChallengeStorage.getInstance();
    const mockGameState = {
      mode: 'daily' as const,
      currentSong: { id: songId, name: 'Test Song' } as any,
      currentTry: 1,
      maxTries: 6,
      isGameOver: true,
      hasWon: true,
      guesses: ['Test Song'],
      audioDuration: 1000,
      startTime: Date.now() - 60000,
      endTime: Date.now()
    };
    
    storage.saveDailyChallenge(artistId, songId, mockGameState);
    console.log(`🎭 Simulated completed daily challenge for ${artistId}`);
  }
};

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).debugUtils = debugUtils;
  console.log('🔧 Debug utilities available: window.debugUtils');
  console.log('📝 Available functions:');
  console.log('  - debugUtils.clearAllDailyChallenges()');
  console.log('  - debugUtils.showDailyChallengeStats("twice")');
  console.log('  - debugUtils.checkTodayCompletion("twice")');
  console.log('  - debugUtils.simulateCompletedChallenge("twice", "test-song")');
}
