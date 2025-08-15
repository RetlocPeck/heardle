'use client';

import React, { useRef, useEffect, useState } from 'react';
import { TWICESong } from '@/lib/itunes';

interface AudioPlayerProps {
  song: TWICESong;
  duration: number;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  disabled?: boolean;
  isGameWon?: boolean;
}

export default function AudioPlayer({ 
  song, 
  duration, 
  onPlay, 
  onPause, 
  onEnded, 
  disabled = false,
  isGameWon = false
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any existing timeout when component unmounts or duration changes
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [onEnded]);

  // Handle audio source and duration control
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !song.previewUrl) return;

    // Skip duration control if game is won or over (full preview)
    if (isGameWon || disabled) {
      const message = isGameWon ? 'Game won' : 'Game over';
      console.log(`🎵 AudioPlayer: ${message} - skipping duration control for full preview`);
      return;
    }

    console.log(`🎵 AudioPlayer: Setting duration to ${duration}ms (${duration/1000}s)`);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Set the audio source
    audio.src = song.previewUrl;
    audio.currentTime = 0;
    
    // Set a timeout to stop the audio after the specified duration
    timeoutRef.current = setTimeout(() => {
      console.log(`🎵 AudioPlayer: Timeout reached, stopping audio after ${duration}ms`);
      if (audio) {
        // Force stop the audio
        audio.pause();
        audio.currentTime = 0;
        audio.load(); // Reload to ensure it's completely stopped
        setIsPlaying(false);
        setCurrentTime(0);
        onEnded?.();
      }
      timeoutRef.current = null;
    }, duration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [song.previewUrl, duration, onEnded, isGameWon]);

  const forceStop = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.load(); // Reload to ensure it's completely stopped
      setIsPlaying(false);
      setCurrentTime(0);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };

  // Force stop audio when duration changes (new game state)
  useEffect(() => {
    if (timeoutRef.current && !isGameWon && !disabled) {
      forceStop();
    }
  }, [duration, isGameWon, disabled]);

  // Auto-play full preview when game is won or over
  useEffect(() => {
    if ((isGameWon || disabled) && song.previewUrl) {
      const audio = audioRef.current;
      if (audio) {
        const message = isGameWon ? 'Game won!' : 'Game over!';
        console.log(`🎵 AudioPlayer: ${message} Auto-playing full preview`);
        
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        // Set audio source and play full preview
        audio.src = song.previewUrl;
        audio.currentTime = 0;
        audio.play().catch(console.error);
        setIsPlaying(true);
        onPlay?.();
      }
    }
  }, [isGameWon, disabled, song.previewUrl, onPlay]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !song.previewUrl) return;
    
    // If disabled (game over but not won), allow full preview playback
    if (disabled && !isGameWon) {
      // Game is over, allow full preview playback
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        onPause?.();
      } else {
        audio.currentTime = 0;
        setCurrentTime(0);
        audio.play().catch(console.error);
        setIsPlaying(true);
        onPlay?.();
      }
      return;
    }

    if (isPlaying) {
      // Pause the audio
      audio.pause();
      setIsPlaying(false);
      onPause?.();
      
      // Clear the timeout since we're manually pausing
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } else {
      // Start playing
      // Reset current time to 0 when starting playback
      audio.currentTime = 0;
      setCurrentTime(0);
      
      if (isGameWon) {
        // For full preview (game won), no timeout - let it play to the end
        console.log('🎵 AudioPlayer: Playing full preview (game won)');
        audio.play().catch(console.error);
        setIsPlaying(true);
        onPlay?.();
      } else {
        // For limited preview (during game), set timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          console.log(`🎵 AudioPlayer: Play timeout reached, stopping audio after ${duration}ms`);
          if (audio && !audio.paused) {
            audio.pause();
            audio.currentTime = 0;
            audio.load(); // Reload to ensure it's completely stopped
            setIsPlaying(false);
            setCurrentTime(0);
            onEnded?.();
          }
          timeoutRef.current = null;
        }, duration);
        
        audio.play().catch(console.error);
        setIsPlaying(true);
        onPlay?.();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress based on current time vs duration
  const progress = duration > 0 ? Math.min((currentTime / (duration / 1000)) * 100, 100) : 0;

  // For full preview (game won), calculate progress based on actual preview duration (30 seconds)
  const fullPreviewProgress = isGameWon 
    ? Math.min((currentTime / 30) * 100, 100) 
    : progress;

  // Use full preview progress when game is won, otherwise use limited duration progress
  const displayProgress = isGameWon ? fullPreviewProgress : progress;
  const displayDuration = isGameWon ? 30 : duration / 1000;

  if (!song.previewUrl) {
    return (
      <div className="text-center p-8 backdrop-blur-xl bg-red-500/10 border border-red-400/30 rounded-3xl">
        <div className="text-red-300 text-xl font-bold mb-4">
          🚫 Song Preview Unavailable
        </div>
        <div className="text-white/80 mb-6">
          No preview available for this song on iTunes.
        </div>
        <a
          href={song.itunesUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
        >
          🎵 Listen on iTunes
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-3">
          {isGameWon ? (
            <div className="space-y-2">
              <div className="text-3xl">🎉 You got it! 🎉</div>
              <div className="text-2xl bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {song.name}
              </div>
            </div>
          ) : disabled ? (
            <div className="space-y-2">
              <div className="text-3xl">😔 Game Over</div>
              <div className="text-2xl bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {song.name}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>🎵</span>
              <span>Listen to the song preview</span>
            </div>
          )}
        </h3>
        <p className="text-white/70 text-lg">
          {isGameWon || disabled ? (
            <span className="flex items-center justify-center space-x-2">
              <span>💿</span>
              <span>{song.album}</span>
            </span>
          ) : (
            <span className="flex items-center justify-center space-x-2">
              <span>⏱️</span>
              <span>Duration: {formatTime(duration / 1000)}s</span>
            </span>
          )}
        </p>
      </div>

      {(isGameWon || disabled) && (
        <div className="relative w-full max-w-sm">
          <div className="bg-white/20 rounded-full h-3 backdrop-blur-sm">
            <div 
              className="bg-gradient-to-r from-pink-400 to-purple-500 h-3 rounded-full transition-all duration-100 shadow-lg"
              style={{ width: `${fullPreviewProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-white/60 mt-2 font-medium">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(30)}</span>
          </div>
        </div>
      )}
      
      {!isGameWon && !disabled && (
        <div className="relative w-full max-w-sm">
          <div className="bg-white/20 rounded-full h-3 backdrop-blur-sm">
            <div 
              className="bg-gradient-to-r from-pink-400 to-purple-500 h-3 rounded-full transition-all duration-100 shadow-lg"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-white/60 mt-2 font-medium">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration / 1000)}</span>
          </div>
        </div>
      )}

      <button
        onClick={togglePlay}
        disabled={isLoading || !song.previewUrl}
        className={`
          px-10 py-4 rounded-2xl font-bold text-white transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 text-lg
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
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </>
        ) : isPlaying ? (
          <>
            <div className="w-5 h-5 bg-white rounded-sm" />
            <span>Pause</span>
          </>
        ) : (
          <>
            <div className="w-0 h-0 border-l-[10px] border-l-white border-y-[8px] border-y-transparent ml-1" />
            <span>Play</span>
          </>
        )}
      </button>

      <audio ref={audioRef} preload="metadata" />
    </div>
  );
}
