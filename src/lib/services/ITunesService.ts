import { ArtistService, ArtistConfig } from './ArtistService';
import { TrackFilterService } from './TrackFilterService';
import { CacheService } from './CacheService';
import { APIService } from './APIService';
import { StringUtils } from '../utils/stringUtils';
import { DateUtils } from '../utils/dateUtils';

export interface TWICESong {
  id: string;
  name: string;
  artists: string[];
  album: string;
  previewUrl: string;
  duration: number;
  itunesUrl: string;
  artworkUrl: string;
  trackId: number;
}

interface ITunesTrack {
  wrapperType: string;
  kind: string;
  artistId: number;
  collectionId: number;
  trackId: number;
  artistName: string;
  collectionName: string;
  trackName: string;
  previewUrl: string;
  artworkUrl100: string;
  trackTimeMillis: number;
  trackViewUrl: string;
}

export class ITunesService {
  private static instance: ITunesService;
  private artistService: ArtistService;
  private filterService: TrackFilterService;
  private cacheService: CacheService<TWICESong[]>;
  private apiService: APIService;

  static getInstance(): ITunesService {
    if (!ITunesService.instance) {
      ITunesService.instance = new ITunesService();
    }
    return ITunesService.instance;
  }

  constructor() {
    this.artistService = ArtistService.getInstance();
    this.filterService = TrackFilterService.getInstance();
    this.cacheService = new CacheService<TWICESong[]>({
      maxSize: 100,
      ttl: 60 * 60 * 1000 // 1 hour
    });
    this.apiService = APIService.getInstance();
  }

  async searchSongs(artistId: string): Promise<TWICESong[]> {
    // Check cache first
    const cached = this.cacheService.get(artistId);
    if (cached && cached.length > 0) {
      console.log(`🎵 Cache hit: Found ${cached.length} ${artistId} tracks`);
      return cached;
    }

    const artist = this.artistService.getArtist(artistId);
    if (!artist) {
      console.error(`Artist ${artistId} not found`);
      return [];
    }

    try {
      const tracks = await this.fetchArtistTracks(artist);
      const filteredTracks = this.filterService.filterTracks(tracks, artistId);
      const processedTracks = this.processTracks(filteredTracks, artist);
      
      // Cache the results
      this.cacheService.set(artistId, processedTracks);
      
      return processedTracks;
    } catch (error) {
      console.error(`Failed to fetch tracks for ${artist.displayName}:`, error);
      return [];
    }
  }

  private async fetchArtistTracks(artist: ArtistConfig): Promise<ITunesTrack[]> {
    // Try lookup endpoint first (most reliable)
    const lookupResult = await this.apiService.get('/lookup', {
      id: artist.artistId,
      entity: 'song',
      limit: '200'
    });

    if (lookupResult.success && lookupResult.data.results) {
      return this.filterValidTracks(lookupResult.data.results);
    }

    // Fallback to search endpoint
    const searchResults = await this.searchByArtistName(artist);
    return searchResults;
  }

  private async searchByArtistName(artist: ArtistConfig): Promise<ITunesTrack[]> {
    const allTracks: ITunesTrack[] = [];

    for (const term of artist.searchTerms) {
      const result = await this.apiService.get('/search', {
        term,
        entity: 'song',
        media: 'music',
        limit: '200'
      });

      if (result.success && result.data.results) {
        allTracks.push(...result.data.results);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return this.filterValidTracks(allTracks);
  }

  private filterValidTracks(tracks: any[]): ITunesTrack[] {
    return tracks.filter(track => 
      track.wrapperType === 'track' && 
      track.kind === 'song' &&
      track.previewUrl
    );
  }

  private processTracks(tracks: ITunesTrack[], artist: ArtistConfig): TWICESong[] {
    const uniqueById = this.removeDuplicatesById(tracks);
    
    return uniqueById.map(track => ({
      id: `itunes-${track.trackId}`,
      name: track.trackName || 'Unknown Track',
      artists: [track.artistName || artist.displayName],
      album: track.collectionName || 'Unknown Album',
      previewUrl: track.previewUrl,
      duration: track.trackTimeMillis || 0,
      itunesUrl: track.trackViewUrl || '',
      artworkUrl: track.artworkUrl100?.replace('100x100', '300x300') || '',
      trackId: track.trackId
    }));
  }

  private removeDuplicatesById(tracks: ITunesTrack[]): ITunesTrack[] {
    return tracks.filter((track, index, self) =>
      index === self.findIndex(t => t.trackId === track.trackId)
    );
  }

  // Public methods
  async getRandomSong(artistId: string): Promise<TWICESong> {
    const songs = await this.searchSongs(artistId);
    if (songs.length === 0) {
      const artist = this.artistService.getArtist(artistId);
      throw new Error(`No ${artist?.displayName || artistId} songs found`);
    }
    
    const randomIndex = Math.floor(Math.random() * songs.length);
    return songs[randomIndex];
  }

  async getDailySong(date: string, artistId: string): Promise<TWICESong> {
    const songs = await this.searchSongs(artistId);
    if (songs.length === 0) {
      const artist = this.artistService.getArtist(artistId);
      throw new Error(`No ${artist?.displayName || artistId} songs found`);
    }
    
    const seed = this.hashCode(date);
    const index = seed % songs.length;
    return songs[index];
  }

  // Search methods
  async searchSpecificSong(songName: string, artistId: string): Promise<TWICESong[]> {
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
      
      const artist = this.artistService.getArtist(artistId);
      console.log(`🔍 Found ${matchingSongs.length} ${artist?.displayName} songs matching "${songName}"`);
      
      return matchingSongs;
    } catch (error) {
      console.error('Failed to search for specific song:', error);
      return [];
    }
  }

  async getSongsByAlbum(albumName: string, artistId: string): Promise<TWICESong[]> {
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

  // Utility methods
  async getTotalSongCount(artistId: string): Promise<number> {
    try {
      const songs = await this.searchSongs(artistId);
      return songs.length;
    } catch (error) {
      console.error('Failed to get song count:', error);
      return 0;
    }
  }

  // Cache management
  clearCache(artistId?: string): void {
    if (artistId) {
      this.cacheService.delete(artistId);
    } else {
      this.cacheService.clear();
    }
  }

  getCacheStats(): any {
    return this.cacheService.getStats();
  }

  // Artist management (delegated to ArtistService)
  getAvailableArtists() {
    return this.artistService.getAllArtists();
  }

  addTrack(track: TWICESong, artistId: string): void {
    const currentTracks = this.cacheService.get(artistId) || [];
    currentTracks.push(track);
    this.cacheService.set(artistId, currentTracks);
    console.log(`Added track: ${track.name} (ID: ${track.trackId}) to ${artistId}`);
  }

  // Refresh songs for an artist
  async refreshSongs(artistId: string): Promise<TWICESong[]> {
    const artist = this.artistService.getArtist(artistId);
    console.log(`🔄 Refreshing ${artist?.displayName} songs from iTunes...`);
    this.cacheService.delete(artistId);
    return await this.searchSongs(artistId);
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
