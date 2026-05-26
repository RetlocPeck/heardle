import { BaseStorageService } from './baseStorageService';
import { STORAGE_KEYS } from '@/lib/constants';

export interface PracticeSongHistory {
  artistId: string;
  recentSongs: string[]; // Track IDs of recently played songs
  lastUpdated: number;
}

export class PracticeModeStorage extends BaseStorageService<Record<string, PracticeSongHistory>> {
  private static instance: PracticeModeStorage;

  protected readonly STORAGE_KEY = STORAGE_KEYS.PRACTICE_HISTORY;
  private readonly MAX_RECENT_SONGS = 3;

  private constructor() { super(); }

  static getInstance(): PracticeModeStorage {
    if (!PracticeModeStorage.instance) {
      PracticeModeStorage.instance = new PracticeModeStorage();
    }
    return PracticeModeStorage.instance;
  }

  protected getDefault(): Record<string, PracticeSongHistory> {
    return {};
  }

  getRecentSongs(artistId: string): string[] {
    return this.getStored()[artistId]?.recentSongs ?? [];
  }

  recordPlayedSong(artistId: string, trackId: string): void {
    const history = this.getStored();

    if (!history[artistId]) {
      history[artistId] = { artistId, recentSongs: [], lastUpdated: Date.now() };
    }

    const artistHistory = history[artistId];
    artistHistory.recentSongs = artistHistory.recentSongs.filter(id => id !== trackId);
    artistHistory.recentSongs.unshift(trackId);
    artistHistory.recentSongs = artistHistory.recentSongs.slice(0, this.MAX_RECENT_SONGS);
    artistHistory.lastUpdated = Date.now();

    this.save(history);
  }

  clearArtistHistory(artistId: string): void {
    const history = this.getStored();
    if (history[artistId]) {
      delete history[artistId];
      this.save(history);
    }
  }

  clearAllHistory(): void {
    this.clear();
  }

  getDebugInfo(): Record<string, PracticeSongHistory> {
    return this.getStored();
  }
}
