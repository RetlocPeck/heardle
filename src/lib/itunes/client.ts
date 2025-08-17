import { ITunesResponse, ITunesLookupParams, ITunesSearchParams, PageOpts } from './types';
import { DebugHelper } from './debug';

export class ITunesClient {
  private readonly baseUrl = 'https://itunes.apple.com';
  private readonly lookupUrl = `${this.baseUrl}/lookup`;
  private readonly searchUrl = `${this.baseUrl}/search`;

  /**
   * Lookup songs by artist ID (single page only - no pagination support)
   */
  async lookupArtistSongs(params: ITunesLookupParams, opts: PageOpts = {}): Promise<ITunesResponse> {
    const { limit = 200, entity = 'song' } = opts;
    const url = new URL(this.lookupUrl);
    
    url.searchParams.set('id', params.id);
    url.searchParams.set('entity', entity);
    url.searchParams.set('limit', limit.toString());

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`iTunes lookup failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to lookup artist songs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for songs by artist name/terms with proper offset support
   */
  async searchByArtistName(params: ITunesSearchParams, opts: PageOpts = {}): Promise<ITunesResponse> {
    const { limit = 200, entity = 'song', media = 'music', offset = 0, country = 'US' } = opts;
    const url = new URL(this.searchUrl);
    
    url.searchParams.set('term', params.term);
    url.searchParams.set('entity', entity);
    url.searchParams.set('media', media);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('country', country);

    DebugHelper.info(`Searching: ${url.toString()}`);

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`iTunes search failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      DebugHelper.info(`Search results: ${data.resultCount} total, ${data.results?.length || 0} returned`);
      
      return data;
    } catch (error) {
      throw new Error(`Failed to search by artist name: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check pagination info for an artist
   */
  async checkPagination(artistId: string): Promise<{ totalAvailable: number }> {
    try {
      const response = await this.lookupArtistSongs({ id: artistId }, { limit: 1 });
      return { totalAvailable: response.resultCount || 0 };
    } catch (error) {
      throw new Error(`Failed to check pagination: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * NEW: paginate by artistId using search (filter on artistId) - with flexible filtering
   */
  async searchAllByArtistId(artistId: number, displayName: string, opts: PageOpts = {}): Promise<any[]> {
    const { limit = 200, countries = ['US','JP','KR','GB','CA'] } = opts;
    const all: any[] = [];
    const seen = new Set<number>();

    DebugHelper.pagination(`Starting multi-country search for artistId=${artistId}, displayName="${displayName}"`);

    for (const country of countries) {
      let offset = 0, page = 1;
      DebugHelper.pagination(`Searching in country: ${country}`);
      
      while (true) {
        DebugHelper.searchTermCountry(displayName, country, offset, limit);
        
        const data = await this.searchByArtistName(
          { term: displayName, entity: 'song', media: 'music', limit }, 
          { limit, offset, country }
        );
        
        // Use BOTH artistId filtering AND flexible name filtering to capture all relevant tracks
        let batch = (data.results ?? []).filter(
          (t: any) => {
            if (t?.wrapperType !== 'track' || t?.kind !== 'song' || !t?.previewUrl) return false;
            
            // Accept tracks that match either:
            // 1. Exact artistId match
            // 2. Artist name contains our search terms
            const exactIdMatch = t.artistId === artistId;
            const nameMatch = this.isArtistNameMatch(t.artistName, displayName);
            
            return exactIdMatch || nameMatch;
          }
        );
        
        DebugHelper.info(`Country ${country}, page ${page}: Found ${batch.length} tracks (${data.results?.length || 0} total results)`);
        DebugHelper.pageFetch(page, batch.length, offset, limit);
        
        // dedupe as we go
        let uniqueInBatch = 0;
        for (const t of batch) {
          if (t.trackId && !seen.has(t.trackId)) { 
            seen.add(t.trackId); 
            all.push(t);
            uniqueInBatch++;
          }
        }
        
        DebugHelper.batchProcess(batch.length, all.length, uniqueInBatch);
        
        if (batch.length < limit) {
          DebugHelper.info(`Country ${country}: Reached end (${batch.length} < ${limit})`);
          break; // done with this country
        }
        
        offset += limit; 
        page += 1;
        await new Promise(r => setTimeout(r, 100));
      }
      
      await new Promise(r => setTimeout(r, 150)); // delay between countries
    }

    DebugHelper.paginationComplete(all.length, countries.length, all.length);
    return all;
  }

  /**
   * Helper method to check if artist name matches our search terms
   */
  private isArtistNameMatch(trackArtistName: string, searchArtistName: string): boolean {
    if (!trackArtistName || !searchArtistName) return false;
    
    const trackName = trackArtistName.toLowerCase().trim();
    const searchName = searchArtistName.toLowerCase().trim();
    
    // Direct match
    if (trackName === searchName) return true;
    
    // Contains match (for collaborations like "Coldplay X BTS")
    if (trackName.includes(searchName)) return true;
    
    // For BTS specifically, also check Korean name
    if (searchName === 'bts') {
      return trackName.includes('bts') || trackName.includes('방탄소년단');
    }
    
    return false;
  }

  /**
   * Fetch all songs for an artist using search-based pagination
   */
  async fetchAllArtistSongs(artistId: string, opts: PageOpts = {}): Promise<any[]> {
    const idNum = Number(artistId);
    if (!Number.isFinite(idNum)) return [];
    
    // Always paginate via search (lookup is single page only)
    DebugHelper.pagination(`Starting full pagination via search for artistId=${idNum}`);
    return this.searchAllByArtistId(idNum, /* display name needed by caller */ (opts as any).__displayName ?? '', opts);
  }

  /**
   * Search for all songs by artist name using pagination
   */
  async searchAllByArtistName(term: string, opts: PageOpts = {}): Promise<any[]> {
    const { limit = 200, country = 'US' } = opts;
    let allTracks: any[] = [];
    let offset = 0;
    let hasMore = true;
    let consecutiveEmptyPages = 0;
    const maxEmptyPages = 3; // Stop after 3 consecutive empty pages
    let page = 1;

    DebugHelper.pagination(`Starting search pagination for term "${term}" in country ${country}`);

    while (hasMore && consecutiveEmptyPages < maxEmptyPages) {
      try {
        const response = await this.searchByArtistName(
          { term, limit },
          { ...opts, limit, offset, country }
        );

        if (!response.results || !Array.isArray(response.results)) {
          DebugHelper.pageFetch(page, 0, offset, limit);
          consecutiveEmptyPages++;
          offset += limit;
          page++;
          continue;
        }

        const tracks = response.results.filter(track => 
          track.wrapperType === 'track' && 
          track.kind === 'song' &&
          track.previewUrl
        );

        if (tracks.length === 0) {
          consecutiveEmptyPages++;
          DebugHelper.pageFetch(page, 0, offset, limit);
        } else {
          consecutiveEmptyPages = 0;
          allTracks = allTracks.concat(tracks);
          DebugHelper.pageFetch(page, tracks.length, offset, limit);
        }

        // Check if we should continue
        if (tracks.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
          page++;
        }

        // Add a small delay between requests to be respectful
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        DebugHelper.warn(`Failed to search page ${page} at offset ${offset}:`, error);
        consecutiveEmptyPages++;
        offset += limit;
        page++;
      }
    }

    DebugHelper.paginationComplete(allTracks.length, page, allTracks.length);
    return allTracks;
  }
}
