'use client';

import { use, useState, useEffect } from 'react';
import { getArtistById } from '@/config/artists';
import type { ArtistConfig } from '@/config/artists';
import DynamicHeardle from '@/components/game/DynamicHeardle';
import ModeSelector from '@/components/game/ModeSelector';
import StatisticsButton from '@/components/stats/StatisticsButton';
import PageLoadingSpinner from '@/components/ui/LoadingSpinner';
import { DailyChallengeStatus } from '@/components/artist/DailyChallengeStatus';
import NextDailyCountdown from '@/components/game/NextDailyCountdown';
import NotificationBanner from '@/components/ui/NotificationBanner';
import { PageShell, PageHeader, ResponsiveContainer } from '@/components/ui/PageShell';
import RelatedArtists from '@/components/artist/RelatedArtists';
import FAQSection from '@/components/seo/FAQSection';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { generateFAQItems } from '@/lib/utils/faqUtils';
import { useClientDate } from '@/lib/hooks/useClientDate';
import { GameMode } from '@/lib/game';
import { emitDailyChallengeUpdated } from '@/lib/utils/customEvents';

type ArtistPageProps = {
  params: Promise<{ artist: string }>;
};

export default function ArtistPage({ params }: ArtistPageProps) {
  const { artist: artistId } = use(params);
  const [selectedMode, setSelectedMode] = useState<GameMode>('daily');
  const [artist, setArtist] = useState<ArtistConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getTodayString } = useClientDate();

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
      <PageShell blobCount={2} subtle>
        <div className="flex items-center justify-center min-h-screen">
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
      </PageShell>
    );
  }

  return (
    <PageShell blobCount={3} subtle>
      <PageHeader>
        <div className="py-3 sm:py-4">
          {/* Top row: Breadcrumbs, Title, Stats */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex-shrink-0">
              <Breadcrumbs
                items={[
                  { label: 'Home', href: '/' },
                  { label: artist.displayName }
                ]}
              />
            </div>

            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white whitespace-nowrap">
                {artist.displayName} Heardle
              </h1>
            </div>

            <div className="flex-shrink-0">
              <StatisticsButton artistId={artist.id} currentMode={selectedMode} />
            </div>
          </div>

          <div className="text-center">
            <p className="text-white/70 text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              {artist.fandom ? `Calling all ${artist.fandom}! ` : ''}
              Test your knowledge of {artist.displayName}&apos;s discography.
              Listen to song clips and guess the title. New daily challenge every day!
            </p>
          </div>
        </div>
      </PageHeader>

      <NotificationBanner
        id="new-artists-2026-02"
        message="🎵 New Update! We've added over 100 K-pop artists. Explore more on the home page!"
        icon="✨"
      />

      <ResponsiveContainer className="py-4">
        <div className="flex flex-col items-stretch space-y-4 sm:space-y-5 lg:space-y-6">
          <ModeSelector
            selectedMode={selectedMode}
            onModeChange={setSelectedMode}
          />

          {selectedMode === 'daily' && (
            <div className="flex flex-col items-center gap-2 sm:gap-3 lg:gap-4">
              <DailyChallengeStatus artistId={artist.id} />
              <NextDailyCountdown />
            </div>
          )}

          <DynamicHeardle
            key={selectedMode}
            mode={selectedMode}
            onGameStateChange={(gameState) => {
              if (gameState.isGameOver) {
                emitDailyChallengeUpdated({
                  artistId: artist.id,
                  date: getTodayString(),
                  completed: gameState.isGameOver,
                });
              }
            }}
          />
        </div>
      </ResponsiveContainer>

      <RelatedArtists currentArtistId={artist.id} maxArtists={4} />
      <FAQSection faqItems={generateFAQItems(artist.displayName, artist.fandom)} />
    </PageShell>
  );
}
