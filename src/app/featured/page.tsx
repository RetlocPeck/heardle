'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { getAllArtists } from '@/config/artists';
import ArtistCard from '@/components/artist/ArtistCard';
import { PageShell, PageHeader, ResponsiveContainer } from '@/components/ui/PageShell';

export default function FeaturedArtistsPage() {
  const featuredArtists = useMemo(() => {
    return getAllArtists()
      .filter(a => a.featured)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, []);

  return (
    <PageShell blobCount={3} subtle>
      <PageHeader>
        <div className="flex justify-between items-center py-4 sm:py-6 lg:py-8">
          <Link
            href="/"
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm sm:text-base">Back to Home</span>
          </Link>

          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent">
            Featured Artists
          </h1>

          <div className="w-24 sm:w-32" />
        </div>
      </PageHeader>

      <ResponsiveContainer className="py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <span>★</span>
            <span>Featured Collection</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            Featured K-Pop Artists
          </h2>
          <p className="text-white/70 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto">
            Our handpicked selection of the most popular K-pop artists.
            These artists represent the best of K-pop across different generations and styles.
          </p>
        </div>

        {/* Featured Artists Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {featuredArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} variant="featured" />
            ))}
          </div>
        </div>

        {/* Link to all artists */}
        <div className="text-center mt-8 sm:mt-12">
          <Link
            href="/artists"
            className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all duration-300"
          >
            <span>View All {getAllArtists().length} Artists</span>
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </ResponsiveContainer>
    </PageShell>
  );
}
