/**
 * Game constants - centralized magic values for the Heardle game
 */

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

// Custom events
export const DAILY_CHALLENGE_UPDATED_EVENT = 'daily-challenge-updated';

// Timing constants
export const ROLLOVER_CHECK_INTERVAL_MS = 30000;
export const ANIMATION_FRAME_INTERVAL_MS = 16; // 60fps
export const AUDIO_UNMUTE_DELAY_MS = 100;
export const AUTOPLAY_UNMUTE_DELAY_MS = 150;
export const DROPDOWN_HIDE_DELAY_MS = 150;
export const MODAL_FOCUS_DELAY_MS = 100;

// Breakpoints (matching Tailwind)
export const BREAKPOINT_SM = 640;
export const BREAKPOINT_LG = 1024;
