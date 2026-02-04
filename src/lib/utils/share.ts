import type { GameState as InternalGameState } from '@/lib/game/gameLogic';
import { getArtistByName } from '@/config/artists';
import {
  SKIP_MARKER,
  DURATION_PROGRESSION_MS,
  DURATION_MAP,
  MAX_TRIES,
} from '@/lib/constants/game';

type Round = { action: 'guess'|'skip'; correct: boolean; seconds: 1|2|4|7|10|15 };

export type ShareGameState = {
  artist: string;               // e.g., "TWICE"
  rounds: Round[];              // length ≤ 6 in chronological order
  siteUrl?: string;             // default "https://heardle.live"
  puzzleNumber: number;         // from getLocalPuzzleNumber()
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
    const isSkip = guess === SKIP_MARKER;
    
    // If the game was won, the last guess is the correct one
    // If the game was lost, no guesses are correct
    const isCorrect = !isSkip && gameState.hasWon && i === gameState.guesses.length - 1;
    
    // Get the duration for this round (1-indexed to 0-indexed)
    const durationMs = DURATION_PROGRESSION_MS[i] || DURATION_PROGRESSION_MS[DURATION_PROGRESSION_MS.length - 1];
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
  const score = won ? `${winIndex + 1}/${MAX_TRIES}` : `X/${MAX_TRIES}`;

  // Build grid up to the solving round, or all 6 if failed
  const upto = won ? winIndex + 1 : Math.min(MAX_TRIES, state.rounds.length);
  const grid = state.rounds.slice(0, upto).map(r => r.correct ? '🟩' : '🟥').join('');

  // Use the artist ID from config instead of creating a slug from the name
  // This ensures URLs match the actual route structure
  const artistConfig = getArtistByName(state.artist);
  const artistSlug = artistConfig?.id ?? state.artist.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  
  return `${state.artist} Heardle #${state.puzzleNumber} ${score}\n${grid}\n${siteUrl}/${artistSlug}`;
}
