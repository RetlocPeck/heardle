'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Song } from '@/types/song';

interface GuessInputProps {
  onSubmit: (guess: string) => void;
  onSkip?: () => void;
  disabled?: boolean;
  placeholder?: string;
  availableSongs?: Song[];
  currentTry?: number;
  maxTries?: number;
}

export default function GuessInput({ 
  onSubmit, 
  onSkip,
  disabled = false, 
  placeholder = "Enter your guess...",
  availableSongs = [],
  currentTry = 0,
  maxTries = 6
}: GuessInputProps) {
  const [guess, setGuess] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [openAbove, setOpenAbove] = useState(false);
  const [coords, setCoords] = useState<{top:number; left:number; width:number}>({top:0,left:0,width:0});
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter songs based on input
  useEffect(() => {
    console.log(`🔍 GuessInput: Filtering songs. Input: "${guess}", Available songs: ${availableSongs.length}`);
    
    if (guess.trim() && availableSongs.length > 0) {
      const filtered = availableSongs.filter(song => 
        song.name.toLowerCase().startsWith(guess.toLowerCase())
      );
      
      // Deduplicate by song title - keep only one entry per unique song name
      const uniqueSongs = filtered.reduce((acc: Song[], currentSong) => {
        const existingSong = acc.find(song => 
          song.name.toLowerCase() === currentSong.name.toLowerCase()
        );
        
        if (!existingSong) {
          // This is a new unique song title, add it
          acc.push(currentSong);
        } else {
          // We already have this song title, keep the better version
          // Prefer the one without parentheses in the name (usually the main version)
          const currentHasParentheses = currentSong.name.includes('(');
          const existingHasParentheses = existingSong.name.includes('(');
          
          if (!currentHasParentheses && existingHasParentheses) {
            // Replace with the version without parentheses
            const index = acc.findIndex(song => song.id === existingSong.id);
            acc[index] = currentSong;
          }
        }
        
        return acc;
      }, []);
      
      setFilteredSongs(uniqueSongs);
      if (uniqueSongs.length > 0) {
        updateDropdownPosition();
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
      setSelectedIndex(-1);
      console.log(`🔍 GuessInput: Found ${filtered.length} songs, deduplicated to ${uniqueSongs.length} unique titles starting with "${guess}"`);
    } else {
      setFilteredSongs([]);
      setShowDropdown(false);
      setSelectedIndex(-1);
      if (guess.trim()) {
        console.log(`🔍 GuessInput: No songs available for filtering`);
      }
    }
  }, [guess, availableSongs]);

  // Update dropdown position on visual viewport + scroll/resize
  useEffect(() => {
    if (!showDropdown) return;

    const vv = (window as any).visualViewport;
    const handlers = [
      ['resize', updateDropdownPosition],
      ['scroll', updateDropdownPosition],
    ] as const;

    handlers.forEach(([ev, fn]) => window.addEventListener(ev, fn, { passive: true }));
    vv?.addEventListener?.('resize', updateDropdownPosition);
    vv?.addEventListener?.('scroll', updateDropdownPosition);

    updateDropdownPosition();

    return () => {
      handlers.forEach(([ev, fn]) => window.removeEventListener(ev, fn as any));
      vv?.removeEventListener?.('resize', updateDropdownPosition as any);
      vv?.removeEventListener?.('scroll', updateDropdownPosition as any);
    };
  }, [showDropdown]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredSongs.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredSongs.length) {
          const selectedSong = filteredSongs[selectedIndex];
          setGuess(selectedSong.name);
          setShowDropdown(false);
          onSubmit(selectedSong.name);
        } else if (guess.trim()) {
          onSubmit(guess.trim());
          setGuess('');
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim() && !disabled) {
      onSubmit(guess.trim());
      setGuess('');
      setShowDropdown(false);
    }
  };

  const handleSongSelect = (song: Song) => {
    setGuess(song.name);
    setShowDropdown(false);
    onSubmit(song.name);
    setGuess(''); // Clear the input field after submitting
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGuess(e.target.value);
  };

  const GAP = 8; // px

  const updateDropdownPosition = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const vv = (window as any).visualViewport;
    const viewportH = vv?.height ?? window.innerHeight;

    const spaceBelow = viewportH - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    setOpenAbove(openUp);

    const left = Math.round(rect.left + window.scrollX);
    const width = Math.round(rect.width);
    const top = openUp
      ? Math.round(rect.top + window.scrollY - GAP) // we'll anchor above using translateY(-100%)
      : Math.round(rect.bottom + window.scrollY + GAP);

    setCoords({ top, left, width });
  };

  const handleInputFocus = () => {
    console.log(`🔍 GuessInput: Input focused. Guess: "${guess}", Filtered songs: ${filteredSongs.length}`);
    updateDropdownPosition();
    if (guess.trim() && filteredSongs.length > 0) {
      setShowDropdown(true);
      console.log(`🔍 GuessInput: Showing dropdown with ${filteredSongs.length} songs`);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => setShowDropdown(false), 150);
  };

  return (
    <div className="w-full relative">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col space-y-2 sm:space-y-3">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={guess}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={placeholder}
              disabled={disabled}
              className={`
                w-full px-3 sm:px-4 py-2 sm:py-3
                backdrop-blur-md bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl
                text-white text-sm sm:text-base font-medium placeholder-white/60
                focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent focus:bg-white/20
                transition-all duration-300
                ${disabled ? 'bg-gray-500/20 cursor-not-allowed opacity-50' : 'hover:bg-white/15'}
              `}
            />



            {/* Autocomplete unavailable message (kept; positioned under input) */}
            {!showDropdown && availableSongs.length === 0 && guess.trim() && (
              <div className="absolute z-10 w-full mt-2 backdrop-blur-xl bg-yellow-500/20 border border-yellow-400/30 rounded-xl sm:rounded-2xl p-2 sm:p-3">
                <div className="text-xs sm:text-sm text-yellow-200 text-center">
                  💡 Autocomplete unavailable - you can still type and guess manually!
                </div>
              </div>
            )}
          </div>
          
          <div className="flex space-x-1.5 sm:space-x-2 lg:space-x-3">
            <button
              type="submit"
              disabled={disabled || !guess.trim()}
              className={`
                flex-1 px-2.5 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-lg sm:rounded-xl lg:rounded-2xl text-xs sm:text-sm lg:text-base
                hover:shadow-2xl hover:shadow-purple-500/25 focus:outline-none transition-all duration-300 transform hover:scale-105
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                flex items-center justify-center space-x-0.5 sm:space-x-1 lg:space-x-2
              `}
            >
              <span className="text-xs sm:text-sm">🎯</span>
              <span className="whitespace-nowrap">Guess</span>
            </button>

            <button
              type="button"
              onClick={onSkip}
              disabled={disabled || (currentTry + 1 >= maxTries)}
              title={currentTry + 1 >= maxTries ? "This is your last try - you must guess!" : "Skip to hear more of the song"}
              className={`
                flex-1 px-2.5 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold rounded-lg sm:rounded-xl lg:rounded-2xl text-xs sm:text-sm lg:text-base
                hover:shadow-2xl hover:shadow-gray-500/25 focus:outline-none transition-all duration-300 transform hover:scale-105
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                flex items-center justify-center space-x-0.5 sm:space-x-1 lg:space-x-2
              `}
            >
              <span className="text-xs sm:text-sm">⏭️</span>
              <span className="whitespace-nowrap">Skip</span>
            </button>
          </div>
        </div>
      </form>

               {/* Portal-based Autocomplete Dropdown Overlay */}
        {showDropdown && typeof window !== 'undefined' && createPortal(
          <>
            {/* full-screen click-away (below panel but above page) */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 2147483646, pointerEvents: 'auto' }}
              onMouseDown={() => setShowDropdown(false)}
              onTouchStart={() => setShowDropdown(false)}
            />

            {/* overlay root: holds absolutely positioned dropdown */}
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2147483647, // sit above any stacking context
                pointerEvents: 'none',
              }}
            >
              <div
                ref={dropdownRef}
                style={{
                  position: 'absolute',
                  left: coords.left,
                  top: coords.top,
                  width: coords.width,
                  transform: openAbove ? 'translateY(-100%)' : 'none',
                  pointerEvents: 'auto',
                }}
                className="
                  rounded-xl sm:rounded-2xl shadow-2xl
                  backdrop-blur-md bg-black/20
                  ring-1 ring-white/10
                  overflow-hidden
                "
              >
                {/* inner scroll area */}
                <div
                  className="
                    dropdown-scroll
                    max-h-48 sm:max-h-56
                    overflow-y-auto overscroll-contain
                  "
                  style={{
                    WebkitOverflowScrolling: 'touch',
                    scrollbarGutter: 'stable',
                  }}
                >
                  {filteredSongs.length > 0 ? (
                    filteredSongs.map((song, index) => (
                      <div
                        key={song.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSongSelect(song)}
                        className={`
                          px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer 
                          transition-all duration-200 ease-out
                          ${index === selectedIndex 
                            ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 backdrop-blur-sm' 
                            : 'hover:bg-white/10'
                          }
                          border-b border-white/5 last:border-b-0
                        `}
                      >
                        <div className="font-medium text-white text-xs sm:text-sm truncate">
                          {song.name}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 sm:px-4 py-3 text-white/60 text-center text-xs sm:text-sm">
                      No songs found starting with "{guess}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
     </div>
   );
 }
