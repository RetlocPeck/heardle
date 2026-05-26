'use client';

import { useState, useEffect } from 'react';
import DailyChallengeStorage from '@/lib/services/dailyChallengeStorage';
import { DAILY_CHALLENGE_UPDATED_EVENT } from '@/lib/constants';

interface DailyChallengeUpdatedDetail {
  artistId?: string;
  date?: string;
  completed?: boolean;
  isNewDaily?: boolean;
}

export function DailyChallengeStatus({ artistId }: { artistId: string }) {
  const [challengeData, setChallengeData] = useState<{ isCompleted: boolean; hasWon: boolean } | null>(null);

  useEffect(() => {
    const updateChallengeData = () => {
      const storage = DailyChallengeStorage.getInstance();
      const isCompleted = storage.isDailyChallengeCompleted(artistId);
      const challenge = storage.loadDailyChallenge(artistId);
      const hasWon = challenge?.gameState.hasWon || false;
      setChallengeData({ isCompleted, hasWon });
    };

    updateChallengeData();

    const handleStorageChange = (event: Event) => {
      const detail = (event as CustomEvent<DailyChallengeUpdatedDetail>).detail;
      if (detail?.isNewDaily && detail?.artistId === artistId) {
        setChallengeData({ isCompleted: false, hasWon: false });
        return;
      }
      updateChallengeData();
    };

    window.addEventListener(DAILY_CHALLENGE_UPDATED_EVENT, handleStorageChange);
    window.addEventListener('storage', updateChallengeData);

    return () => {
      window.removeEventListener(DAILY_CHALLENGE_UPDATED_EVENT, handleStorageChange);
      window.removeEventListener('storage', updateChallengeData);
    };
  }, [artistId]);

  if (!challengeData || !challengeData.isCompleted) {
    return (
      <div className="inline-flex items-center px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full">
        <span className="text-blue-300 text-xs sm:text-sm font-medium">🎯 Daily Challenge Available</span>
      </div>
    );
  }

  if (challengeData.hasWon) {
    return (
      <div className="inline-flex items-center px-3 py-1 bg-green-500/20 border border-green-400/30 rounded-full">
        <span className="text-green-300 text-xs sm:text-sm font-medium">✅ Daily Challenge Completed</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center px-3 py-1 bg-red-500/20 border border-red-400/30 rounded-full">
      <span className="text-red-300 text-xs sm:text-sm font-medium">❌ Daily Challenge Failed</span>
    </div>
  );
}
