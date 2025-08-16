import { SearchStrategy, PageOpts } from './types';
import { ITunesClient } from './client';
import { ITunesTrack } from '@/types/song';

/**
 * Strategy 1: Lookup by artist ID (most reliable)
 */
export class ArtistIdLookupStrategy implements SearchStrategy {
  name = 'Artist ID Lookup';
  
  constructor(private client: ITunesClient) {}
  
  async execute(artist: any, opts: PageOpts = {}): Promise<any[]> {
    try {
      const response = await this.client.lookupArtistSongs(
        { id: artist.itunesArtistId },
        { ...opts, limit: opts.limit || 200 }
      );
      
      if (!response.results || !Array.isArray(response.results)) {
        return [];
      }

      // Filter out non-song results and ensure they're actually songs
      const songs = response.results.filter((track: any) => 
        track.wrapperType === 'track' && 
        track.kind === 'song' &&
        track.previewUrl // Only include tracks with preview URLs
      );

      return songs;
    } catch (error) {
      throw new Error(`Artist ID lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Strategy 2: Search by artist name/terms (fallback)
 */
export class ArtistNameSearchStrategy implements SearchStrategy {
  name = 'Artist Name Search';
  
  constructor(private client: ITunesClient) {}
  
  async execute(artist: any, opts: PageOpts = {}): Promise<any[]> {
    try {
      let allTracks: ITunesTrack[] = [];

      for (const term of artist.searchTerms) {
        const response = await this.client.searchByArtistName(
          { term },
          { ...opts, limit: opts.limit || 200 }
        );
        
        if (response.results && Array.isArray(response.results)) {
          allTracks = allTracks.concat(response.results);
        }
        
        // Small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Filter for the specific artist's songs only
      const artistSongs = allTracks.filter(track => {
        const artistName = track.artistName?.toLowerCase().trim();
        const isArtist = artist.searchTerms.some((term: string) => 
          artistName === term.toLowerCase()
        );
        
        return isArtist && track.previewUrl;
      });

      return artistSongs;
    } catch (error) {
      throw new Error(`Artist name search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Search pipeline that orchestrates multiple strategies
 */
export class SearchPipeline {
  private strategies: SearchStrategy[] = [];
  
  constructor(private client: ITunesClient) {
    // Add strategies in order of preference
    this.strategies.push(new ArtistIdLookupStrategy(client));
    this.strategies.push(new ArtistNameSearchStrategy(client));
  }

  /**
   * Execute search using multiple strategies until one succeeds
   */
  async execute(artist: any, opts: PageOpts = {}): Promise<any[]> {
    for (const strategy of this.strategies) {
      try {
        const results = await strategy.execute(artist, opts);
        if (results.length > 0) {
          return results;
        }
      } catch (error) {
        // Continue to next strategy
        continue;
      }
    }
    
    // No strategy succeeded
    return [];
  }

  /**
   * Get information about available strategies
   */
  getStrategies(): Array<{ name: string; description: string }> {
    return this.strategies.map(strategy => ({
      name: strategy.name,
      description: strategy.name === 'Artist ID Lookup' 
        ? 'Most reliable method using iTunes artist ID'
        : 'Fallback method using artist name search terms'
    }));
  }
}
