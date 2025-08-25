'use client';

import Link from 'next/link';
import { useState } from 'react';
import { getArtistsSorted } from '@/config/artists';
import type { ArtistConfig } from '@/config/artists';
import StatisticsButton from '@/components/StatisticsButton';
import SupportButton from '@/components/SupportButton';

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');

  const allArtists = getArtistsSorted();
  const filteredArtists = allArtists.filter(artist =>
    artist.name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
    artist.displayName.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
    artist.searchTerms.some(term => term.toLowerCase().startsWith(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 backdrop-blur-md bg-white/10 border-b border-white/20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex justify-between items-center py-3 sm:py-4 lg:py-6">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent leading-tight">
                K-Pop Heardle
              </h1>
              <span className="ml-1 sm:ml-3 text-lg sm:text-2xl lg:text-3xl animate-pulse">🎵</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              <SupportButton variant="home" />
              <StatisticsButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 lg:mb-4 leading-tight">
            Welcome to 
            <span className="block bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              K-Pop Heardle
            </span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-white/80 max-w-xs sm:max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-2">
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
              className="w-full px-3 sm:px-5 py-2.5 sm:py-3 pl-9 sm:pl-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all duration-300 focus:bg-white/20 text-sm sm:text-base"
            />
            <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3.5 flex items-center pointer-events-none">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          {filteredArtists.map((artist, index) => (
            <div
              key={artist.id}
              className="group relative"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {/* Glassmorphism Card */}
              <div className={`group relative backdrop-blur-xl rounded-3xl overflow-hidden hover:bg-white/20 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 ${
                artist.featured 
                  ? 'bg-gradient-to-br from-amber-50/20 to-yellow-400/10 border-2 border-amber-400/60 shadow-lg shadow-amber-400/20' 
                  : 'bg-white/10 border border-white/20'
              }`}>
                {/* Gradient Border Effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${artist.theme.gradientFrom} ${artist.theme.gradientTo} opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-3xl`}></div>
                
                {/* Top-left stack (inside the card) */}
                <div className="absolute left-2 sm:left-3 top-2 sm:top-3 flex items-center gap-1 sm:gap-2 z-30">
                  {artist.featured && (
                    <div
                      className="
                        group/feat inline-flex items-center h-5 sm:h-6 lg:h-7 rounded-full bg-yellow-400 text-black
                        pl-1.5 pr-1.5 sm:pl-2 sm:pr-2 overflow-hidden whitespace-nowrap
                        transition-[max-width] duration-300 ease-out
                        max-w-[24px] sm:max-w-[28px] lg:max-w-[32px]                 /* collapsed: icon(16) + padding */
                        group-hover:max-w-[100px] sm:group-hover:max-w-[120px] lg:group-hover:max-w-[132px]    /* expanded: enough for 'Featured' */
                        gap-0 group-hover:gap-1      /* tighten star–text spacing */
                      "
                    >
                      {/* Star icon */}
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                      </svg>

                      {/* Label: hidden until hover so no letters leak */}
                      <span
                        className="
                          text-xs sm:text-sm font-semibold
                          opacity-0 text-transparent
                          transition-opacity duration-150
                          group-hover:opacity-100 group-hover:text-current
                        "
                        aria-hidden="true"
                      >
                        Featured
                      </span>
                    </div>
                  )}
                  
                  {/* Year Pill */}
                  <div className="inline-flex items-center h-5 sm:h-6 lg:h-7 rounded-full bg-neutral-800/90 text-white px-2 sm:px-3 text-xs sm:text-sm font-semibold">
                    {artist.metadata.releaseYear}
                  </div>
                </div>
                
                {/* Artist Image */}
                <div className="relative h-32 sm:h-48 lg:h-64 overflow-hidden">
                  <img
                    src={artist.metadata.imageUrl}
                    alt={artist.displayName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.background = `linear-gradient(135deg, rgb(168, 85, 247), rgb(236, 72, 153))`;
                      target.style.display = 'none';
                    }}
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Stats Badge */}
                  <div className="absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4">
                    <div className={`backdrop-blur-md ${artist.theme.bgColor} ${artist.theme.textColor} px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border border-white/30`}>
                      {artist.metadata.songCount}+ songs
                    </div>
                  </div>
                </div>

                {/* Artist Info */}
                <div className="p-3 sm:p-4 lg:p-8">
                  <h3 className={`text-base sm:text-lg lg:text-2xl xl:text-3xl font-bold mb-2 sm:mb-3 transition-all duration-300 leading-tight ${
                    artist.featured
                      ? 'text-amber-100 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-amber-300 group-hover:to-yellow-400 group-hover:bg-clip-text'
                      : 'text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-purple-400 group-hover:bg-clip-text'
                  }`}>
                    {artist.displayName}
                  </h3>
                  


                  {/* Play Button */}
                  <Link
                    href={`/${artist.id}`}
                    className={`group/btn relative w-full block text-center px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 bg-gradient-to-r ${artist.theme.gradientFrom} ${artist.theme.gradientTo} text-white font-bold rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden ${
                      artist.featured
                        ? 'hover:shadow-2xl hover:shadow-amber-400/30 border border-amber-300/30'
                        : 'hover:shadow-2xl hover:shadow-purple-500/25'
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center space-x-1 sm:space-x-2">
                      <span className="text-sm sm:text-lg lg:text-xl">🎯</span>
                      <span className="text-xs sm:text-sm lg:text-base">Play Heardle</span>
                    </span>
                    <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-300 origin-left"></div>
                  </Link>
                  
                  <div className="text-center mt-2 sm:mt-3 lg:mt-4 hidden sm:block">
                    <p className="text-white/60 text-xs sm:text-sm mb-1">Choose your mode on the next page</p>
                    <div className="flex justify-center space-x-1 sm:space-x-2 text-xs">
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/10 rounded-full text-white/70 text-xs">Daily Challenge</span>
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/10 rounded-full text-white/70 text-xs">Practice Mode</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>


      </div>
    </div>
  );
}
