'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { Song } from '@/types/song';
import { useAudioControl } from '@/lib/hooks/useAudioControl';
import { Logger } from '@/lib/utils/logger';

interface AudioPlayerProps {
  song: Song;
  duration: number;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  disabled?: boolean;
  isGameWon?: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({
  song,
  duration,
  onPlay,
  onPause,
  onEnded,
  disabled = false,
  isGameWon = false,
}: AudioPlayerProps) {
  const { audioRef, isPlaying, isLoading, currentTime, play, pause, stop, setSource, snapTo } =
    useAudioControl(onEnded);

  // Game-specific refs
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clipEndedRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  const prevIsOverRef = useRef(false);
  const hasMountedRef = useRef(false);

  // Keep callback refs current so timeouts always call the latest version
  // without those callbacks needing to be in the source-setup effect's dep array.
  const onPlayRef = useRef(onPlay);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);
  useEffect(() => { onPlayRef.current = onPlay; }, [onPlay]);

  // ── Effect 1: Source setup, duration limit, and post-game autoplay ────────
  //
  // Combines what were previously 6 separate effects. The hook handles the
  // generic audio lifecycle (events, polling, visibility). This effect owns
  // only the game-specific decisions:
  //   - Active game:  reset source, start a duration-limit timeout.
  //   - Game over:    load full source; attempt autoplay on in-session transition.
  useEffect(() => {
    const audio = audioRef.current;
    const isOver = isGameWon || disabled;
    const wasOver = prevIsOverRef.current;
    const isFirstRun = !hasMountedRef.current;
    hasMountedRef.current = true;
    prevIsOverRef.current = isOver;

    if (!song.previewUrl) return;

    // Always clear any outstanding duration timeout when deps change.
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isOver) {
      // Prepare full-length source (no duration limit).
      setSource(song.previewUrl);

      // Don't autoplay when the page loads with an already-finished game,
      // or when the game was already over before this render.
      if (!audio || isFirstRun || wasOver) return;

      // In-session transition to game over: polite muted-preroll autoplay.
      audio.muted = true;
      setTimeout(() => {
        const a = audioRef.current;
        if (!a) return;
        a.play()
          .then(() => {
            onPlayRef.current?.();
            setTimeout(() => { if (audioRef.current) audioRef.current.muted = false; }, 150);
          })
          .catch((err) => {
            if ((err as Error)?.name !== 'AbortError') Logger.warn('Autoplay failed:', err);
            if (audioRef.current) audioRef.current.muted = false;
          });
      }, 100);
    } else {
      // Active game: reset source and arm the duration-limit timeout.
      clipEndedRef.current = false;
      setSource(song.previewUrl);

      timeoutRef.current = setTimeout(() => {
        const a = audioRef.current;
        if (a && !a.paused) {
          // Stop the polling interval before snapping so it can't overwrite the
          // 100% value. snapTo() cancels the interval internally.
          snapTo(duration / 1000);
          pause();
          clipEndedRef.current = true;
          onEndedRef.current?.();
        }
        timeoutRef.current = null;
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    // onPlay/onEnded use refs (onPlayRef/onEndedRef) so parent re-renders that produce
    // new function references don't reset the audio mid-play.
  }, [song.previewUrl, duration, isGameWon, disabled, audioRef, setSource, snapTo, pause]);

  // ── Playback helpers ──────────────────────────────────────────────────────

  const pauseAudio = useCallback(() => {
    // Clear the duration timeout so time doesn't run down while paused.
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pause();
    onPause?.();
  }, [pause, onPause]);

  const startLimitedPreview = useCallback(() => {
    clipEndedRef.current = false;
    stop(); // seek to 0 and reset state

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const a = audioRef.current;
      if (a && !a.paused) {
        snapTo(duration / 1000);
        pause();
        clipEndedRef.current = true;
        onEndedRef.current?.();
      }
      timeoutRef.current = null;
    }, duration);

    play().then(() => onPlayRef.current?.());
  }, [stop, play, pause, snapTo, duration, audioRef]);

  const startFullPreview = useCallback(() => {
    stop(); // seek to 0 and reset state
    play().then(() => onPlayRef.current?.());
  }, [stop, play]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !song.previewUrl) return;

    if (isPlaying) {
      pauseAudio();
      return;
    }

    if (isGameWon || disabled) {
      // Full preview: resume from current position if mid-track, else restart.
      const atEnd = audio.duration > 0 && audio.currentTime >= audio.duration - 0.1;
      if (audio.currentTime > 0 && !atEnd) {
        play().then(() => onPlayRef.current?.());
      } else {
        startFullPreview();
      }
    } else {
      // Limited preview: use clipEndedRef instead of a raw currentTime comparison
      // so timer imprecision can't cause a false mid-clip resume.
      const maxSec = duration / 1000;
      const isMidClip = !clipEndedRef.current && audio.currentTime > 0 && audio.currentTime < maxSec;
      if (isMidClip) {
        const remainingMs = (maxSec - audio.currentTime) * 1000;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          const a = audioRef.current;
          if (a && !a.paused) {
            snapTo(maxSec);
            pause();
            clipEndedRef.current = true;
            onEndedRef.current?.();
          }
          timeoutRef.current = null;
        }, remainingMs);
        play().then(() => onPlayRef.current?.());
      } else {
        startLimitedPreview();
      }
    }
  };

  // ── Rendering ─────────────────────────────────────────────────────────────

  if (!song.previewUrl) {
    return (
      <div className="text-center p-4 max-[400px]:p-3 backdrop-blur-xl bg-red-500/10 border border-red-400/30 rounded-3xl">
        <div className="text-red-300 text-lg max-[400px]:text-base font-bold mb-3 max-[400px]:mb-2">
          🚫 Song Preview Unavailable
        </div>
        <div className="text-white/80 mb-4 max-[400px]:mb-3 text-sm max-[400px]:text-xs">
          No preview available for this song on Apple Music.
        </div>
        <a
          href={song.trackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 max-[400px]:px-3 py-2 max-[400px]:py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-2xl font-bold text-sm max-[400px]:text-xs hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
        >
          🎵 Listen on Apple Music
        </a>
      </div>
    );
  }

  const isOver = isGameWon || disabled;
  // Full preview uses the song's full 30s duration; limited preview uses the game-controlled duration.
  const totalSeconds = isOver ? 30 : duration / 1000;
  const displayProgress = Math.min((currentTime / totalSeconds) * 100, 100);

  return (
    <div className="flex flex-col items-center space-y-4 max-[400px]:space-y-3 p-4 max-[400px]:p-3">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">
          {isGameWon ? (
            <div className="space-y-1">
              <div className="text-lg sm:text-xl whitespace-nowrap">🎉 You got it! 🎉</div>
              <div className="text-base sm:text-lg bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {song.name}
              </div>
            </div>
          ) : disabled ? (
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl">😔 Game Over</div>
              <div className="text-lg sm:text-xl bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {song.name}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              <span>🎵</span>
              <span className="text-xs sm:text-sm">Listen to the song preview</span>
            </div>
          )}
        </h3>
        <p className="text-white/70 text-sm sm:text-base">
          {isOver ? (
            <span className="flex items-center justify-center space-x-1 sm:space-x-2">
              <span>💿</span>
              <span>{song.album}</span>
            </span>
          ) : (
            <span className="flex items-center justify-center space-x-1 sm:space-x-2">
              <span>⏱️</span>
              <span>Duration: {formatTime(duration / 1000)}s</span>
            </span>
          )}
        </p>
      </div>

      {/* Progress bar — single block; totalSeconds drives both limited and full preview */}
      <div className="relative w-full max-w-sm">
        <div className="bg-white/20 rounded-full h-3 backdrop-blur-sm overflow-hidden">
          <div
            className="bg-gradient-to-r from-pink-400 to-purple-500 h-3 rounded-full shadow-lg transition-[width] duration-[50ms] linear"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs sm:text-sm text-white/60 mt-2 font-medium tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalSeconds)}</span>
        </div>
      </div>

      {/* Play / Pause button */}
      <button
        onClick={togglePlay}
        disabled={isLoading || !song.previewUrl}
        aria-label={isLoading ? 'Loading audio' : isPlaying ? 'Pause audio preview' : 'Play audio preview'}
        aria-pressed={isPlaying}
        className={`
          px-6 sm:px-8 py-2 sm:py-3 rounded-2xl font-bold text-white transition-all duration-300 transform hover:scale-105 flex items-center space-x-1 sm:space-x-3 text-sm sm:text-base
          focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-slate-900
          ${isLoading || !song.previewUrl
            ? 'bg-gray-500/50 cursor-not-allowed'
            : isPlaying
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-2xl hover:shadow-red-500/25'
              : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/25'
          }
        `}
      >
        {isLoading ? (
          <>
            <div className="w-3 sm:w-4 h-3 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </>
        ) : isPlaying ? (
          <>
            <div className="w-3 sm:w-4 h-3 sm:h-4 bg-white rounded-sm" />
            <span>Pause</span>
          </>
        ) : (
          <>
            <div className="w-0 h-0 border-l-[6px] sm:border-l-[8px] border-l-white border-y-[4px] sm:border-y-[6px] border-y-transparent ml-1" />
            <span>Play</span>
          </>
        )}
      </button>

      <audio ref={audioRef} preload="metadata" autoPlay={false} playsInline={true} />
    </div>
  );
}
