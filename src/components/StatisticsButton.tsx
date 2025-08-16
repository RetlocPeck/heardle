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
          w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center 
          transition-all duration-200 hover:scale-110 hover:shadow-lg
          ${className}
        `}
        title={artistId ? 'View Artist Statistics' : 'View Global Statistics'}
      >
        <span className="text-white text-xl">📊</span>
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
