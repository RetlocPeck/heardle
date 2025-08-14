'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Artist {
  id: string;
  name: string;
  displayName: string;
  description: string;
  imageUrl: string;
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
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Features126/v4/8f/8c/8f/8f8c8f8c-8f8c-8f8c-8f8c-8f8c8f8c8f8c/1203816887.jpg/300x300bb.jpg',
    color: 'pink',
    songCount: 100,
    releaseYear: 2015
  },
  {
    id: 'le-sserafim',
    name: 'LE SSERAFIM',
    displayName: 'LE SSERAFIM',
    description: 'Dynamic K-pop quintet specializing in self-assured, bass-heavy dance-pop',
    imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Features126/v4/8f/8c/8f/8f8c8f8c-8f8c-8f8c-8f8c-8f8c8f8c8f8c/1616740364.jpg/300x300bb.jpg',
    color: 'purple',
    songCount: 50,
    releaseYear: 2022
  }
];

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
          {filteredArtists.map((artist) => (
            <div
              key={artist.id}
              className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-${artist.color}-500`}
            >
              {/* Artist Image */}
              <div className="relative">
                <img
                  src={artist.imageUrl}
                  alt={artist.displayName}
                  className="w-full h-48 object-cover rounded-t-xl"
                  onError={(e) => {
                    // Fallback to a gradient if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.background = `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`;
                    target.style.display = 'none';
                  }}
                />
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${artist.color}-100 text-${artist.color}-800`}>
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
                    className={`w-full block text-center px-4 py-2 bg-${artist.color}-500 text-white font-semibold rounded-lg hover:bg-${artist.color}-600 transition-colors duration-200`}
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
          ))}
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
