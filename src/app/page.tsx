'use client';

import { useState, useEffect, useMemo } from 'react';
import { getArtistsSorted } from '@/config/artists';
import StatisticsButton from '@/components/stats/StatisticsButton';
import SupportButton from '@/components/ui/buttons/SupportButton';
import ThemeOptionsButton from '@/components/ui/ThemeOptionsButton';
import ArtistCard from '@/components/artist/ArtistCard';
import { PageShell, PageHeader, ResponsiveContainer } from '@/components/ui/PageShell';

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');

  const allArtists = useMemo(() => getArtistsSorted(), []);
  const filteredArtists = useMemo(
    () => allArtists.filter(artist =>
      artist.name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
      artist.displayName.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
      artist.searchTerms.some(term => term.toLowerCase().startsWith(searchTerm.toLowerCase()))
    ),
    [allArtists, searchTerm]
  );

  // Preload artwork JSON for featured artists to improve perceived performance
  useEffect(() => {
    const featured = getArtistsSorted().filter(a => a.featured);
    featured.forEach(artist => {
      fetch(`/data/artwork/${artist.id}.json`).catch(() => {});
    });
  }, []);

  return (
    <PageShell blobCount={3}>
      <PageHeader>
        <div className="flex justify-between items-center py-4 sm:py-6 lg:py-8">
          <div className="flex items-center">
            <h1 className="text-lg sm:text-3xl lg:text-4xl font-bold theme-text tracking-tight leading-tight">
              K-Pop Heardle
            </h1>
            <span className="ml-1 sm:ml-3 text-lg sm:text-2xl lg:text-3xl">🎵</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            <SupportButton variant="home" />
            <StatisticsButton />
            <ThemeOptionsButton />
          </div>
        </div>
      </PageHeader>

      <ResponsiveContainer className="py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold theme-text mb-2 sm:mb-3 lg:mb-4 leading-tight tracking-tight">
            Welcome to K-Pop Heardle
          </h2>
          <p className="text-sm sm:text-base lg:text-lg theme-text-secondary max-w-xs sm:max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-2">
            Challenge yourself with music guessing games featuring your favorite K-pop artists.
            Listen to short previews and test your knowledge of their discographies!
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xs sm:max-w-md lg:max-w-lg mx-auto mb-6 sm:mb-8 lg:mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="Search artists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 sm:px-5 py-2.5 sm:py-3 pl-9 sm:pl-12 backdrop-blur-xl rounded-xl theme-input transition-all duration-300 text-sm sm:text-base"
            />
            <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3.5 flex items-center pointer-events-none">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 theme-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Artists Grid */}
        <div
          className="
            grid gap-3 sm:gap-4 lg:gap-6 mx-auto px-2 sm:px-4
            grid-cols-2 md:grid-cols-3
            lg:[--card-w:420px]
            lg:[grid-template-columns:repeat(auto-fill,minmax(var(--card-w),var(--card-w)))]
            lg:justify-center
          "
        >
          {filteredArtists.map((artist) => {
            const artistIndex = allArtists.findIndex(a => a.id === artist.id);
            const staggerDelay = artist.featured ? 0 : artistIndex * 50;
            return (
              <ArtistCard
                key={artist.id}
                artist={artist}
                fetchDelay={staggerDelay}
              />
            );
          })}
        </div>
      </ResponsiveContainer>
    </PageShell>
  );
}
