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
  onNewGame?: () => void;
  /** 'mobile' uses smaller sizing, 'desktop' uses larger sizing */
  variant?: 'mobile' | 'desktop';
}

export default function GameResultCard({
  gameState,
  currentSong,
  mode,
  artist,
  onNewGame,
  variant = 'desktop',
}: GameResultCardProps) {
  const isMobile = variant === 'mobile';

  // Responsive classes based on variant
  const emojiSize = isMobile ? 'text-2xl sm:text-4xl' : 'text-4xl';
  const headingSize = isMobile ? 'text-lg sm:text-xl lg:text-2xl' : 'text-2xl';
  const textSize = isMobile ? 'text-sm sm:text-base lg:text-lg' : 'text-lg';
  const spacing = isMobile ? 'space-y-2 sm:space-y-3' : 'space-y-3';
  const outerSpacing = isMobile ? 'space-y-2 sm:space-y-4' : 'space-y-4';
  const cardPadding = isMobile ? 'p-2 sm:p-3 lg:p-4' : 'p-4';
  const cardRounding = isMobile ? 'rounded-xl sm:rounded-2xl' : 'rounded-2xl';
  const buttonPadding = isMobile
    ? 'px-3 sm:px-4 lg:px-6 py-2 sm:py-2 lg:py-3'
    : 'px-6 py-3';
  const buttonRounding = isMobile ? 'rounded-lg sm:rounded-xl' : 'rounded-xl';
  const buttonText = isMobile ? 'text-xs sm:text-sm lg:text-base' : 'text-base';
  const songNameSize = isMobile ? 'text-sm sm:text-base lg:text-lg' : 'text-lg';
  const detailSize = isMobile ? 'text-xs sm:text-sm' : 'text-sm';
  const labelSize = isMobile ? 'text-xs sm:text-sm lg:text-base' : 'text-base';

  return (
    <div className={`text-center ${outerSpacing}`}>
      {/* Win/Lose Header */}
      {gameState.hasWon ? (
        <div className={spacing}>
          <div className={emojiSize}>🎉</div>
          <h3 className={`${headingSize} font-bold text-green-300`}>Correct!</h3>
          <div className={`text-white/80 ${textSize}`}>
            You got it in{' '}
            <span className="text-green-300 font-bold">
              {gameState.currentTry + 1}
            </span>{' '}
            {gameState.currentTry === 0 ? 'try' : 'tries'}!
          </div>
        </div>
      ) : (
        <div className={spacing}>
          <div className={emojiSize}>😔</div>
          <h3 className={`${headingSize} font-bold text-orange-300`}>Game Over</h3>
          <div className={`text-white/80 ${textSize}`}>Better luck next time!</div>
        </div>
      )}

      {/* Song Details Card */}
      <div className={isMobile ? 'pt-1 sm:pt-2' : 'pt-4'}>
        <div
          className={`backdrop-blur-xl bg-white/10 ${cardRounding} border border-white/20 ${cardPadding}`}
        >
          <div className={`text-center ${spacing}`}>
            <div className={`text-white/70 ${labelSize}`}>
              <span className="text-white/50">The song was:</span>
            </div>
            <div className={`text-white font-bold ${songNameSize}`}>
              {currentSong?.name}
            </div>
            <div className={`text-white/70 ${detailSize}`}>
              <span className="text-white/50">Album:</span> {currentSong?.album}
            </div>

            <div className={isMobile ? 'pt-1 sm:pt-2' : 'pt-2'}>
              <a
                href={currentSong?.trackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center ${isMobile ? 'space-x-1 sm:space-x-2' : 'space-x-2'} ${buttonPadding} bg-gradient-to-r from-blue-500 to-cyan-600 text-white ${buttonRounding} font-bold ${buttonText} hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105`}
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
          className={`${isMobile ? 'mt-2 sm:mt-4' : 'mt-4'} ${buttonRounding} bg-green-500 text-white ${isMobile ? 'px-3 sm:px-4 py-2 sm:py-3' : 'px-4 py-3'} font-medium ${isMobile ? 'text-xs sm:text-sm' : ''} transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25`}
        />
      )}

      {/* New Song Button (practice mode only - mobile version) */}
      {mode === 'practice' && isMobile && onNewGame && (
        <div className="text-center">
          <button
            onClick={onNewGame}
            className={`mt-2 px-4 py-2 bg-gradient-to-r ${artist.theme.gradientFrom} ${artist.theme.gradientTo} text-white rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-2xl`}
          >
            🎵 New Song
          </button>
        </div>
      )}
    </div>
  );
}
