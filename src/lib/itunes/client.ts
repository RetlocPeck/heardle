import { ITunesResponse, ITunesLookupParams, ITunesSearchParams, PageOpts } from './types';

export class ITunesClient {
  private readonly baseUrl = 'https://itunes.apple.com';
  private readonly lookupUrl = `${this.baseUrl}/lookup`;
  private readonly searchUrl = `${this.baseUrl}/search`;

  /**
   * Lookup songs by artist ID
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
   * Search for songs by artist name/terms
   */
  async searchByArtistName(params: ITunesSearchParams, opts: PageOpts = {}): Promise<ITunesResponse> {
    const { limit = 200, entity = 'song', media = 'music' } = opts;
    const url = new URL(this.searchUrl);
    
    url.searchParams.set('term', params.term);
    url.searchParams.set('entity', entity);
    url.searchParams.set('media', media);
    url.searchParams.set('limit', limit.toString());

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`iTunes search failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
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
}
