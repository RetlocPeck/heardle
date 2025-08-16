import { Song, ITunesTrack, ITunesResponse, convertITunesTrackToSong } from '@/types/song';
import { ConfigService } from '@/lib/services/configService';
import { hashCode } from '@/lib/utils/stringUtils';
import { deduplicateSongVersions, FilteredTrack } from '@/lib/utils/songDeduplication';

// Re-export Song type for backward compatibility during transition
export type TWICESong = Song;

export class ITunesService {
  private static instance: ITunesService;
  private availableTracks: Map<string, Song[]> = new Map();
  private lookupUrl = 'https://itunes.apple.com/lookup';
  private configService: ConfigService;

  static getInstance(): ITunesService {
    if (!ITunesService.instance) {
      ITunesService.instance = new ITunesService();
    }
    return ITunesService.instance;
  }

  constructor() {
    this.configService = ConfigService.getInstance();
    
    // Initialize with some known tracks for immediate testing
    this.availableTracks.set('twice', [
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
    
    this.availableTracks.set('le-sserafim', [
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
    
    console.log('🎵 iTunes Service initialized with configuration-driven system');
    console.log('💡 Will lookup iTunes for real tracks on first use');
  }

  async searchSongs(artistId: string): Promise<Song[]> {
    // If we already have tracks, return them
    const cachedTracks = this.availableTracks.get(artistId);
    if (cachedTracks && cachedTracks.length > 1) {
      console.log(`🎵 iTunes: Found ${cachedTracks.length} ${artistId} tracks in cache`);
      return cachedTracks;
    }

    const artist = this.configService.getArtist(artistId);
    if (!artist) {
      console.error(`Artist ${artistId} not found in configuration`);
      return [];
    }

    // Use the lookup endpoint to get ALL tracks by artist ID
    console.log(`🔍 Looking up iTunes for ALL ${artist.displayName} tracks using artist ID...`);

    try {
      // Strategy 1: Lookup all songs by artist ID (most reliable)
      console.log(`📡 Strategy 1: Looking up songs by artist ID...`);
      const artistSongs = await this.lookupArtistSongs(artist);
      
      if (artistSongs.length > 0) {
        console.log(`✅ Artist ID lookup found ${artistSongs.length} tracks`);
        this.processAndCacheTracks(artistSongs, artistId);
        return this.availableTracks.get(artistId) || [];
      }

      // Strategy 2: Fallback to search by artist name
      console.log(`📡 Strategy 2: Fallback to search by artist name...`);
      const searchResults = await this.searchByArtistName(artist);
      
      if (searchResults.length > 0) {
        console.log(`✅ Artist name search found ${searchResults.length} tracks`);
        this.processAndCacheTracks(searchResults, artistId);
        return this.availableTracks.get(artistId) || [];
      }

      console.warn(`❌ No ${artist.displayName} tracks found with any lookup strategy`);
      return [];
      
    } catch (error) {
      console.error(`Failed to lookup iTunes for ${artist.displayName}:`, error);
      return this.availableTracks.get(artistId) || [];
    }
  }

  private async lookupArtistSongs(artist: any): Promise<ITunesTrack[]> {
    try {
      // Use the lookup endpoint as per API documentation
      // This is the most reliable way to get all songs by an artist
      const response = await fetch(
        `${this.lookupUrl}?id=${artist.itunesArtistId}&entity=song&limit=200`
      );
      
      if (!response.ok) {
        console.warn(`Artist lookup failed with status: ${response.status}`);
        return [];
      }
      
      const data: ITunesResponse = await response.json();
      console.log(`📊 Artist lookup found ${data.resultCount || 0} total tracks`);
      
      if (!data.results || !Array.isArray(data.results)) {
        return [];
      }

      // Filter out non-song results and ensure they're actually songs
      const songs = data.results.filter(track => 
        track.wrapperType === 'track' && 
        track.kind === 'song' &&
        track.previewUrl // Only include tracks with preview URLs
      );

      console.log(`🎵 Filtered to ${songs.length} valid song tracks with preview URLs`);
      return songs;
      
    } catch (error) {
      console.warn('Artist lookup failed:', error);
      return [];
    }
  }

  private async searchByArtistName(artist: any): Promise<ITunesTrack[]> {
    try {
      let allTracks: ITunesTrack[] = [];

      for (const term of artist.searchTerms) {
        // Use the search endpoint as fallback
        const response = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&media=music&limit=200`
        );
        
        if (!response.ok) {
          continue;
        }
        
        const data: ITunesResponse = await response.json();
        
        if (data.results && Array.isArray(data.results)) {
          allTracks = allTracks.concat(data.results);
        }
        
        // Small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 100));
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

  private processAndCacheTracks(tracks: ITunesTrack[], artistId: string): void {
    const artist = this.configService.getArtist(artistId);
    if (!artist) return;

    // Enhanced filtering with hard filtering + smart deduplication
    const filteredOutTracks: FilteredTrack[] = [];
    const validTracks: ITunesTrack[] = [];

    // Step 1: Hard filtering for known bad patterns
    tracks.forEach((track: ITunesTrack) => {
      const originalTrackName = track.trackName;
      const trackName = track.trackName?.toLowerCase() || '';
      const collectionName = track.collectionName?.toLowerCase() || '';
      
      // Check 1: Missing track name or preview URL
      if (!track.trackName || !track.previewUrl) {
        filteredOutTracks.push({ 
          track, 
          reason: `Missing ${!track.trackName ? 'track name' : 'preview URL'}` 
        });
        return;
      }
      
      // Check 2: Square brackets anywhere in the title
      if (/\[.*\]/.test(originalTrackName)) {
        filteredOutTracks.push({ 
          track, 
          reason: 'Contains square brackets [...]' 
        });
        return;
      }
      
      // Check 3: "ver." anywhere in the song name
      if (/ver\./i.test(originalTrackName)) {
        filteredOutTracks.push({ 
          track, 
          reason: 'Contains "ver." anywhere in title' 
        });
        return;
      }
      
      // Check 4: Unwanted words between hyphens - -
      const hyphenPattern = /-\s*(version|ver\.|japanese|kor|korean|english|eng|instrumental|inst\.|remix|mix|edit)\s*-/i;
      const hyphenMatch = hyphenPattern.exec(originalTrackName);
      if (hyphenMatch) {
        filteredOutTracks.push({ 
          track, 
          reason: `Contains "${hyphenMatch[1]}" between hyphens` 
        });
        return;
      }
      
      // Check 5: Unwanted patterns in parentheses or brackets (HARD FILTER)
      const unwantedPatterns = [
        'remix', 'version', 'ver\\.', 'edit', 'mixed', 'mix', 'instrumental', 'inst\\.',
        'japanese', 'korean', 'english', 'kor', 'eng', 'jap'
      ];
      
      let foundUnwantedPattern = false;
      let unwantedReason = '';
      
      for (const pattern of unwantedPatterns) {
        const inParentheses = new RegExp(`\\([^)]*${pattern}[^)]*\\)`, 'i');
        const inBrackets = new RegExp(`\\[[^\\]]*${pattern}[^\\]]*\\]`, 'i');
        
        if (inParentheses.test(trackName)) {
          foundUnwantedPattern = true;
          unwantedReason = `Contains "${pattern.replace('\\\\', '')}" in parentheses`;
          break;
        }
        
        if (inBrackets.test(trackName)) {
          foundUnwantedPattern = true;
          unwantedReason = `Contains "${pattern.replace('\\\\', '')}" in brackets`;
          break;
        }
      }
      
      if (foundUnwantedPattern) {
        filteredOutTracks.push({ 
          track, 
          reason: unwantedReason 
        });
        return;
      }
      
      // Check 6: Albums with remix in parentheses
      const hasRemixInAlbumParentheses = /\([^)]*remix[^)]*\)/i.test(collectionName);
      if (hasRemixInAlbumParentheses) {
        filteredOutTracks.push({ 
          track, 
          reason: 'Album contains "remix" in parentheses' 
        });
        return;
      }
      
      // If we get here, the track passed all hard filters
      validTracks.push(track);
    });

    // Step 2: Smart deduplication - remove duplicate versions and keep the best one
    const deduplicatedTracks = deduplicateSongVersions(validTracks, filteredOutTracks);

    console.log(`🎵 ${artist.displayName}: ${tracks.length} → ${deduplicatedTracks.length} songs (${((deduplicatedTracks.length / tracks.length) * 100).toFixed(1)}% kept)`);

    // Remove duplicates based on track ID (final safety check)
    const uniqueById = deduplicatedTracks.filter((track, index, self) =>
      index === self.findIndex(t => t.trackId === track.trackId)
    );

    // Convert to our format with proper validation
    const processedTracks = uniqueById.map(track => convertITunesTrackToSong(track));

    this.availableTracks.set(artistId, processedTracks);
    console.log(`✅ ${artist.displayName}: Successfully loaded ${processedTracks.length} clean songs`);
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
    console.log(`\n=== ITUNES RANDOM SONG (${artist?.displayName}) ===`);
    console.log(`Song: ${song.name}`);
    console.log(`Album: ${song.album}`);
    console.log(`Preview URL: ${song.previewUrl ? 'Available' : 'Not available'}`);
    
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
    console.log(`\n=== ITUNES DAILY SONG (${artist?.displayName}) ===`);
    console.log(`Date: ${date}, Seed: ${seed}`);
    console.log(`Total songs available: ${songs.length}`);
    console.log(`Selected song index: ${index}`);
    console.log(`Song: ${song.name}`);
    console.log(`Album: ${song.album}`);
    console.log(`Preview URL: ${song.previewUrl ? 'Available' : 'Not available'}`);
    console.log(`Local timezone date used for song selection`);
    
    return song;
  }

  // Helper method to manually add tracks
  addTrack(track: Song, artistId: string) {
    const currentTracks = this.availableTracks.get(artistId) || [];
    currentTracks.push(track);
    this.availableTracks.set(artistId, currentTracks);
    console.log(`Added track: ${track.name} (ID: ${track.trackId}) to ${artistId}`);
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
      console.log(`🔍 Found ${matchingSongs.length} ${artist?.displayName} songs matching "${songName}"`);
      
      return matchingSongs;
    } catch (error) {
      console.error('Failed to search for specific song:', error);
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
      
      console.log(`📀 Found ${albumSongs.length} songs from album "${albumName}"`);
      
      return albumSongs;
    } catch (error) {
      console.error('Failed to get songs by album:', error);
      return [];
    }
  }

  // Get total count of available songs for an artist
  async getTotalSongCount(artistId: string): Promise<number> {
    try {
      const songs = await this.searchSongs(artistId);
      return songs.length;
    } catch (error) {
      console.error('Failed to get song count:', error);
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

      console.log(`🔍 Checking pagination for ${artist.displayName} (ID: ${artist.itunesArtistId})`);
      
      // First, try to get the total count from a single request
      const testUrl = `${this.lookupUrl}?id=${artist.itunesArtistId}&entity=song&limit=1`;
      const testResponse = await fetch(testUrl);
      
      if (!testResponse.ok) {
        throw new Error(`Failed to check pagination: ${testResponse.status}`);
      }
      
      const testData: ITunesResponse = await testResponse.json();
      const totalAvailable = testData.resultCount || 0;
      
      // Get the actual songs we have cached
      const cachedSongs = this.availableTracks.get(artistId) || [];
      const fetched = cachedSongs.length;
      
      // Calculate pages (assuming 200 per page)
      const pages = Math.ceil(totalAvailable / 200);
      
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

  // Clear cache and reload songs for an artist
  async refreshSongs(artistId: string): Promise<Song[]> {
    const artist = this.configService.getArtist(artistId);
    console.log(`🔄 Refreshing ${artist?.displayName} songs from iTunes...`);
    this.availableTracks.delete(artistId);
    return await this.searchSongs(artistId);
  }

  // Get all available artists
  getAvailableArtists() {
    return this.configService.getAllArtists();
  }




}

// Make the service available globally for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).itunesService = ITunesService.getInstance();
  console.log('🔧 iTunes service available globally as window.itunesService');
}

export default ITunesService;