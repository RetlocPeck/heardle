import { SearchStrategy, PageOpts } from './types';
import { ITunesClient } from './client';
import { ITunesTrack } from '@/types/song';

/**
 * Strategy 1: Search by artist ID with display name (most reliable) with pagination
 */
export class ArtistIdLookupStrategy implements SearchStrategy {
  name = 'Artist ID Search with Pagination';
  
  constructor(private client: ITunesClient) {}
  
  async execute(artist: any, opts: PageOpts = {}): Promise<any[]> {
    try {
      // Try search-based pagination first
      const searchTracks = await this.client.searchAllByArtistId(artist.itunesArtistId, artist.displayName, opts);
      
      if (searchTracks.length >= 200) {
        // Search found enough tracks, use those
        return searchTracks;
      } else {
        // Search didn't find enough tracks, fall back to lookup
        try {
          const lookupTracks = await this.client.lookupArtistSongs({ id: artist.itunesArtistId }, opts);
          return lookupTracks.results || [];
        } catch (error) {
          // If lookup fails, use search results
          return searchTracks;
        }
      }
    } catch (error) {
      // If search fails, try lookup as fallback
      try {
        const lookupTracks = await this.client.lookupArtistSongs({ id: artist.itunesArtistId }, opts);
        return lookupTracks.results || [];
      } catch (lookupError) {
        throw new Error(`Both search and lookup strategies failed for ${artist.displayName}`);
      }
    }
  }
}

/**
 * Strategy 2: Search by artist name/terms (fallback) with pagination
 */
export class ArtistNameSearchStrategy implements SearchStrategy {
  name = 'Artist Name Search with Pagination';
  
  constructor(private client: ITunesClient) {}
  
  async execute(artist: any, opts: PageOpts = {}): Promise<any[]> {
    try {
      let allTracks: ITunesTrack[] = [];

      for (const term of artist.searchTerms) {
        // Use the new pagination method to fetch all songs for this term
        const tracks = await this.client.searchAllByArtistName(term, opts);
        
        if (tracks && Array.isArray(tracks)) {
          allTracks = allTracks.concat(tracks);
        }
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
      description: strategy.name === 'Artist ID Search with Pagination' 
        ? 'Most reliable method using iTunes search with artist ID filtering and multi-country pagination'
        : 'Fallback method using artist name search terms with pagination'
    }));
  }
}
