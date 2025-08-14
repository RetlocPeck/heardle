'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TWICESong } from '@/lib/itunes';

interface GuessInputProps {
  onSubmit: (guess: string) => void;
  onSkip?: () => void;
  disabled?: boolean;
  placeholder?: string;
  availableSongs?: TWICESong[];
}

export default function GuessInput({ 
  onSubmit, 
  onSkip,
  disabled = false, 
  placeholder = "Enter your guess...",
  availableSongs = []
}: GuessInputProps) {
  const [guess, setGuess] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSongs, setFilteredSongs] = useState<TWICESong[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
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
      const uniqueSongs = filtered.reduce((acc: TWICESong[], currentSong) => {
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
      setShowDropdown(uniqueSongs.length > 0);
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

  const handleSongSelect = (song: TWICESong) => {
    setGuess(song.name);
    setShowDropdown(false);
    onSubmit(song.name);
    setGuess(''); // Clear the input field after submitting
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGuess(e.target.value);
  };

  const handleInputFocus = () => {
    console.log(`🔍 GuessInput: Input focused. Guess: "${guess}", Filtered songs: ${filteredSongs.length}`);
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
    <div className="w-full max-w-md relative">
      <form onSubmit={handleSubmit}>
        <div className="flex space-x-2">
          <div className="flex-1 relative">
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
                w-full px-4 py-3 border-2 rounded-lg text-lg font-medium
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent
                transition-all duration-200
                ${disabled 
                  ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'border-gray-300 hover:border-pink-300 focus:border-pink-500'
                }
              `}
            />
            
            {/* Autocomplete Dropdown */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                {filteredSongs.length > 0 ? (
                  <>
                    {filteredSongs.map((song, index) => (
                      <div
                        key={song.id}
                        onClick={() => handleSongSelect(song)}
                        className={`
                          px-4 py-3 cursor-pointer hover:bg-pink-50 transition-colors
                          ${index === selectedIndex ? 'bg-pink-100' : ''}
                          ${index === 0 ? 'rounded-t-lg' : ''}
                          ${index === filteredSongs.length - 1 ? 'rounded-b-lg' : ''}
                        `}
                      >
                        <div className="font-medium text-gray-800">{song.name}</div>
                      </div>
                    ))}
                    {/* Show info about deduplication if there were many results */}
                    {availableSongs.filter(song => 
                      song.name.toLowerCase().startsWith(guess.toLowerCase())
                    ).length > filteredSongs.length && (
                      <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
                        Showing {filteredSongs.length} unique songs (duplicates removed)
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-center">
                    No songs found starting with "{guess}"
                  </div>
                )}
              </div>
            )}
            
            {/* Show message when no songs are available for autocomplete */}
            {!showDropdown && availableSongs.length === 0 && guess.trim() && (
              <div className="absolute z-50 w-full mt-1 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-sm text-yellow-800 text-center">
                  Autocomplete unavailable - you can still type and guess manually!
                </div>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={disabled || !guess.trim()}
            className={`
              px-6 py-3 bg-pink-500 text-white font-semibold rounded-lg
              hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            Guess
          </button>

          <button
            type="button"
            onClick={() => {
              console.log('🔘 Skip button clicked');
              console.log('🔘 onSkip function:', onSkip);
              if (onSkip) {
                onSkip();
              } else {
                console.error('❌ onSkip function is not defined');
              }
            }}
            disabled={disabled}
            className={`
              px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg
              hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            Skip
          </button>
        </div>
      </form>
    </div>
  );
}
