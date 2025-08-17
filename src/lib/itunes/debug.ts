/**
 * Debug helper for iTunes service
 * Encapsulates logging to avoid noisy console logs in production
 */
export class DebugHelper {
  private static isDevelopment = process.env.NODE_ENV === 'development';
  private static isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';

  /**
   * Log info messages (only in development/debug mode)
   */
  static info(message: string, ...args: any[]): void {
    if (this.isDebug) {
      console.log(`🎵 iTunes: ${message}`, ...args);
    }
  }

  /**
   * Log warning messages (only in development/debug mode)
   */
  static warn(message: string, ...args: any[]): void {
    if (this.isDebug) {
      console.warn(`⚠️ iTunes: ${message}`, ...args);
    }
  }

  /**
   * Log error messages (always logged)
   */
  static error(message: string, ...args: any[]): void {
    console.error(`❌ iTunes: ${message}`, ...args);
  }

  /**
   * Log success messages (only in development/debug mode)
   */
  static success(message: string, ...args: any[]): void {
    if (this.isDebug) {
      console.log(`✅ iTunes: ${message}`, ...args);
    }
  }

  /**
   * Log search strategy messages (only in development/debug mode)
   */
  static strategy(strategyName: string, message: string, ...args: any[]): void {
    if (this.isDebug) {
      console.log(`📡 ${strategyName}: ${message}`, ...args);
    }
  }

  /**
   * Log filtering messages (only in development/debug mode)
   */
  static filter(message: string, ...args: any[]): void {
    if (this.isDebug) {
      console.log(`🔍 Filter: ${message}`, ...args);
    }
  }

  /**
   * Log cache messages (only in development/debug mode)
   */
  static cache(message: string, ...args: any[]): void {
    if (this.isDebug) {
      console.log(`💾 Cache: ${message}`, ...args);
    }
  }

  /**
   * Log pagination messages (only in development/debug mode)
   */
  static pagination(message: string, ...args: any[]): void {
    if (this.isDebug) {
      console.log(`📊 Pagination: ${message}`, ...args);
    }
  }

  /**
   * Log pagination progress (only in development/debug mode)
   */
  static paginationProgress(current: number, total: number, page: number, totalPages: number): void {
    if (this.isDebug) {
      const percentage = total > 0 ? ((current / total) * 100).toFixed(1) : '0.0';
      console.log(`📊 Pagination Progress: ${current}/${total} (${percentage}%) - Page ${page}/${totalPages}`);
    }
  }

  /**
   * Log page fetch details (only in development/debug mode)
   */
  static pageFetch(page: number, tracksFound: number, offset: number, limit: number): void {
    if (this.isDebug) {
      console.log(`📄 Page ${page}: Found ${tracksFound} tracks (offset: ${offset}, limit: ${limit})`);
    }
  }

  /**
   * Log pagination completion (only in development/debug mode)
   */
  static paginationComplete(totalTracks: number, totalPages: number, totalAvailable: number): void {
    if (this.isDebug) {
      const coverage = totalAvailable > 0 ? ((totalTracks / totalAvailable) * 100).toFixed(1) : '0.0';
      console.log(`🎯 Pagination Complete: ${totalTracks} tracks from ${totalPages} pages (${coverage}% coverage)`);
    }
  }

  /**
   * Log search term and country combination (only in development/debug mode)
   */
  static searchTermCountry(term: string, country: string, offset: number, limit: number): void {
    if (this.isDebug) {
      console.log(`🔍 Search: "${term}" in ${country} (offset: ${offset}, limit: ${limit})`);
    }
  }

  /**
   * Log batch processing details (only in development/debug mode)
   */
  static batchProcess(batchSize: number, totalFound: number, uniqueCount: number): void {
    if (this.isDebug) {
      console.log(`📦 Batch: ${batchSize} tracks found, ${uniqueCount} unique (${totalFound} total so far)`);
    }
  }

  /**
   * Check if debug logging is enabled
   */
  static isEnabled(): boolean {
    return this.isDebug;
  }
}
