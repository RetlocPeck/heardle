'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { getAllArtists } from '@/config/artists';
import ArtistImage from '@/components/artist/ArtistImage';
import AnimatedBackground from '@/components/ui/AnimatedBackground';

export default function FeaturedArtistsPage() {
  // Get featured artists
  const featuredArtists = useMemo(() => {
    return getAllArtists()
      .filter(a => a.featured)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <AnimatedBackground blobCount={3} subtle />

      {/* Header */}
      <div className="relative z-10 backdrop-blur-md bg-white/10 border-b border-white/20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
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
            
            <div className="w-24 sm:w-32" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8 sm:py-12">
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
              <Link
                key={artist.id}
                href={`/${artist.id}`}
                className="group relative backdrop-blur-xl rounded-3xl overflow-hidden bg-gradient-to-br from-amber-50/20 to-yellow-400/10 border-2 border-amber-400/60 shadow-lg shadow-amber-400/20 hover:shadow-amber-400/40 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2"
              >
                {/* Featured badge */}
                <div className="absolute left-3 top-3 z-30">
                  <div className="inline-flex items-center h-7 rounded-full bg-yellow-400 text-black px-3 gap-1">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                    <span className="text-sm font-semibold">Featured</span>
                  </div>
                </div>

                {/* Artist Image */}
                <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
                  <ArtistImage
                    artistId={artist.id}
                    alt={artist.displayName}
                    className="w-full h-full object-cover object-[center_30%] group-hover:scale-110 transition-transform duration-700"
                    width={400}
                    height={400}
                    priority={true}
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Artist Info */}
                <div className="p-4 sm:p-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-amber-100 mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-amber-300 group-hover:to-yellow-400 group-hover:bg-clip-text transition-all duration-300">
                    {artist.displayName}
                  </h3>
                  
                  {artist.fandom && (
                    <p className="text-white/60 text-sm mb-3">
                      Fandom: {artist.fandom}
                    </p>
                  )}

                  {/* Play Button */}
                  <div className={`w-full text-center px-4 py-3 bg-gradient-to-r ${artist.theme.gradientFrom} ${artist.theme.gradientTo} text-white font-bold rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-amber-400/30 border border-amber-300/30`}>
                    <span className="flex items-center justify-center space-x-2">
                      <span>🎯</span>
                      <span>Play Heardle</span>
                    </span>
                  </div>
                </div>
              </Link>
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
      </div>
    </div>
  );
}
