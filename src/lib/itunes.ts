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
  collectionCensoredName: string;
  trackCensoredName: string;
  artistViewUrl: string;
  collectionViewUrl: string;
  trackViewUrl: string;
  previewUrl: string;
  artworkUrl60: string;
  artworkUrl100: string;
  collectionPrice: number;
  trackPrice: number;
  collectionExplicitness: string;
  trackExplicitness: string;
  discCount: number;
  discNumber: number;
  trackCount: number;
  trackNumber: number;
  trackTimeMillis: number;
  country: string;
  currency: string;
  primaryGenreName: string;
  releaseDate: string;
}

interface ITunesResponse {
  resultCount: number;
  results: ITunesTrack[];
}

interface ArtistConfig {
  id: string;
  name: string;
  displayName: string;
  artistId: string;
  searchTerms: string[];
}

const ARTISTS: ArtistConfig[] = [
  {
    id: 'twice',
    name: 'TWICE',
    displayName: 'TWICE',
    artistId: '1203816887',
    searchTerms: ['TWICE', '트와이스']
  },
  {
    id: 'le-sserafim',
    name: 'LE SSERAFIM',
    displayName: 'LE SSERAFIM',
    artistId: '1616740364',
    searchTerms: ['LE SSERAFIM', '르세라핌']
  }
];

export class ITunesService {
  private static instance: ITunesService;
  private availableTracks: Map<string, TWICESong[]> = new Map();
  private lookupUrl = 'https://itunes.apple.com/lookup';

  static getInstance(): ITunesService {
    if (!ITunesService.instance) {
      ITunesService.instance = new ITunesService();
    }
    return ITunesService.instance;
  }

  constructor() {
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
    
    console.log('🎵 iTunes Service initialized with sample tracks for multiple artists');
    console.log('💡 Will lookup iTunes for real tracks on first use');
  }

  async searchSongs(artistId: string = 'twice'): Promise<TWICESong[]> {
    // If we already have tracks, return them
    const cachedTracks = this.availableTracks.get(artistId);
    if (cachedTracks && cachedTracks.length > 1) {
      console.log(`🎵 iTunes: Found ${cachedTracks.length} ${artistId} tracks in cache`);
      return cachedTracks;
    }

    const artist = ARTISTS.find(a => a.id === artistId);
    if (!artist) {
      console.error(`Artist ${artistId} not found`);
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

  private async lookupArtistSongs(artist: ArtistConfig): Promise<ITunesTrack[]> {
    try {
      // Use the lookup endpoint as per API documentation
      // This is the most reliable way to get all songs by an artist
      const response = await fetch(
        `${this.lookupUrl}?id=${artist.artistId}&entity=song&limit=200`
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

  private async searchByArtistName(artist: ArtistConfig): Promise<ITunesTrack[]> {
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
        const isArtist = artist.searchTerms.some(term => 
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
    const artist = ARTISTS.find(a => a.id === artistId);
    if (!artist) return;

    // Filter for valid songs with simple filtering
    const validTracks = tracks.filter((track: ITunesTrack) => {
      if (!track.trackName || !track.previewUrl) {
        return false;
      }
      
      const trackName = track.trackName.toLowerCase();
      const collectionName = track.collectionName?.toLowerCase() || '';
      
      // Exclude only obvious unwanted versions that are in parentheses or brackets
      const unwantedPatterns = [
        'remix', 'version', 'ver.', 'edit', 'mixed', 'mix'
      ];
      
      // Check if track name contains any unwanted patterns inside parentheses or brackets
      const hasUnwantedPattern = unwantedPatterns.some(pattern => {
        // Look for patterns inside parentheses: (remix), (version), etc.
        const inParentheses = new RegExp(`\\([^)]*${pattern.replace('.', '\\.')}[^)]*\\)`, 'i');
        // Look for patterns inside square brackets: [remix], [version], etc.
        const inBrackets = new RegExp(`\\[[^\\]]*${pattern.replace('.', '\\.')}[^\\]]*\\]`, 'i');
        
        return inParentheses.test(trackName) || inBrackets.test(trackName);
      });
      
      // Additional filter: exclude tracks with "instrumental" in parentheses
      const hasInstrumentalInParentheses = /\([^)]*instrumental[^)]*\)/i.test(trackName);
      
      // Additional filter: exclude albums with "remix" in parentheses
      const hasRemixInAlbumParentheses = /\([^)]*remix[^)]*\)/i.test(collectionName);
      
      // Additional filter: exclude tracks with language indicators in parentheses or brackets
      const languagePatterns = ['eng', 'english', 'kor', 'korean', 'jap', 'japanese'];
      const hasLanguageIndicator = languagePatterns.some(lang => {
        // Look for language patterns inside parentheses: (ENG), (English), etc.
        const inParentheses = new RegExp(`\\([^)]*${lang}[^)]*\\)`, 'i');
        // Look for language patterns inside square brackets: [ENG], [English], etc.
        const inBrackets = new RegExp(`\\[[^\\]]*${lang}[^\\]]*\\]`, 'i');
        
        return inParentheses.test(trackName) || inBrackets.test(trackName);
      });
      
      return !hasUnwantedPattern && !hasInstrumentalInParentheses && !hasRemixInAlbumParentheses && !hasLanguageIndicator;
    });

    console.log(`🔍 Filtered to ${validTracks.length} valid ${artist.displayName} tracks`);

    // Remove duplicates based on track ID first
    const uniqueById = validTracks.filter((track, index, self) =>
      index === self.findIndex(t => t.trackId === track.trackId)
    );

    console.log(`✨ Found ${uniqueById.length} unique tracks by ID`);

    // Convert to our format with proper validation
    const processedTracks = uniqueById.map(track => ({
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

    this.availableTracks.set(artistId, processedTracks);
    console.log(`✅ iTunes: Successfully loaded ${processedTracks.length} ${artist.displayName} tracks`);
    
    // Log some sample tracks for verification
    if (processedTracks.length > 0) {
      console.log(`📋 Sample ${artist.displayName} tracks loaded:`);
      processedTracks.slice(0, 5).forEach((track, index) => {
        console.log(`  ${index + 1}. ${track.name} - ${track.album}`);
      });
      if (processedTracks.length > 5) {
        console.log(`  ... and ${processedTracks.length - 5} more tracks`);
      }
    }
  }

  async getRandomSong(artistId: string = 'twice'): Promise<TWICESong> {
    const songs = await this.searchSongs(artistId);
    
    if (songs.length === 0) {
      const artist = ARTISTS.find(a => a.id === artistId);
      throw new Error(`No ${artist?.displayName || artistId} songs found in iTunes`);
    }
    
    const randomIndex = Math.floor(Math.random() * songs.length);
    const song = songs[randomIndex];
    
    const artist = ARTISTS.find(a => a.id === artistId);
    console.log(`\n=== ITUNES RANDOM SONG (${artist?.displayName}) ===`);
    console.log(`Song: ${song.name}`);
    console.log(`Album: ${song.album}`);
    console.log(`Preview URL: ${song.previewUrl ? 'Available' : 'Not available'}`);
    
    return song;
  }

  async getDailySong(date: string, artistId: string = 'twice'): Promise<TWICESong> {
    // Use date as seed for consistent daily song
    const seed = this.hashCode(date);
    const songs = await this.searchSongs(artistId);
    
    if (songs.length === 0) {
      const artist = ARTISTS.find(a => a.id === artistId);
      throw new Error(`No ${artist?.displayName || artistId} songs found in iTunes`);
    }
    
    const index = seed % songs.length;
    const song = songs[index];
    
    const artist = ARTISTS.find(a => a.id === artistId);
    console.log(`\n=== ITUNES DAILY SONG (${artist?.displayName}) ===`);
    console.log(`Date: ${date}, Seed: ${seed}`);
    console.log(`Song: ${song.name}`);
    console.log(`Album: ${song.album}`);
    console.log(`Preview URL: ${song.previewUrl ? 'Available' : 'Not available'}`);
    
    return song;
  }

  // Helper method to manually add tracks
  addTrack(track: TWICESong, artistId: string = 'twice') {
    const currentTracks = this.availableTracks.get(artistId) || [];
    currentTracks.push(track);
    this.availableTracks.set(artistId, currentTracks);
    console.log(`Added track: ${track.name} (ID: ${track.trackId}) to ${artistId}`);
  }

  // Helper method to search for specific songs within an artist's catalog
  async searchSpecificSong(songName: string, artistId: string = 'twice'): Promise<TWICESong[]> {
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
      
      const artist = ARTISTS.find(a => a.id === artistId);
      console.log(`🔍 Found ${matchingSongs.length} ${artist?.displayName} songs matching "${songName}"`);
      
      return matchingSongs;
    } catch (error) {
      console.error('Failed to search for specific song:', error);
      return [];
    }
  }

  // Get songs by album
  async getSongsByAlbum(albumName: string, artistId: string = 'twice'): Promise<TWICESong[]> {
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
  async getTotalSongCount(artistId: string = 'twice'): Promise<number> {
    try {
      const songs = await this.searchSongs(artistId);
      return songs.length;
    } catch (error) {
      console.error('Failed to get song count:', error);
      return 0;
    }
  }

  // Clear cache and reload songs for an artist
  async refreshSongs(artistId: string = 'twice'): Promise<TWICESong[]> {
    const artist = ARTISTS.find(a => a.id === artistId);
    console.log(`🔄 Refreshing ${artist?.displayName} songs from iTunes...`);
    this.availableTracks.delete(artistId);
    return await this.searchSongs(artistId);
  }

  // Get all available artists
  getAvailableArtists(): ArtistConfig[] {
    return ARTISTS;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export default ITunesService;