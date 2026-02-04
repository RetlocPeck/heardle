import { ArtistConfig, getArtistById, getAllArtists, ARTISTS } from '@/config/artists';

export class ConfigService {
  private static instance: ConfigService;

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Get artist configuration by ID
   */
  getArtist(id: string): ArtistConfig | null {
    const artist = getArtistById(id);
    if (!artist) {
      console.warn(`Artist with ID '${id}' not found`);
      return null;
    }
    return artist;
  }

  /**
   * Get all available artists
   */
  getAllArtists(): ArtistConfig[] {
    return getAllArtists();
  }

  /**
   * Get all artist IDs
   */
  getAllArtistIds(): string[] {
    return ARTISTS.map(a => a.id);
  }

  /**
   * Check if artist ID is valid
   */
  isValidArtist(id: string): boolean {
    return getArtistById(id) !== null;
  }

  /**
   * Get artist theme configuration
   */
  getArtistTheme(id: string) {
    const artist = this.getArtist(id);
    return artist?.theme || null;
  }

  /**
   * Get search terms for Apple Music API
   */
  getSearchTerms(id: string): string[] {
    const artist = this.getArtist(id);
    return artist?.searchTerms || [];
  }

  /**
   * Generate CSS variables for artist theme
   */
  generateThemeVariables(id: string): Record<string, string> {
    const theme = this.getArtistTheme(id);
    if (!theme) return {};

    return {
      '--artist-primary-color': theme.primaryColor,
      '--artist-gradient-from': theme.gradientFrom,
      '--artist-gradient-to': theme.gradientTo,
      '--artist-accent-color': theme.accentColor,
      '--artist-spinner-color': theme.spinnerColor,
      '--artist-border-color': theme.borderColor,
      '--artist-bg-color': theme.bgColor,
      '--artist-text-color': theme.textColor,
    };
  }

  /**
   * Get artist display name with fallback
   */
  getDisplayName(id: string): string {
    const artist = this.getArtist(id);
    return artist?.displayName || artist?.name || id.toUpperCase();
  }

  /**
   * Search artists by name or description
   */
  searchArtists(query: string): ArtistConfig[] {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return this.getAllArtists();

    return ARTISTS.filter(artist =>
      artist.name.toLowerCase().includes(searchTerm) ||
      artist.displayName.toLowerCase().includes(searchTerm) ||
      artist.searchTerms.some(term => term.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get artist statistics (deprecated - metadata removed)
   */
  getArtistStats() {
    return null;
  }

  /**
   * Validate artist configuration at runtime
   */
  validateArtist(id: string): { isValid: boolean; errors: string[] } {
    const artist = this.getArtist(id);
    if (!artist) {
      return {
        isValid: false,
        errors: [`Artist '${id}' not found`]
      };
    }

    // Basic validation checks
    const errors: string[] = [];

    if (!artist.searchTerms || artist.searchTerms.length === 0) {
      errors.push('Search terms are missing');
    }

    if (!artist.theme) {
      errors.push('Theme is missing');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
