'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getArtistById } from '@/config/artists';
import type { ArtistConfig } from '@/config/artists';
import DynamicHeardle from '@/components/DynamicHeardle';
import ModeSelector from '@/components/ModeSelector';
import StatisticsButton from '@/components/StatisticsButton';
import PageLoadingSpinner from '@/components/ui/LoadingSpinner';
import ArtistHeader from '@/components/ArtistHeader';
import { useClientDate } from '@/lib/hooks/useClientDate';
import { GameMode } from '@/lib/gameLogic';



export default function ArtistPage() {
  const params = useParams();
  const [selectedMode, setSelectedMode] = useState<GameMode>('daily');
  const [artist, setArtist] = useState<ArtistConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getTodayString } = useClientDate();

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
         <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
                       <div className="flex justify-between items-center py-8 md:py-12">
              {/* Back Button - Smaller on mobile */}
              <div className="flex items-center flex-shrink-0">
                <a href="/" className="flex items-center space-x-1 sm:space-x-2 text-white/80 hover:text-white transition-colors font-medium">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm sm:text-base hidden sm:inline">Back to Artists</span>
                  <span className="sm:hidden">Back</span>
                </a>
              </div>
              
              {/* Centered Header Stack - Absolutely positioned */}
              <ArtistHeader artist={artist} selectedMode={selectedMode} />
              
              {/* Statistics Button - Smaller on mobile */}
              <div className="flex items-center justify-end flex-shrink-0">
                <StatisticsButton artistId={artist.id} currentMode={selectedMode} />
              </div>
            </div>
         </div>
       </div>

             {/* Main Content */}
       <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-4">
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
                detail: { artistId: artist.id, date: getTodayString(), completed: gameState.isGameOver }
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
