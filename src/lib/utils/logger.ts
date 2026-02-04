/**
 * Centralized logging utility with environment-based levels.
 * In production, only warnings and errors are logged.
 * In development, all levels are logged.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const getCurrentLevel = (): number => {
  // In production, only show warnings and errors
  if (process.env.NODE_ENV === 'production') {
    return LOG_LEVELS.warn;
  }
  return LOG_LEVELS.debug;
};

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= getCurrentLevel();
};

const formatMessage = (level: LogLevel, message: string): string => {
  const icons: Record<LogLevel, string> = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  };
  return `${icons[level]} ${message}`;
};

export const Logger = {
  /**
   * Debug level - only shown in development
   */
  debug: (message: string, ...args: unknown[]): void => {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', message), ...args);
    }
  },

  /**
   * Info level - only shown in development
   */
  info: (message: string, ...args: unknown[]): void => {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message), ...args);
    }
  },

  /**
   * Warning level - shown in all environments
   */
  warn: (message: string, ...args: unknown[]): void => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message), ...args);
    }
  },

  /**
   * Error level - shown in all environments
   */
  error: (message: string, ...args: unknown[]): void => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message), ...args);
    }
  },

  /**
   * Log API request (debug level)
   */
  apiRequest: (method: string, url: string): void => {
    Logger.debug(`${method} ${url}`);
  },

  /**
   * Log API response (debug level)
   */
  apiResponse: (status: number, url: string, durationMs?: number): void => {
    const duration = durationMs ? ` (${durationMs}ms)` : '';
    if (status >= 400) {
      Logger.warn(`API ${status} ${url}${duration}`);
    } else {
      Logger.debug(`API ${status} ${url}${duration}`);
    }
  },

  /**
   * Log with custom prefix
   */
  withPrefix: (prefix: string) => ({
    debug: (message: string, ...args: unknown[]) => Logger.debug(`[${prefix}] ${message}`, ...args),
    info: (message: string, ...args: unknown[]) => Logger.info(`[${prefix}] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => Logger.warn(`[${prefix}] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) => Logger.error(`[${prefix}] ${message}`, ...args),
  }),
};

export default Logger;
