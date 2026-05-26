'use client';
import { useState, useRef, useEffect } from 'react';
import { buildShareText, ShareGameState } from '@/lib/utils/share';
import { Logger } from '@/lib/utils/logger';

type CopyState = 'idle' | 'copied' | 'error';

export default function ShareButton({ state, className }: { state: ShareGameState; className?: string }) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear reset timer on unmount.
  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const scheduleReset = () => {
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = setTimeout(() => {
      resetTimerRef.current = null;
      setCopyState('idle');
    }, 2000);
  };

  const onShare = async () => {
    const text = buildShareText(state);
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
      scheduleReset();
    } catch (error) {
      Logger.error('Clipboard copy failed:', error);
      setCopyState('error');
      scheduleReset();
    }
  };

  return (
    <button
      onClick={onShare}
      className={className ?? 'mt-3 rounded-xl bg-green-500 text-white px-4 py-2 hover:opacity-90 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25'}
      aria-label="Share your result"
      title="Share your result"
      disabled={copyState !== 'idle'}
    >
      {copyState === 'copied' ? (
        <span className="flex items-center justify-center space-x-2">
          <span>📋</span>
          <span>Copied to clipboard!</span>
        </span>
      ) : copyState === 'error' ? (
        <span className="flex items-center justify-center space-x-2">
          <span>❌</span>
          <span>Copy failed</span>
        </span>
      ) : (
        <span className="flex items-center justify-center space-x-2">
          <span>🔁</span>
          <span>Share Result</span>
        </span>
      )}
    </button>
  );
}
