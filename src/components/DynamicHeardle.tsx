'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Song } from '@/types/song';
import { GameLogic, GameMode, GameState } from '@/lib/gameLogic';
import AudioPlayer from './AudioPlayer';
import GuessInput from './GuessInput';
import GameBoard from './GameBoard';
import { ArtistLoadingSpinner } from './ui/LoadingSpinner';
import ErrorBoundary from './ui/ErrorBoundary';
import { getArtistById } from '@/config/artists';
import type { ArtistConfig } from '@/config/artists';

interface DynamicHeardleProps {
  mode: GameMode;
}

export default function DynamicHeardle({ mode }: DynamicHeardleProps) {
  const params = useParams();
  const [gameLogic] = useState(() => new GameLogic(mode));
  const [gameState, setGameState] = useState<GameState>(gameLogic.getGameState());
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [artist, setArtist] = useState<ArtistConfig | null>(null);

  useEffect(() => {
    const artistId = params.artist as string;
    const foundArtist = getArtistById(artistId);
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
      <ArtistLoadingSpinner 
        artistName={artist?.displayName} 
      />
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="backdrop-blur-xl bg-red-900/20 border border-red-500/30 rounded-3xl p-8">
          <div className="text-red-400 text-lg mb-6">Error: {error}</div>
          <button
            onClick={() => loadSong(artist.id)}
            className={`px-8 py-4 ${artist.theme.accentColor} text-white rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl`}
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
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header - More Compact */}
        <div className="text-center mb-6">
          <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/20 p-6">
            <h1 className={`text-4xl lg:text-5xl font-bold bg-gradient-to-r ${artist.theme.gradientFrom} ${artist.theme.gradientTo} bg-clip-text text-transparent mb-2`}>
              {artist.displayName} Heardle
            </h1>
            <p className="text-white text-lg lg:text-xl">
              {mode === 'daily' ? '🌟 Daily Challenge' : '🎮 Practice Mode'}
              {mode === 'daily' && <span className="text-white/60 ml-2">• New song every day at midnight</span>}
            </p>
          </div>
        </div>

        {/* Main Game Layout - Three columns on larger screens */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column - Audio Player & Input */}
          <div className="xl:col-span-4 space-y-4">
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
                  className={`px-8 py-3 bg-gradient-to-r ${artist.theme.gradientFrom} ${artist.theme.gradientTo} text-white rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25`}
                >
                  {mode === 'daily' ? '🔄 Play Again' : '🎵 New Song'}
                </button>
              </div>
            )}
          </div>

          {/* Middle Column - Game Board */}
          <div className="xl:col-span-4">
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/20 p-6 h-full">
              <GameBoard gameState={gameState} />
            </div>
          </div>

          {/* Right Column - Game Instructions (Compact) */}
          <div className="xl:col-span-4">
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/20 p-6 h-full">
              <h3 className="text-xl font-bold text-white mb-4 text-center">🎯 How to Play</h3>
              <ul className="space-y-2 text-white/80 text-sm lg:text-base">
                <li className="flex items-start space-x-2">
                  <span className="text-pink-400 mt-0.5">🎵</span>
                  <span>Listen to the song preview (starts with 1 second)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-400 mt-0.5">💭</span>
                  <span>Guess the {artist.displayName} song title or click Skip</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-indigo-400 mt-0.5">⏰</span>
                  <span>Each wrong guess or skip gives you more time</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-400 mt-0.5">🎯</span>
                  <span>You have 6 tries to get it right</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-cyan-400 mt-0.5">⏭️</span>
                  <span>Use Skip to hear more before guessing</span>
                </li>
              </ul>
              
              {availableSongs.length === 0 && (
                <div className="mt-4 p-3 bg-blue-500/20 border border-blue-400/30 rounded-2xl">
                  <p className="text-blue-200 text-sm">
                    <strong>💡 Note:</strong> Song autocomplete is currently unavailable. 
                    You can still play by typing the exact song title manually!
                  </p>
                </div>
              )}
              
              {currentSong && !currentSong.previewUrl && (
                <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-2xl">
                  <p className="text-yellow-200 text-sm">
                    <strong>⚠️ Note:</strong> Song preview is not available for this track. 
                    You can still play by guessing the song title!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
