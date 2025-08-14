'use client';

import { useState, useEffect } from 'react';
import { TWICESong } from '@/lib/itunes';
import { GameLogic, GameMode, GameState } from '@/lib/gameLogic';
import AudioPlayer from './AudioPlayer';
import GuessInput from './GuessInput';
import GameBoard from './GameBoard';

interface TWICEHeardleProps {
  mode: GameMode;
}

export default function TWICEHeardle({ mode }: TWICEHeardleProps) {
  const [gameLogic] = useState(() => new GameLogic(mode));
  const [gameState, setGameState] = useState<GameState>(gameLogic.getGameState());
  const [currentSong, setCurrentSong] = useState<TWICESong | null>(null);
  const [availableSongs, setAvailableSongs] = useState<TWICESong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSong();
    loadAvailableSongs();
  }, [mode, gameLogic]);

  const loadSong = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const endpoint = mode === 'daily' ? '/api/itunes/daily' : '/api/itunes/random';
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to load song');
      }
      
      const data = await response.json();
      const song = data.song;
      
      console.log(`\n=== ITUNES GAME SONG LOADED ===`);
      console.log(`Song: ${song.name}`);
      console.log(`Album: ${song.album}`);
      console.log(`Artists: ${song.artists.join(', ')}`);
      console.log(`Duration: ${Math.round(song.duration / 1000)}s`);
      console.log(`Track ID: ${song.trackId}`);
      console.log(`Preview URL: ${song.previewUrl || 'NONE'}`);
      console.log(`iTunes URL: ${song.itunesUrl}`);
      
      setCurrentSong(song);
      gameLogic.startGame(song);
      setGameState(gameLogic.getGameState());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableSongs = async () => {
    try {
      const response = await fetch('/api/itunes/songs');
      if (response.ok) {
        const data = await response.json();
        const songs = data.songs || [];
        setAvailableSongs(songs);
        console.log(`Loaded ${songs.length} available TWICE songs from iTunes for autocomplete`);
        
        if (songs.length === 0) {
          console.warn('No songs loaded for autocomplete - users will need to type manually');
        }
      } else {
        console.warn(`Failed to load available songs: ${response.status} ${response.statusText}`);
        setAvailableSongs([]);
      }
    } catch (err) {
      console.warn('Failed to load available songs from iTunes for autocomplete:', err);
      setAvailableSongs([]);
    }
  };

  const handleGuess = (guess: string) => {
    const isCorrect = gameLogic.makeGuess(guess);
    setGameState(gameLogic.getGameState());
    
    if (isCorrect) {
      // Play success sound or show celebration
      console.log('Correct guess!');
    } else {
      // Wrong guess - audio duration should increase for next try
      console.log(`Wrong guess. Next audio duration: ${gameLogic.getCurrentAudioDuration()}ms`);
    }
  };

  const handleSkip = () => {
    // Skip current turn - move to next audio duration
    gameLogic.makeGuess(''); // Empty guess counts as a skip
    setGameState(gameLogic.getGameState());
    console.log(`Skipped turn. Next audio duration: ${gameLogic.getCurrentAudioDuration()}ms`);
  };

  const handleNewGame = () => {
    if (mode === 'practice') {
      loadSong();
    } else {
      // For daily mode, just reset the current game
      gameLogic.resetGame();
      setGameState(gameLogic.getGameState());
    }
  };

  const handleAudioEnded = () => {
    // Audio preview ended, could add logic here if needed
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading TWICE song...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 text-lg mb-4">Error: {error}</div>
        <button
          onClick={loadSong}
          className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!currentSong) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-600 text-lg">No song available</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-pink-600 mb-2">
          TWICE Heardle
        </h1>
        <p className="text-gray-600 text-lg">
          {mode === 'daily' ? 'Daily Challenge' : 'Practice Mode'}
        </p>
        {mode === 'daily' && (
          <p className="text-sm text-gray-500 mt-1">
            New song every day at midnight
          </p>
        )}
      </div>

      {/* Game Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Audio Player */}
        <div className="space-y-6">
          <AudioPlayer
            key={`${currentSong?.id}-${gameLogic.getCurrentAudioDuration()}`}
            song={currentSong}
            duration={gameLogic.getCurrentAudioDuration()}
            onEnded={handleAudioEnded}
            disabled={gameState.isGameOver}
            isGameWon={gameState.hasWon}
          />
          
          {!gameState.isGameOver && (
            <GuessInput
              onSubmit={handleGuess}
              onSkip={handleSkip}
              disabled={gameState.isGameOver}
              placeholder="Guess the TWICE song..."
              availableSongs={availableSongs}
            />
          )}
          
          {gameState.isGameOver && (
            <div className="text-center">
              <button
                onClick={handleNewGame}
                className="px-8 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-semibold"
              >
                {mode === 'daily' ? 'Play Again' : 'New Song'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Game Board */}
        <div className="flex justify-center">
          <GameBoard gameState={gameState} />
        </div>
      </div>

      {/* Game Instructions */}
      <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">How to Play</h3>
        <ul className="space-y-2 text-gray-600">
          <li>• Listen to the song preview (starts with 1 second)</li>
          <li>• Guess the TWICE song title or click Skip to hear more</li>
          <li>• Each wrong guess or skip gives you more time to listen</li>
          <li>• You have 6 tries to get it right</li>
          <li>• Use Skip if you want to hear more before guessing</li>
        </ul>
        
        {availableSongs.length === 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Song autocomplete is currently unavailable. 
              You can still play by typing the exact song title manually!
            </p>
          </div>
        )}
        
        {currentSong && !currentSong.previewUrl && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Song preview is not available for this track. 
              You can still play by guessing the song title!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
