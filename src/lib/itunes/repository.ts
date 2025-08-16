import { Repository, CacheEntry } from './types';
import { Song } from '@/types/song';

export class InMemoryRepository implements Repository<Song[]> {
  private cache = new Map<string, CacheEntry<Song[]>>();

  get(key: string): Song[] | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check TTL if set
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return undefined;
    }

    return entry.data;
  }

  set(key: string, value: Song[], ttl?: number): void {
    const entry: CacheEntry<Song[]> = {
      data: value,
      timestamp: Date.now(),
      ttl
    };
    
    this.cache.set(key, entry);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
    totalSongs: number;
  } {
    const keys = Array.from(this.cache.keys());
    const totalSongs = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.data.length, 0);

    return {
      size: this.cache.size,
      keys,
      totalSongs
    };
  }

  /**
   * Clean expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}
