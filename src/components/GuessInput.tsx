'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TWICESong } from '@/lib/itunes';

interface GuessInputProps {
  onSubmit: (guess: string) => void;
  onSkip?: () => void;
  disabled?: boolean;
  placeholder?: string;
  availableSongs?: TWICESong[];
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
    <div className="w-full relative">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col space-y-4">
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
                w-full px-6 py-4 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl text-white text-lg font-medium placeholder-white/60
                focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent focus:bg-white/20
                transition-all duration-300
                ${disabled 
                  ? 'bg-gray-500/20 cursor-not-allowed opacity-50' 
                  : 'hover:bg-white/15'
                }
              `}
            />
            
            {/* Autocomplete Dropdown */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute z-50 w-full mt-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl max-h-64 overflow-y-auto"
              >
                {filteredSongs.length > 0 ? (
                  <>
                    {filteredSongs.map((song, index) => (
                      <div
                        key={song.id}
                        onClick={() => handleSongSelect(song)}
                        className={`
                          px-6 py-4 cursor-pointer hover:bg-white/20 transition-all duration-200
                          ${index === selectedIndex ? 'bg-white/20' : ''}
                          ${index === 0 ? 'rounded-t-2xl' : ''}
                          ${index === filteredSongs.length - 1 ? 'rounded-b-2xl' : ''}
                        `}
                      >
                        <div className="font-semibold text-white">{song.name}</div>
                      </div>
                    ))}
                    {/* Show info about deduplication if there were many results */}
                    {availableSongs.filter(song => 
                      song.name.toLowerCase().startsWith(guess.toLowerCase())
                    ).length > filteredSongs.length && (
                      <div className="px-6 py-3 text-sm text-white/60 bg-white/5 border-t border-white/10 rounded-b-2xl">
                        Showing {filteredSongs.length} unique songs (duplicates removed)
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-6 py-4 text-white/60 text-center">
                    No songs found starting with "{guess}"
                  </div>
                )}
              </div>
            )}
            
            {/* Show message when no songs are available for autocomplete */}
            {!showDropdown && availableSongs.length === 0 && guess.trim() && (
              <div className="absolute z-50 w-full mt-2 backdrop-blur-xl bg-yellow-500/20 border border-yellow-400/30 rounded-2xl p-4">
                <div className="text-sm text-yellow-200 text-center">
                  💡 Autocomplete unavailable - you can still type and guess manually!
                </div>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={disabled || !guess.trim()}
              className={`
                flex-1 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-2xl text-lg
                hover:shadow-2xl hover:shadow-purple-500/25 focus:outline-none transition-all duration-300 transform hover:scale-105
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                flex items-center justify-center space-x-2
              `}
            >
              <span>🎯</span>
              <span>Guess</span>
            </button>

            <button
              type="button"
              onClick={onSkip}
              disabled={disabled || (currentTry + 1 >= maxTries)}
              title={currentTry + 1 >= maxTries ? "This is your last try - you must guess!" : "Skip to hear more of the song"}
              className={`
                flex-1 px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold rounded-2xl text-lg
                hover:shadow-2xl hover:shadow-gray-500/25 focus:outline-none transition-all duration-300 transform hover:scale-105
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                flex items-center justify-center space-x-2
              `}
            >
              <span>⏭️</span>
              <span>Skip</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
