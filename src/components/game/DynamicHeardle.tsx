'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Logger } from '@/lib/utils/logger';
import { useParams } from 'next/navigation';
import { Song } from '@/types/song';
import { GameLogic, GameMode, GameState } from '@/lib/game';
import AudioPlayer from './AudioPlayer';
import GuessInput from './GuessInput';
import GameBoard from './GameBoard';
import GameResultCard from './GameResultCard';
import HowToPlayCard from './HowToPlayCard';
import GlassCard from '@/components/ui/GlassCard';
import { ArtistLoadingSpinner } from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { getArtistById } from '@/config/artists';
import type { ArtistConfig } from '@/config/artists';
import DailyChallengeStorage from '@/lib/services/dailyChallengeStorage';
import { StatisticsStorage } from '@/lib/services/statisticsStorage';
import { PracticeModeStorage } from '@/lib/services/practiceModeStorage';
import SupportButton from '@/components/ui/buttons/SupportButton';
import { getLocalPuzzleNumber, getTodayString } from '@/lib/utils/dateUtils';
import { useDailyRolloverDetection, useNewDailyChallengeListener } from '@/lib/hooks/useDailyRolloverDetection';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

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

  // Keep the parent callback in a ref so callbacks that use it never need it as a dep.
  const onGameStateChangeRef = useRef(onGameStateChange);
  useEffect(() => { onGameStateChangeRef.current = onGameStateChange; }, [onGameStateChange]);

  // ── Core game data loading ────────────────────────────────────────────────

  const loadSong = useCallback(async (artistId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (mode === 'daily') {
        const storage = DailyChallengeStorage.getInstance();
        const savedChallenge = storage.loadDailyChallenge(artistId);
        
        if (savedChallenge) {
          setCurrentSong(savedChallenge.gameState.currentSong);
          gameLogic.loadGameState(savedChallenge.gameState);
          const loadedGameState = gameLogic.getGameState();
          setGameState(loadedGameState);
          onGameStateChangeRef.current?.(loadedGameState);
          setIsLoading(false);
          return;
        }
      }
      
      let endpoint = mode === 'daily' ? `/api/${artistId}/daily` : `/api/${artistId}/random`;
      
      if (mode === 'daily') {
        const clientDate = getTodayString();
        const searchParams = new URLSearchParams({ date: clientDate });
        endpoint = `${endpoint}?${searchParams.toString()}`;
      }
      
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
      setCurrentSong(data.song);
      gameLogic.startGame(data.song);
      setGameState(gameLogic.getGameState());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [mode, gameLogic]);

  const loadAvailableSongs = useCallback(async (artistId: string) => {
    try {
      const response = await fetch(`/api/${artistId}/songs`);
      if (response.ok) {
        const data = await response.json();
        const songs = data.songs || [];
        setAvailableSongs(songs);
        if (songs.length === 0) {
          Logger.warn('No songs loaded for autocomplete');
        }
      } else {
        Logger.warn(`Failed to load available songs: ${response.status} ${response.statusText}`);
        setAvailableSongs([]);
      }
    } catch (err) {
      Logger.warn('Failed to load available songs for autocomplete:', err);
      setAvailableSongs([]);
    }
  }, []);

  /**
   * Record game statistics and save daily challenge state after a guess/skip.
   */
  const recordGameResult = useCallback((newGameState: GameState, song: Song | null) => {
    const artistId = params.artist as string;
    
    if (mode === 'daily' && song) {
      const storage = DailyChallengeStorage.getInstance();
      storage.saveDailyChallenge(artistId, song.id, newGameState, getLocalPuzzleNumber());
    }
    
    if (newGameState.isGameOver && song) {
      const statsStorage = StatisticsStorage.getInstance();
      const tries = newGameState.currentTry + 1;
      
      if (mode === 'daily') {
        statsStorage.recordDailyChallenge(artistId, newGameState.hasWon, tries);
      } else {
        statsStorage.recordPracticeGame(artistId, newGameState.hasWon, tries);
      }
    }
    
    onGameStateChangeRef.current?.(newGameState);
  }, [mode, params.artist]);

  // ── Effects ───────────────────────────────────────────────────────────────

  // Initial data load — re-runs only when the artist route changes.
  // mode and gameLogic are stable within a component instance because
  // the parent keys DynamicHeardle by mode, remounting on mode switches.
  useEffect(() => {
    const artistId = params.artist as string;
    const foundArtist = getArtistById(artistId);
    if (foundArtist) {
      setArtist(foundArtist);
      loadSong(artistId);
      loadAvailableSongs(artistId);
    }
  }, [params.artist, loadSong, loadAvailableSongs]);

  // 8c: Use the shared hook instead of a direct matchMedia effect.
  // useMediaQuery includes the Safari-compatible addListener fallback.
  const isMobile = useMediaQuery('(max-width: 1023.98px)');

  // ── Rollover detection (single owner — not duplicated in the parent page) ─

  useDailyRolloverDetection({
    artistId: params.artist as string,
    enabled: mode === 'daily',
  });

  useNewDailyChallengeListener(params.artist as string, useCallback(() => {
    if (mode !== 'daily') return;
    gameLogic.resetGame();
    setGameState(gameLogic.getGameState());
    loadSong(params.artist as string);
  }, [mode, gameLogic, loadSong, params.artist]));

  // ── Event handlers ────────────────────────────────────────────────────────

  const handleGuess = (guess: string) => {
    gameLogic.makeGuess(guess);
    const newGameState = gameLogic.getGameState();
    setGameState(newGameState);
    recordGameResult(newGameState, currentSong);
  };

  const handleSkip = () => {
    gameLogic.makeGuess('');
    const newGameState = gameLogic.getGameState();
    setGameState(newGameState);
    recordGameResult(newGameState, currentSong);
  };

  const handleNewGame = () => {
    if (mode === 'practice') {
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

  const handleAudioEnded = useCallback(() => {
    // No-op; extend here if game-over logic ever needs an audio-ended signal.
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

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

  // Single source of truth for the side card content — rendered in both
  // the mobile slot (left column, lg:hidden) and the desktop slot (third column).
  const sideCardContent = gameState.isGameOver ? (
    <GameResultCard
      gameState={gameState}
      currentSong={currentSong}
      mode={mode}
      artist={artist}
    />
  ) : (
    <HowToPlayCard
      artistDisplayName={artist.displayName}
      availableSongs={availableSongs}
      currentSong={currentSong}
    />
  );

  return (
    <ErrorBoundary>
      <div className="w-full pt-0 px-2 pb-2 sm:px-4 sm:pb-4 lg:px-6 lg:pb-6 xl:px-8 xl:pb-8 2xl:px-12 2xl:pb-12 max-w-[1400px] mx-auto">
        {/* Main Game Layout - Two columns on mobile, three on larger screens */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-6 items-stretch">
          {/* Left Column */}
          <div className="col-span-1 flex flex-col h-full gap-2 sm:gap-3 lg:gap-4">
            {/* Audio card */}
            <GlassCard>
              <AudioPlayer
                key={currentSong?.id}
                song={currentSong}
                duration={gameLogic.getCurrentAudioDuration()}
                onEnded={handleAudioEnded}
                disabled={gameState.isGameOver}
                isGameWon={gameState.hasWon}
              />
            </GlassCard>

            {mode === 'practice' && gameState.isGameOver && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleNewGame}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 shadow-md bg-gradient-to-r ${artist.theme.gradientFrom} ${artist.theme.gradientTo} text-white font-medium text-xs sm:text-sm transition-transform duration-150 ease-out hover:scale-105 focus:outline-none focus-visible:ring focus-visible:ring-white/40 cursor-pointer`}
                >
                  <span aria-hidden="true">🎵</span>
                  <span>New Song</span>
                </button>
              </div>
            )}

            {/* Guess card (only while active) */}
            {!gameState.isGameOver && (
              <GlassCard>
                <GuessInput
                  onSubmit={handleGuess}
                  onSkip={handleSkip}
                  disabled={gameState.isGameOver}
                  placeholder={isMobile ? 'Guess the song...' : `Guess the ${artist.displayName} song...`}
                  availableSongs={availableSongs}
                />
              </GlassCard>
            )}

            {/* Side card — mobile slot (hidden on lg+) */}
            <GlassCard padding={gameState.isGameOver ? 'md' : 'sm'} className="lg:hidden">
              {sideCardContent}
            </GlassCard>

            <div className="text-center hidden lg:block">
              <SupportButton />
            </div>
          </div>

          {/* Center Column - Game Board */}
          <div className="col-span-1 flex flex-col min-h-0 lg:min-h-[600px]">
            <GlassCard fullHeight flexCol>
              <div className="flex-1">
                <GameBoard gameState={gameState} />
              </div>
              <div
                className="mt-2 sm:mt-3 lg:hidden text-center pt-1"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
              >
                <SupportButton variant="home" />
              </div>
            </GlassCard>
          </div>

          {/* Third Column — desktop slot (hidden on mobile) */}
          <div className="hidden lg:block">
            <GlassCard padding="lg" rounded="lg" fullHeight>
              {sideCardContent}
            </GlassCard>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
