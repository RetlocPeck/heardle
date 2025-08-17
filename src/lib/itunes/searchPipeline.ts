import { SearchStrategy, PageOpts } from './types';
import { ITunesClient } from './client';
import { ITunesTrack } from '@/types/song';
import { DebugHelper } from './debug';

/**
 * Strategy 1: Search by artist ID with display name (most reliable) with pagination
 */
export class ArtistIdLookupStrategy implements SearchStrategy {
  name = 'Artist ID Search with Pagination';
  
  constructor(private client: ITunesClient) {}
  
  async execute(artist: any, opts: PageOpts = {}): Promise<any[]> {
    try {
      const { countries = ['US', 'JP', 'KR', 'GB', 'CA'] } = opts;
      const allTracks: any[] = [];
      const seenTrackIds = new Set<number>();
      
      DebugHelper.strategy(this.name, `Starting execution for ${artist.displayName} with ${artist.searchTerms.length} search terms`);
      
      // Try each search term with each country for maximum coverage
      for (const searchTerm of artist.searchTerms) {
        DebugHelper.strategy(this.name, `Processing search term: "${searchTerm}"`);
        
        for (const country of countries) {
          DebugHelper.strategy(this.name, `Searching in country: ${country} for term: "${searchTerm}"`);
          
          try {
            // Use search-based pagination for this term/country combination
            const searchTracks = await this.client.searchAllByArtistId(
              artist.itunesArtistId, 
              searchTerm, 
              { ...opts, countries: [country] }
            );
            
            // Filter by exact artistId match and deduplicate
            for (const track of searchTracks) {
              if (track.artistId === Number(artist.itunesArtistId) && 
                  track.trackId && 
                  !seenTrackIds.has(track.trackId)) {
                seenTrackIds.add(track.trackId);
                allTracks.push(track);
              }
            }
            
            DebugHelper.strategy(this.name, `Country ${country}, term "${searchTerm}": Found ${searchTracks.length} tracks, ${allTracks.length} unique total`);
            
          } catch (error) {
            DebugHelper.warn(`Failed to search for term "${searchTerm}" in country ${country}:`, error);
            continue;
          }
        }
      }
      
      DebugHelper.strategy(this.name, `Strategy complete: ${allTracks.length} unique tracks from all terms and countries`);
      return allTracks;
      
    } catch (error) {
      DebugHelper.error(`ArtistIdLookupStrategy failed:`, error);
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
   * Execute search using multiple strategies and aggregate results
   */
  async execute(artist: any, opts: PageOpts = {}): Promise<any[]> {
    const allResults: any[] = [];
    const seenTrackIds = new Set<number>();
    
    DebugHelper.info(`Executing ${this.strategies.length} search strategies for ${artist.displayName}`);
    
    for (const strategy of this.strategies) {
      try {
        DebugHelper.strategy(strategy.name, `Starting execution for ${artist.displayName}`);
        const results = await strategy.execute(artist, opts);
        
        if (results && Array.isArray(results) && results.length > 0) {
          DebugHelper.strategy(strategy.name, `Found ${results.length} tracks`);
          
          // Deduplicate by trackId as we aggregate
          for (const track of results) {
            if (track.trackId && !seenTrackIds.has(track.trackId)) {
              seenTrackIds.add(track.trackId);
              allResults.push(track);
            }
          }
          
          DebugHelper.strategy(strategy.name, `After deduplication: ${allResults.length} unique tracks`);
        } else {
          DebugHelper.strategy(strategy.name, `No tracks found`);
        }
      } catch (error) {
        DebugHelper.warn(`Strategy ${strategy.name} failed:`, error);
        // Continue to next strategy
        continue;
      }
    }
    
    DebugHelper.success(`Pipeline complete: ${allResults.length} unique tracks from all strategies`);
    return allResults;
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
