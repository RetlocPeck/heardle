export interface FilterConfig {
  unwantedPatterns: string[];
  languagePatterns: string[];
  checkParentheses: boolean;
  checkBrackets: boolean;
  checkAlbumNames: boolean;
}

export class TrackFilterService {
  private static instance: TrackFilterService;
  private filterConfig: FilterConfig;

  static getInstance(): TrackFilterService {
    if (!TrackFilterService.instance) {
      TrackFilterService.instance = new TrackFilterService();
    }
    return TrackFilterService.instance;
  }

  constructor() {
    this.filterConfig = {
      unwantedPatterns: ['remix', 'version', 'ver.', 'edit', 'mixed', 'mix'],
      languagePatterns: ['eng', 'english', 'kor', 'korean', 'jap', 'japanese'],
      checkParentheses: true,
      checkBrackets: true,
      checkAlbumNames: true
    };
  }

  // Update filter configuration
  updateFilterConfig(config: Partial<FilterConfig>): void {
    this.filterConfig = { ...this.filterConfig, ...config };
  }

  // Main filtering method
  filterTracks(tracks: any[], artistId: string): any[] {
    return tracks.filter(track => this.isValidTrack(track));
  }

  private isValidTrack(track: any): boolean {
    if (!track.trackName || !track.previewUrl) {
      return false;
    }

    const trackName = track.trackName.toLowerCase();
    const collectionName = track.collectionName?.toLowerCase() || '';

    return (
      !this.hasUnwantedPatterns(trackName) &&
      !this.hasInstrumentalInParentheses(trackName) &&
      !this.hasRemixInAlbumParentheses(collectionName) &&
      !this.hasLanguageIndicators(trackName)
    );
  }

  private hasUnwantedPatterns(trackName: string): boolean {
    return this.filterConfig.unwantedPatterns.some(pattern => {
      if (this.filterConfig.checkParentheses) {
        const inParentheses = new RegExp(`\\([^)]*${pattern.replace('.', '\\.')}[^)]*\\)`, 'i');
        if (inParentheses.test(trackName)) return true;
      }
      
      if (this.filterConfig.checkBrackets) {
        const inBrackets = new RegExp(`\\[[^\\]]*${pattern.replace('.', '\\.')}[^\\]]*\\]`, 'i');
        if (inBrackets.test(trackName)) return true;
      }
      
      return false;
    });
  }

  private hasInstrumentalInParentheses(trackName: string): boolean {
    if (!this.filterConfig.checkParentheses) return false;
    return /\([^)]*instrumental[^)]*\)/i.test(trackName);
  }

  private hasRemixInAlbumParentheses(collectionName: string): boolean {
    if (!this.filterConfig.checkAlbumNames) return false;
    return /\([^)]*remix[^)]*\)/i.test(collectionName);
  }

  private hasLanguageIndicators(trackName: string): boolean {
    return this.filterConfig.languagePatterns.some(lang => {
      if (this.filterConfig.checkParentheses) {
        const inParentheses = new RegExp(`\\([^)]*${lang}[^)]*\\)`, 'i');
        if (inParentheses.test(trackName)) return true;
      }
      
      if (this.filterConfig.checkBrackets) {
        const inBrackets = new RegExp(`\\[[^\\]]*${lang}[^\\]]*\\]`, 'i');
        if (inBrackets.test(trackName)) return true;
      }
      
      return false;
    });
  }

  // Get current filter configuration
  getFilterConfig(): FilterConfig {
    return { ...this.filterConfig };
  }

  // Add new unwanted patterns
  addUnwantedPattern(pattern: string): void {
    if (!this.filterConfig.unwantedPatterns.includes(pattern)) {
      this.filterConfig.unwantedPatterns.push(pattern);
    }
  }

  // Add new language patterns
  addLanguagePattern(pattern: string): void {
    if (!this.filterConfig.languagePatterns.includes(pattern)) {
      this.filterConfig.languagePatterns.push(pattern);
    }
  }

  // Remove patterns
  removeUnwantedPattern(pattern: string): void {
    this.filterConfig.unwantedPatterns = this.filterConfig.unwantedPatterns.filter(p => p !== pattern);
  }

  removeLanguagePattern(pattern: string): void {
    this.filterConfig.languagePatterns = this.filterConfig.languagePatterns.filter(p => p !== pattern);
  }
}
