import { Song, ITunesTrack, ITunesResponse, convertITunesTrackToSong } from '@/types/song';
import { ConfigService } from '@/lib/services/configService';
import { ITunesConfigManager, ITunesServiceConfig } from '@/lib/config/itunesConfig';
import { SongFilteringService } from '@/lib/services/songFilteringService';
import { SongDeduplicationService } from '@/lib/services/songDeduplicationService';
import { SongCacheService } from '@/lib/services/songCacheService';
import { HTTPClientService } from '@/lib/services/httpClientService';
import { hashCode } from '@/lib/utils/stringUtils';

export interface ITunesServiceStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  totalSongsRetrieved: number;
  averageResponseTime: number;
  lastUpdated: number;
}

export class ITunesService {
  private static instance: ITunesService;
  
  // Services
  private configManager: ITunesConfigManager;
  private configService: ConfigService;
  private filteringService: SongFilteringService;
  private deduplicationService: SongDeduplicationService;
  private cacheService: SongCacheService;
  private httpClient: HTTPClientService;
  
  // Statistics
  private stats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalSongsRetrieved: 0,
    responseTimes: [] as number[],
    lastUpdated: Date.now()
  };
  
  private constructor() {
    this.configManager = ITunesConfigManager.getInstance();
    this.configService = ConfigService.getInstance();
    
    const config = this.configManager.getConfig();
    this.filteringService = new SongFilteringService(config);
    this.deduplicationService = new SongDeduplicationService(config);
    this.cacheService = new SongCacheService(config);
    this.httpClient = new HTTPClientService(config);
    
    console.log('🎵 iTunes Service initialized with modular architecture');
  }
  
  static getInstance(): ITunesService {
    if (!ITunesService.instance) {
      ITunesService.instance = new ITunesService();
    }
    return ITunesService.instance;
  }
  
  /**
   * Search for songs by artist ID
   */
  async searchSongs(artistId: string): Promise<Song[]> {
    const startTime = performance.now();
    this.stats.totalRequests++;
    
    try {
      // Check cache first
      const cachedSongs = this.cacheService.get(artistId);
      if (cachedSongs) {
        this.stats.cacheHits++;
        this.logCacheHit(artistId, cachedSongs.length);
        return cachedSongs;
      }
      
      this.stats.cacheMisses++;
      
      // Fetch from iTunes
      const songs = await this.fetchSongsFromITunes(artistId);
      
      // Cache the results
      this.cacheService.set(artistId, songs, {
        source: 'itunes',
        totalFound: songs.length,
        filteredCount: 0, // Will be updated by filtering service
        deduplicatedCount: 0 // Will be updated by deduplication service
      });
      
      // Update statistics
      this.stats.totalSongsRetrieved += songs.length;
      this.updateResponseTime(performance.now() - startTime);
      
      return songs;
      
    } catch (error) {
      console.error(`Failed to search songs for ${artistId}:`, error);
      throw error;
    }
  }
  
  /**
   * Fetch songs from iTunes using multiple strategies
   */
  private async fetchSongsFromITunes(artistId: string): Promise<Song[]> {
    const artist = this.configService.getArtist(artistId);
    if (!artist) {
      throw new Error(`Artist ${artistId} not found in configuration`);
    }
    
    const config = this.configManager.getConfig();
    
    try {
      // Strategy 1: Lookup by artist ID (most reliable)
      console.log(`📡 Strategy 1: Looking up songs by artist ID for ${artist.displayName}...`);
      const artistSongs = await this.lookupArtistSongs(artist);
      
      if (artistSongs.length > 0) {
        console.log(`✅ Artist ID lookup found ${artistSongs.length} tracks`);
        return this.processTracks(artistSongs, artistId);
      }
      
      // Strategy 2: Search by artist name
      console.log(`📡 Strategy 2: Fallback to search by artist name for ${artist.displayName}...`);
      const searchResults = await this.searchByArtistName(artist);
      
      if (searchResults.length > 0) {
        console.log(`✅ Artist name search found ${searchResults.length} tracks`);
        return this.processTracks(searchResults, artistId);
      }
      
      console.warn(`❌ No ${artist.displayName} tracks found with any lookup strategy`);
      return [];
      
    } catch (error) {
      console.error(`Failed to fetch songs for ${artist.displayName}:`, error);
      throw error;
    }
  }
  
  /**
   * Lookup songs by artist ID
   */
  private async lookupArtistSongs(artist: any): Promise<ITunesTrack[]> {
    const config = this.configManager.getConfig();
    const url = `${config.api.lookupUrl}?id=${artist.itunesArtistId}&entity=song&limit=${config.search.defaultLimit}`;
    
    try {
      const response = await this.httpClient.request<ITunesResponse>(url);
      const data = response.data;
      
      console.log(`📊 Artist lookup found ${data.resultCount || 0} total tracks`);
      
      if (!data.results || !Array.isArray(data.results)) {
        return [];
      }
      
      // Filter out non-song results
      const songs = data.results.filter(track => 
        track.wrapperType === 'track' && 
        track.kind === 'song' &&
        track.previewUrl
      );
      
      console.log(`🎵 Filtered to ${songs.length} valid song tracks with preview URLs`);
      return songs;
      
    } catch (error) {
      console.warn('Artist lookup failed:', error);
      return [];
    }
  }
  
  /**
   * Search songs by artist name
   */
  private async searchByArtistName(artist: any): Promise<ITunesTrack[]> {
    const config = this.configManager.getConfig();
    let allTracks: ITunesTrack[] = [];
    
    try {
      for (const term of artist.searchTerms) {
        const url = `${config.api.searchUrl}?term=${encodeURIComponent(term)}&entity=song&media=music&limit=${config.search.defaultLimit}`;
        
        const response = await this.httpClient.request<ITunesResponse>(url, { delay: config.api.requestDelay });
        
        if (response.data.results && Array.isArray(response.data.results)) {
          allTracks = allTracks.concat(response.data.results);
        }
      }
      
      console.log(`📊 Artist name search found ${allTracks.length} total tracks`);
      
      // Filter for the specific artist's songs only
      const artistSongs = allTracks.filter(track => {
        const artistName = track.artistName?.toLowerCase().trim();
        const isArtist = artist.searchTerms.some((term: string) => 
          artistName === term.toLowerCase()
        );
        
        return isArtist && track.previewUrl;
      });
      
      console.log(`🎵 Filtered to ${artistSongs.length} ${artist.displayName} songs with preview URLs`);
      return artistSongs;
      
    } catch (error) {
      console.warn('Artist name search failed:', error);
      return [];
    }
  }
  
  /**
   * Process tracks through filtering and deduplication
   */
  private processTracks(tracks: ITunesTrack[], artistId: string): Song[] {
    const config = this.configManager.getConfig();
    const artist = this.configService.getArtist(artistId);
    
    if (!artist) {
      throw new Error(`Artist ${artistId} not found`);
    }
    
    console.log(`🔍 Processing ${tracks.length} tracks for ${artist.displayName}...`);
    
    // Step 1: Filter tracks
    const { passed: filteredTracks, stats: filterStats } = this.filteringService.filterTracks(tracks);
    
    // Step 2: Deduplicate tracks
    const deduplicationResult = this.deduplicationService.deduplicateTracks(filteredTracks);
    const deduplicatedTracks = deduplicationResult.uniqueTracks;
    const dedupStats = deduplicationResult;
    
    // Step 3: Convert to Song format
    const processedTracks = deduplicatedTracks.map(track => convertITunesTrackToSong(track));
    
    // Update cache metadata
    this.cacheService.set(artistId, processedTracks, {
      source: 'itunes',
      totalFound: tracks.length,
      filteredCount: filterStats.filteredTracks,
      deduplicatedCount: dedupStats.duplicatesRemoved
    });
    
    console.log(`✅ ${artist.displayName}: ${tracks.length} → ${processedTracks.length} songs (${((processedTracks.length / tracks.length) * 100).toFixed(1)}% kept)`);
    
    return processedTracks;
  }
  
  /**
   * Get random song for an artist
   */
  async getRandomSong(artistId: string): Promise<Song> {
    const songs = await this.searchSongs(artistId);
    
    if (songs.length === 0) {
      const artist = this.configService.getArtist(artistId);
      throw new Error(`No ${artist?.displayName || artistId} songs found in iTunes`);
    }
    
    const randomIndex = Math.floor(Math.random() * songs.length);
    const song = songs[randomIndex];
    
    const artist = this.configService.getArtist(artistId);
    this.logSongRetrieval('random', artist?.displayName || artistId, song);
    
    return song;
  }
  
  /**
   * Get daily song for an artist
   */
  async getDailySong(date: string, artistId: string): Promise<Song> {
    const seed = hashCode(date);
    const songs = await this.searchSongs(artistId);
    
    if (songs.length === 0) {
      const artist = this.configService.getArtist(artistId);
      throw new Error(`No ${artist?.displayName || artistId} songs found in iTunes`);
    }
    
    const index = seed % songs.length;
    const song = songs[index];
    
    const artist = this.configService.getArtist(artistId);
    this.logSongRetrieval('daily', artist?.displayName || artistId, song, date, seed);
    
    return song;
  }
  
  /**
   * Search for specific songs within an artist's catalog
   */
  async searchSpecificSong(songName: string, artistId: string): Promise<Song[]> {
    try {
      const allSongs = await this.searchSongs(artistId);
      
      if (allSongs.length === 0) {
        return [];
      }
      
      const searchTerm = songName.toLowerCase();
      const matchingSongs = allSongs.filter(song => 
        song.name.toLowerCase().includes(searchTerm) ||
        song.album.toLowerCase().includes(searchTerm)
      );
      
      const artist = this.configService.getArtist(artistId);
      console.log(`🔍 Found ${matchingSongs.length} ${artist?.displayName} songs matching "${songName}"`);
      
      return matchingSongs;
    } catch (error) {
      console.error('Failed to search for specific song:', error);
      return [];
    }
  }
  
  /**
   * Get songs by album
   */
  async getSongsByAlbum(albumName: string, artistId: string): Promise<Song[]> {
    try {
      const allSongs = await this.searchSongs(artistId);
      
      if (allSongs.length === 0) {
        return [];
      }
      
      const searchTerm = albumName.toLowerCase();
      const albumSongs = allSongs.filter(song => 
        song.album.toLowerCase().includes(searchTerm)
      );
      
      console.log(`📀 Found ${albumSongs.length} songs from album "${albumName}"`);
      
      return albumSongs;
    } catch (error) {
      console.error('Failed to get songs by album:', error);
      return [];
    }
  }
  
  /**
   * Get total count of available songs for an artist
   */
  async getTotalSongCount(artistId: string): Promise<number> {
    try {
      const songs = await this.searchSongs(artistId);
      return songs.length;
    } catch (error) {
      console.error('Failed to get song count:', error);
      return 0;
    }
  }
  
  /**
   * Check iTunes API pagination limits
   */
  async checkArtistPagination(artistId: string): Promise<{ totalAvailable: number; fetched: number; pages: number }> {
    try {
      const artist = this.configService.getArtist(artistId);
      if (!artist) {
        throw new Error(`Artist ${artistId} not found in configuration`);
      }
      
      const config = this.configManager.getConfig();
      console.log(`🔍 Checking pagination for ${artist.displayName} (ID: ${artist.itunesArtistId})`);
      
      const testUrl = `${config.api.lookupUrl}?id=${artist.itunesArtistId}&entity=song&limit=1`;
      const response = await this.httpClient.request<ITunesResponse>(testUrl);
      
      const totalAvailable = response.data.resultCount || 0;
      const cachedSongs = this.cacheService.get(artistId) || [];
      const fetched = cachedSongs.length;
      const pages = Math.ceil(totalAvailable / config.search.defaultLimit);
      
      console.log(`📊 Pagination Info for ${artist.displayName}:`);
      console.log(`   Total available on iTunes: ${totalAvailable}`);
      console.log(`   Currently fetched: ${fetched}`);
      console.log(`   Estimated pages: ${pages}`);
      console.log(`   Coverage: ${((fetched / totalAvailable) * 100).toFixed(1)}%`);
      
      return { totalAvailable, fetched, pages };
      
    } catch (error) {
      console.error('Failed to check artist pagination:', error);
      return { totalAvailable: 0, fetched: 0, pages: 0 };
    }
  }
  
  /**
   * Refresh songs for an artist (clear cache and reload)
   */
  async refreshSongs(artistId: string): Promise<Song[]> {
    const artist = this.configService.getArtist(artistId);
    console.log(`🔄 Refreshing ${artist?.displayName} songs from iTunes...`);
    
    this.cacheService.delete(artistId);
    return await this.searchSongs(artistId);
  }
  
  /**
   * Get all available artists
   */
  getAvailableArtists() {
    return this.configService.getAllArtists();
  }
  
  /**
   * Get service statistics
   */
  getStats(): ITunesServiceStats {
    const cacheStats = this.cacheService.getStats();
    const avgResponseTime = this.stats.responseTimes.length > 0 
      ? this.stats.responseTimes.reduce((sum, time) => sum + time, 0) / this.stats.responseTimes.length
      : 0;
    
    return {
      totalRequests: this.stats.totalRequests,
      cacheHits: cacheStats.hits,
      cacheMisses: cacheStats.misses,
      totalSongsRetrieved: this.stats.totalSongsRetrieved,
      averageResponseTime: avgResponseTime,
      lastUpdated: this.stats.lastUpdated
    };
  }
  
  /**
   * Update configuration for all services
   */
  updateConfig(newConfig: Partial<ITunesServiceConfig>): void {
    this.configManager.updateConfig(newConfig);
    
    const config = this.configManager.getConfig();
    this.filteringService.updateConfig(config);
    this.deduplicationService.updateConfig(config);
    this.cacheService.updateConfig(config);
    this.httpClient.updateConfig(config);
    
    console.log('⚙️ iTunes Service configuration updated');
  }
  
  /**
   * Get current configuration
   */
  getConfig(): ITunesServiceConfig {
    return this.configManager.getConfig();
  }
  
  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    this.configManager.resetToDefaults();
    const config = this.configManager.getConfig();
    
    this.filteringService.updateConfig(config);
    this.deduplicationService.updateConfig(config);
    this.cacheService.updateConfig(config);
    this.httpClient.updateConfig(config);
    
    console.log('🔄 iTunes Service configuration reset to defaults');
  }
  
  // Helper methods for logging and statistics
  
  private logCacheHit(artistId: string, songCount: number): void {
    if (this.configManager.getConfig().logging.level === 'debug') {
      console.log(`💾 Cache hit for ${artistId}: ${songCount} songs`);
    }
  }
  
  private logSongRetrieval(type: 'random' | 'daily', artistName: string, song: Song, date?: string, seed?: number): void {
    const config = this.configManager.getConfig();
    if (config.logging.level === 'info') {
      console.log(`\n=== ITUNES ${type.toUpperCase()} SONG (${artistName}) ===`);
      console.log(`Song: ${song.name}`);
      console.log(`Album: ${song.album}`);
      console.log(`Preview URL: ${song.previewUrl ? 'Available' : 'Not available'}`);
      
      if (type === 'daily' && date && seed !== undefined) {
        console.log(`Date: ${date}, Seed: ${seed}`);
      }
    }
  }
  
  private updateResponseTime(time: number): void {
    this.stats.responseTimes.push(time);
    
    // Keep only last 100 response times for statistics
    if (this.stats.responseTimes.length > 100) {
      this.stats.responseTimes.shift();
    }
    
    this.stats.lastUpdated = Date.now();
  }
  
  /**
   * Cleanup resources
   */
  destroy(): void {
    this.cacheService.destroy();
    console.log('🧹 iTunes Service destroyed');
  }
}

// Make the service available globally for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).itunesService = ITunesService.getInstance();
  console.log('🔧 iTunes service available globally as window.itunesService');
}

// Export the class
export default ITunesService;
