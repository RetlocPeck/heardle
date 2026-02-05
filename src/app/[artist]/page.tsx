'use client';

import { use, useState, useEffect } from 'react';
import { getArtistById } from '@/config/artists';
import type { ArtistConfig } from '@/config/artists';
import DynamicHeardle from '@/components/game/DynamicHeardle';
import ModeSelector from '@/components/game/ModeSelector';
import StatisticsButton from '@/components/stats/StatisticsButton';
import PageLoadingSpinner from '@/components/ui/LoadingSpinner';
import { DailyChallengeStatus } from '@/components/artist/ArtistHeader';
import NextDailyCountdown from '@/components/game/NextDailyCountdown';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import NotificationBanner from '@/components/ui/NotificationBanner';
import RelatedArtists from '@/components/artist/RelatedArtists';
import FAQSection from '@/components/seo/FAQSection';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { generateFAQItems } from '@/lib/utils/faqUtils';
import { useClientDate } from '@/lib/hooks/useClientDate';
import ClientDailyChallengeStorage from '@/lib/services/clientDailyChallengeStorage';
import { useDailyRolloverDetection } from '@/lib/hooks/useDailyRolloverDetection';
import { GameMode } from '@/lib/game';
import { DAILY_CHALLENGE_UPDATED_EVENT } from '@/lib/constants';

type ArtistPageProps = {
  params: Promise<{ artist: string }>;
};

export default function ArtistPage({ params }: ArtistPageProps) {
  const { artist: artistId } = use(params);
  const [selectedMode, setSelectedMode] = useState<GameMode>('daily');
  const [artist, setArtist] = useState<ArtistConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [challengeResetKey, setChallengeResetKey] = useState(0); // Force re-render of challenge status
  const { getTodayString } = useClientDate();
  
  // Global rollover detection - works independently of game component
  useDailyRolloverDetection({
    artistId: artist?.id,
    enabled: !!artist && selectedMode === 'daily'
  });

  useEffect(() => {
    const foundArtist = getArtistById(artistId);
    
    if (foundArtist) {
      setArtist(foundArtist);
    }
    setIsLoading(false);
  }, [artistId]);

  if (isLoading) {
    return <PageLoadingSpinner />;
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
        <AnimatedBackground blobCount={2} subtle />
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
      <AnimatedBackground blobCount={3} subtle />

      {/* Header with integrated content */}
       <div className="relative z-10 backdrop-blur-md bg-white/10 border-b border-white/20">
         <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
           <div className="py-3 sm:py-4">
             {/* Top row: Breadcrumbs, Title, and Stats */}
             <div className="flex justify-between items-center mb-2">
               {/* Left: Breadcrumbs */}
               <div className="flex-shrink-0">
                 <Breadcrumbs 
                   items={[
                     { label: 'Home', href: '/' },
                     { label: artist.displayName }
                   ]}
                 />
               </div>
               
               {/* Center: Artist Title */}
               <div className="absolute left-1/2 transform -translate-x-1/2">
                 <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white whitespace-nowrap">
                   {artist.displayName} Heardle
                 </h1>
               </div>
               
               {/* Right: Stats Button */}
               <div className="flex-shrink-0">
                 <StatisticsButton artistId={artist.id} currentMode={selectedMode} />
               </div>
             </div>
             
             {/* Description row */}
             <div className="text-center">
               <p className="text-white/70 text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                 {artist.fandom ? `Calling all ${artist.fandom}! ` : ''}
                 Test your knowledge of {artist.displayName}'s discography. 
                 Listen to song clips and guess the title. New daily challenge every day!
               </p>
             </div>
           </div>
         </div>
       </div>

      {/* Notification Banner */}
      <NotificationBanner
        id="new-artists-2026-02"
        message="🎵 New Update! We've added over 100 K-pop artists. Explore more on the home page!"
        icon="✨"
      />

             {/* Main Content */}
       <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-4">
         <div className="flex flex-col items-stretch space-y-4 sm:space-y-5 lg:space-y-6">
           <ModeSelector 
            selectedMode={selectedMode} 
            onModeChange={setSelectedMode} 
          />
          
          {/* Daily Countdown + Daily Challenge Status - Only show in daily mode */}
          {selectedMode === 'daily' && (
            <div className="flex flex-col items-center gap-2 sm:gap-3 lg:gap-4">
              <DailyChallengeStatus key={challengeResetKey} artistId={artist.id} />
              <NextDailyCountdown 
                onRollOver={() => {
                  console.log('🔄 Daily rollover detected from countdown!');
                  
                  // Clear the daily challenge storage for this artist
                  const storage = ClientDailyChallengeStorage.getInstance();
                  storage.clearDailyChallenge(artist.id);
                  
                  // Force re-render of challenge status component
                  setChallengeResetKey(prev => prev + 1);
                  
                  // Dispatch event to notify other components
                  const event = new CustomEvent(DAILY_CHALLENGE_UPDATED_EVENT, {
                    detail: { artistId: artist.id, date: getTodayString(), completed: false }
                  });
                  window.dispatchEvent(event);
                  
                  // Refresh the page after a short delay to ensure all components reset
                  setTimeout(() => {
                    console.log('🔄 Refreshing page for new daily challenge...');
                    window.location.reload();
                  }, 1000);
                }}
              />
            </div>
          )}
          
          {/* Remove any extra top margin/padding from the child; parent controls spacing */}
          <DynamicHeardle 
            mode={selectedMode} 
            onGameStateChange={(gameState) => {
              // Force update of the DailyChallengeStatus component
              if (gameState.isGameOver) {
                const event = new CustomEvent(DAILY_CHALLENGE_UPDATED_EVENT, {
                  detail: { artistId: artist.id, date: getTodayString(), completed: gameState.isGameOver }
                });
                window.dispatchEvent(event);
                console.log(`📡 Artist page dispatched ${DAILY_CHALLENGE_UPDATED_EVENT}:`, event.detail);
              }
            }}
          />
         </div>
      </div>

      {/* Related Artists Section - Internal Linking for SEO */}
      <RelatedArtists currentArtistId={artist.id} maxArtists={4} />

      {/* FAQ Section - UI only (schema rendered server-side in layout) */}
      <FAQSection faqItems={generateFAQItems(artist.displayName, artist.fandom)} />
    </div>
  );
}
