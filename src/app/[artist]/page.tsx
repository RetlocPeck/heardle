'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { GameMode } from '@/lib/gameLogic';
import ModeSelector from '@/components/ModeSelector';
import DynamicHeardle from '@/components/DynamicHeardle';

interface ArtistConfig {
  id: string;
  name: string;
  displayName: string;
  color: string;
}

const artists: ArtistConfig[] = [
  {
    id: 'twice',
    name: 'TWICE',
    displayName: 'TWICE',
    color: 'pink'
  },
  {
    id: 'le-sserafim',
    name: 'LE SSERAFIM',
    displayName: 'LE SSERAFIM',
    color: 'purple'
  }
];

export default function ArtistPage() {
  const params = useParams();
  const [selectedMode, setSelectedMode] = useState<GameMode>('daily');
  const [artist, setArtist] = useState<ArtistConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const artistId = params.artist as string;
    const foundArtist = artists.find(a => a.id === artistId);
    
    if (foundArtist) {
      setArtist(foundArtist);
    }
    setIsLoading(false);
  }, [params.artist]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading artist...</p>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Artist Not Found</h1>
          <p className="text-gray-600 mb-6">The artist you're looking for doesn't exist.</p>
          <a
            href="/"
            className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <a href="/" className="text-2xl font-bold text-gray-600 hover:text-gray-800 transition-colors">
                ← Back to Artists
              </a>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">{artist.displayName} Heardle</h1>
              <p className="text-sm text-gray-600">Test your {artist.displayName} knowledge!</p>
            </div>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8">
        <ModeSelector 
          selectedMode={selectedMode} 
          onModeChange={setSelectedMode} 
        />
        <DynamicHeardle mode={selectedMode} />
      </div>
    </div>
  );
}
