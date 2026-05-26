'use client';

import Link from 'next/link';
import ArtistImage from '@/components/artist/ArtistImage';
import type { ArtistConfig } from '@/config/artists';

interface ArtistCardProps {
  artist: ArtistConfig;
  /** Stagger delay in ms for image fetching */
  fetchDelay?: number;
}

const FeaturedBadge = () => (
  <div
    className="
      inline-flex items-center h-5 sm:h-6 lg:h-7 rounded-full bg-yellow-400 text-black
      pl-1.5 pr-1.5 sm:pl-2 sm:pr-2 overflow-hidden whitespace-nowrap
      transition-[max-width] duration-300 ease-out
      max-w-[24px] sm:max-w-[28px] lg:max-w-[32px]
      group-hover:max-w-[100px] sm:group-hover:max-w-[120px] lg:group-hover:max-w-[132px]
      gap-0 group-hover:gap-1
    "
  >
    <svg className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
    <span
      className="text-xs sm:text-sm font-semibold opacity-0 text-transparent transition-opacity duration-150 group-hover:opacity-100 group-hover:text-current"
      aria-hidden="true"
    >
      Featured
    </span>
  </div>
);

export default function ArtistCard({ artist, fetchDelay }: ArtistCardProps) {
  return (
    <div className="group relative">
      <div className={`group relative rounded-3xl overflow-hidden backdrop-blur-xl transition-[transform,box-shadow] duration-300 transform hover:scale-105 hover:-translate-y-2 ${
        artist.featured
          ? 'bg-gradient-to-br from-amber-50/20 to-yellow-400/10 border-2 border-amber-400/60 shadow-lg shadow-amber-400/20'
          : 'theme-glass-surface hover:border-[var(--icon-btn-hover-border)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.15)]'
      }`}>
        {/* Gradient border glow on hover */}
        <div className={`absolute inset-0 bg-gradient-to-r ${artist.theme.gradientFrom} ${artist.theme.gradientTo} opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-3xl`} />

        {/* Top-left badge stack */}
        <div className="absolute left-2 sm:left-3 top-2 sm:top-3 flex items-center gap-1 sm:gap-2 z-30">
          {artist.featured && <FeaturedBadge />}
          {/* Year pill — invisible placeholder for layout stability */}
          <div className="inline-flex items-center h-5 sm:h-6 lg:h-7 rounded-full bg-neutral-800/90 text-white px-2 sm:px-3 text-xs sm:text-sm font-semibold invisible">
            2024
          </div>
        </div>

        {/* Artist Image */}
        <div className="relative h-32 sm:h-48 lg:h-64 overflow-hidden">
          <ArtistImage
            artistId={artist.id}
            alt={artist.displayName}
            className="w-full h-full object-cover object-[center_30%] group-hover:scale-110 transition-transform duration-300"
            width={400}
            height={400}
            priority={artist.featured}
            fetchDelay={fetchDelay}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {/* Stats badge — invisible placeholder */}
          <div className="absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4 invisible">
            <div className={`backdrop-blur-md ${artist.theme.bgColor} ${artist.theme.textColor} px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border border-white/30`}>
              K-pop
            </div>
          </div>
        </div>

        {/* Artist Info */}
        <div className="p-3 sm:p-4 lg:p-8">
          <h3 className={`text-base sm:text-lg lg:text-2xl xl:text-3xl font-bold mb-2 sm:mb-3 transition-colors duration-300 leading-tight ${
            artist.featured
              ? 'featured-artist-name'
              : 'theme-text group-hover:text-[var(--foreground)]'
          }`}>
            {artist.displayName}
          </h3>

          <Link
            href={`/${artist.id}`}
            className={`group/btn relative w-full block text-center px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 bg-gradient-to-r ${artist.theme.gradientFrom} ${artist.theme.gradientTo} text-white font-bold rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden ${
              artist.featured
                ? 'hover:shadow-2xl hover:shadow-amber-400/30 border border-amber-300/30'
                : 'hover:shadow-2xl hover:shadow-black/30'
            }`}
          >
            <span className="relative z-10 flex items-center justify-center space-x-1 sm:space-x-2">
              <span className="text-sm sm:text-lg lg:text-xl">🎯</span>
              <span className="text-xs sm:text-sm lg:text-base">Play Heardle</span>
            </span>
            <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-300 origin-left" />
          </Link>

          <div className="text-center mt-2 sm:mt-3 lg:mt-4 hidden sm:block">
            <p className="theme-text-muted text-xs sm:text-sm mb-1">Choose your mode on the next page</p>
            <div className="flex justify-center space-x-1 sm:space-x-2 text-xs">
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 theme-glass-surface rounded-full theme-text-secondary text-xs">Daily Challenge</span>
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 theme-glass-surface rounded-full theme-text-secondary text-xs">Practice Mode</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
