/**
 * Utility functions for game logic and scoring
 */

import { GameState } from '@/lib/game/gameLogic';

/**
 * Calculate game score based on number of tries used
 * Perfect score (1 try) = 6 points, decreasing by 1 for each additional try
 */
export function calculateScore(gameState: GameState): number {
  if (!gameState.hasWon) return 0;
  
  const triesUsed = gameState.guesses.filter(guess => guess !== '(Skipped)').length;
  const maxScore = gameState.maxTries;
  return Math.max(0, maxScore - triesUsed + 1);
}

/**
 * Get score emoji for sharing
 */
export function getScoreEmoji(score: number, maxScore: number): string {
  const percentage = score / maxScore;
  if (percentage === 1) return '🏆'; // Perfect score
  if (percentage >= 0.8) return '🥇'; // Gold
  if (percentage >= 0.6) return '🥈'; // Silver
  if (percentage >= 0.4) return '🥉'; // Bronze
  if (percentage > 0) return '🎯'; // Some points
  return '💔'; // No points
}

/**
 * Generate shareable result text
 */
export function generateShareText(
  gameState: GameState, 
  artistName: string, 
  mode: 'daily' | 'practice',
  date?: string
): string {
  const { hasWon, guesses, maxTries } = gameState;
  const score = calculateScore(gameState);
  const emoji = getScoreEmoji(score, maxTries);
  
  const headerText = mode === 'daily' 
    ? `${artistName} Heardle ${date || 'Daily'} ${emoji}`
    : `${artistName} Heardle Practice ${emoji}`;
  
  const resultText = hasWon 
    ? `${guesses.length}/${maxTries} 🎵`
    : `X/${maxTries} 💔`;
  
  // Create visual representation
  const visualRows = Array.from({ length: maxTries }, (_, index) => {
    if (index < guesses.length) {
      const guess = guesses[index];
      if (guess === '(Skipped)') return '⏭️';
      if (hasWon && index === guesses.length - 1) return '🎯';
      return '❌';
    }
    return '⬜';
  }).join('');
  
  return `${headerText}\n${resultText}\n${visualRows}\n\nPlay at: twice-heardle.com`;
}

/**
 * Get performance rating based on tries used
 */
export function getPerformanceRating(gameState: GameState): {
  rating: string;
  description: string;
  color: string;
} {
  if (!gameState.hasWon) {
    return {
      rating: 'Better luck next time!',
      description: 'Keep practicing to improve your skills',
      color: 'text-red-400'
    };
  }
  
  const triesUsed = gameState.guesses.filter(guess => guess !== '(Skipped)').length;
  
  switch (triesUsed) {
    case 1:
      return {
        rating: 'PERFECT!',
        description: 'Incredible! You got it on the first try!',
        color: 'text-yellow-400'
      };
    case 2:
      return {
        rating: 'EXCELLENT!',
        description: 'Amazing musical knowledge!',
        color: 'text-green-400'
      };
    case 3:
      return {
        rating: 'GREAT!',
        description: 'Well done! You know your music!',
        color: 'text-blue-400'
      };
    case 4:
      return {
        rating: 'GOOD!',
        description: 'Nice work! Getting better!',
        color: 'text-purple-400'
      };
    case 5:
      return {
        rating: 'OKAY',
        description: 'Not bad! Keep practicing!',
        color: 'text-orange-400'
      };
    default:
      return {
        rating: 'CLOSE!',
        description: 'You got it! Every guess counts!',
        color: 'text-pink-400'
      };
  }
}

/**
 * Calculate time bonus (if game was completed quickly)
 */
export function calculateTimeBonus(gameState: GameState): number {
  if (!gameState.hasWon || !gameState.startTime || !gameState.endTime) return 0;
  
  const timeSpent = (gameState.endTime - gameState.startTime) / 1000; // in seconds
  
  // Bonus points for completing quickly
  if (timeSpent < 30) return 3; // Lightning fast
  if (timeSpent < 60) return 2; // Very fast
  if (timeSpent < 120) return 1; // Fast
  return 0; // Normal time
}

/**
 * Get total score including time bonus
 */
export function getTotalScore(gameState: GameState): number {
  const baseScore = calculateScore(gameState);
  const timeBonus = calculateTimeBonus(gameState);
  return baseScore + timeBonus;
}

/**
 * Check if this is a new personal best
 */
export function isPersonalBest(
  currentScore: number, 
  previousBest: number | null
): boolean {
  return previousBest === null || currentScore > previousBest;
}

/**
 * Get difficulty rating for a song based on play statistics
 */
export function getSongDifficulty(
  correctGuesses: number, 
  totalAttempts: number
): { level: string; percentage: number; color: string } {
  if (totalAttempts === 0) {
    return { level: 'Unknown', percentage: 0, color: 'text-gray-400' };
  }
  
  const successRate = (correctGuesses / totalAttempts) * 100;
  
  if (successRate >= 80) {
    return { level: 'Easy', percentage: successRate, color: 'text-green-400' };
  } else if (successRate >= 60) {
    return { level: 'Medium', percentage: successRate, color: 'text-yellow-400' };
  } else if (successRate >= 40) {
    return { level: 'Hard', percentage: successRate, color: 'text-orange-400' };
  } else {
    return { level: 'Expert', percentage: successRate, color: 'text-red-400' };
  }
}
