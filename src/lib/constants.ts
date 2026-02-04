/**
 * Game constants - centralized magic values for the Heardle game
 */

// =============================================================================
// GAME SETTINGS
// =============================================================================

// Game state markers
export const SKIP_MARKER = '(Skipped)';

// Duration progression in milliseconds: 1s, 2s, 4s, 7s, 10s, 15s
export const DURATION_PROGRESSION_MS = [1000, 2000, 4000, 7000, 10000, 15000] as const;

// Duration map for share functionality (ms to seconds)
export const DURATION_MAP: Record<number, 1 | 2 | 4 | 7 | 10 | 15> = {
  1000: 1,
  2000: 2,
  4000: 4,
  7000: 7,
  10000: 10,
  15000: 15,
};

// Game settings
export const MAX_TRIES = 6;
export const INITIAL_DURATION_MS = 1000;
export const MAX_DURATION_MS = 15000;
export const FULL_PREVIEW_DURATION_SECONDS = 30;

// =============================================================================
// TIMING CONSTANTS
// =============================================================================

// Custom events
export const DAILY_CHALLENGE_UPDATED_EVENT = 'daily-challenge-updated';

// Intervals
export const ROLLOVER_CHECK_INTERVAL_MS = 30000;
export const ANIMATION_FRAME_INTERVAL_MS = 16; // 60fps

// Delays
export const AUDIO_UNMUTE_DELAY_MS = 100;
export const AUTOPLAY_UNMUTE_DELAY_MS = 150;
export const DROPDOWN_HIDE_DELAY_MS = 150;
export const MODAL_FOCUS_DELAY_MS = 100;

// =============================================================================
// UI CONSTANTS
// =============================================================================

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  MOBILE_MAX: 1023.98, // For media queries targeting mobile
} as const;

// Legacy exports for backward compatibility
export const BREAKPOINT_SM = BREAKPOINTS.SM;
export const BREAKPOINT_LG = BREAKPOINTS.LG;

// Animation delays
export const ANIMATION_DELAYS = {
  CARD_STAGGER_MS: 200,
  IMAGE_STAGGER_MS: 100,
  FADE_IN_MS: 300,
} as const;

// =============================================================================
// API CONSTANTS
// =============================================================================

export const API_CONFIG = {
  APPLE_MUSIC_BASE_URL: 'https://api.music.apple.com/v1',
  PRIMARY_STOREFRONT: 'us',
  STOREFRONTS: ['us', 'jp', 'kr'] as const,
  ALBUM_LIMIT: 100,
  SONG_LIMIT: 20,
} as const;

export const API_DELAYS = {
  RATE_LIMIT_MS: 30,
  PAGINATION_MS: 100,
  BETWEEN_ARTISTS_MS: 500,
  BETWEEN_REQUESTS_MS: 50,
} as const;

// =============================================================================
// SCORING CONSTANTS
// =============================================================================

export const TIME_BONUS_THRESHOLDS = {
  LIGHTNING_SEC: 30,
  VERY_FAST_SEC: 60,
  FAST_SEC: 120,
} as const;

export const SONG_SCORING = {
  BASE_SCORE: 100,
  PENALTIES: {
    SOUNDTRACK: -50,
    FEAT: -30,
    REMIX: -40,
    VER: -20,
    MIX: -25,
    LIVE: -35,
    COVER: -45,
    VERY_LONG_NAME: -10,
    PARENS: -5,
  },
  BONUSES: {
    HAS_PREVIEW: 50,
    CLEAN_VERSION: 25,
    SHORT_NAME: 5,
  },
} as const;

// =============================================================================
// STORAGE KEYS
// =============================================================================

export const STORAGE_KEYS = {
  DAILY_CHALLENGES: 'kpop-heardle-daily-challenges',
  PRACTICE_HISTORY: 'twice-heardle-practice-history',
  STATISTICS: 'twice-heardle-stats',
} as const;

// =============================================================================
// SITE CONFIG
// =============================================================================

export const SITE_CONFIG = {
  URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://heardle.live',
  NAME: 'K-Pop Heardle',
  TWITTER_HANDLE: '@kpopheardle',
} as const;
