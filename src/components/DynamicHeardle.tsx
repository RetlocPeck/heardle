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
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  spinnerColor: string;
}

const ARTISTS: ArtistConfig[] = [
  {
    id: 'twice',
    name: 'TWICE',
    displayName: 'TWICE',
    color: 'pink',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-rose-600',
    accentColor: 'bg-pink-500 hover:bg-pink-600',
    spinnerColor: 'border-pink-400'
  },
  {
    id: 'le-sserafim',
    name: 'LE SSERAFIM',
    displayName: 'LE SSERAFIM',
    color: 'purple',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-indigo-600',
    accentColor: 'bg-purple-500 hover:bg-purple-600',
    spinnerColor: 'border-purple-400'
  }
];

export default function DynamicHeardle({ mode }: DynamicHeardleProps) {
  const params = useParams();
  const [gameLogic] = useState(() => new GameLogic(mode));
  const [gameState, setGameState] = useState<GameState>(gameLogic.getGameState());
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
      loadSong(artistId);
      loadAvailableSongs(artistId);
    }
  }, [params.artist, mode, gameLogic]);

  const loadSong = async (artistId: string) => {
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
      gameLogic.startGame(song);
      setGameState(gameLogic.getGameState());
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
    const isCorrect = gameLogic.makeGuess(guess);
    setGameState(gameLogic.getGameState());
    
    if (isCorrect) {
      console.log('Correct guess!');
    } else {
      console.log(`Wrong guess. Next audio duration: ${gameLogic.getCurrentAudioDuration()}ms`);
    }
  };

  const handleSkip = () => {
    gameLogic.makeGuess(''); // Empty guess counts as a skip
    setGameState(gameLogic.getGameState());
    console.log(`Skipped turn. Next audio duration: ${gameLogic.getCurrentAudioDuration()}ms`);
  };

  const handleNewGame = () => {
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
          <div className={`w-12 h-12 border-4 ${artist.spinnerColor} border-t-transparent rounded-full animate-spin mx-auto mb-6`}></div>
          <p className="text-white/80 text-lg">Loading {artist.displayName} song...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="backdrop-blur-xl bg-red-900/20 border border-red-500/30 rounded-3xl p-8">
          <div className="text-red-400 text-lg mb-6">Error: {error}</div>
          <button
            onClick={() => loadSong(artist.id)}
            className={`px-8 py-4 ${artist.accentColor} text-white rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl`}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentSong) {
    return (
      <div className="text-center p-8">
        <div className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-3xl p-8">
          <div className="text-white/80 text-lg">No song available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      {/* Header */}
      <div className="text-center">
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/20 p-8 mb-8">
          <h1 className={`text-5xl font-bold bg-gradient-to-r ${artist.gradientFrom} ${artist.gradientTo} bg-clip-text text-transparent mb-4`}>
            {artist.displayName} Heardle
          </h1>
          <p className="text-white text-xl mb-2">
            {mode === 'daily' ? '🌟 Daily Challenge' : '🎮 Practice Mode'}
          </p>
          {mode === 'daily' && (
            <p className="text-white/60">
              New song every day at midnight
            </p>
          )}
        </div>
      </div>

      {/* Game Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Column - Audio Player */}
        <div className="space-y-6">
          <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/20 p-6">
            <AudioPlayer
              key={`${currentSong?.id}-${gameLogic.getCurrentAudioDuration()}`}
              song={currentSong}
              duration={gameLogic.getCurrentAudioDuration()}
              onEnded={handleAudioEnded}
              disabled={gameState.isGameOver}
              isGameWon={gameState.hasWon}
            />
          </div>
          
          {!gameState.isGameOver && (
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/20 p-6">
              <GuessInput
                onSubmit={handleGuess}
                onSkip={handleSkip}
                disabled={gameState.isGameOver}
                placeholder={`Guess the ${artist.displayName} song...`}
                availableSongs={availableSongs}
              />
            </div>
          )}
          
          {gameState.isGameOver && (
            <div className="text-center">
              <button
                onClick={handleNewGame}
                className={`px-10 py-4 bg-gradient-to-r ${artist.gradientFrom} ${artist.gradientTo} text-white rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25`}
              >
                {mode === 'daily' ? '🔄 Play Again' : '🎵 New Song'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Game Board */}
        <div className="flex justify-center">
          <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/20 p-6 w-full">
            <GameBoard gameState={gameState} />
          </div>
        </div>
      </div>

      {/* Game Instructions */}
      <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/20 p-8 max-w-3xl mx-auto">
        <h3 className="text-2xl font-bold text-white mb-6 text-center">🎯 How to Play</h3>
        <ul className="space-y-3 text-white/80 text-lg">
          <li className="flex items-center space-x-3">
            <span className="text-pink-400">🎵</span>
            <span>Listen to the song preview (starts with 1 second)</span>
          </li>
          <li className="flex items-center space-x-3">
            <span className="text-purple-400">💭</span>
            <span>Guess the {artist.displayName} song title or click Skip to hear more</span>
          </li>
          <li className="flex items-center space-x-3">
            <span className="text-indigo-400">⏰</span>
            <span>Each wrong guess or skip gives you more time to listen</span>
          </li>
          <li className="flex items-center space-x-3">
            <span className="text-rose-400">🎯</span>
            <span>You have 6 tries to get it right</span>
          </li>
          <li className="flex items-center space-x-3">
            <span className="text-cyan-400">⏭️</span>
            <span>Use Skip if you want to hear more before guessing</span>
          </li>
        </ul>
        
        {availableSongs.length === 0 && (
          <div className="mt-6 p-4 bg-blue-500/20 border border-blue-400/30 rounded-2xl">
            <p className="text-blue-200">
              <strong>💡 Note:</strong> Song autocomplete is currently unavailable. 
              You can still play by typing the exact song title manually!
            </p>
          </div>
        )}
        
        {currentSong && !currentSong.previewUrl && (
          <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-400/30 rounded-2xl">
            <p className="text-yellow-200">
              <strong>⚠️ Note:</strong> Song preview is not available for this track. 
              You can still play by guessing the song title!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
