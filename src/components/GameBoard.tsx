'use client';

import { GameState } from '@/lib/gameLogic';

interface GameBoardProps {
  gameState: GameState;
}

export default function GameBoard({ gameState }: GameBoardProps) {
  if (!gameState) {
    return (
      <div className="w-full max-w-md space-y-3">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Game Progress
          </h3>
          <p className="text-sm text-gray-600 font-medium">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  const { guesses, currentTry, maxTries, isGameOver, hasWon, currentSong } = gameState;

  const renderGuessRow = (index: number, guess: string | null, isCorrect: boolean | null) => {
    const isCurrentRow = index === currentTry && !isGameOver;
    const isPastRow = index < currentTry || (isGameOver && guess !== null);
    
    // Handle skipped guesses
    if (guess === '(Skipped)') {
      return (
        <div 
          key={index}
          className="flex items-center space-x-3 p-3 rounded-lg border-2 border-gray-300 bg-gray-50 transition-all duration-200"
        >
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
            {index + 1}
          </div>
          
          <div className="flex-1">
            <div className="text-gray-500 italic font-medium">Skipped</div>
          </div>

          <div className="w-6 h-6 flex items-center justify-center">
            <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">-</span>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div 
        key={index}
        className={`
          flex items-center space-x-3 p-3 rounded-lg border-2 transition-all duration-200
          ${isCurrentRow 
            ? 'border-pink-300 bg-pink-50' 
            : isPastRow 
              ? isCorrect 
                ? 'border-green-500 bg-green-50' 
                : 'border-red-500 bg-red-50'
              : 'border-gray-200 bg-gray-50'
          }
        `}
      >
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
          {index + 1}
        </div>
        
        <div className="flex-1">
          {isCurrentRow ? (
            <div className="text-gray-500 italic font-medium">Your turn...</div>
          ) : guess ? (
            <div className="font-medium text-gray-800">{guess}</div>
          ) : (
            <div className="text-gray-400">-</div>
          )}
        </div>

        <div className="w-6 h-6 flex items-center justify-center">
          {isPastRow && (
            isCorrect ? (
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            ) : (
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">✗</span>
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  const renderGameResult = () => {
    if (!isGameOver) return null;

    return (
      <div className="mt-6 p-6 bg-white rounded-lg shadow-lg border-2 border-pink-200">
        <div className="text-center">
          {hasWon ? (
            <div className="text-green-600">
              <div className="text-2xl font-bold mb-2">🎉 Correct! 🎉</div>
              <div className="text-lg text-gray-800">You got it in {currentTry + 1} tries!</div>
            </div>
          ) : (
            <div className="text-red-600">
              <div className="text-2xl font-bold mb-2">😔 Game Over</div>
              <div className="text-lg">Better luck next time!</div>
            </div>
          )}
          
          {currentSong && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-800">The song was:</div>
              <div className="text-lg text-gray-700 mt-1">{currentSong.name}</div>
              <div className="text-sm text-gray-600 mt-1">
                by {currentSong.artists.join(', ')} • {currentSong.album}
              </div>
              <a
                href={currentSong.itunesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Listen on iTunes
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-md space-y-3">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Game Progress
        </h3>
        <p className="text-sm text-gray-600 font-medium">
          Try {Math.min(currentTry + 1, maxTries)} of {maxTries}
        </p>
      </div>

      <div className="space-y-3">
        {Array.from({ length: maxTries }, (_, index) => {
          const guess = guesses[index] || null;
          // Use exact matching logic like in gameLogic.ts, but skip is never correct
          const isCorrect = guess && guess !== '(Skipped)' && gameState.currentSong ? 
            guess.toLowerCase().trim() === gameState.currentSong.name.toLowerCase().trim() : null;
          
          return renderGuessRow(index, guess, isCorrect);
        })}
      </div>

      {renderGameResult()}
    </div>
  );
}
