'use client';

import { useState, useEffect } from 'react';
import ClientDailyChallengeStorage from '@/lib/services/clientDailyChallengeStorage';

// Component to show daily challenge completion status
export function DailyChallengeStatus({ artistId }: { artistId: string }) {
  const [challengeData, setChallengeData] = useState<{ isCompleted: boolean; hasWon: boolean } | null>(null);
  
  useEffect(() => {
    const storage = ClientDailyChallengeStorage.getInstance();
    const isCompleted = storage.isDailyChallengeCompleted(artistId);
    const challenge = storage.loadDailyChallenge(artistId);
    const hasWon = challenge?.gameState.hasWon || false;
    
    setChallengeData({ isCompleted, hasWon });
    
    // Listen for storage changes to update the status immediately
    const handleStorageChange = () => {
      const newIsCompleted = storage.isDailyChallengeCompleted(artistId);
      const newChallenge = storage.loadDailyChallenge(artistId);
      const newHasWon = newChallenge?.gameState.hasWon || false;
      
      console.log(`📡 DailyChallengeStatus received event, updating status for ${artistId}:`, { isCompleted: newIsCompleted, hasWon: newHasWon });
      setChallengeData({ isCompleted: newIsCompleted, hasWon: newHasWon });
    };
    
    // Listen for custom storage event
    window.addEventListener('daily-challenge-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('daily-challenge-updated', handleStorageChange);
    };
  }, [artistId]);
  
  if (!challengeData) {
    return (
      <div className="inline-flex items-center px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full">
        <span className="text-blue-300 text-xs sm:text-sm font-medium">🎯 Daily Challenge Available</span>
      </div>
    );
  }
  
  if (challengeData.isCompleted) {
    if (challengeData.hasWon) {
      return (
        <div className="inline-flex items-center px-3 py-1 bg-green-500/20 border border-green-400/30 rounded-full">
          <span className="text-green-300 text-xs sm:text-sm font-medium">✅ Daily Challenge Completed</span>
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center px-3 py-1 bg-red-500/20 border border-red-400/30 rounded-full">
          <span className="text-red-300 text-xs sm:text-sm font-medium">❌ Daily Challenge Failed</span>
        </div>
      );
    }
  }
  
  return (
    <div className="inline-flex items-center px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full">
      <span className="text-blue-300 text-xs sm:text-sm font-medium">🎯 Daily Challenge Available</span>
    </div>
  );
}

interface ArtistHeaderProps {
  artist: {
    id: string;
    displayName: string;
    theme: {
      gradientFrom: string;
      gradientTo: string;
    };
  };
}

export default function ArtistHeader({ artist }: ArtistHeaderProps) {
  return (
    <div className="absolute left-1/2 transform -translate-x-1/2">
      {/* Header stack */}
      <div
        className="
          grid place-items-center text-center
          gap-1
          md:gap-2
        "
      >
        <h1
          className={`
            m-0
            text-lg sm:text-2xl lg:text-4xl font-bold bg-gradient-to-r ${artist.theme.gradientFrom} ${artist.theme.gradientTo} bg-clip-text text-transparent
            leading-tight md:leading-tight
            tracking-tight
          `}
        >
          <span className="hidden sm:inline">{artist.displayName} Heardle</span>
          <span className="sm:hidden">{artist.displayName}</span>
        </h1>

        <p
          className="
            m-0
            text-xs sm:text-sm lg:text-base
            leading-snug text-white/80 font-medium
            hidden sm:block
          "
        >
          Test your {artist.displayName} knowledge! 🎵
        </p>

        {/* Daily challenge status pill removed from navbar per mobile/desktop design */}
      </div>
    </div>
  );
}
