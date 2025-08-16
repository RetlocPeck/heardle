'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Song } from '@/types/song';

interface AudioPlayerProps {
  song: Song;
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
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Clear any existing timeout when component unmounts or duration changes
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
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
  }, []);

  // Smooth progress animation using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying || !song.previewUrl) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animateProgress = (timestamp: number) => {
      if (!animationFrameRef.current) return;
      
      const audio = audioRef.current;
      if (!audio) return;

      // Update every 16ms (60fps) for smooth animation
      if (timestamp - lastUpdateTimeRef.current >= 16) {
        setCurrentTime(audio.currentTime);
        lastUpdateTimeRef.current = timestamp;
      }

      animationFrameRef.current = requestAnimationFrame(animateProgress);
    };

    animationFrameRef.current = requestAnimationFrame(animateProgress);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, song.previewUrl]);

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

    // Ensure audio is properly reset and stopped
    audio.pause();
    audio.currentTime = 0;
    audio.load(); // Reload to ensure clean state
    
    // Reset playing state to ensure button shows play
    setIsPlaying(false);
    setCurrentTime(0);

    // Set the audio source
    audio.src = song.previewUrl;
    
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
  }, [song.previewUrl, duration, isGameWon, disabled]);

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
        audio.play().catch((error) => {
          // Handle AbortError gracefully (audio was interrupted)
          if (error.name !== 'AbortError') {
            console.error('Audio auto-play error:', error);
          }
        });
        setIsPlaying(true);
        onPlay?.();
      }
    }
  }, [isGameWon, disabled, song.previewUrl]);

  // Reset audio state when song changes (e.g., loading saved game)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
         // Add a small delay to prevent rapid state changes
     const timeoutId = setTimeout(() => {
       // Reset audio state when song changes
       audio.pause();
       audio.currentTime = 0;
       audio.load();
       setIsPlaying(false);
       setCurrentTime(0);
       
       // Clear any existing timeout
       if (timeoutRef.current) {
         clearTimeout(timeoutRef.current);
         timeoutRef.current = null;
       }
       
       // Clear animation frame
       if (animationFrameRef.current) {
         cancelAnimationFrame(animationFrameRef.current);
         animationFrameRef.current = null;
       }
     }, 100); // 100ms delay to prevent rapid state changes
     
     return () => {
       clearTimeout(timeoutId);
       if (animationFrameRef.current) {
         cancelAnimationFrame(animationFrameRef.current);
         animationFrameRef.current = null;
       }
     };
  }, [song.id]); // Only reset when song ID changes

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
        audio.play().catch((error) => {
          // Handle AbortError gracefully (audio was interrupted)
          if (error.name !== 'AbortError') {
            console.error('Audio play error:', error);
          }
        });
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
        audio.play().catch((error) => {
          // Handle AbortError gracefully (audio was interrupted)
          if (error.name !== 'AbortError') {
            console.error('Audio play error:', error);
          }
        });
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
        
        audio.play().catch((error) => {
          // Handle AbortError gracefully (audio was interrupted)
          if (error.name !== 'AbortError') {
            console.error('Audio play error:', error);
          }
        });
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
  // Ensure progress reaches 100% before disappearing by using a small buffer
  const progress = duration > 0 ? Math.min((currentTime / (duration / 1000)) * 100, 100) : 0;
  
  // For full preview (game won or over), calculate progress based on actual preview duration (30 seconds)
  const fullPreviewProgress = (isGameWon || disabled) 
    ? Math.min((currentTime / 30) * 100, 100) 
    : progress;

  // Use full preview progress when game is won or over, otherwise use limited duration progress
  const displayProgress = (isGameWon || disabled) ? fullPreviewProgress : progress;
  const displayDuration = (isGameWon || disabled) ? 30 : duration / 1000;

  // Ensure progress bar reaches 100% by adding a small buffer
  const smoothProgress = Math.min(displayProgress, 100);

  if (!song.previewUrl) {
    return (
      <div className="text-center p-4 max-[400px]:p-3 backdrop-blur-xl bg-red-500/10 border border-red-400/30 rounded-3xl">
        <div className="text-red-300 text-lg max-[400px]:text-base font-bold mb-3 max-[400px]:mb-2">
          🚫 Song Preview Unavailable
        </div>
        <div className="text-white/80 mb-4 max-[400px]:mb-3 text-sm max-[400px]:text-xs">
          No preview available for this song on iTunes.
        </div>
        <a
          href={song.itunesUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 max-[400px]:px-3 py-2 max-[400px]:py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-2xl font-bold text-sm max-[400px]:text-xs hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
        >
          🎵 Listen on iTunes
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4 max-[400px]:space-y-3 p-4 max-[400px]:p-3">
      <div className="text-center">
        <h3 className="text-xl max-[400px]:text-lg font-bold text-white mb-2 max-[400px]:mb-1">
          {isGameWon ? (
            <div className="space-y-1 max-[400px]:space-y-1">
              <div className="text-2xl max-[400px]:text-xl">🎉 You got it! 🎉</div>
              <div className="text-xl max-[400px]:text-lg bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {song.name}
              </div>
            </div>
          ) : disabled ? (
            <div className="space-y-1 max-[400px]:space-y-1">
              <div className="text-2xl max-[400px]:text-xl">😔 Game Over</div>
              <div className="text-xl max-[400px]:text-lg bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {song.name}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-1 max-[400px]:space-x-1 sm:space-x-2">
              <span>🎵</span>
              <span className="text-sm max-[400px]:text-xs">Listen to the song preview</span>
            </div>
          )}
        </h3>
        <p className="text-white/70 text-base max-[400px]:text-sm">
          {isGameWon || disabled ? (
            <span className="flex items-center justify-center space-x-1 max-[400px]:space-x-1 sm:space-x-2">
              <span>💿</span>
              <span>{song.album}</span>
            </span>
          ) : (
            <span className="flex items-center justify-center space-x-1 max-[400px]:space-x-1 sm:space-x-2">
              <span>⏱️</span>
              <span>Duration: {formatTime(duration / 1000)}s</span>
            </span>
          )}
        </p>
      </div>

                    {(isGameWon || disabled) && (
         <div className="relative w-full max-w-sm">
           <div className="bg-white/20 rounded-full h-3 backdrop-blur-sm overflow-hidden">
             <div 
               className="bg-gradient-to-r from-pink-400 to-purple-500 h-3 rounded-full transition-all duration-75 ease-out shadow-lg"
               style={{ width: `${smoothProgress}%` }}
             />
           </div>
           <div className="flex justify-between text-xs max-[400px]:text-xs sm:text-sm text-white/60 mt-2 font-medium">
             <span>{formatTime(currentTime)}</span>
             <span>{formatTime(30)}</span>
           </div>
         </div>
       )}
       
              {!isGameWon && !disabled && (
         <div className="relative w-full max-w-sm">
           <div className="bg-white/20 rounded-full h-3 backdrop-blur-sm overflow-hidden">
             <div 
               className="bg-gradient-to-r from-pink-400 to-purple-500 h-3 rounded-full transition-all duration-75 ease-out shadow-lg"
               style={{ width: `${smoothProgress}%` }}
             />
           </div>
           <div className="flex justify-between text-xs max-[400px]:text-xs sm:text-sm text-white/60 mt-2 font-medium">
             <span>{formatTime(currentTime)}</span>
             <span>{formatTime(duration / 1000)}</span>
           </div>
         </div>
       )}

      <button
        onClick={togglePlay}
        disabled={isLoading || !song.previewUrl}
        className={`
          px-8 max-[400px]:px-6 py-3 max-[400px]:py-2 rounded-2xl font-bold text-white transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 max-[400px]:space-x-1 sm:space-x-3 text-base max-[400px]:text-sm
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
            <div className="w-4 max-[400px]:w-4 h-4 max-[400px]:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </>
        ) : isPlaying ? (
          <>
            <div className="w-4 max-[400px]:w-4 h-4 max-[400px]:h-4 bg-white rounded-sm" />
            <span>Pause</span>
          </>
        ) : (
          <>
            <div className="w-0 h-0 border-l-[8px] max-[400px]:border-l-[6px] border-l-white border-y-[6px] max-[400px]:border-y-[5px] border-y-transparent ml-1" />
            <span>Play</span>
          </>
        )}
      </button>

      <audio ref={audioRef} preload="metadata" />
    </div>
  );
}
