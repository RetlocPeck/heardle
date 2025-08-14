import { TWICESong } from '@/lib/itunes';

export type GameMode = 'daily' | 'practice';

export interface GameState {
  mode: GameMode;
  currentSong: TWICESong | null;
  currentTry: number;
  maxTries: number;
  isGameOver: boolean;
  hasWon: boolean;
  guesses: string[];
  audioDuration: number;
  startTime: number | null;
  endTime: number | null;
}

export interface GameSettings {
  initialDuration: number; // 1 second
  maxDuration: number; // 15 seconds
  maxTries: number; // 6 tries
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  initialDuration: 1000, // 1 second
  maxDuration: 15000, // 15 seconds
  maxTries: 6,
};

// Duration progression: 1s, 2s, 4s, 7s, 10s, 15s
const DURATION_PROGRESSION = [1000, 2000, 4000, 7000, 10000, 15000];

export class GameLogic {
  private state: GameState;
  private settings: GameSettings;

  constructor(mode: GameMode = 'practice', settings: GameSettings = DEFAULT_GAME_SETTINGS) {
    this.settings = settings;
    this.state = this.createInitialState(mode);
  }

  private createInitialState(mode: GameMode): GameState {
    return {
      mode,
      currentSong: null,
      currentTry: 0,
      maxTries: this.settings.maxTries,
      isGameOver: false,
      hasWon: false,
      guesses: [],
      audioDuration: this.settings.initialDuration,
      startTime: null,
      endTime: null,
    };
  }

  startGame(song: TWICESong): void {
    this.state = {
      ...this.createInitialState(this.state.mode),
      currentSong: song,
      startTime: Date.now(),
    };
  }

  makeGuess(guess: string): boolean {
    if (this.state.isGameOver || !this.state.currentSong) {
      return false;
    }

    // Handle skip (empty guess)
    if (!guess.trim()) {
      // Don't increment try count for skip if we're already at max tries
      if (this.state.currentTry >= this.state.maxTries) {
        this.state.isGameOver = true;
        this.state.endTime = Date.now();
        return false;
      }
      
      this.state.currentTry++;
      
      // Set audio duration for next try based on progression
      const nextTryIndex = this.state.currentTry;
      if (nextTryIndex < DURATION_PROGRESSION.length) {
        this.state.audioDuration = DURATION_PROGRESSION[nextTryIndex];
        console.log(`🎵 GameLogic: Turn ${this.state.currentTry} skipped. Next duration: ${this.state.audioDuration}ms (${this.state.audioDuration/1000}s)`);
      } else {
        this.state.audioDuration = this.settings.maxDuration;
        console.log(`🎵 GameLogic: Turn ${this.state.currentTry} skipped. Next duration: ${this.state.audioDuration}ms (${this.state.audioDuration/1000}s) - max reached`);
      }
      
      return false;
    }

    const isCorrect = this.checkGuess(guess, this.state.currentSong);
    this.state.guesses.push(guess);
    
    if (isCorrect) {
      // User won! Don't increment currentTry, keep it at the current value
      this.state.hasWon = true;
      this.state.isGameOver = true;
      this.state.endTime = Date.now();
      console.log(`🎵 GameLogic: User won on try ${this.state.currentTry + 1}!`);
      return true;
    }

    // User guessed wrong, increment try count
    this.state.currentTry++;

    // Check if game is over after wrong guess
    if (this.state.currentTry >= this.state.maxTries) {
      this.state.isGameOver = true;
      this.state.endTime = Date.now();
      console.log(`🎵 GameLogic: Game over after ${this.state.currentTry} tries. User lost.`);
      return false;
    }

    // Set audio duration for next try based on progression
    const nextTryIndex = this.state.currentTry;
    if (nextTryIndex < DURATION_PROGRESSION.length) {
      this.state.audioDuration = DURATION_PROGRESSION[nextTryIndex];
      console.log(`🎵 GameLogic: Try ${this.state.currentTry} completed. Next duration: ${this.state.audioDuration}ms (${this.state.audioDuration/1000}s)`);
    } else {
      this.state.audioDuration = this.settings.maxDuration;
      console.log(`🎵 GameLogic: Try ${this.state.currentTry} completed. Next duration: ${this.state.audioDuration}ms (${this.state.audioDuration/1000}s) - max reached`);
    }

    return false;
  }

  private checkGuess(guess: string, song: TWICESong): boolean {
    const normalizedGuess = this.normalizeString(guess);
    const normalizedSongName = this.normalizeString(song.name);
    
    // Only accept exact matches of the song title
    return normalizedGuess === normalizedSongName;
  }

  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  getCurrentAudioDuration(): number {
    return this.state.audioDuration;
  }

  getRemainingTries(): number {
    return this.state.maxTries - this.state.currentTry;
  }

  getGameState(): GameState {
    return { ...this.state };
  }

  resetGame(): void {
    this.state = this.createInitialState(this.state.mode);
  }

  getGameStats(): { accuracy: number; timeSpent: number | null } {
    if (!this.state.startTime) {
      return { accuracy: 0, timeSpent: null };
    }

    const timeSpent = this.state.endTime 
      ? this.state.endTime - this.state.startTime 
      : Date.now() - this.state.startTime;

    const accuracy = this.state.guesses.length > 0 
      ? (this.state.hasWon ? 1 : 0) 
      : 0;

    return { accuracy, timeSpent };
  }
}
