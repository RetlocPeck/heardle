'use client';

import React from 'react';
import StatsModal from './StatsModal';
import StatsContent from './StatsContent';
import { getArtistById } from '@/config/artists';

interface StatisticsProps {
  artistId?: string; // If provided, show artist-specific stats; if not, show global stats
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'daily' | 'practice'; // Default mode to show when opening
}

export default function Statistics({ artistId, isOpen, onClose, defaultMode = 'daily' }: StatisticsProps) {
  const artistName = artistId ? getArtistById(artistId)?.displayName : 'All Artists';
  const title = `${artistName} Statistics`;

  return (
    <StatsModal open={isOpen} onClose={onClose} title={title}>
      <StatsContent artistId={artistId} defaultMode={defaultMode} />
    </StatsModal>
  );
}
