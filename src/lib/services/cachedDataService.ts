import { Song } from '@/types/song';
import { ArtistArtwork } from './appleMusicService';
import fs from 'fs';
import path from 'path';

/**
 * Service for reading pre-cached song and artwork data
 * Falls back to live API if cache doesn't exist
 */
export class CachedDataService {
  private static instance: CachedDataService;
  private songsCache: Map<string, Song[]> = new Map();
  private artworkCache: Map<string, ArtistArtwork> = new Map();
  private dataDir: string;
  private initialized = false;

  static getInstance(): CachedDataService {
    if (!CachedDataService.instance) {
      CachedDataService.instance = new CachedDataService();
    }
    return CachedDataService.instance;
  }

  constructor() {
    // In Next.js, public folder is at the root
    this.dataDir = path.join(process.cwd(), 'public', 'data');
  }

  /**
   * Check if cached data exists for an artist
   */
  hasCachedSongs(artistId: string): boolean {
    const filePath = path.join(this.dataDir, 'songs', `${artistId}.json`);
    return fs.existsSync(filePath);
  }

  /**
   * Check if cached artwork exists for an artist
   */
  hasCachedArtwork(artistId: string): boolean {
    const filePath = path.join(this.dataDir, 'artwork', `${artistId}.json`);
    return fs.existsSync(filePath);
  }

  /**
   * Get songs from cache
   */
  getCachedSongs(artistId: string): Song[] | null {
    // Check memory cache first
    if (this.songsCache.has(artistId)) {
      return this.songsCache.get(artistId)!;
    }

    // Try to load from file
    const filePath = path.join(this.dataDir, 'songs', `${artistId}.json`);
    
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        const songs: Song[] = JSON.parse(data);
        
        // Store in memory cache
        this.songsCache.set(artistId, songs);
        console.log(`📦 Loaded ${songs.length} cached songs for ${artistId}`);
        
        return songs;
      }
    } catch (error) {
      console.error(`Failed to load cached songs for ${artistId}:`, error);
    }

    return null;
  }

  /**
   * Get artwork from cache
   */
  getCachedArtwork(artistId: string): ArtistArtwork | null {
    // Check memory cache first
    if (this.artworkCache.has(artistId)) {
      return this.artworkCache.get(artistId)!;
    }

    // Try to load from file
    const filePath = path.join(this.dataDir, 'artwork', `${artistId}.json`);
    
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        const artwork: ArtistArtwork = JSON.parse(data);
        
        // Store in memory cache
        this.artworkCache.set(artistId, artwork);
        
        return artwork;
      }
    } catch (error) {
      console.error(`Failed to load cached artwork for ${artistId}:`, error);
    }

    return null;
  }

  /**
   * Get summary of cached data
   */
  getSummary(): { timestamp: string; totalArtists: number; totalSongs: number } | null {
    const summaryPath = path.join(this.dataDir, 'summary.json');
    
    try {
      if (fs.existsSync(summaryPath)) {
        const data = fs.readFileSync(summaryPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load summary:', error);
    }

    return null;
  }

  /**
   * Check if cache exists and is recent
   */
  isCacheValid(maxAgeHours = 24 * 7): boolean {
    const summary = this.getSummary();
    if (!summary?.timestamp) return false;

    const cacheTime = new Date(summary.timestamp).getTime();
    const now = Date.now();
    const ageHours = (now - cacheTime) / (1000 * 60 * 60);

    return ageHours < maxAgeHours;
  }

  /**
   * Clear memory caches
   */
  clearMemoryCache(): void {
    this.songsCache.clear();
    this.artworkCache.clear();
  }
}

export default CachedDataService;
