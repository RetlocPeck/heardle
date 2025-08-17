import { Song, convertITunesTrackToSong } from '@/types/song';
import { ConfigService } from '@/lib/services/configService';
import { hashCode } from '@/lib/utils/stringUtils';
import { ITunesClient } from './client';
import { SearchPipeline } from './searchPipeline';
import { SongFilters } from './filters';
import { InMemoryRepository } from './repository';
import { DebugHelper } from './debug';
import { PageOpts, PaginationResult } from './types';

// Re-export Song type for backward compatibility during transition
export type TWICESong = Song;

export class ITunesService {
  private static instance: ITunesService;
  private client: ITunesClient;
  private searchPipeline: SearchPipeline;
  private filters: SongFilters;
  private repository: InMemoryRepository;
  private configService: ConfigService;

  static getInstance(): ITunesService {
    if (!ITunesService.instance) {
      ITunesService.instance = new ITunesService();
    }
    return ITunesService.instance;
  }

  constructor() {
    this.configService = ConfigService.getInstance();
    this.client = new ITunesClient();
    this.searchPipeline = new SearchPipeline(this.client);
    this.filters = new SongFilters();
    this.repository = new InMemoryRepository();
    
    // Initialize with some known tracks for immediate testing
    this.repository.set('twice', [
      {
        id: 'itunes-1',
        name: 'Fancy',
        artists: ['TWICE'],
        album: 'Fancy You',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/8f/8c/8f/8f8c8f8c-8f8c-8f8c-8f8c-8f8c8f8c8f8c/mzaf_1234567890.aac.p.m4a',
        duration: 180000,
        itunesUrl: 'https://music.apple.com/us/album/fancy/1234567890',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/8f/8c/8f/8f8c8f8c-8f8c-8f8c-8f8c-8f8c8f8c8f8c/1234567890.jpg/300x300bb.jpg',
        trackId: 1234567890
      }
    ]);
    
    this.repository.set('le-sserafim', [
      {
        id: 'itunes-2',
        name: 'ANTIFRAGILE',
        artists: ['LE SSERAFIM'],
        album: 'ANTIFRAGILE',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/8f/8c/8f/8f8c8f8c-8f8c-8f8c-8f8c-8f8c8f8c8f8c/mzaf_1234567890.aac.p.m4a',
        duration: 180000,
        itunesUrl: 'https://music.apple.com/us/album/antifragile/1234567890',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/8f/8c/8f/8f8c8f8c-8f8c-8f8c-8f8c-8f8c8f8c8f8c/1234567890.jpg/300x300bb.jpg',
        trackId: 1234567891
      }
    ]);
    
    DebugHelper.info('Service initialized with configuration-driven system');
    DebugHelper.info('Will lookup iTunes for real tracks on first use with search-based pagination support');
  }

  async searchSongs(artistId: string, opts: PageOpts = {}): Promise<Song[]> {
    // If we already have tracks, return them
    const cachedTracks = this.repository.get(artistId);
    if (cachedTracks && cachedTracks.length > 1) {
      DebugHelper.cache(`Found ${cachedTracks.length} ${artistId} tracks in cache`);
      return cachedTracks;
    }

    const artist = this.configService.getArtist(artistId);
    if (!artist) {
      DebugHelper.error(`Artist ${artistId} not found in configuration`);
      return [];
    }

    DebugHelper.info(`Looking up iTunes for ALL ${artist.displayName} tracks using multi-country search-based pagination...`);

    try {
      // Use search pipeline to execute strategies with pagination
      const tracks = await this.searchPipeline.execute(artist, opts);
      
      if (tracks.length > 0) {
        DebugHelper.success(`Found ${tracks.length} tracks using search pipeline with pagination`);
        this.processAndCacheTracks(tracks, artistId);
        return this.repository.get(artistId) || [];
      }

      DebugHelper.warn(`No ${artist.displayName} tracks found with any lookup strategy`);
      return [];
      
    } catch (error) {
      DebugHelper.error(`Failed to lookup iTunes for ${artist.displayName}:`, error);
      return this.repository.get(artistId) || [];
    }
  }

  private processAndCacheTracks(tracks: any[], artistId: string): void {
    const artist = this.configService.getArtist(artistId);
    if (!artist) return;

    // Apply filtering and deduplication
    const { valid: filteredTracks, filtered: filteredOutTracks } = this.filters.processTracks(tracks);
    
    // Get filtering statistics
    const stats = this.filters.getFilterStats(tracks.length, filteredTracks.length);
    DebugHelper.filter(`${artist.displayName}: ${stats.original} → ${stats.final} songs (${stats.percentageKept}% kept)`);

    // Convert to our format with proper validation
    const processedTracks = filteredTracks.map(track => convertITunesTrackToSong(track));

    this.repository.set(artistId, processedTracks);
    DebugHelper.success(`${artist.displayName}: Successfully loaded ${processedTracks.length} clean songs with multi-country search-based pagination`);
  }

  async getRandomSong(artistId: string): Promise<Song> {
    const songs = await this.searchSongs(artistId);
    
    if (songs.length === 0) {
      const artist = this.configService.getArtist(artistId);
      throw new Error(`No ${artist?.displayName || artistId} songs found in iTunes`);
    }
    
    const randomIndex = Math.floor(Math.random() * songs.length);
    const song = songs[randomIndex];
    
    const artist = this.configService.getArtist(artistId);
    DebugHelper.info(`\n=== ITUNES RANDOM SONG (${artist?.displayName}) ===`);
    DebugHelper.info(`Song: ${song.name}`);
    DebugHelper.info(`Album: ${song.album}`);
    DebugHelper.info(`Preview URL: ${song.previewUrl ? 'Available' : 'Not available'}`);
    
    return song;
  }

  async getDailySong(date: string, artistId: string): Promise<Song> {
    // Use date as seed for consistent daily song
    const seed = hashCode(date);
    const songs = await this.searchSongs(artistId);
    
    if (songs.length === 0) {
      const artist = this.configService.getArtist(artistId);
      throw new Error(`No ${artist?.displayName || artistId} songs found in iTunes`);
    }
    
    const index = seed % songs.length;
    const song = songs[index];
    
    const artist = this.configService.getArtist(artistId);
    DebugHelper.info(`\n=== ITUNES DAILY SONG (${artist?.displayName}) ===`);
    DebugHelper.info(`Date: ${date}, Seed: ${seed}`);
    DebugHelper.info(`Total songs available: ${songs.length}`);
    DebugHelper.info(`Selected song index: ${index}`);
    DebugHelper.info(`Song: ${song.name}`);
    DebugHelper.info(`Album: ${song.album}`);
    DebugHelper.info(`Preview URL: ${song.previewUrl ? 'Available' : 'Not available'}`);
    DebugHelper.info(`Local timezone date used for song selection`);
    
    return song;
  }

  // Helper method to manually add tracks
  addTrack(track: Song, artistId: string) {
    const currentTracks = this.repository.get(artistId) || [];
    currentTracks.push(track);
    this.repository.set(artistId, currentTracks);
    DebugHelper.info(`Added track: ${track.name} (ID: ${track.trackId}) to ${artistId}`);
  }

  // Helper method to search for specific songs within an artist's catalog
  async searchSpecificSong(songName: string, artistId: string): Promise<Song[]> {
    try {
      // First, ensure we have all songs loaded
      const allSongs = await this.searchSongs(artistId);
      
      if (allSongs.length === 0) {
        return [];
      }
      
      // Search within our loaded songs
      const searchTerm = songName.toLowerCase();
      const matchingSongs = allSongs.filter(song => 
        song.name.toLowerCase().includes(searchTerm) ||
        song.album.toLowerCase().includes(searchTerm)
      );
      
      const artist = this.configService.getArtist(artistId);
      DebugHelper.info(`Found ${matchingSongs.length} ${artist?.displayName} songs matching "${songName}"`);
      
      return matchingSongs;
    } catch (error) {
      DebugHelper.error('Failed to search for specific song:', error);
      return [];
    }
  }

  // Get songs by album
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
      
      DebugHelper.info(`Found ${albumSongs.length} songs from album "${albumName}"`);
      
      return albumSongs;
    } catch (error) {
      DebugHelper.error('Failed to get songs by album:', error);
      return [];
    }
  }

  // Get total count of available songs for an artist
  async getTotalSongCount(artistId: string): Promise<number> {
    try {
      const songs = await this.searchSongs(artistId);
      return songs.length;
    } catch (error) {
      DebugHelper.error('Failed to get song count:', error);
      return 0;
    }
  }

  // Check iTunes API pagination limits and get total available songs
  async checkArtistPagination(artistId: string): Promise<{ totalAvailable: number; fetched: number; pages: number }> {
    try {
      const artist = this.configService.getArtist(artistId);
      if (!artist) {
        throw new Error(`Artist ${artistId} not found in configuration`);
      }

      DebugHelper.pagination(`Checking pagination for ${artist.displayName} (ID: ${artist.itunesArtistId})`);
      
      // Get pagination info from client
      const { totalAvailable } = await this.client.checkPagination(artist.itunesArtistId);
      
      // Get the actual songs we have cached
      const cachedSongs = this.repository.get(artistId) || [];
      const fetched = cachedSongs.length;
      
      // Calculate pages (assuming 200 per page)
      const pages = Math.ceil(totalAvailable / 200);
      
      DebugHelper.pagination(`Pagination Info for ${artist.displayName}:`);
      DebugHelper.pagination(`   Total available on iTunes: ${totalAvailable}`);
      DebugHelper.pagination(`   Currently fetched: ${fetched}`);
      DebugHelper.pagination(`   Estimated pages: ${pages}`);
      DebugHelper.pagination(`   Coverage: ${((fetched / totalAvailable) * 100).toFixed(1)}%`);
      
      return { totalAvailable, fetched, pages };
      
    } catch (error) {
      DebugHelper.error('Failed to check artist pagination:', error);
      return { totalAvailable: 0, fetched: 0, pages: 0 };
    }
  }

  // Clear cache and reload songs for an artist
  async refreshSongs(artistId: string): Promise<Song[]> {
    const artist = this.configService.getArtist(artistId);
    DebugHelper.info(`Refreshing ${artist?.displayName} songs from iTunes with multi-country search-based pagination...`);
    this.repository.delete(artistId);
    return await this.searchSongs(artistId);
  }

  // Get all available artists
  getAvailableArtists() {
    return this.configService.getAllArtists();
  }

  // Get cache statistics
  getCacheStats() {
    return this.repository.getStats();
  }

  // Clean expired cache entries
  cleanupCache(): number {
    return this.repository.cleanup();
  }

  // Enhanced method to get pagination details for an artist
  async getArtistPaginationDetails(artistId: string): Promise<PaginationResult> {
    try {
      const artist = this.configService.getArtist(artistId);
      if (!artist) {
        throw new Error(`Artist ${artistId} not found in configuration`);
      }

      DebugHelper.pagination(`Getting detailed pagination info for ${artist.displayName}`);
      
      // Get total available from iTunes
      const { totalAvailable } = await this.client.checkPagination(artist.itunesArtistId);
      
      // Get cached songs
      const cachedSongs = this.repository.get(artistId) || [];
      const fetched = cachedSongs.length;
      
      // Calculate pages and coverage
      const pagesFetched = Math.ceil(fetched / 200);
      const hasMore = fetched < totalAvailable;
      
      const result: PaginationResult = {
        tracks: cachedSongs,
        totalAvailable,
        pagesFetched,
        hasMore
      };

      DebugHelper.pagination(`Detailed pagination for ${artist.displayName}:`);
      DebugHelper.pagination(`   Total available: ${totalAvailable}`);
      DebugHelper.pagination(`   Currently fetched: ${fetched}`);
      DebugHelper.pagination(`   Pages fetched: ${pagesFetched}`);
      DebugHelper.pagination(`   Has more: ${hasMore}`);
      DebugHelper.pagination(`   Coverage: ${((fetched / totalAvailable) * 100).toFixed(1)}%`);
      
      return result;
      
    } catch (error) {
      DebugHelper.error('Failed to get artist pagination details:', error);
      return {
        tracks: [],
        totalAvailable: 0,
        pagesFetched: 0,
        hasMore: false
      };
    }
  }
}

// Make the service available globally for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).itunesService = ITunesService.getInstance();
  console.log('🔧 iTunes service available globally as window.itunesService');
}

export default ITunesService;
