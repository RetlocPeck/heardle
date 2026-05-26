/**
 * Global hook for detecting daily challenge rollover
 * This runs independently and notifies all components when a new daily becomes available
 */

import { useEffect, useRef } from 'react';
import { Logger } from '@/lib/utils/logger';
import { getLocalPuzzleNumber, getTodayString } from '@/lib/utils/dateUtils';
import DailyChallengeStorage from '@/lib/services/dailyChallengeStorage';
import { DAILY_CHALLENGE_UPDATED_EVENT, ROLLOVER_CHECK_INTERVAL_MS } from '@/lib/constants';

interface RolloverDetectionOptions {
  artistId?: string;
  checkInterval?: number; // in milliseconds, default 30000 (30 seconds)
  enabled?: boolean;
}

export function useDailyRolloverDetection(options: RolloverDetectionOptions = {}) {
  const {
    artistId,
    checkInterval = ROLLOVER_CHECK_INTERVAL_MS,
    enabled = true
  } = options;

  const lastPuzzleNumberRef = useRef<number>(getLocalPuzzleNumber());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const checkForRollover = () => {
      const currentPuzzleNumber = getLocalPuzzleNumber();
      const lastPuzzleNumber = lastPuzzleNumberRef.current;

      if (currentPuzzleNumber !== lastPuzzleNumber) {
        Logger.debug(`Global rollover detected: ${lastPuzzleNumber} → ${currentPuzzleNumber}`);
        
        // Update our reference
        lastPuzzleNumberRef.current = currentPuzzleNumber;

        // If we have a specific artist, clear their challenge
        if (artistId) {
          const storage = DailyChallengeStorage.getInstance();
          storage.clearDailyChallenge(artistId);
        }

        // Dispatch global event to notify all components
        const rolloverEvent = new CustomEvent('daily-rollover-detected', {
          detail: {
            previousPuzzleNumber: lastPuzzleNumber,
            currentPuzzleNumber: currentPuzzleNumber,
            date: getTodayString(),
            artistId: artistId || null
          }
        });
        window.dispatchEvent(rolloverEvent);

        // Also dispatch the challenge updated event for the specific artist
        if (artistId) {
          const challengeEvent = new CustomEvent(DAILY_CHALLENGE_UPDATED_EVENT, {
            detail: {
              artistId,
              date: getTodayString(),
              completed: false,
              isNewDaily: true
            }
          });
          window.dispatchEvent(challengeEvent);
        }
      }
    };

    // Initial check
    checkForRollover();

    // Set up interval checking
    intervalRef.current = setInterval(checkForRollover, checkInterval);

    // Check when tab becomes visible (user returns from another tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForRollover();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check when window gains focus (user clicks on window)
    const handleFocus = () => {
      checkForRollover();
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [artistId, checkInterval, enabled]);

  return {
    currentPuzzleNumber: lastPuzzleNumberRef.current
  };
}

/**
 * Hook specifically for challenge card components to listen for new dailies
 */
export function useNewDailyChallengeListener(artistId: string, onNewDaily?: () => void) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleNewDaily = (event: CustomEvent) => {
      const detail = event.detail;

      if (event.type === DAILY_CHALLENGE_UPDATED_EVENT) {
        // Only respond to rollover events, not regular completion events.
        // Completion events dispatched by the page on game-over do NOT have
        // isNewDaily:true — responding to those causes an infinite reload loop.
        if (detail?.isNewDaily && detail?.artistId === artistId) {
          onNewDaily?.();
        }
        return;
      }

      // 'daily-rollover-detected' — always a genuine rollover
      if (detail?.artistId === artistId || (!detail?.artistId && detail?.currentPuzzleNumber)) {
        onNewDaily?.();
      }
    };

    // Listen for both specific challenge updates and global rollover events
    window.addEventListener(DAILY_CHALLENGE_UPDATED_EVENT, handleNewDaily as EventListener);
    window.addEventListener('daily-rollover-detected', handleNewDaily as EventListener);

    return () => {
      window.removeEventListener(DAILY_CHALLENGE_UPDATED_EVENT, handleNewDaily as EventListener);
      window.removeEventListener('daily-rollover-detected', handleNewDaily as EventListener);
    };
  }, [artistId, onNewDaily]);
}
