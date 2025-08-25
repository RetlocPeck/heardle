'use client';

import React, { useState, useEffect } from 'react';
import { StatisticsStorage, ArtistStats, GlobalStats } from '@/lib/services/statisticsStorage';

interface StatsContentProps {
  artistId?: string; // If provided, show artist-specific stats; if not, show global stats
  defaultMode?: 'daily' | 'practice'; // Default mode to show when opening
}

type GameMode = 'daily' | 'practice';

export default function StatsContent({ artistId, defaultMode = 'daily' }: StatsContentProps) {
  const [stats, setStats] = useState<GlobalStats | ArtistStats | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>(defaultMode);
  const [isGlobal, setIsGlobal] = useState(!artistId);

  useEffect(() => {
    const storage = StatisticsStorage.getInstance();
    if (artistId) {
      // Artist-specific stats
      setStats(storage.getArtistStats(artistId));
      setIsGlobal(false);
    } else {
      // Global stats
      setStats(storage.getGlobalStats());
      setIsGlobal(true);
    }

    // Listen for statistics updates
    const handleStatsUpdate = (event: CustomEvent) => {
      if (artistId) {
        setStats(storage.getArtistStats(artistId));
      } else {
        setStats(event.detail);
      }
    };

    window.addEventListener('statistics-updated', handleStatsUpdate as EventListener);
    return () => {
      window.removeEventListener('statistics-updated', handleStatsUpdate as EventListener);
    };
  }, [artistId]);

  if (!stats) return null;

  const currentStats = isGlobal 
    ? (stats as GlobalStats)[gameMode]
    : (stats as ArtistStats)[gameMode];





  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setGameMode('daily')}
          className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ${
            gameMode === 'daily'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          📅 Daily Challenge
        </button>
        <button
          onClick={() => setGameMode('practice')}
          className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ml-3 ${
            gameMode === 'practice'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          🎮 Practice Mode
        </button>
      </div>

      {/* Bar Graph */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-white mb-6 text-center">
          Wins by Number of Tries
        </h3>
        
        <div className="space-y-4">
          {/* Try counts 1-6 */}
          {[1, 2, 3, 4, 5, 6].map((tries) => {
                         const count = currentStats.winsByTries[tries] || 0;
             const percentage = currentStats.totalGames > 0 
               ? Math.round((count / currentStats.totalGames) * 100) 
               : 0;
             const barWidth = percentage; // Bar width should match the percentage
            
            return (
              <div key={tries} className="flex items-center space-x-4">
                <div className="w-16 text-right">
                  <span className="text-white font-semibold">{tries} {tries === 1 ? 'try' : 'tries'}</span>
                </div>
                
                <div className="flex-1 relative">
                  <div className="bg-white/20 rounded-full h-8 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-pink-400 to-purple-500 h-8 rounded-full transition-all duration-500 ease-out shadow-lg"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
                
                <div className="w-24 text-left">
                  <span className="text-white font-semibold">
                    {count} ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* Failed games */}
          <div className="flex items-center space-x-4">
            <div className="w-16 text-right">
              <span className="text-red-300 font-semibold">Failed</span>
            </div>
            
            <div className="flex-1 relative">
              <div className="bg-white/20 rounded-full h-8 overflow-hidden">
                                     <div 
                       className="bg-gradient-to-r from-red-400 to-red-500 h-8 rounded-full transition-all duration-500 ease-out shadow-lg"
                       style={{ width: `${currentStats.totalGames > 0 ? Math.round((currentStats.failedGames / currentStats.totalGames) * 100) : 0}%` }}
                     />
              </div>
            </div>
            
            <div className="w-24 text-left">
              <span className="text-red-300 font-semibold">
                {currentStats.failedGames} ({currentStats.totalGames > 0 ? Math.round((currentStats.failedGames / currentStats.totalGames) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/20">
          <div className="text-2xl font-bold text-white">{currentStats.totalGames}</div>
          <div className="text-white/70 text-sm">Total Games</div>
        </div>
        
        <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/20">
          <div className="text-2xl font-bold text-white">{currentStats.winPercentage}%</div>
          <div className="text-white/70 text-sm">Win Rate</div>
        </div>
        
        <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/20">
          <div className="text-2xl font-bold text-white">{currentStats.averageTries}</div>
          <div className="text-white/70 text-sm">Avg Tries</div>
        </div>
        
        <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/20">
          <div className="text-2xl font-bold text-white">{currentStats.bestStreak}</div>
          <div className="text-white/70 text-sm">Best Streak</div>
        </div>
      </div>

      {/* Current Streak */}
      {currentStats.currentStreak > 0 && (
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-2xl">
            <span className="text-xl">🔥</span>
            <span className="font-semibold">
              Current Streak: {currentStats.currentStreak}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
