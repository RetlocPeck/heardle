/**
 * Typed helpers for custom window events.
 *
 * Using these instead of raw addEventListener + CustomEvent casts:
 * - Eliminates `as EventListener` casts at every call site
 * - Keeps event name strings in one place (constants.ts)
 * - Makes event detail shapes explicit and type-checked
 */

import {
  DAILY_CHALLENGE_UPDATED_EVENT,
  DAILY_ROLLOVER_DETECTED_EVENT,
  STATISTICS_UPDATED_EVENT,
} from '@/lib/constants';
import type { GlobalStats } from '@/lib/services/statisticsStorage';

// ── Daily challenge updated ───────────────────────────────────────────────────

export interface DailyChallengeUpdatedDetail {
  artistId?: string;
  date?: string;
  completed?: boolean;
  isNewDaily?: boolean;
}

export function emitDailyChallengeUpdated(detail: DailyChallengeUpdatedDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DAILY_CHALLENGE_UPDATED_EVENT, { detail }));
}

export function onDailyChallengeUpdated(
  handler: (detail: DailyChallengeUpdatedDetail) => void
): () => void {
  const listener = (event: Event) =>
    handler((event as CustomEvent<DailyChallengeUpdatedDetail>).detail ?? {});
  window.addEventListener(DAILY_CHALLENGE_UPDATED_EVENT, listener);
  return () => window.removeEventListener(DAILY_CHALLENGE_UPDATED_EVENT, listener);
}

// ── Daily rollover detected ───────────────────────────────────────────────────

export interface DailyRolloverDetail {
  previousPuzzleNumber: number;
  currentPuzzleNumber: number;
  date: string;
  artistId: string | null;
}

export function emitDailyRolloverDetected(detail: DailyRolloverDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DAILY_ROLLOVER_DETECTED_EVENT, { detail }));
}

export function onDailyRolloverDetected(
  handler: (detail: DailyRolloverDetail) => void
): () => void {
  const listener = (event: Event) =>
    handler((event as CustomEvent<DailyRolloverDetail>).detail);
  window.addEventListener(DAILY_ROLLOVER_DETECTED_EVENT, listener);
  return () => window.removeEventListener(DAILY_ROLLOVER_DETECTED_EVENT, listener);
}

// ── Statistics updated ────────────────────────────────────────────────────────

export function emitStatisticsUpdated(detail: GlobalStats): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STATISTICS_UPDATED_EVENT, { detail }));
}

export function onStatisticsUpdated(
  handler: (detail: GlobalStats) => void
): () => void {
  const listener = (event: Event) =>
    handler((event as CustomEvent<GlobalStats>).detail);
  window.addEventListener(STATISTICS_UPDATED_EVENT, listener);
  return () => window.removeEventListener(STATISTICS_UPDATED_EVENT, listener);
}
