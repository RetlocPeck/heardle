'use client';

import { GameState } from '@/lib/gameLogic';
import { normalizedStringMatch } from '@/lib/utils/stringUtils';

interface GameBoardProps {
  gameState: GameState;
}

export default function GameBoard({ gameState }: GameBoardProps) {
  const { guesses, currentTry, maxTries, isGameOver, hasWon } = gameState;

  const renderGuessRow = (index: number, guess: string | null, isCorrect: boolean | null) => {
    const isCurrentRow = index === currentTry && !isGameOver;
    const isPastRow = index < currentTry || (isGameOver && guess !== null);
    
    return (
      <div 
        key={index}
        className={`
          w-full flex items-center space-x-3 max-[400px]:space-x-2 p-3 max-[400px]:p-2 rounded-2xl border transition-all duration-300 backdrop-blur-sm
          ${isCurrentRow 
            ? 'border-pink-400/50 bg-pink-500/20 shadow-lg shadow-pink-500/25' 
            : isPastRow 
              ? isCorrect 
                ? 'border-green-400/50 bg-green-500/20 shadow-lg shadow-green-500/25' 
                : 'border-red-400/50 bg-red-500/20 shadow-lg shadow-red-500/25'
              : 'border-white/20 bg-white/5'
          }
        `}
      >
        <div className={`w-8 max-[400px]:w-7 h-8 max-[400px]:h-7 rounded-full flex items-center justify-center text-xs max-[400px]:text-xs sm:text-sm font-bold ${
          isCurrentRow 
            ? 'bg-pink-500 text-white' 
            : isPastRow 
              ? isCorrect 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
              : 'bg-white/20 text-white/60'
        }`}>
          {index + 1}
        </div>
        
        <div className="flex-1">
          {isCurrentRow ? (
            <div className="text-pink-300 italic font-medium text-sm max-[400px]:text-xs">Your turn...</div>
          ) : guess ? (
            <div className="font-semibold text-white text-sm max-[400px]:text-xs">{guess}</div>
          ) : (
            <div className="text-white/40 text-sm max-[400px]:text-xs">-</div>
          )}
        </div>

        <div className="w-7 max-[400px]:w-6 h-7 max-[400px]:h-6 flex items-center justify-center">
          {isPastRow && (
            isCorrect ? (
              <div className="w-5 max-[400px]:w-4 h-5 max-[400px]:h-4 bg-green-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xs max-[400px]:text-xs font-bold">✓</span>
              </div>
            ) : (
              <div className="w-5 max-[400px]:w-4 h-5 max-[400px]:h-4 bg-red-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xs max-[400px]:text-xs font-bold">✗</span>
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-3 max-[400px]:space-y-2">
      <div className="text-center mb-4 max-[400px]:mb-3">
        <h3 className="text-xl max-[400px]:text-lg font-bold text-white mb-2 max-[400px]:mb-1">
          🎯 Game Progress
        </h3>
        <p className="text-white/70 text-base max-[400px]:text-sm">
          Try {Math.min(currentTry + 1, maxTries)} of {maxTries}
        </p>
      </div>

      <div className="flex flex-col items-center space-y-3 max-[400px]:space-y-2">
        {Array.from({ length: maxTries }, (_, index) => {
          const guess = guesses[index] || null;
          const isCorrect = guess ? 
            (guess === '(Skipped)' ? false : // Skipped guesses are always incorrect
             (gameState.currentSong && 
              normalizedStringMatch(guess, gameState.currentSong.name))) : null;
          
          return renderGuessRow(index, guess, isCorrect);
        })}
      </div>
    </div>
  );
}