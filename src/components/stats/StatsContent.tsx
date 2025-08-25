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
    <div className="p-3 sm:p-6">
      {/* Tabs */}
      <div className="flex justify-center mb-4 sm:mb-6">
        <button
          onClick={() => setGameMode('daily')}
          className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-base transition-all duration-200 ${
            gameMode === 'daily'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          <span className="sm:hidden">📅 Daily</span>
          <span className="hidden sm:inline">📅 Daily Challenge</span>
        </button>
        <button
          onClick={() => setGameMode('practice')}
          className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-base transition-all duration-200 ml-2 sm:ml-3 ${
            gameMode === 'practice'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          <span className="sm:hidden">🎮 Practice</span>
          <span className="hidden sm:inline">🎮 Practice Mode</span>
        </button>
      </div>

      {/* Bar Graph */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 text-center">
          Wins by Number of Tries
        </h3>
        
        <div className="space-y-2 sm:space-y-4">
          {/* Try counts 1-6 */}
          {[1, 2, 3, 4, 5, 6].map((tries) => {
                         const count = currentStats.winsByTries[tries] || 0;
             const percentage = currentStats.totalGames > 0 
               ? Math.round((count / currentStats.totalGames) * 100) 
               : 0;
             const barWidth = percentage; // Bar width should match the percentage
            
            return (
              <div key={tries} className="flex items-center space-x-2 sm:space-x-4">
                <div className="w-10 sm:w-16 text-right">
                  <span className="text-white font-semibold text-xs sm:text-base">
                    <span className="sm:hidden">{tries}</span>
                    <span className="hidden sm:inline">{tries} {tries === 1 ? 'try' : 'tries'}</span>
                  </span>
                </div>
                
                <div className="flex-1 relative">
                  <div className="bg-white/20 rounded-full h-6 sm:h-8 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-pink-400 to-purple-500 h-6 sm:h-8 rounded-full transition-all duration-500 ease-out shadow-lg"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
                
                <div className="w-16 sm:w-24 text-left">
                  <span className="text-white font-semibold text-xs sm:text-base">
                    <span className="sm:hidden">{count}</span>
                    <span className="hidden sm:inline">{count} ({percentage}%)</span>
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* Failed games */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="w-10 sm:w-16 text-right">
              <span className="text-red-300 font-semibold text-xs sm:text-base">
                <span className="sm:hidden">X</span>
                <span className="hidden sm:inline">Failed</span>
              </span>
            </div>
            
            <div className="flex-1 relative">
              <div className="bg-white/20 rounded-full h-6 sm:h-8 overflow-hidden">
                                     <div 
                       className="bg-gradient-to-r from-red-400 to-red-500 h-6 sm:h-8 rounded-full transition-all duration-500 ease-out shadow-lg"
                       style={{ width: `${currentStats.totalGames > 0 ? Math.round((currentStats.failedGames / currentStats.totalGames) * 100) : 0}%` }}
                     />
              </div>
            </div>
            
            <div className="w-16 sm:w-24 text-left">
              <span className="text-red-300 font-semibold text-xs sm:text-base">
                <span className="sm:hidden">{currentStats.failedGames}</span>
                <span className="hidden sm:inline">{currentStats.failedGames} ({currentStats.totalGames > 0 ? Math.round((currentStats.failedGames / currentStats.totalGames) * 100) : 0}%)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-white/20">
          <div className="text-lg sm:text-2xl font-bold text-white">{currentStats.totalGames}</div>
          <div className="text-white/70 text-xs sm:text-sm">Total Games</div>
        </div>
        
        <div className="bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-white/20">
          <div className="text-lg sm:text-2xl font-bold text-white">{currentStats.winPercentage}%</div>
          <div className="text-white/70 text-xs sm:text-sm">Win Rate</div>
        </div>
        
        <div className="bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-white/20">
          <div className="text-lg sm:text-2xl font-bold text-white">{currentStats.averageTries}</div>
          <div className="text-white/70 text-xs sm:text-sm">Avg Tries</div>
        </div>
        
        <div className="bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-white/20">
          <div className="text-lg sm:text-2xl font-bold text-white">{currentStats.bestStreak}</div>
          <div className="text-white/70 text-xs sm:text-sm">Best Streak</div>
        </div>
      </div>

      {/* Current Streak */}
      {currentStats.currentStreak > 0 && (
        <div className="text-center">
          <div className="inline-flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl">
            <span className="text-lg sm:text-xl">🔥</span>
            <span className="font-semibold text-sm sm:text-base">
              <span className="sm:hidden">Streak: {currentStats.currentStreak}</span>
              <span className="hidden sm:inline">Current Streak: {currentStats.currentStreak}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
