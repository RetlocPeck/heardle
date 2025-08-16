'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { GameMode } from '@/lib/gameLogic';
import ModeSelector from '@/components/ModeSelector';
import DynamicHeardle from '@/components/DynamicHeardle';
import { PageLoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getArtistById } from '@/config/artists';
import type { ArtistConfig } from '@/config/artists';
import DailyChallengeStorage from '@/lib/services/dailyChallengeStorage';
import StatisticsButton from '@/components/StatisticsButton';

// Component to show daily challenge completion status
function DailyChallengeStatus({ artistId }: { artistId: string }) {
  const [challengeData, setChallengeData] = useState<{ isCompleted: boolean; hasWon: boolean } | null>(null);
  
  useEffect(() => {
    const storage = DailyChallengeStorage.getInstance();
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
      <div className="mt-2 inline-flex items-center px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full">
        <span className="text-blue-300 text-sm font-medium">🎯 Daily Challenge Available</span>
      </div>
    );
  }
  
  if (challengeData.isCompleted) {
    if (challengeData.hasWon) {
      return (
        <div className="mt-2 inline-flex items-center px-3 py-1 bg-green-500/20 border border-green-400/30 rounded-full">
          <span className="text-green-300 text-sm font-medium">✅ Daily Challenge Completed</span>
        </div>
      );
    } else {
      return (
        <div className="mt-2 inline-flex items-center px-3 py-1 bg-red-500/20 border border-red-400/30 rounded-full">
          <span className="text-red-300 text-sm font-medium">❌ Daily Challenge Failed</span>
        </div>
      );
    }
  }
  
  return (
    <div className="mt-2 inline-flex items-center px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full">
      <span className="text-blue-300 text-sm font-medium">🎯 Daily Challenge Available</span>
    </div>
  );
}

export default function ArtistPage() {
  const params = useParams();
  const [selectedMode, setSelectedMode] = useState<GameMode>('daily');
  const [artist, setArtist] = useState<ArtistConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const artistId = params.artist as string;
    const foundArtist = getArtistById(artistId);
    
    if (foundArtist) {
      setArtist(foundArtist);
    }
    setIsLoading(false);
  }, [params.artist]);

  if (isLoading) {
    return <PageLoadingSpinner />;
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
                 {/* Animated Background Elements */}
         <div className="absolute inset-0 overflow-hidden">
           <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full filter blur-xl opacity-70 animate-blob"></div>
           <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/30 rounded-full filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
         </div>
        <div className="relative z-10 text-center">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 p-12">
            <h1 className="text-5xl font-bold text-white mb-6">Artist Not Found</h1>
            <p className="text-white/80 mb-8 text-lg">The artist you're looking for doesn't exist.</p>
            <a
              href="/"
              className="inline-block px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
               {/* Animated Background Elements */}
         <div className="absolute inset-0 overflow-hidden">
           <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full filter blur-xl opacity-70 animate-blob"></div>
           <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/30 rounded-full filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
           <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-500/30 rounded-full filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
         </div>

             {/* Header */}
       <div className="relative z-10 backdrop-blur-md bg-white/10 border-b border-white/20">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex justify-between items-center py-6">
             <div className="flex items-center w-1/3">
               <a href="/" className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors font-medium">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                 </svg>
                 <span>Back to Artists</span>
               </a>
             </div>
             <div className="text-center w-1/3">
               <h1 className={`text-4xl font-bold bg-gradient-to-r ${artist.theme.gradientFrom} ${artist.theme.gradientTo} bg-clip-text text-transparent`}>
                 {artist.displayName} Heardle
               </h1>
               <p className="text-white/80 font-medium">Test your {artist.displayName} knowledge! 🎵</p>
               
               {/* Daily Challenge Status */}
               {selectedMode === 'daily' && (
                 <DailyChallengeStatus artistId={artist.id} />
               )}
             </div>
             <div className="flex items-center justify-end w-1/3">
               <StatisticsButton artistId={artist.id} currentMode={selectedMode} />
             </div>
           </div>
         </div>
       </div>

             {/* Main Content */}
       <div className="relative z-10 container mx-auto py-4">
         <ModeSelector 
          selectedMode={selectedMode} 
          onModeChange={setSelectedMode} 
        />
        <DynamicHeardle 
          mode={selectedMode} 
          onGameStateChange={(gameState) => {
            // Force update of the DailyChallengeStatus component
            if (gameState.isGameOver) {
              const event = new CustomEvent('daily-challenge-updated', {
                detail: { artistId: artist.id, date: new Date().toISOString().split('T')[0], completed: gameState.isGameOver }
              });
              window.dispatchEvent(event);
              console.log(`📡 Artist page dispatched daily-challenge-updated event:`, event.detail);
            }
          }}
        />
      </div>
    </div>
  );
}
