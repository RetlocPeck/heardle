'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { getAllArtists } from '@/config/artists';
import AnimatedBackground from '@/components/ui/AnimatedBackground';

export default function AllArtistsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Get all artists sorted alphabetically
  const allArtists = useMemo(() => {
    return [...getAllArtists()].sort((a, b) => 
      a.displayName.localeCompare(b.displayName)
    );
  }, []);

  const filteredArtists = allArtists.filter(artist =>
    artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.searchTerms.some(term => term.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group artists by first letter
  const groupedArtists = useMemo(() => {
    const groups: Record<string, typeof filteredArtists> = {};
    
    filteredArtists.forEach(artist => {
      const firstChar = artist.displayName[0].toUpperCase();
      // Group numbers and special characters under '#'
      const key = /[A-Z]/i.test(firstChar) ? firstChar : '#';
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(artist);
    });
    
    return groups;
  }, [filteredArtists]);

  const sortedKeys = Object.keys(groupedArtists).sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });

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
            
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              All Artists
            </h1>
            
            <div className="w-24 sm:w-32" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
            All K-Pop Artists
          </h2>
          <p className="text-white/70 text-sm sm:text-base max-w-2xl mx-auto">
            Browse our complete collection of {allArtists.length} K-pop artists. 
            Find your favorites and test your music knowledge!
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search artists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-5 py-3 pl-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all duration-300 focus:bg-white/20"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="text-center text-white/60 text-sm mb-6">
          {filteredArtists.length} artist{filteredArtists.length !== 1 ? 's' : ''} found
        </div>

        {/* Artists grouped by letter */}
        <div className="max-w-5xl mx-auto space-y-8">
          {sortedKeys.map(letter => (
            <div key={letter}>
              <h3 className="text-2xl font-bold text-pink-400 mb-4 border-b border-white/10 pb-2">
                {letter}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {groupedArtists[letter].map(artist => (
                  <Link
                    key={artist.id}
                    href={`/${artist.id}`}
                    className={`group relative backdrop-blur-md rounded-xl p-3 sm:p-4 transition-all duration-300 hover:scale-105 ${
                      artist.featured
                        ? 'bg-gradient-to-br from-amber-50/20 to-yellow-400/10 border border-amber-400/40 hover:border-amber-400/60'
                        : 'bg-white/10 border border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {artist.featured && (
                      <span className="absolute -top-1 -right-1 text-yellow-400 text-xs">★</span>
                    )}
                    <div className={`text-sm font-medium text-center truncate ${
                      artist.featured ? 'text-amber-100' : 'text-white'
                    }`}>
                      {artist.displayName}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* No results */}
        {filteredArtists.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-white/70">No artists found matching &ldquo;{searchTerm}&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  );
}
