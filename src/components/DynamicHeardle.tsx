'use client';

import { useState, useEffect, useCallback } from 'react';
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
import ClientDailyChallengeStorage from '@/lib/services/clientDailyChallengeStorage';
import { StatisticsStorage } from '@/lib/services/statisticsStorage';
import { PracticeModeStorage } from '@/lib/services/practiceModeStorage';
import ShareButton from './ShareButton';
import SupportButton from './SupportButton';
import { convertGameStateToShareState } from '@/utils/share';
import { getPuzzleNumber } from '@/utils/puzzle';

interface DynamicHeardleProps {
  mode: GameMode;
  onGameStateChange?: (gameState: GameState) => void;
}

export default function DynamicHeardle({ mode, onGameStateChange }: DynamicHeardleProps) {
  const params = useParams();
  const [gameLogic] = useState(() => new GameLogic(mode));
  const [gameState, setGameState] = useState<GameState>(gameLogic.getGameState());
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [artist, setArtist] = useState<ArtistConfig | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const artistId = params.artist as string;
    const foundArtist = getArtistById(artistId);
    if (foundArtist) {
      setArtist(foundArtist);
      loadSong(artistId);
      loadAvailableSongs(artistId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.artist, mode, gameLogic]);

  // Detect mobile (match Tailwind's lg breakpoint at 1024px)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 1023.98px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const loadSong = useCallback(async (artistId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // For daily mode, check if we have a saved game state
      if (mode === 'daily') {
        const storage = ClientDailyChallengeStorage.getInstance();
        const savedChallenge = storage.loadDailyChallenge(artistId);
        
        if (savedChallenge) {
          // Load saved game state

          setCurrentSong(savedChallenge.gameState.currentSong);
          gameLogic.loadGameState(savedChallenge.gameState);
          const loadedGameState = gameLogic.getGameState();
          setGameState(loadedGameState);
          
          // Notify parent component of loaded game state
          onGameStateChange?.(loadedGameState);
          
          setIsLoading(false);
          return;
        }
      }
      
      // Load new song from API
      let endpoint = mode === 'daily' ? `/api/${artistId}/daily` : `/api/${artistId}/random`;
      
      // For practice mode, exclude recently played songs
      if (mode === 'practice') {
        const practiceStorage = PracticeModeStorage.getInstance();
        const recentSongs = practiceStorage.getRecentSongs(artistId);
        
        if (recentSongs.length > 0) {
          const excludeParams = new URLSearchParams({ exclude: recentSongs.join(',') });
          endpoint = `${endpoint}?${excludeParams.toString()}`;
        }
      }
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to load song');
      }
      
      const data = await response.json();
      const song = data.song;
      

      
      setCurrentSong(song);
      gameLogic.startGame(song);
      setGameState(gameLogic.getGameState());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [mode, gameLogic, onGameStateChange]);

  const loadAvailableSongs = useCallback(async (artistId: string) => {
    try {
      const response = await fetch(`/api/${artistId}/songs`);
      if (response.ok) {
        const data = await response.json();
        const songs = data.songs || [];
        setAvailableSongs(songs);

        
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
  }, []);

  const handleGuess = (guess: string) => {
    gameLogic.makeGuess(guess);
    const newGameState = gameLogic.getGameState();
    setGameState(newGameState);
    
    // Save daily challenge state if in daily mode
    if (mode === 'daily' && currentSong) {
      const storage = ClientDailyChallengeStorage.getInstance();
      storage.saveDailyChallenge(params.artist as string, currentSong.id, newGameState);
    }
    
    // Record statistics when game ends
    if (newGameState.isGameOver && currentSong) {
      const statsStorage = StatisticsStorage.getInstance();
      const tries = newGameState.currentTry + 1; // +1 because currentTry is 0-indexed
      
      if (mode === 'daily') {
        statsStorage.recordDailyChallenge(params.artist as string, newGameState.hasWon, tries);
      } else {
        statsStorage.recordPracticeGame(params.artist as string, newGameState.hasWon, tries);
      }
    }
    
    // Notify parent component of game state change
    onGameStateChange?.(newGameState);
    

  };

  const handleSkip = () => {
    gameLogic.makeGuess(''); // Empty guess counts as a skip
    const newGameState = gameLogic.getGameState();
    setGameState(newGameState);
    
    // Save daily challenge state if in daily mode
    if (mode === 'daily' && currentSong) {
      const storage = ClientDailyChallengeStorage.getInstance();
      storage.saveDailyChallenge(params.artist as string, currentSong.id, newGameState);
    }
    
    // Record statistics when game ends
    if (newGameState.isGameOver && currentSong) {
      const statsStorage = StatisticsStorage.getInstance();
      const tries = newGameState.currentTry + 1; // +1 because currentTry is 0-indexed
      
      if (mode === 'daily') {
        statsStorage.recordDailyChallenge(params.artist as string, newGameState.hasWon, tries);
      } else {
        statsStorage.recordPracticeGame(params.artist as string, newGameState.hasWon, tries);
      }
    }
    
    // Notify parent component of game state change
    onGameStateChange?.(newGameState);
    

  };

  const handleNewGame = () => {
    if (mode === 'practice') {
      // Record the current song before loading a new one (to prevent immediate repeats)
      if (currentSong) {
        const practiceStorage = PracticeModeStorage.getInstance();
        practiceStorage.recordPlayedSong(params.artist as string, currentSong.trackId.toString());

      }
      
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
      <div className="w-full pt-0 px-2 pb-2 sm:px-4 sm:pb-4 lg:px-6 lg:pb-6 xl:px-8 xl:pb-8 2xl:px-12 2xl:pb-12 max-w-[1400px] mx-auto">
        {/* Header spacing removed; tagline moved to parent alongside countdown */}

        {/* Main Game Layout - Two columns on mobile, three on larger screens */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-6 items-stretch">
          {/* Left Column - uniform gap-controlled stack */}
          <div className="col-span-1 flex flex-col h-full gap-2 sm:gap-3 lg:gap-4">
            {/* Audio card */}
            <div className="relative z-10 overflow-visible backdrop-blur-xl bg-white/5 rounded-2xl sm:rounded-3xl border border-white/20 p-2 sm:p-3 lg:p-6">
              <AudioPlayer
                key={`${currentSong?.id}-${gameLogic.getCurrentAudioDuration()}`}
                song={currentSong}
                duration={gameLogic.getCurrentAudioDuration()}
                onEnded={handleAudioEnded}
                disabled={gameState.isGameOver}
                isGameWon={gameState.hasWon}
              />
            </div>

            {/* Guess card (only while active) */}
            {!gameState.isGameOver && (
              <div className="relative z-10 overflow-visible backdrop-blur-xl bg-white/5 rounded-2xl sm:rounded-3xl border border-white/20 p-2 sm:p-3 lg:p-6">
                <GuessInput
                  onSubmit={handleGuess}
                  onSkip={handleSkip}
                  disabled={gameState.isGameOver}
                  placeholder={isMobile ? 'Guess the song...' : `Guess the ${artist.displayName} song...`}
                  availableSongs={availableSongs}
                />
              </div>
            )}

            {/* Final card (always last) */}
            {!gameState.isGameOver ? (
              <div className="lg:hidden relative z-10 overflow-visible backdrop-blur-xl bg-white/5 rounded-2xl sm:rounded-3xl border border-white/20 p-2 sm:p-3">
                <h3 className="text-sm sm:text-base font-bold text-white mb-2 sm:mb-3 text-center">🎯 How to Play</h3>
                <ul className="space-y-1 sm:space-y-2 text-white/80 text-xs sm:text-sm mx-auto max-w-md">
                  <li className="flex items-start space-x-1 sm:space-x-2">
                    <span className="text-pink-400 mt-0.5 text-xs sm:text-sm">🎵</span>
                    <span>Listen to the song preview (starts with 1 second)</span>
                  </li>
                  <li className="flex items-start space-x-1 sm:space-x-2">
                    <span className="text-purple-400 mt-0.5 text-xs sm:text-sm">💭</span>
                    <span>Guess the {artist.displayName} song title or click Skip</span>
                  </li>
                  <li className="flex items-start space-x-1 sm:space-x-2">
                    <span className="text-indigo-400 mt-0.5 text-xs sm:text-sm">⏰</span>
                    <span>Each wrong guess or skip gives you more time</span>
                  </li>
                  <li className="flex items-start space-x-1 sm:space-x-2">
                    <span className="text-rose-400 mt-0.5 text-xs sm:text-sm">🎯</span>
                    <span>You have 6 tries to get it right</span>
                  </li>
                  <li className="flex items-start space-x-1 sm:space-x-2">
                    <span className="text-cyan-400 mt-0.5 text-xs sm:text-sm">⏭️</span>
                    <span>Use Skip to hear more before guessing</span>
                  </li>
                </ul>
                {availableSongs.length === 0 && (
                  <div className="mt-2 sm:mt-3 p-2 bg-blue-500/20 border border-blue-400/30 rounded-xl sm:rounded-2xl">
                    <p className="text-blue-200 text-xs sm:text-sm">
                      <strong>💡 Note:</strong> Song autocomplete is currently unavailable. 
                      You can still play by typing the exact song title manually!
                    </p>
                  </div>
                )}
                {currentSong && !currentSong.previewUrl && (
                  <div className="mt-2 sm:mt-3 p-2 bg-yellow-500/20 border border-yellow-400/30 rounded-xl sm:rounded-2xl">
                    <p className="text-yellow-200 text-xs sm:text-sm">
                      <strong>⚠️ Note:</strong> Song preview is not available for this track. 
                      You can still play by guessing the song title!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative z-10 overflow-visible lg:hidden backdrop-blur-xl bg-white/5 rounded-2xl sm:rounded-3xl border border-white/20 p-2 sm:p-3 lg:p-6">
                <div className="text-center space-y-2 sm:space-y-4">
                  {gameState.hasWon ? (
                    <div className="space-y-2 sm:space-y-3">
                      <div className="text-2xl sm:text-4xl">🎉</div>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-green-300">Correct!</h3>
                      <div className="text-white/80 text-sm sm:text-base lg:text-lg">
                        You got it in <span className="text-green-300 font-bold">{gameState.currentTry + 1}</span> {gameState.currentTry === 0 ? 'try' : 'tries'}!
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      <div className="text-2xl sm:text-4xl">😔</div>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-300">Game Over</h3>
                      <div className="text-white/80 text-sm sm:text-base lg:text-lg">
                        Better luck next time!
                      </div>
                    </div>
                  )}
                  <div className="pt-1 sm:pt-2">
                    <div className="backdrop-blur-xl bg-white/10 rounded-xl sm:rounded-2xl border border-white/20 p-2 sm:p-3 lg:p-4">
                      <div className="text-center space-y-2 sm:space-y-3">
                        <div className="text-white/70 text-xs sm:text-sm lg:text-base">
                          <span className="text-white/50">The song was:</span>
                        </div>
                        <div className="text-white font-bold text-sm sm:text-base lg:text-lg">
                          {currentSong?.name}
                        </div>
                        <div className="text-white/70 text-xs sm:text-sm">
                          <span className="text-white/50">Album:</span> {currentSong?.album}
                        </div>
                        <div className="pt-1 sm:pt-2">
                          <a
                            href={currentSong?.itunesUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2 lg:py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm lg:text-base hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
                          >
                            <span>🎵</span>
                            <span>Listen on iTunes</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  {mode === 'daily' && (
                    <ShareButton
                      state={convertGameStateToShareState(
                        gameState,
                        artist?.displayName || 'Unknown Artist',
                        getPuzzleNumber()
                      )}
                      className="mt-2 sm:mt-4 rounded-lg sm:rounded-xl bg-green-500 text-white px-3 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25"
                    />
                  )}
                  {mode === 'practice' && (
                    <div className="text-center">
                      <button
                        onClick={handleNewGame}
                        className={`mt-2 px-4 py-2 bg-gradient-to-r ${artist.theme.gradientFrom} ${artist.theme.gradientTo} text-white rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-2xl`}
                      >
                        🎵 New Song
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Practice mode new song button on desktop - underneath audio card */}
            {mode === 'practice' && gameState.isGameOver && (
              <div className="text-center hidden lg:block">
                <button
                  onClick={handleNewGame}
                  className={`px-6 py-3 bg-gradient-to-r ${artist.theme.gradientFrom} ${artist.theme.gradientTo} text-white rounded-2xl font-bold text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-2xl`}
                >
                  🎵 New Song
                </button>
              </div>
            )}

            {/* Desktop-only donate stays as-is */}
            <div className="text-center hidden lg:block">
              <SupportButton />
            </div>
          </div>

          {/* Right Column - Game Board */}
          <div className="col-span-1 flex flex-col min-h-0 lg:min-h-[600px]">
            <div className="relative z-10 overflow-visible backdrop-blur-xl bg-white/5 rounded-2xl sm:rounded-3xl border border-white/20 p-2 sm:p-3 lg:p-6 h-full flex flex-col">
              <div className="flex-1">
                <GameBoard gameState={gameState} />
              </div>
              {/* Support Button pinned to bottom on mobile, always visible on mobile */}
              <div
                className="mt-2 sm:mt-3 lg:hidden text-center pt-1"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
              >
                <SupportButton variant="home" />
              </div>
            </div>
          </div>

          {/* Third Column - Game Instructions OR Game Results (hidden on mobile/tablet, shown on lg+ screens) */}
          <div className="hidden lg:block">
            {gameState.isGameOver ? (
              // Game Results Card (replaces How to Play when game ends)
              <div className="relative z-10 overflow-visible backdrop-blur-xl bg-white/5 rounded-3xl border border-white/20 p-6 h-full">
                <div className="text-center space-y-4">
                  {gameState.hasWon ? (
                    <div className="space-y-3">
                      <div className="text-4xl">🎉</div>
                      <h3 className="text-2xl font-bold text-green-300">Correct!</h3>
                      <div className="text-white/80 text-lg">
                        You got it in <span className="text-green-300 font-bold">{gameState.currentTry + 1}</span> {gameState.currentTry === 0 ? 'try' : 'tries'}!
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-4xl">😔</div>
                      <h3 className="text-2xl font-bold text-orange-300">Game Over</h3>
                      <div className="text-white/80 text-lg">
                        Better luck next time!
                      </div>
                    </div>
                  )}
                  
                  {/* Song details and iTunes button */}
                  <div className="pt-4">
                    <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-4">
                      <div className="text-center space-y-3">
                        <div className="text-white/70 text-base">
                          <span className="text-white/50">The song was:</span>
                        </div>
                        <div className="text-white font-bold text-lg">
                          {currentSong?.name}
                        </div>
                        <div className="text-white/70 text-sm">
                          <span className="text-white/50">Album:</span> {currentSong?.album}
                        </div>
                        
                        <div className="pt-2">
                          <a
                            href={currentSong?.itunesUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
                          >
                            <span>🎵</span>
                            <span>Listen on iTunes</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                                      {/* Share button - below the inner sub-card (daily mode only) */}
                  {mode === 'daily' && (
                    <ShareButton
                      state={convertGameStateToShareState(
                        gameState,
                        artist?.displayName || 'Unknown Artist',
                        getPuzzleNumber()
                      )}
                      className="mt-4 rounded-xl bg-green-500 text-white px-4 py-3 font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25"
                    />
                  )}
                </div>
              </div>
            ) : (
              // How to Play Card (shown when game is not over)
              <div className="relative z-10 overflow-visible backdrop-blur-xl bg-white/5 rounded-3xl border border-white/20 p-6 h-full">
                <h3 className="text-lg font-bold text-white mb-3 text-center">🎯 How to Play</h3>
                <ul className="space-y-2 text-white/80 text-sm mx-auto max-w-md">
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
            )}
          </div>
        </div>


      </div>
    </ErrorBoundary>
  );
}
