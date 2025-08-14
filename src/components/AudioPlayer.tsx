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

    // Skip duration control if game is won (full preview)
    if (isGameWon) {
      console.log('🎵 AudioPlayer: Game won - skipping duration control for full preview');
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
    if (timeoutRef.current && !isGameWon) {
      forceStop();
    }
  }, [duration, isGameWon]);

  // Auto-play full preview when game is won
  useEffect(() => {
    if (isGameWon && song.previewUrl) {
      const audio = audioRef.current;
      if (audio) {
        console.log('🎵 AudioPlayer: Game won! Auto-playing full preview');
        
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
  }, [isGameWon, song.previewUrl, onPlay]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || disabled || !song.previewUrl) return;

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
      <div className="text-center p-6 bg-gray-50 rounded-lg">
        <div className="text-red-600 text-lg font-semibold mb-2">
          Song Preview Unavailable
        </div>
        <div className="text-gray-600 text-sm">
          No preview available for this song on iTunes.
        </div>
        <div className="mt-3">
          <a
            href={song.itunesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Listen on iTunes
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {isGameWon ? (
            <div>
              <div className="text-pink-600 mb-1">🎉 You got it! 🎉</div>
              <div className="text-xl">{song.name}</div>
            </div>
          ) : (
            'Listen to the song preview'
          )}
        </h3>
        <p className="text-sm text-gray-600">
          {isGameWon ? song.album : `Duration: ${formatTime(duration / 1000)}s`}
        </p>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-gray-200 rounded-full h-2">
          <div 
            className="bg-pink-500 h-2 rounded-full transition-all duration-100"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(displayDuration)}</span>
        </div>
      </div>

      <button
        onClick={togglePlay}
        disabled={disabled || isLoading || !song.previewUrl}
        className={`
          px-8 py-3 rounded-full font-semibold text-white transition-all duration-200
          ${disabled || isLoading || !song.previewUrl
            ? 'bg-gray-400 cursor-not-allowed' 
            : isPlaying 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-pink-500 hover:bg-pink-600'
          }
        `}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        ) : isPlaying ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-white rounded-sm" />
            <span>Pause</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[6px] border-y-transparent ml-1" />
            <span>Play</span>
          </div>
        )}
      </button>

      <audio ref={audioRef} preload="metadata" />
    </div>
  );
}
