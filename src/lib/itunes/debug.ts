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
   * Check if debug logging is enabled
   */
  static isEnabled(): boolean {
    return this.isDebug;
  }
}
