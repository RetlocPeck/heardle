'use client';

import React, { useState } from 'react';
import Statistics from './Statistics';

interface StatisticsButtonProps {
  artistId?: string; // If provided, show artist-specific stats; if not, show global stats
  className?: string;
  currentMode?: 'daily' | 'practice'; // Current game mode to set as default in stats
}

export default function StatisticsButton({ artistId, className = '', currentMode = 'daily' }: StatisticsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  return (
    <>
      <button
        onClick={handleOpen}
        className={`
          w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/10 hover:bg-white/20
          rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center
          transition-all duration-200 hover:scale-105 sm:hover:scale-110 hover:shadow-lg
          ${className}
        `}
        title={artistId ? 'View Artist Statistics' : 'View Global Statistics'}
      >
        <span className="text-white text-base sm:text-lg lg:text-xl">📊</span>
      </button>

      <Statistics
        artistId={artistId}
        isOpen={isOpen}
        onClose={handleClose}
        defaultMode={currentMode}
      />
    </>
  );
}
