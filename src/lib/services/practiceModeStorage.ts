export interface PracticeSongHistory {
  artistId: string;
  recentSongs: string[]; // Track IDs of recently played songs
  lastUpdated: number;
}

export class PracticeModeStorage {
  private static instance: PracticeModeStorage;
  private readonly STORAGE_KEY = 'twice-heardle-practice-history';
  private readonly MAX_RECENT_SONGS = 3; // Don't repeat songs for 3 plays

  private constructor() {}

  static getInstance(): PracticeModeStorage {
    if (!PracticeModeStorage.instance) {
      PracticeModeStorage.instance = new PracticeModeStorage();
    }
    return PracticeModeStorage.instance;
  }

  private getStoredHistory(): Record<string, PracticeSongHistory> {
    if (typeof window === 'undefined') {
      return {};
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading practice history from localStorage:', error);
    }

    return {};
  }

  private saveHistory(history: Record<string, PracticeSongHistory>): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving practice history to localStorage:', error);
    }
  }

  /**
   * Get list of recently played song track IDs for an artist
   */
  getRecentSongs(artistId: string): string[] {
    const history = this.getStoredHistory();
    const artistHistory = history[artistId];
    
    if (!artistHistory) {
      return [];
    }

    return artistHistory.recentSongs || [];
  }

  /**
   * Record a song as played for an artist
   */
  recordPlayedSong(artistId: string, trackId: string): void {
    const history = this.getStoredHistory();
    
    if (!history[artistId]) {
      history[artistId] = {
        artistId,
        recentSongs: [],
        lastUpdated: Date.now()
      };
    }

    const artistHistory = history[artistId];
    
    // Remove the song if it already exists (move to front)
    artistHistory.recentSongs = artistHistory.recentSongs.filter(id => id !== trackId);
    
    // Add the song to the front
    artistHistory.recentSongs.unshift(trackId);
    
    // Keep only the last MAX_RECENT_SONGS
    artistHistory.recentSongs = artistHistory.recentSongs.slice(0, this.MAX_RECENT_SONGS);
    
    artistHistory.lastUpdated = Date.now();

    this.saveHistory(history);
  }

  /**
   * Clear history for a specific artist
   */
  clearArtistHistory(artistId: string): void {
    const history = this.getStoredHistory();
    if (history[artistId]) {
      delete history[artistId];
      this.saveHistory(history);
    }
  }

  /**
   * Clear all practice history
   */
  clearAllHistory(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing practice history:', error);
    }
  }

  /**
   * Get debug info about practice history
   */
  getDebugInfo(): Record<string, PracticeSongHistory> {
    return this.getStoredHistory();
  }
}
