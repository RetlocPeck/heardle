'use client';

import type { GameState, GameMode } from '@/lib/game';
import type { Song } from '@/types/song';
import type { ArtistConfig } from '@/config/artists';
import ShareButton from '@/components/ui/buttons/ShareButton';
import { convertGameStateToShareState } from '@/lib/utils/share';
import { getLocalPuzzleNumber } from '@/lib/utils/dateUtils';

interface GameResultCardProps {
  gameState: GameState;
  currentSong: Song | null;
  mode: GameMode;
  artist: ArtistConfig;
}

export default function GameResultCard({
  gameState,
  currentSong,
  mode,
  artist,
}: GameResultCardProps) {
  return (
    <div className="text-center space-y-2 sm:space-y-4">
      {/* Win/Lose Header */}
      {gameState.hasWon ? (
        <div className="space-y-2 sm:space-y-3">
          <div className="text-2xl sm:text-4xl">🎉</div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-green-300">Correct!</h3>
          <div className="theme-text-secondary text-sm sm:text-base lg:text-lg">
            You got it in{' '}
            <span className="text-green-300 font-bold">
              {gameState.currentTry + 1}
            </span>{' '}
            {gameState.currentTry === 0 ? 'try' : 'tries'}!
          </div>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          <div className="text-2xl sm:text-4xl">😔</div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-300">Game Over</h3>
          <div className="theme-text-secondary text-sm sm:text-base lg:text-lg">Better luck next time!</div>
        </div>
      )}

      {/* Song Details Card */}
      <div className="pt-1 sm:pt-2 lg:pt-4">
        <div className="backdrop-blur-xl theme-glass-surface rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-4">
          <div className="text-center space-y-2 sm:space-y-3">
            <div className="theme-text-secondary text-xs sm:text-sm lg:text-base">
              <span className="theme-text-muted">The song was:</span>
            </div>
            <div className="theme-text font-bold text-sm sm:text-base lg:text-lg">
              {currentSong?.name}
            </div>
            <div className="theme-text-secondary text-xs sm:text-sm">
              <span className="theme-text-muted">Album:</span> {currentSong?.album}
            </div>

            <div className="pt-1 sm:pt-2">
              <a
                href={currentSong?.trackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm lg:text-base hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
              >
                <span>🎵</span>
                <span>Listen on Apple Music</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Share Button (daily mode only) */}
      {mode === 'daily' && (
        <ShareButton
          state={convertGameStateToShareState(
            gameState,
            artist?.displayName || 'Unknown Artist',
            getLocalPuzzleNumber()
          )}
          className="mt-2 sm:mt-4 rounded-lg sm:rounded-xl bg-green-500 text-white px-3 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25"
        />
      )}
    </div>
  );
}
