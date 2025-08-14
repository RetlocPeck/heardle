'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TWICESong } from '@/lib/itunes';
import { GameLogic, GameMode, GameState } from '@/lib/gameLogic';
import AudioPlayer from './AudioPlayer';
import GuessInput from './GuessInput';
import GameBoard from './GameBoard';

interface DynamicHeardleProps {
  mode: GameMode;
}

interface ArtistConfig {
  id: string;
  name: string;
  displayName: string;
  color: string;
}

const ARTISTS: ArtistConfig[] = [
  {
    id: 'twice',
    name: 'TWICE',
    displayName: 'TWICE',
    color: 'pink'
  },
  {
    id: 'le-sserafim',
    name: 'LE SSERAFIM',
    displayName: 'LE SSERAFIM',
    color: 'purple'
  }
];

export default function DynamicHeardle({ mode }: DynamicHeardleProps) {
  const params = useParams();
  const [gameLogic, setGameLogic] = useState<GameLogic | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentSong, setCurrentSong] = useState<TWICESong | null>(null);
  const [availableSongs, setAvailableSongs] = useState<TWICESong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [artist, setArtist] = useState<ArtistConfig | null>(null);

  useEffect(() => {
    const artistId = params.artist as string;
    const foundArtist = ARTISTS.find(a => a.id === artistId);
    if (foundArtist) {
      setArtist(foundArtist);
      
      // Initialize GameLogic with artistId
      const newGameLogic = new GameLogic(artistId, mode);
      setGameLogic(newGameLogic);
      setGameState(newGameLogic.getGameState());
      
      // Load song and songs after GameLogic is initialized
      const initializeGame = async () => {
        await loadSong(artistId, newGameLogic);
        await loadAvailableSongs(artistId);
      };
      
      initializeGame();
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      console.log('🧹 Cleaning up DynamicHeardle useEffect');
    };
  }, [params.artist, mode]); // Only run when artist or mode changes

  const loadSong = async (artistId: string, gameLogicInstance?: GameLogic) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const endpoint = mode === 'daily' ? `/api/${artistId}/daily` : `/api/${artistId}/random`;
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to load song');
      }
      
      const data = await response.json();
      const song = data.song;
      
      console.log(`\n=== ${artist?.displayName || artistId.toUpperCase()} GAME SONG LOADED ===`);
      console.log(`Song: ${song.name}`);
      console.log(`Album: ${song.album}`);
      console.log(`Artists: ${song.artists.join(', ')}`);
      console.log(`Duration: ${Math.round(song.duration / 1000)}s`);
      console.log(`Track ID: ${song.trackId}`);
      console.log(`Preview URL: ${song.previewUrl || 'NONE'}`);
      console.log(`iTunes URL: ${song.itunesUrl}`);
      
      setCurrentSong(song);
      
      // Use the passed instance or the one from state
      const logicToUse = gameLogicInstance || gameLogic;
      if (logicToUse) {
        logicToUse.startGame(song);
        setGameState(logicToUse.getGameState());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableSongs = async (artistId: string) => {
    try {
      const response = await fetch(`/api/${artistId}/songs`);
      if (response.ok) {
        const data = await response.json();
        const songs = data.songs || [];
        setAvailableSongs(songs);
        console.log(`Loaded ${songs.length} available ${artist?.displayName || artistId} songs from iTunes for autocomplete`);
        
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
    if (!gameLogic) return;
    const isCorrect = gameLogic.makeGuess(guess);
    setGameState(gameLogic.getGameState());
    
    if (isCorrect) {
      console.log('Correct guess!');
    } else {
      console.log(`Wrong guess. Next audio duration: ${gameLogic.getCurrentAudioDuration()}ms`);
    }
  };

  const handleSkip = () => {
    console.log('🎯 handleSkip called');
    console.log('🎯 gameLogic:', gameLogic);
    console.log('🎯 gameState:', gameState);
    
    if (!gameLogic) {
      console.error('❌ gameLogic is null, cannot skip');
      return;
    }
    
    console.log('🎯 Calling gameLogic.makeGuess("")');
    const result = gameLogic.makeGuess(''); // Empty guess counts as a skip
    console.log('🎯 makeGuess result:', result);
    
    const newGameState = gameLogic.getGameState();
    console.log('🎯 New game state:', newGameState);
    
    setGameState(newGameState);
    console.log(`🎯 Skipped turn. Next audio duration: ${gameLogic.getCurrentAudioDuration()}ms`);
  };

  const handleNewGame = () => {
    if (!gameLogic) return;
    if (mode === 'practice') {
      loadSong(params.artist as string);
    } else {
      gameLogic.resetGame();
      setGameState(gameLogic.getGameState());
    }
  };

  const handleAudioEnded = () => {
    // Audio preview ended, could add logic here if needed
  };

  if (!artist) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-600 text-lg">Artist not found</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className={`w-8 h-8 border-4 border-${artist.color}-500 border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
          <p className="text-gray-600">Loading {artist.displayName} song...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 text-lg mb-4">Error: {error}</div>
        <button
          onClick={() => loadSong(artist.id)}
          className={`px-6 py-3 bg-${artist.color}-500 text-white rounded-lg hover:bg-${artist.color}-600 transition-colors`}
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
        <h1 className={`text-4xl font-bold text-${artist.color}-600 mb-2`}>
          {artist.displayName} Heardle
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
            key={`${currentSong?.id}-${gameLogic?.getCurrentAudioDuration() || 0}`}
            song={currentSong}
            duration={gameLogic?.getCurrentAudioDuration() || 0}
            onEnded={handleAudioEnded}
            disabled={gameState?.isGameOver || false}
            isGameWon={gameState?.hasWon || false}
          />
          
          {!gameState?.isGameOver && (
            <GuessInput
              onSubmit={handleGuess}
              onSkip={handleSkip}
              disabled={gameState?.isGameOver}
              placeholder={`Guess the ${artist.displayName} song...`}
              availableSongs={availableSongs}
            />
          )}
          
          {gameState?.isGameOver && (
            <div className="text-center">
              <button
                onClick={handleNewGame}
                className={`px-8 py-3 bg-${artist.color}-500 text-white rounded-lg hover:bg-${artist.color}-600 transition-colors font-semibold`}
              >
                {mode === 'daily' ? 'Play Again' : 'New Song'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Game Board */}
        <div className="flex justify-center">
          {gameState && (
            <GameBoard gameState={gameState} />
          )}
        </div>
      </div>

      {/* Game Instructions */}
      <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">How to Play</h3>
        <ul className="space-y-2 text-gray-600">
          <li>• Listen to the song preview (starts with 1 second)</li>
          <li>• Guess the {artist.displayName} song title or click Skip to hear more</li>
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
