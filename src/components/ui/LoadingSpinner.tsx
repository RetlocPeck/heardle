'use client';

import React from 'react';
import AnimatedBackground from '@/components/ui/AnimatedBackground';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  message?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
};

const borderClasses = {
  sm: 'border-2',
  md: 'border-4',
  lg: 'border-4',
  xl: 'border-4'
};

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'border-[var(--foreground-secondary)]', 
  message,
  className = ''
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div
        className={`
          ${sizeClasses[size]} 
          ${borderClasses[size]} 
          ${color} 
          border-t-transparent 
          rounded-full 
          animate-spin
        `}
      />
      {message && (
        <p className="theme-text-secondary text-center font-medium">
          {message}
        </p>
      )}
    </div>
  );
}

export function ArtistLoadingSpinner({ artistName }: { artistName?: string }) {
  return (
    <LoadingSpinner
      size="lg"
      message={artistName ? `Loading ${artistName} song...` : 'Loading song...'}
      className="min-h-64"
    />
  );
}

export function GameLoadingSpinner() {
  return (
    <LoadingSpinner
      size="md"
      message="Preparing game..."
    />
  );
}

export function PageLoadingSpinner() {
  return (
    <div className="min-h-screen theme-page flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 theme-page-gradient pointer-events-none"
        aria-hidden="true"
      />
      <AnimatedBackground blobCount={2} subtle />

      <div className="relative z-10">
        <LoadingSpinner
          size="xl"
          message="Loading K-Pop Heardle..."
        />
      </div>
    </div>
  );
}
