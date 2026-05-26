'use client';

import { GameState } from '@/lib/game';
import { normalizedStringMatch } from '@/lib/utils/stringUtils';
import { SKIP_MARKER } from '@/lib/constants';

interface GameBoardProps {
  gameState: GameState;
}

export default function GameBoard({ gameState }: GameBoardProps) {
  const { guesses, currentTry, maxTries, isGameOver } = gameState;

  const renderGuessRow = (index: number, guess: string | null, isCorrect: boolean | null) => {
    const isCurrentRow = index === currentTry && !isGameOver;
    const isPastRow = index < currentTry || (isGameOver && guess !== null);
    
    return (
      <div 
        key={index}
        className={`
          w-full flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-2xl border transition-all duration-300 backdrop-blur-sm
          ${isCurrentRow 
            ? 'theme-row-current' 
            : isPastRow 
              ? isCorrect 
                ? 'border-green-400/50 bg-green-500/20 shadow-lg shadow-green-500/25' 
                : 'border-red-400/50 bg-red-500/20 shadow-lg shadow-red-500/25'
              : 'theme-row-idle'
          }
        `}
      >
        <div className={`w-7 sm:w-8 h-7 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
          isCurrentRow 
            ? 'theme-row-badge-current' 
            : isPastRow 
              ? isCorrect 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
              : 'bg-[var(--icon-btn-bg)] theme-text-muted'
        }`}>
          {index + 1}
        </div>
        
        <div className="flex-1 min-w-0">
          {isCurrentRow ? (
            <div className="theme-text-secondary italic font-medium text-xs sm:text-sm">Your turn...</div>
          ) : guess ? (
            <div
              className="font-semibold theme-text text-[11px] sm:text-sm text-left leading-snug break-words overflow-hidden"
              style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}
            >
              {guess}
            </div>
          ) : (
            <div className="theme-text-muted text-xs sm:text-sm">-</div>
          )}
        </div>

        <div className="w-6 sm:w-7 h-6 sm:h-7 flex items-center justify-center flex-shrink-0">
          {isPastRow && (
            isCorrect ? (
              <div className="w-4 sm:w-5 h-4 sm:h-5 bg-green-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            ) : (
              <div className="w-4 sm:w-5 h-4 sm:h-5 bg-red-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xs font-bold">✗</span>
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-2 sm:space-y-3">
      <div className="text-center mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-bold theme-text mb-1 sm:mb-2 whitespace-nowrap leading-tight">
          🎯 Game Progress
        </h3>
        <p className="theme-text-secondary text-sm sm:text-base leading-tight">
          Try {Math.min(currentTry + 1, maxTries)} of {maxTries}
        </p>
      </div>

      <div className="flex flex-col items-center space-y-2 sm:space-y-3">
        {Array.from({ length: maxTries }, (_, index) => {
          const guess = guesses[index] || null;
          const isCorrect = guess ? 
            (guess === SKIP_MARKER ? false :
             (gameState.currentSong && 
              normalizedStringMatch(guess, gameState.currentSong.name))) : null;
          
          return renderGuessRow(index, guess, isCorrect);
        })}
      </div>
    </div>
  );
}
