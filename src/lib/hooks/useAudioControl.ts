'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Logger } from '@/lib/utils/logger';

export interface AudioControlReturn {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  setSource: (url: string) => void;
  /**
   * Force the displayed `currentTime` to a specific value without resuming playback.
   * Cancels the progress-polling interval so the interval cannot overwrite the value.
   * Use this when snapping the bar to 100% at the end of a timed clip.
   */
  snapTo: (time: number) => void;
}

/**
 * Manages the generic audio lifecycle:
 *   - HTMLAudioElement ref and event listeners (ended, play, pause, loadstart, canplay)
 *   - isPlaying / isLoading / currentTime state
 *   - 20fps progress-polling interval (only while playing)
 *   - Auto-pause when the page is hidden or the window loses focus
 *
 * Game-specific concerns (duration timeout, post-game autoplay) live in AudioPlayer.
 */
export function useAudioControl(onEnded?: () => void): AudioControlReturn {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unmuteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEndedRef = useRef(onEnded);

  // Keep onEndedRef current without it being a dep of other effects.
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Audio element event listeners.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      stopPolling();
      setIsPlaying(false);
      setCurrentTime(audio.duration || 30);
      onEndedRef.current?.();
    };
    // Reflect native play/pause events so external callers (e.g. autoplay polyfill,
    // the browser's media session) keep isPlaying in sync.
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      if (unmuteTimeoutRef.current !== null) {
        clearTimeout(unmuteTimeoutRef.current);
        unmuteTimeoutRef.current = null;
      }
    };
  }, [stopPolling]);

  // Smooth 20fps progress polling — only active while playing.
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
    }, 50);
    intervalRef.current = id;
    return () => {
      clearInterval(id);
      intervalRef.current = null;
    };
  }, [isPlaying]);

  // Pause when the page is hidden or the window loses focus (iOS backgrounding, etc.).
  useEffect(() => {
    const handleStop = () => {
      const audio = audioRef.current;
      if (!audio) return;
      stopPolling();
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onVisibility = () => { if (document.hidden) handleStop(); };
    const onPageHide = () => handleStop();
    const onBlur = () => handleStop();
    const onFreeze = () => handleStop();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('blur', onBlur);
    // 'freeze' is a Chrome Page Lifecycle API event; not in standard TS lib types.
    // Cast to EventTarget (which accepts any string event name) to avoid `as any`.
    (document as EventTarget).addEventListener('freeze', onFreeze);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('blur', onBlur);
      (document as EventTarget).removeEventListener('freeze', onFreeze);
    };
  }, [stopPolling]);

  const play = useCallback(async (): Promise<void> => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.muted = false;
      await audio.play();
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        Logger.error('Audio play error:', e);
      }
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    stopPolling();
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  }, [stopPolling]);

  const setSource = useCallback((url: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    stopPolling();
    if (unmuteTimeoutRef.current !== null) {
      clearTimeout(unmuteTimeoutRef.current);
      unmuteTimeoutRef.current = null;
    }
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    audio.preload = 'metadata';
    audio.muted = true;
    audio.src = url;
    audio.load();
    // Brief unmute delay so the browser can finish the synchronous load setup
    // before audio output is re-enabled, preventing a flash of audio on some browsers.
    unmuteTimeoutRef.current = setTimeout(() => {
      unmuteTimeoutRef.current = null;
      if (audioRef.current) audioRef.current.muted = false;
    }, 100);
  }, [stopPolling]);

  const snapTo = useCallback((time: number) => {
    stopPolling();
    setCurrentTime(time);
  }, [stopPolling]);

  return { audioRef, isPlaying, isLoading, currentTime, play, pause, stop, setSource, snapTo };
}
