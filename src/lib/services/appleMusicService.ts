import {
  Song,
  AppleMusicTrack,
  AppleMusicAlbum,
  AppleMusicArtist,
  AppleMusicResponse,
  AppleMusicArtistResponse,
  convertAppleMusicTrackToSong,
  formatAppleMusicArtworkUrl,
} from '@/types/song';
import { ConfigService } from '@/lib/services/configService';
import { CachedDataService } from '@/lib/services/cachedDataService';
import { hashCode } from '@/lib/utils/stringUtils';
import { deduplicateSongVersions } from '@/lib/utils/songDeduplication';
import { applyFilterChain, getDefaultFilterChain, getGenericTrackId } from './trackFilters';

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
  private baseUrl = 'https://api.music.apple.com/v1';
  private primaryStorefront = 'us'; // Primary storefront for searches
  // Query multiple storefronts to get international releases (Japanese, Korean, etc.)
  private storefronts = ['us', 'jp', 'kr'];
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
    const token = process.env.APPLE_MUSIC_DEV_TOKEN;
    
    if (!token) {
      console.error('❌ APPLE_MUSIC_DEV_TOKEN not found in environment variables');
      throw new Error('Apple Music developer token not configured');
    }

    return {
      'Authorization': `Bearer ${token}`,
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
      console.log(`✅ Returning ${memoryCachedTracks.length} memory-cached tracks for ${artistId}`);
      return memoryCachedTracks;
    }

    // Check for pre-fetched static data (from build time)
    const cachedDataService = CachedDataService.getInstance();
    const staticCachedSongs = cachedDataService.getCachedSongs(artistId);
    if (staticCachedSongs && staticCachedSongs.length > 0) {
      console.log(`📦 Using ${staticCachedSongs.length} pre-cached songs for ${artistId}`);
      this.availableTracks.set(artistId, staticCachedSongs);
      return staticCachedSongs;
    }

    const artist = this.configService.getArtist(artistId);
    if (!artist) {
      console.error(`Artist ${artistId} not found in configuration`);
      return [];
    }

    console.log(`🌐 No cache found for ${artistId}, fetching from Apple Music API...`);

    try {
      // Strategy 1: Use explicit Apple Music artist ID if configured
      const explicitId = (artist as any).appleMusicArtistId;
      if (explicitId) {
        console.log(`🎵 Fetching tracks for ${artist.displayName} using explicit Apple Music ID: ${explicitId}`);
        const tracks = await this.fetchArtistTracks(explicitId);
        
        if (tracks.length > 0) {
          this.processAndCacheTracks(tracks, artistId);
          return this.availableTracks.get(artistId) || [];
        }
        console.warn(`⚠️ Explicit ID ${explicitId} returned no tracks, falling back to search...`);
      }

      // Strategy 2: Search by artist name (primary strategy)
      console.log(`🔍 Searching for "${artist.displayName}" by name...`);
      const searchedArtist = await this.searchArtistByName(artist.displayName);
      
      if (searchedArtist) {
        console.log(`✅ Found artist: ${searchedArtist.attributes.name} (ID: ${searchedArtist.id})`);
        const tracks = await this.fetchArtistTracks(searchedArtist.id);
        
        if (tracks.length > 0) {
          this.processAndCacheTracks(tracks, artistId);
          return this.availableTracks.get(artistId) || [];
        }
      }

      console.warn(`❌ No ${artist.displayName} tracks found with any lookup strategy`);
      return [];
      
    } catch (error) {
      console.error(`Failed to fetch Apple Music tracks for ${artist.displayName}:`, error);
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
      const allAlbums: AppleMusicAlbum[] = [];
      const seenAlbumIds = new Set<string>();

      console.log(`🌏 Fetching albums from ${this.storefronts.length} storefronts: ${this.storefronts.join(', ')}`);

      for (const storefront of this.storefronts) {
        const albums = await this.fetchArtistAlbumsFromStorefront(appleMusicArtistId, storefront);
        
        // Add unique albums only (same album might exist in multiple storefronts)
        let newCount = 0;
        for (const album of albums) {
          if (!seenAlbumIds.has(album.id)) {
            seenAlbumIds.add(album.id);
            allAlbums.push({ ...album, _storefront: storefront } as AppleMusicAlbum & { _storefront: string });
            newCount++;
          }
        }
        
        if (newCount > 0) {
          console.log(`  📀 ${storefront.toUpperCase()}: ${albums.length} albums (${newCount} new, ${albums.length - newCount} duplicates)`);
        }
      }

      console.log(`📀 Total ${allAlbums.length} unique albums across all storefronts`);

      if (allAlbums.length === 0) {
        // Fallback to direct songs endpoint (for artists with no albums listed)
        console.log(`⚠️ No albums found, falling back to songs endpoint...`);
        return await this.fetchArtistSongsDirect(appleMusicArtistId);
      }

      // Step 2: Fetch tracks from each album
      const allTracks: AppleMusicTrack[] = [];
      const seenTrackIds = new Set<string>();

      for (const album of allAlbums) {
        const storefront = (album as any)._storefront || this.primaryStorefront;
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

      console.log(`✅ Total ${allTracks.length} unique tracks from ${allAlbums.length} albums`);
      return allTracks;
      
    } catch (error) {
      console.error('Failed to fetch artist tracks:', error);
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
          console.warn(`⚠️ Failed to fetch albums from ${storefront}: ${response.status}`);
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
        console.warn(`⚠️ Failed to fetch tracks for album ${albumName}: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      // Tracks are in the relationships.tracks.data array
      const tracks = data.data?.[0]?.relationships?.tracks?.data || [];
      
      if (tracks.length > 0) {
        console.log(`  📝 ${albumName}: ${tracks.length} tracks`);
      }
      
      return tracks;
      
    } catch (error) {
      console.warn(`⚠️ Error fetching album ${albumName}:`, error);
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

    console.log(`✅ Fetched ${allTracks.length} songs (direct endpoint)`);
    return allTracks;
  }

  /**
   * Search for an artist by name
   */
  private async searchArtistByName(artistName: string): Promise<AppleMusicArtist | null> {
    try {
      const url = `${this.baseUrl}/catalog/${this.primaryStorefront}/search?types=artists&term=${encodeURIComponent(artistName)}&limit=5`;
      
      console.log(`🔎 Searching Apple Music for: "${artistName}"`);
      
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Artist search failed: ${response.status} ${response.statusText}`);
        console.error(`   Response: ${errorText.substring(0, 200)}`);
        return null;
      }

      const data: { results?: { artists?: AppleMusicArtistResponse } } = await response.json();
      
      if (data.results?.artists?.data && data.results.artists.data.length > 0) {
        // Return first match (usually most relevant)
        const foundArtist = data.results.artists.data[0];
        console.log(`✅ Found artist: "${foundArtist.attributes.name}" (ID: ${foundArtist.id})`);
        return foundArtist;
      }

      console.warn(`⚠️ No artists found for search term: "${artistName}"`);
      return null;
      
    } catch (error) {
      console.error('Failed to search for artist:', error);
      return null;
    }
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

    console.log(`🎯 Filtering: ${tracks.length} total → ${validTracks.length} valid, ${filteredOutTracks.length} filtered out`);

    // Smart deduplication
    const deduplicatedTracks = deduplicateSongVersions(validTracks, filteredOutTracks);

    // Remove duplicates based on track ID (final safety check)
    const uniqueById = deduplicatedTracks.filter((track, index, self) =>
      index === self.findIndex(t => getGenericTrackId(t) === getGenericTrackId(track))
    );

    // Convert to our Song format (tracks are AppleMusicTrack at this point)
    const processedTracks = uniqueById.map(track => convertAppleMusicTrackToSong(track as AppleMusicTrack));

    this.availableTracks.set(artistId, processedTracks);
    console.log(`✅ Cached ${processedTracks.length} songs for ${artistId}`);
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
      console.warn(`🎵 All songs excluded for ${artistId}, falling back to full catalog`);
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
      console.log(`📦 Using pre-cached artwork for ${artistId}`);
      this.artistArtwork.set(artistId, staticCachedArtwork);
      return staticCachedArtwork;
    }

    const artist = this.configService.getArtist(artistId);
    if (!artist) {
      return null;
    }

    console.log(`🌐 No cached artwork for ${artistId}, fetching from API...`);

    try {
      // Try explicit Apple Music ID first
      const explicitId = (artist as any).appleMusicArtistId;
      let appleMusicId = explicitId;

      // If no explicit ID, search for the artist
      if (!appleMusicId) {
        const searchedArtist = await this.searchArtistByName(artist.displayName);
        if (searchedArtist) {
          appleMusicId = searchedArtist.id;
        }
      }

      if (!appleMusicId) {
        console.warn(`No Apple Music ID found for ${artist.displayName}`);
        return null;
      }

      const url = `${this.baseUrl}/catalog/${this.primaryStorefront}/artists/${appleMusicId}`;
      
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        console.warn(`Failed to fetch artist artwork: ${response.status}`);
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
        console.log(`✅ Cached artwork for ${artistId}`);
        return result;
      }

      return null;
      
    } catch (error) {
      console.error('Failed to fetch artist artwork:', error);
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
      console.error('Failed to get song count:', error);
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
    console.log('🗑️ Cleared all Apple Music cache');
  }

  /**
   * Get all available artists
   */
  getAvailableArtists() {
    return this.configService.getAllArtists();
  }
}

// Make the service available globally for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).appleMusicService = AppleMusicService.getInstance();
}

export default AppleMusicService;
