'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { ANIMATION_FRAME_INTERVAL_MS } from '@/lib/constants';

interface UseAudioControlOptions {
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: Error) => void;
}

interface UseAudioControlReturn {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  setSource: (src: string) => void;
}

/**
 * Hook for managing audio playback with proper cleanup
 */
export function useAudioControl(options: UseAudioControlOptions = {}): UseAudioControlReturn {
  const { onPlay, onPause, onEnded, onError } = options;
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Smooth time tracking using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      const audio = audioRef.current;
      if (!audio || !animationFrameRef.current) return;

      if (timestamp - lastUpdateTimeRef.current >= ANIMATION_FRAME_INTERVAL_MS) {
        setCurrentTime(audio.currentTime);
        lastUpdateTimeRef.current = timestamp;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = (_e: Event) => {
      const error = new Error('Audio playback error');
      onError?.(error);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [onEnded, onError]);

  // Stop playback when page is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      await audio.play();
      setIsPlaying(true);
      onPlay?.();
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        onError?.(error as Error);
      }
    }
  }, [onPlay, onError]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsPlaying(false);
    onPause?.();
  }, [onPause]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const setSource = useCallback((src: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    audio.src = src;
    audio.load();
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  return {
    audioRef,
    isPlaying,
    isLoading,
    currentTime,
    play,
    pause,
    stop,
    setSource,
  };
}

export default useAudioControl;
