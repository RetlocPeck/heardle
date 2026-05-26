import {
  Song,
  AppleMusicTrack,
  AppleMusicAlbum,
  AppleMusicAlbumWithStorefront,
  AppleMusicArtist,
  AppleMusicResponse,
  AppleMusicArtistResponse,
  SongFilterTrackAdapter,
  convertAppleMusicTrackToSong,
  formatAppleMusicArtworkUrl,
} from '@/types/song';
import { ConfigService } from '@/lib/services/configService';
import { CachedDataService } from '@/lib/services/cachedDataService';
import { hashCode } from '@/lib/utils/stringUtils';
import { deduplicateSongVersions } from '@/lib/utils/songDeduplication';
import { applyFilterChain, getDefaultFilterChain, getGenericTrackId } from './trackFilters';
import { Logger } from '@/lib/utils/logger';
import appleMusicConstants from '@/config/apple-music-constants.json';

// Read once at module load — avoids re-reading process.env on every API call
const APPLE_MUSIC_TOKEN = process.env.APPLE_MUSIC_DEV_TOKEN;
if (!APPLE_MUSIC_TOKEN && typeof window === 'undefined') {
  Logger.error('APPLE_MUSIC_DEV_TOKEN not configured');
}

export interface ArtistArtwork {
  standardUrl: string; // 600x600 or similar
  highResUrl: string; // 1200x1200 or higher
  bannerUrl?: string; // Editorial banner if available
  bgColor?: string;
}

export class AppleMusicService {
  private static instance: AppleMusicService;
  private availableTracks: Map<string, Song[]> = new Map();
  private artistArtwork: Map<string, ArtistArtwork> = new Map();
  private baseUrl = appleMusicConstants.baseUrl;
  private primaryStorefront = appleMusicConstants.primaryStorefront;
  private storefronts = appleMusicConstants.storefronts;
  private configService: ConfigService;

  static getInstance(): AppleMusicService {
    if (!AppleMusicService.instance) {
      AppleMusicService.instance = new AppleMusicService();
    }
    return AppleMusicService.instance;
  }

  constructor() {
    this.configService = ConfigService.getInstance();
  }

  /**
   * Get authorization headers for Apple Music API
   */
  private getAuthHeaders(): HeadersInit {
    if (!APPLE_MUSIC_TOKEN) {
      throw new Error('Apple Music developer token not configured');
    }
    return {
      'Authorization': `Bearer ${APPLE_MUSIC_TOKEN}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Search for songs by artist ID
   * Uses pre-cached data if available, falls back to live API
   */
  async searchSongs(artistId: string): Promise<Song[]> {
    // Return memory-cached tracks if available
    const memoryCachedTracks = this.availableTracks.get(artistId);
    if (memoryCachedTracks && memoryCachedTracks.length > 1) {
      return memoryCachedTracks;
    }

    // Check for pre-fetched static data (from build time)
    const cachedDataService = CachedDataService.getInstance();
    const staticCachedSongs = cachedDataService.getCachedSongs(artistId);
    if (staticCachedSongs && staticCachedSongs.length > 0) {
      // IMPORTANT: Always apply runtime filters to static cached data
      // This ensures old cache files (built before filter updates) don't leak
      // intro/outro/skit/version tracks into the game
      const filteredSongs = this.applyRuntimeFiltersToSongs(staticCachedSongs);
      this.availableTracks.set(artistId, filteredSongs);
      return filteredSongs;
    }

    const artist = this.configService.getArtist(artistId);
    if (!artist) {
      Logger.error(`Artist ${artistId} not found in configuration`);
      return [];
    }

    try {
      // Strategy 1: Use explicit Apple Music artist ID if configured (PRIORITY)
      // This is more reliable than searching by name, which can return incorrect matches
      if (artist.appleMusicArtistId) {
        const tracks = await this.fetchArtistTracks(artist.appleMusicArtistId);
        
        if (tracks.length > 0) {
          this.processAndCacheTracks(tracks, artistId);
          return this.availableTracks.get(artistId) || [];
        }
        Logger.warn(`Explicit ID ${artist.appleMusicArtistId} returned no tracks, falling back to search`);
      }

      // Strategy 2: Search by artist name (fallback)
      const searchedArtist = await this.searchArtistByName(artist.displayName);
      
      if (searchedArtist) {
        const tracks = await this.fetchArtistTracks(searchedArtist.id);
        
        if (tracks.length > 0) {
          this.processAndCacheTracks(tracks, artistId);
          return this.availableTracks.get(artistId) || [];
        }
      }

      Logger.warn(`No ${artist.displayName} tracks found with any lookup strategy`);
      return [];
      
    } catch (error) {
      Logger.error(`Failed to fetch Apple Music tracks for ${artist.displayName}:`, error);
      return this.availableTracks.get(artistId) || [];
    }
  }

  /**
   * Fetch all tracks for an artist from Apple Music API
   * Uses albums endpoint to get FULL catalog (not just singles/title tracks)
   * Queries multiple storefronts (US, Japan, Korea) to get international releases
   */
  private async fetchArtistTracks(appleMusicArtistId: string): Promise<AppleMusicTrack[]> {
    try {
      // Step 1: Get all albums from ALL storefronts (US, Japan, Korea)
      // This ensures we get Japanese releases, Korean releases, etc.
      const allAlbums: AppleMusicAlbumWithStorefront[] = [];
      const seenAlbumIds = new Set<string>();

      for (const storefront of this.storefronts) {
        const albums = await this.fetchArtistAlbumsFromStorefront(appleMusicArtistId, storefront);
        
        // Add unique albums only (same album might exist in multiple storefronts)
        for (const album of albums) {
          if (!seenAlbumIds.has(album.id)) {
            seenAlbumIds.add(album.id);
            const tagged: AppleMusicAlbumWithStorefront = { ...album, _storefront: storefront };
            allAlbums.push(tagged);
          }
        }
      }

      if (allAlbums.length === 0) {
        // Fallback to direct songs endpoint (for artists with no albums listed)
        Logger.warn('No albums found, falling back to songs endpoint');
        return await this.fetchArtistSongsDirect(appleMusicArtistId);
      }

      // Step 2: Fetch tracks from each album
      const allTracks: AppleMusicTrack[] = [];
      const seenTrackIds = new Set<string>();

      for (const album of allAlbums) {
        const storefront = album._storefront || this.primaryStorefront;
        const albumTracks = await this.fetchAlbumTracksFromStorefront(
          album.id, 
          album.attributes?.name || 'Unknown Album',
          storefront
        );
        
        // Add unique tracks only (avoid duplicates from compilations, etc.)
        for (const track of albumTracks) {
          if (!seenTrackIds.has(track.id)) {
            seenTrackIds.add(track.id);
            allTracks.push(track);
          }
        }

        // Rate limit protection - small delay between album requests
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      return allTracks;
      
    } catch (error) {
      Logger.error('Failed to fetch artist tracks:', error);
      return [];
    }
  }

  /**
   * Fetch all albums for an artist from a specific storefront (with pagination)
   */
  private async fetchArtistAlbumsFromStorefront(appleMusicArtistId: string, storefront: string): Promise<AppleMusicAlbum[]> {
    const allAlbums: AppleMusicAlbum[] = [];
    let nextUrl: string | null = `/catalog/${storefront}/artists/${appleMusicArtistId}/albums?limit=100`;

    while (nextUrl) {
      const fullUrl: string = nextUrl.startsWith('http') 
        ? nextUrl 
        : `${this.baseUrl}${nextUrl}`;

      const response = await fetch(fullUrl, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        // 404 is normal for artists not in a storefront
        if (response.status !== 404) {
          Logger.warn(`Failed to fetch albums from ${storefront}: ${response.status}`);
        }
        break;
      }

      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        allAlbums.push(...data.data);
      }

      // Handle pagination - Apple Music returns next URL for more results
      nextUrl = data.next || null;
      
      if (nextUrl) {
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }

    return allAlbums;
  }

  /**
   * Fetch all tracks from a specific album in a specific storefront
   */
  private async fetchAlbumTracksFromStorefront(albumId: string, albumName: string, storefront: string): Promise<AppleMusicTrack[]> {
    try {
      // Request album with tracks relationship included
      const url = `${this.baseUrl}/catalog/${storefront}/albums/${albumId}?include=tracks`;
      
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        // Try primary storefront as fallback
        if (storefront !== this.primaryStorefront) {
          return this.fetchAlbumTracksFromStorefront(albumId, albumName, this.primaryStorefront);
        }
        Logger.warn(`Failed to fetch tracks for album ${albumName}: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      // Tracks are in the relationships.tracks.data array
      const tracks = data.data?.[0]?.relationships?.tracks?.data || [];
      return tracks;
      
    } catch (error) {
      Logger.warn(`Error fetching album ${albumName}:`, error);
      return [];
    }
  }

  /**
   * Fallback: Fetch songs directly from artist (only title tracks)
   */
  private async fetchArtistSongsDirect(appleMusicArtistId: string): Promise<AppleMusicTrack[]> {
    const allTracks: AppleMusicTrack[] = [];
    let nextUrl: string | null = `/catalog/${this.primaryStorefront}/artists/${appleMusicArtistId}/songs?limit=20`;

    while (nextUrl) {
      const url = nextUrl.startsWith('http') 
        ? nextUrl 
        : `${this.baseUrl}${nextUrl}`;

      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        break;
      }

      const data: AppleMusicResponse = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        allTracks.push(...data.data);
      }

      nextUrl = data.next || null;
      
      if (nextUrl) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return allTracks;
  }

  /**
   * Search for an artist by name
   */
  private async searchArtistByName(artistName: string): Promise<AppleMusicArtist | null> {
    try {
      const url = `${this.baseUrl}/catalog/${this.primaryStorefront}/search?types=artists&term=${encodeURIComponent(artistName)}&limit=5`;
      
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        Logger.error(`Artist search failed: ${response.status} ${response.statusText}. ${errorText.substring(0, 200)}`);
        return null;
      }

      const data: { results?: { artists?: AppleMusicArtistResponse } } = await response.json();
      
      if (data.results?.artists?.data && data.results.artists.data.length > 0) {
        // Return first match (usually most relevant)
        return data.results.artists.data[0];
      }

      Logger.warn(`No artists found for search term: "${artistName}"`);
      return null;
      
    } catch (error) {
      Logger.error('Failed to search for artist:', error);
      return null;
    }
  }

  /**
   * Apply runtime filters to Song[] array
   * Used for static cached songs that may have been built with older filter logic
   */
  private applyRuntimeFiltersToSongs(songs: Song[]): Song[] {
    // Build minimal track adapters satisfying the GenericTrack shape expected by the filter chain.
    const trackAdapters: SongFilterTrackAdapter[] = songs.map(song => ({
      id: song.trackId,
      attributes: {
        name: song.name,
        albumName: song.album,
        previews: [{ url: song.previewUrl }],
      },
    }));

    const filters = getDefaultFilterChain();
    // GenericTrack is AppleMusicTrack; SongFilterTrackAdapter is structurally compatible for
    // the subset of fields the filter chain reads (name, albumName, previews[0].url, id).
    const { valid: validTracks } = applyFilterChain(trackAdapters as unknown as AppleMusicTrack[], filters);

    const validTrackIds = new Set(validTracks.map(t => t.id.toString()));
    return songs.filter(song => validTrackIds.has(song.trackId.toString()));
  }

  /**
   * Process and cache tracks with filtering
   */
  private processAndCacheTracks(tracks: AppleMusicTrack[], artistId: string): void {
    const artist = this.configService.getArtist(artistId);
    if (!artist) return;

    // Apply filter chain to remove unwanted tracks
    const filters = getDefaultFilterChain();
    const { valid: validTracks, filtered: filteredOutTracks } = applyFilterChain(tracks, filters);

    // Smart deduplication
    const deduplicatedTracks = deduplicateSongVersions(validTracks, filteredOutTracks);

    // Remove duplicates based on track ID (final safety check)
    const uniqueById = deduplicatedTracks.filter((track, index, self) =>
      index === self.findIndex(t => getGenericTrackId(t) === getGenericTrackId(track))
    );

    // Convert to our Song format (tracks are AppleMusicTrack at this point)
    const processedTracks = uniqueById.map(track => convertAppleMusicTrackToSong(track as AppleMusicTrack));

    this.availableTracks.set(artistId, processedTracks);
  }

  /**
   * Get random song for practice mode
   */
  async getRandomSong(artistId: string, excludeTrackIds: string[] = []): Promise<Song> {
    const songs = await this.searchSongs(artistId);
    
    if (songs.length === 0) {
      const artist = this.configService.getArtist(artistId);
      throw new Error(`No ${artist?.displayName || artistId} songs found in Apple Music`);
    }
    
    // Filter out excluded songs
    let availableSongs = songs.filter(song => 
      !excludeTrackIds.includes(song.trackId.toString())
    );
    
    // If all songs are excluded, fall back to full catalog
    if (availableSongs.length === 0) {
      Logger.warn(`All songs excluded for ${artistId}, falling back to full catalog`);
      availableSongs = songs;
    }
    
    const randomIndex = Math.floor(Math.random() * availableSongs.length);
    return availableSongs[randomIndex];
  }

  /**
   * Get daily song (deterministic based on date)
   */
  async getDailySong(date: string, artistId: string): Promise<Song> {
    const seed = hashCode(date);
    const songs = await this.searchSongs(artistId);
    
    if (songs.length === 0) {
      const artist = this.configService.getArtist(artistId);
      throw new Error(`No ${artist?.displayName || artistId} songs found in Apple Music`);
    }
    
    const index = seed % songs.length;
    return songs[index];
  }

  /**
   * Get artist artwork from Apple Music API
   * Uses pre-cached data if available, falls back to live API
   */
  async getArtistArtwork(artistId: string): Promise<ArtistArtwork | null> {
    // Return memory-cached artwork if available
    const memoryCached = this.artistArtwork.get(artistId);
    if (memoryCached) {
      return memoryCached;
    }

    // Check for pre-fetched static data (from build time)
    const cachedDataService = CachedDataService.getInstance();
    const staticCachedArtwork = cachedDataService.getCachedArtwork(artistId);
    if (staticCachedArtwork) {
      this.artistArtwork.set(artistId, staticCachedArtwork);
      return staticCachedArtwork;
    }

    const artist = this.configService.getArtist(artistId);
    if (!artist) {
      return null;
    }

    try {
      // Try explicit Apple Music ID first (priority)
      let appleMusicId = artist.appleMusicArtistId;

      // If no explicit ID, search for the artist
      if (!appleMusicId) {
        const searchedArtist = await this.searchArtistByName(artist.displayName);
        if (searchedArtist) {
          appleMusicId = searchedArtist.id;
        }
      }

      if (!appleMusicId) {
        Logger.warn(`No Apple Music ID found for ${artist.displayName}`);
        return null;
      }

      const url = `${this.baseUrl}/catalog/${this.primaryStorefront}/artists/${appleMusicId}`;
      
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        Logger.warn(`Failed to fetch artist artwork: ${response.status}`);
        return null;
      }

      const data: AppleMusicArtistResponse = await response.json();
      
      if (data.data && data.data.length > 0) {
        const artistData = data.data[0];
        const artwork = artistData.attributes.artwork;
        const editorialArtwork = artistData.attributes.editorialArtwork;

        const result: ArtistArtwork = {
          standardUrl: artwork ? formatAppleMusicArtworkUrl(artwork.url, 600, 600) : '',
          highResUrl: artwork ? formatAppleMusicArtworkUrl(artwork.url, 1200, 1200) : '',
          bannerUrl: editorialArtwork?.superHeroWide?.url 
            || editorialArtwork?.subscriptionHero?.url 
            || undefined,
          bgColor: artwork?.bgColor,
        };

        this.artistArtwork.set(artistId, result);
        return result;
      }

      return null;
      
    } catch (error) {
      Logger.error('Failed to fetch artist artwork:', error);
      return null;
    }
  }

  /**
   * Get total song count for an artist
   */
  async getTotalSongCount(artistId: string): Promise<number> {
    try {
      const songs = await this.searchSongs(artistId);
      return songs.length;
    } catch (error) {
      Logger.error('Failed to get song count:', error);
      return 0;
    }
  }

  /**
   * Clear cache for an artist and reload songs
   */
  async refreshSongs(artistId: string): Promise<Song[]> {
    this.availableTracks.delete(artistId);
    this.artistArtwork.delete(artistId);
    return await this.searchSongs(artistId);
  }

  /**
   * Clear all cached data
   */
  clearAllCache(): void {
    this.availableTracks.clear();
    this.artistArtwork.clear();
  }

  /**
   * Get all available artists
   */
  getAvailableArtists() {
    return this.configService.getAllArtists();
  }
}

// Expose the service on the window object for debugging in development only.
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as Window & { appleMusicService?: AppleMusicService }).appleMusicService =
    AppleMusicService.getInstance();
}

export default AppleMusicService;
