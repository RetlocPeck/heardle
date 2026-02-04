type Round = { action: 'guess'|'skip'; correct: boolean; seconds: 1|2|4|7|10|15 };

export type ShareGameState = {
  artist: string;               // e.g., "TWICE"
  rounds: Round[];              // length ≤ 6 in chronological order
  siteUrl?: string;             // default "https://heardle.live"
  puzzleNumber: number;         // from getLocalPuzzleNumber()
};

// Import the GameLogic types to convert from internal state
import type { GameState as InternalGameState } from '@/lib/game/gameLogic';
import { getArtistByName } from '@/config/artists';

// Duration progression from game logic: [1, 2, 4, 7, 10, 15] seconds
const DURATION_MAP: Record<number, 1|2|4|7|10|15> = {
  1000: 1,   // 1s -> 1s
  2000: 2,   // 2s -> 2s  
  4000: 4,   // 4s -> 4s
  7000: 7,   // 7s -> 7s
  10000: 10, // 10s -> 10s
  15000: 15, // 15s -> 15s
};

export function convertGameStateToShareState(
  gameState: InternalGameState,
  artist: string,
  puzzleNumber: number
): ShareGameState {
  const rounds: Round[] = [];
  
  // Build rounds based on guesses and game progression
  for (let i = 0; i < gameState.guesses.length; i++) {
    const guess = gameState.guesses[i];
    const isSkip = guess === '(Skipped)';
    
    // If the game was won, the last guess is the correct one
    // If the game was lost, no guesses are correct
    const isCorrect = !isSkip && gameState.hasWon && i === gameState.guesses.length - 1;
    
    // Get the duration for this round (1-indexed to 0-indexed)
    const durations = [1000, 2000, 4000, 7000, 10000, 15000];
    const durationMs = durations[i] || 15000;
    const seconds = DURATION_MAP[durationMs] || 15;
    
    rounds.push({
      action: isSkip ? 'skip' : 'guess',
      correct: isCorrect,
      seconds
    });
  }
  
  return {
    artist,
    rounds,
    puzzleNumber
  };
}

export function buildShareText(state: ShareGameState): string {
  const siteUrl = state.siteUrl ?? 'https://heardle.live';
  const winIndex = state.rounds.findIndex(r => r.correct);
  const won = winIndex !== -1;
  const score = won ? `${winIndex + 1}/6` : 'X/6';

  // Build grid up to the solving round, or all 6 if failed
  const upto = won ? winIndex + 1 : Math.min(6, state.rounds.length);
  const grid = state.rounds.slice(0, upto).map(r => r.correct ? '🟩' : '🟥').join('');

  // Use the artist ID from config instead of creating a slug from the name
  // This ensures URLs match the actual route structure
  const artistConfig = getArtistByName(state.artist);
  const artistSlug = artistConfig?.id ?? state.artist.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  
  return `${state.artist} Heardle #${state.puzzleNumber} ${score}\n${grid}\n${siteUrl}/${artistSlug}`;
}
