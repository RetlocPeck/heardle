export interface PersistedGameState {
  artistId: string;
  date: string; // YYYY-MM-DD format
  mode: 'daily' | 'practice';
  currentSong: any;
  currentTry: number;
  maxTries: number;
  isGameOver: boolean;
  hasWon: boolean;
  guesses: string[];
  audioDuration: number;
  startTime: number | null;
  endTime: number | null;
}

export class PersistenceService {
  private static instance: PersistenceService;
  private readonly STORAGE_KEY_PREFIX = 'heardle_game_state_';
  private readonly DATE_KEY = 'heardle_last_daily_date';

  private constructor() {}

  static getInstance(): PersistenceService {
    if (!PersistenceService.instance) {
      PersistenceService.instance = new PersistenceService();
    }
    return PersistenceService.instance;
  }

  /**
   * Save game state for a specific artist and mode
   */
  saveGameState(artistId: string, gameState: any, mode: 'daily' | 'practice'): void {
    try {
      const today = this.getTodayString();
      const key = this.getStorageKey(artistId, mode);
      
      const persistedState: PersistedGameState = {
        artistId,
        date: today,
        mode,
        currentSong: gameState.currentSong,
        currentTry: gameState.currentTry,
        maxTries: gameState.maxTries,
        isGameOver: gameState.isGameOver,
        hasWon: gameState.hasWon,
        guesses: gameState.guesses,
        audioDuration: gameState.audioDuration,
        startTime: gameState.startTime,
        endTime: gameState.endTime,
      };

      localStorage.setItem(key, JSON.stringify(persistedState));
      
      // Also save the last daily date for this artist
      if (mode === 'daily') {
        localStorage.setItem(`${this.DATE_KEY}_${artistId}`, today);
      }
      
      console.log(`💾 PersistenceService: Saved ${mode} game state for ${artistId} on ${today}`);
    } catch (error) {
      console.error('💾 PersistenceService: Failed to save game state:', error);
    }
  }

  /**
   * Load game state for a specific artist and mode
   */
  loadGameState(artistId: string, mode: 'daily' | 'practice'): PersistedGameState | null {
    try {
      const key = this.getStorageKey(artistId, mode);
      const stored = localStorage.getItem(key);
      
      if (!stored) {
        return null;
      }

      const persistedState: PersistedGameState = JSON.parse(stored);
      
      // For daily mode, check if the date is still valid
      if (mode === 'daily') {
        const today = this.getTodayString();
        if (persistedState.date !== today) {
          // It's a new day, clear the old state
          this.clearGameState(artistId, mode);
          console.log(`💾 PersistenceService: New day detected for ${artistId}, cleared old daily state`);
          return null;
        }
      }

      console.log(`💾 PersistenceService: Loaded ${mode} game state for ${artistId} from ${persistedState.date}`);
      return persistedState;
    } catch (error) {
      console.error('💾 PersistenceService: Failed to load game state:', error);
      return null;
    }
  }

  /**
   * Check if there's a valid daily game state for today
   */
  hasValidDailyState(artistId: string): boolean {
    try {
      const lastDailyDate = localStorage.getItem(`${this.DATE_KEY}_${artistId}`);
      const today = this.getTodayString();
      
      return lastDailyDate === today;
    } catch (error) {
      console.error('💾 PersistenceService: Failed to check daily state validity:', error);
      return false;
    }
  }

  /**
   * Clear game state for a specific artist and mode
   */
  clearGameState(artistId: string, mode: 'daily' | 'practice'): void {
    try {
      const key = this.getStorageKey(artistId, mode);
      localStorage.removeItem(key);
      
      if (mode === 'daily') {
        localStorage.removeItem(`${this.DATE_KEY}_${artistId}`);
      }
      
      console.log(`💾 PersistenceService: Cleared ${mode} game state for ${artistId}`);
    } catch (error) {
      console.error('💾 PersistenceService: Failed to clear game state:', error);
    }
  }

  /**
   * Clear all game states for a specific artist
   */
  clearAllArtistStates(artistId: string): void {
    try {
      this.clearGameState(artistId, 'daily');
      this.clearGameState(artistId, 'practice');
      console.log(`💾 PersistenceService: Cleared all game states for ${artistId}`);
    } catch (error) {
      console.error('💾 PersistenceService: Failed to clear all artist states:', error);
    }
  }

  /**
   * Get today's date string in YYYY-MM-DD format
   */
  private getTodayString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Generate storage key for a specific artist and mode
   */
  private getStorageKey(artistId: string, mode: 'daily' | 'practice'): string {
    return `${this.STORAGE_KEY_PREFIX}${artistId}_${mode}`;
  }

  /**
   * Get all stored game states (for debugging/admin purposes)
   */
  getAllStoredStates(): { [key: string]: any } {
    const states: { [key: string]: any } = {};
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_KEY_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            states[key] = JSON.parse(value);
          }
        }
      }
    } catch (error) {
      console.error('💾 PersistenceService: Failed to get all stored states:', error);
    }
    
    return states;
  }

  /**
   * Clear all stored game states (for debugging/admin purposes)
   */
  clearAllStoredStates(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`💾 PersistenceService: Cleared all stored game states (${keysToRemove.length} keys)`);
    } catch (error) {
      console.error('💾 PersistenceService: Failed to clear all stored states:', error);
    }
  }
}
