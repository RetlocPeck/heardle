'use client';

import { GameState } from '@/lib/gameLogic';

interface GameBoardProps {
  gameState: GameState;
}

export default function GameBoard({ gameState }: GameBoardProps) {
  const { guesses, currentTry, maxTries, isGameOver, hasWon, currentSong } = gameState;

  const renderGuessRow = (index: number, guess: string | null, isCorrect: boolean | null) => {
    const isCurrentRow = index === currentTry && !isGameOver;
    const isPastRow = index < currentTry;
    
    return (
      <div 
        key={index}
        className={`
          flex items-center space-x-4 p-4 rounded-2xl border transition-all duration-300 backdrop-blur-sm
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
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
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
            <div className="text-pink-300 italic font-medium">Your turn...</div>
          ) : guess ? (
            <div className="font-semibold text-white">{guess}</div>
          ) : (
            <div className="text-white/40">-</div>
          )}
        </div>

        <div className="w-8 h-8 flex items-center justify-center">
          {isPastRow && (
            isCorrect ? (
              <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
            ) : (
              <div className="w-6 h-6 bg-red-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">✗</span>
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
      <div className="mt-8 p-8 backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20">
        <div className="text-center">
          {hasWon ? (
            <div className="text-green-400">
              <div className="text-4xl font-bold mb-3">🎉 Correct! 🎉</div>
              <div className="text-xl text-white">You got it in {currentTry} tries!</div>
            </div>
          ) : (
            <div className="text-red-400">
              <div className="text-4xl font-bold mb-3">😔 Game Over</div>
              <div className="text-xl text-white">Better luck next time!</div>
            </div>
          )}
          
          {currentSong && (
            <div className="mt-6 p-6 backdrop-blur-md bg-white/5 rounded-2xl border border-white/10">
              <div className="font-bold text-white/80 text-lg mb-2">The song was:</div>
              <div className="text-2xl font-bold text-white mb-2">{currentSong.name}</div>
              <div className="text-white/70 mb-4">
                by {currentSong.artists.join(', ')} • {currentSong.album}
              </div>
              <a
                href={currentSong.itunesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
              >
                🎵 Listen on iTunes
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-lg space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">
          🎯 Game Progress
        </h3>
        <p className="text-white/70 text-lg">
          Try {currentTry + 1} of {maxTries}
        </p>
      </div>

      {Array.from({ length: maxTries }, (_, index) => {
        const guess = guesses[index] || null;
        const isCorrect = guess ? 
          (gameState.currentSong && 
           gameState.currentSong.name.toLowerCase().includes(guess.toLowerCase())) : null;
        
        return renderGuessRow(index, guess, isCorrect);
      })}

      {renderGameResult()}
    </div>
  );
}
