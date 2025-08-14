'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Artist {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  songCount: number;
  releaseYear: number;
}

const artists: Artist[] = [
  {
    id: 'twice',
    name: 'TWICE',
    displayName: 'TWICE',
    description: 'K-pop girl group known for their catchy songs and energetic performances',
    color: 'pink',
    songCount: 100,
    releaseYear: 2015
  },
  {
    id: 'le-sserafim',
    name: 'LE SSERAFIM',
    displayName: 'LE SSERAFIM',
    description: 'Dynamic K-pop quintet specializing in self-assured, bass-heavy dance-pop',
    color: 'purple',
    songCount: 50,
    releaseYear: 2022
  }
];

// Color mapping for Tailwind classes
const colorClasses = {
  pink: {
    border: 'border-pink-500',
    bg: 'bg-pink-500',
    bgHover: 'hover:bg-pink-600',
    badge: 'bg-pink-100 text-pink-800'
  },
  purple: {
    border: 'border-purple-500',
    bg: 'bg-purple-500',
    bgHover: 'hover:bg-purple-600',
    badge: 'bg-purple-100 text-purple-800'
  }
};

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredArtists = artists.filter(artist =>
    artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                K-Pop Heardle
              </h1>
              <span className="ml-2 text-2xl">🎵</span>
            </div>
            <div className="text-sm text-gray-600">
              Test your K-pop knowledge!
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to K-Pop Heardle
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Challenge yourself with music guessing games featuring your favorite K-pop artists. 
            Listen to short previews and test your knowledge of their discographies!
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="Search artists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Artists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArtists.map((artist) => {
            const colors = colorClasses[artist.color as keyof typeof colorClasses];
            return (
              <div
                key={artist.id}
                className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 ${colors.border}`}
              >
                {/* Artist Image */}
                <div className="relative">
                  <img
                    src={`/images/artists/${artist.id}.jpg`}
                    alt={artist.displayName}
                    className="w-full h-48 object-cover rounded-t-xl"
                    onError={(e) => {
                      // Hide the image and show placeholder if it fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      
                      // Show loading placeholder
                      const placeholder = document.createElement('div');
                      placeholder.className = 'w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-xl flex items-center justify-center';
                      placeholder.innerHTML = `
                        <div class="text-center">
                          <div class="w-16 h-16 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <span class="text-sm text-gray-500">Add ${artist.displayName} image</span>
                        </div>
                      `;
                      target.parentNode?.appendChild(placeholder);
                    }}
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                      {artist.songCount}+ songs
                    </span>
                  </div>
                </div>

                {/* Artist Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-2xl font-bold text-gray-900">{artist.displayName}</h3>
                    <span className="text-sm text-gray-500">{artist.releaseYear}</span>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {artist.description}
                  </p>

                  {/* Game Modes */}
                  <div className="space-y-3">
                    <Link
                      href={`/${artist.id}`}
                      className={`w-full block text-center px-4 py-2 ${colors.bg} text-white font-semibold rounded-lg ${colors.bgHover} transition-colors duration-200`}
                    >
                      🎯 Play {artist.displayName} Heardle
                    </Link>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-2">Choose your mode on the next page</p>
                      <p className="text-xs text-gray-400">Daily Challenge • Practice Mode</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Coming Soon Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            More Artists Coming Soon!
          </h3>
          <p className="text-gray-600 mb-6">
            We're working on adding more K-pop artists to expand your Heardle experience.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              NewJeans
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              IVE
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              aespa
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              ITZY
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              Red Velvet
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
