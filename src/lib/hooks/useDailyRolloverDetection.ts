/**
 * Global hook for detecting daily challenge rollover.
 * Runs independently and notifies all components when a new daily becomes available.
 */

import { useEffect, useRef, useCallback } from 'react';
import { Logger } from '@/lib/utils/logger';
import { getLocalPuzzleNumber, getTodayString } from '@/lib/utils/dateUtils';
import DailyChallengeStorage from '@/lib/services/dailyChallengeStorage';
import { ROLLOVER_CHECK_INTERVAL_MS } from '@/lib/constants';
import {
  emitDailyRolloverDetected,
  emitDailyChallengeUpdated,
  onDailyChallengeUpdated,
  onDailyRolloverDetected,
  type DailyChallengeUpdatedDetail,
  type DailyRolloverDetail,
} from '@/lib/utils/customEvents';

interface RolloverDetectionOptions {
  artistId?: string;
  checkInterval?: number;
  enabled?: boolean;
}

export function useDailyRolloverDetection(options: RolloverDetectionOptions = {}) {
  const {
    artistId,
    checkInterval = ROLLOVER_CHECK_INTERVAL_MS,
    enabled = true,
  } = options;

  const lastPuzzleNumberRef = useRef<number>(getLocalPuzzleNumber());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const checkForRollover = () => {
      const currentPuzzleNumber = getLocalPuzzleNumber();
      const lastPuzzleNumber = lastPuzzleNumberRef.current;

      if (currentPuzzleNumber !== lastPuzzleNumber) {
        Logger.debug(`Global rollover detected: ${lastPuzzleNumber} → ${currentPuzzleNumber}`);
        lastPuzzleNumberRef.current = currentPuzzleNumber;

        if (artistId) {
          DailyChallengeStorage.getInstance().clearDailyChallenge(artistId);
        }

        emitDailyRolloverDetected({
          previousPuzzleNumber: lastPuzzleNumber,
          currentPuzzleNumber,
          date: getTodayString(),
          artistId: artistId ?? null,
        });

        if (artistId) {
          emitDailyChallengeUpdated({
            artistId,
            date: getTodayString(),
            completed: false,
            isNewDaily: true,
          });
        }
      }
    };

    checkForRollover();
    intervalRef.current = setInterval(checkForRollover, checkInterval);

    const handleVisibilityChange = () => { if (!document.hidden) checkForRollover(); };
    const handleFocus = () => checkForRollover();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [artistId, checkInterval, enabled]);

  return { currentPuzzleNumber: lastPuzzleNumberRef.current };
}

/**
 * Hook for listening to new daily challenges.
 *
 * The `onNewDaily` callback is stored in a ref so inline arrow functions from
 * the parent do not cause listeners to tear down and reattach on every render.
 */
export function useNewDailyChallengeListener(artistId: string, onNewDaily?: () => void) {
  const onNewDailyRef = useRef(onNewDaily);
  useEffect(() => { onNewDailyRef.current = onNewDaily; }, [onNewDaily]);

  const handleChallengeUpdated = useCallback((detail: DailyChallengeUpdatedDetail) => {
    // Only respond to rollover events (isNewDaily:true), not game-completion events.
    // Responding to completion events causes an infinite reload loop.
    if (detail?.isNewDaily && detail?.artistId === artistId) {
      onNewDailyRef.current?.();
    }
  }, [artistId]);

  const handleRolloverDetected = useCallback((detail: DailyRolloverDetail) => {
    if (detail?.artistId === artistId || (!detail?.artistId && detail?.currentPuzzleNumber)) {
      onNewDailyRef.current?.();
    }
  }, [artistId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const offUpdated = onDailyChallengeUpdated(handleChallengeUpdated);
    const offRollover = onDailyRolloverDetected(handleRolloverDetected);
    return () => { offUpdated(); offRollover(); };
  }, [handleChallengeUpdated, handleRolloverDetected]);
}
