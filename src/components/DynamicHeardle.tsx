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
import ClientDailyChallengeStorage from '@/lib/services/clientDailyChallengeStorage';
import { StatisticsStorage } from '@/lib/services/statisticsStorage';

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
      // For daily mode, check if we have a saved game state
      if (mode === 'daily') {
        const storage = ClientDailyChallengeStorage.getInstance();
        const savedChallenge = storage.loadDailyChallenge(artistId);
        
        if (savedChallenge) {
          // Load saved game state
          console.log(`📂 Loading saved daily challenge for ${artistId}`);
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
    
    if (isCorrect) {
      console.log('Correct guess!');
    } else {
      console.log(`Wrong guess. Next audio duration: ${gameLogic.getCurrentAudioDuration()}ms`);
    }
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
      <div className="w-full p-2 sm:p-4 lg:p-6 xl:p-8 2xl:p-12 max-w-[1400px] mx-auto">
        {/* Header - More Compact */}
        <div className="text-center mb-4 max-[400px]:mb-3">
          <p className="text-white/60 text-base max-[400px]:text-sm lg:text-lg xl:text-xl">
            {mode === 'daily' && 'New song every day at midnight'}
          </p>
        </div>

        {/* Main Game Layout - Two columns on mobile, three on larger screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Left Column - Audio Player & Input/Results */}
          <div className="col-span-1 space-y-3 sm:space-y-4">
            {/* Audio Player Card */}
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/20 p-3 sm:p-4 lg:p-6">
              <AudioPlayer
                key={`${currentSong?.id}-${gameLogic.getCurrentAudioDuration()}`}
                song={currentSong}
                duration={gameLogic.getCurrentAudioDuration()}
                onEnded={handleAudioEnded}
                disabled={gameState.isGameOver}
                isGameWon={gameState.hasWon}
              />
            </div>
            
                         {/* Guess Input Card (when game is not over) OR Results Card (when game is over - mobile only) */}
             {!gameState.isGameOver ? (
               <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/20 p-3 sm:p-4 lg:p-6">
                 <GuessInput
                   onSubmit={handleGuess}
                   onSkip={handleSkip}
                   disabled={gameState.isGameOver}
                   placeholder={`Guess the ${artist.displayName} song...`}
                   availableSongs={availableSongs}
                 />
               </div>
             ) : (
               // Game Results Card - Only show on mobile/tablet (hidden on desktop)
               <div className="lg:hidden backdrop-blur-xl bg-white/5 rounded-3xl border border-white/20 p-3 sm:p-4 lg:p-6">
                 <div className="text-center space-y-4">
                   {gameState.hasWon ? (
                     <div className="space-y-3">
                       <div className="text-4xl">🎉</div>
                       <h3 className="text-xl sm:text-2xl font-bold text-green-300">Correct!</h3>
                       <div className="text-white/80 text-base sm:text-lg">
                         You got it in <span className="text-green-300 font-bold">{gameState.currentTry + 1}</span> {gameState.currentTry === 0 ? 'try' : 'tries'}!
                       </div>
                     </div>
                   ) : (
                     <div className="space-y-3">
                       <div className="text-4xl">😔</div>
                       <h3 className="text-xl sm:text-2xl font-bold text-orange-300">Game Over</h3>
                       <div className="text-white/80 text-base sm:text-lg">
                         Better luck next time!
                       </div>
                     </div>
                   )}
                   
                   {/* Song details and iTunes button */}
                   <div className="pt-2">
                     <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-3 sm:p-4">
                       <div className="text-center space-y-3">
                         <div className="text-white/70 text-sm sm:text-base">
                           <span className="text-white/50">The song was:</span>
                         </div>
                         <div className="text-white font-bold text-base sm:text-lg">
                           {currentSong?.name}
                         </div>
                         <div className="text-white/70 text-xs sm:text-sm">
                           <span className="text-white/50">Album:</span> {currentSong?.album}
                         </div>
                         
                         <div className="pt-2">
                           <a
                             href={currentSong?.itunesUrl}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="inline-flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-bold text-sm sm:text-base hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
                           >
                             <span>🎵</span>
                             <span>Listen on iTunes</span>
                           </a>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             )}
             
            {/* New Song button for practice mode */}
            {gameState.isGameOver && mode === 'practice' && (
              <div className="text-center">
                <button
                  onClick={handleNewGame}
                  className={`px-6 py-3 bg-gradient-to-r ${artist.theme.gradientFrom} ${artist.theme.gradientTo} text-white rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 hover:shadow-2xl`}
                >
                  🎵 New Song
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Game Board */}
          <div className="col-span-1">
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/20 p-3 sm:p-4 lg:p-6 h-full">
              <GameBoard gameState={gameState} />
            </div>
          </div>

          {/* Third Column - Game Instructions OR Game Results (hidden on mobile/tablet, shown on lg+ screens) */}
          <div className="hidden lg:block">
            {gameState.isGameOver ? (
              // Game Results Card (replaces How to Play when game ends)
              <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/20 p-6 h-full">
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
                </div>
              </div>
            ) : (
              // How to Play Card (shown when game is not over)
              <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/20 p-6 h-full">
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

        {/* How to Play Card - At the bottom on mobile/tablet only */}
        <div className="lg:hidden mt-4">
          <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/20 p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-bold text-white mb-3 text-center">🎯 How to Play</h3>
            <ul className="space-y-2 text-white/80 text-xs sm:text-sm mx-auto max-w-md">
              <li className="flex items-start space-x-2">
                <span className="text-pink-400 mt-0.5 text-sm">🎵</span>
                <span>Listen to the song preview (starts with 1 second)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-0.5 text-sm">💭</span>
                <span>Guess the {artist.displayName} song title or click Skip</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-indigo-400 mt-0.5 text-sm">⏰</span>
                <span>Each wrong guess or skip gives you more time</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-rose-400 mt-0.5 text-sm">🎯</span>
                <span>You have 6 tries to get it right</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 mt-0.5 text-sm">⏭️</span>
                <span>Use Skip to hear more before guessing</span>
              </li>
            </ul>
            
            {availableSongs.length === 0 && (
              <div className="mt-3 p-2 sm:p-3 bg-blue-500/20 border border-blue-400/30 rounded-2xl">
                <p className="text-blue-200 text-xs sm:text-sm">
                  <strong>💡 Note:</strong> Song autocomplete is currently unavailable. 
                  You can still play by typing the exact song title manually!
                </p>
              </div>
            )}
            
            {currentSong && !currentSong.previewUrl && (
              <div className="mt-3 p-2 sm:p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-2xl">
                <p className="text-yellow-200 text-xs sm:text-sm">
                  <strong>⚠️ Note:</strong> Song preview is not available for this track. 
                  You can still play by guessing the song title!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
