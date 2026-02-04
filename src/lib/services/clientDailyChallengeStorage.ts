import { GameState } from '@/lib/game';
import DailyChallengeStorage from './dailyChallengeStorage';
import { getLocalPuzzleNumber } from '@/lib/utils/dateUtils';

/**
 * Client-side wrapper for DailyChallengeStorage
 * Prevents hydration mismatches by ensuring storage operations only happen on the client
 */
export class ClientDailyChallengeStorage {
  private static instance: ClientDailyChallengeStorage;
  private storage: DailyChallengeStorage | null = null;
  private isClient = false;

  private constructor() {}

  static getInstance(): ClientDailyChallengeStorage {
    if (!ClientDailyChallengeStorage.instance) {
      ClientDailyChallengeStorage.instance = new ClientDailyChallengeStorage();
    }
    return ClientDailyChallengeStorage.instance;
  }

  private ensureClient() {
    if (typeof window === 'undefined') {
      throw new Error('ClientDailyChallengeStorage can only be used on the client side');
    }
    
    if (!this.isClient) {
      this.isClient = true;
      this.storage = DailyChallengeStorage.getInstance();
    }
  }

  saveDailyChallenge(artistId: string, songId: string, gameState: GameState, puzzleNumber: number = getLocalPuzzleNumber()): void {
    this.ensureClient();
    this.storage!.saveDailyChallenge(artistId, songId, gameState, puzzleNumber);
  }

  loadDailyChallenge(artistId: string) {
    this.ensureClient();
    return this.storage!.loadDailyChallenge(artistId);
  }

  isDailyChallengeCompleted(artistId: string): boolean {
    this.ensureClient();
    return this.storage!.isDailyChallengeCompleted(artistId);
  }

  hasDailyChallenge(artistId: string): boolean {
    this.ensureClient();
    return this.storage!.hasDailyChallenge(artistId);
  }

  clearDailyChallenge(artistId: string): void {
    this.ensureClient();
    this.storage!.clearDailyChallenge(artistId);
  }

  clearAllDailyChallenges(): void {
    this.ensureClient();
    this.storage!.clearAllDailyChallenges();
  }

  getCompletionStats(artistId: string) {
    this.ensureClient();
    return this.storage!.getCompletionStats(artistId);
  }
}

export default ClientDailyChallengeStorage;
