'use client';

import React, { useState } from 'react';
import Statistics from '@/components/stats/Statistics';

export default function StatsDemoPage() {
  const [isGlobalStatsOpen, setIsGlobalStatsOpen] = useState(false);
  const [isArtistStatsOpen, setIsArtistStatsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Statistics Modal Demo
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Global Stats Demo */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Global Statistics</h2>
            <p className="text-white/70 mb-6">
              Click the button below to open the global statistics modal showing combined stats from all artists.
            </p>
            <button
              onClick={() => setIsGlobalStatsOpen(true)}
              className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              📊 View Global Statistics
            </button>
          </div>

          {/* Artist Stats Demo */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Artist-Specific Statistics</h2>
            <p className="text-white/70 mb-6">
              Click the button below to open the TWICE-specific statistics modal.
            </p>
            <button
              onClick={() => setIsArtistStatsOpen(true)}
              className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              🎵 View TWICE Statistics
            </button>
          </div>
        </div>

        {/* Feature List */}
        <div className="mt-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Modal Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">✨ Accessibility</h3>
              <ul className="text-white/70 space-y-2">
                <li>• Proper ARIA labels and roles</li>
                <li>• Focus trap inside modal</li>
                <li>• Escape key to close</li>
                <li>• Focus restoration on close</li>
              </ul>
            </div>
            <div>
                             <h3 className="text-lg font-semibold text-white mb-3">🎮 User Experience</h3>
              <ul className="text-white/70 space-y-2">
                <li>• Backdrop click to close</li>
                <li>• Body scroll lock while open</li>
                <li>• Smooth animations</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">🔧 Technical</h3>
              <ul className="text-white/70 space-y-2">
                <li>• React Portal to document.body</li>
                <li>• SSR-safe implementation</li>
                <li>• Proper z-index management</li>
                <li>• No layout shift</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">📱 Responsive</h3>
              <ul className="text-white/70 space-y-2">
                <li>• Max width: 720px</li>
                <li>• 90vw width cap</li>
                <li>• 90vh height cap</li>
                <li>• Mobile-friendly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Global Statistics Modal */}
      <Statistics
        isOpen={isGlobalStatsOpen}
        onClose={() => setIsGlobalStatsOpen(false)}
      />

      {/* Artist-Specific Statistics Modal */}
      <Statistics
        artistId="twice"
        isOpen={isArtistStatsOpen}
        onClose={() => setIsArtistStatsOpen(false)}
      />
    </div>
  );
}
