'use client';

import React from 'react';

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
  color = 'border-pink-400', 
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
        <p className="text-white/80 text-center font-medium">
          {message}
        </p>
      )}
    </div>
  );
}

// Pre-configured spinner variants for common use cases
export function ArtistLoadingSpinner({ artistName }: { artistName?: string }) {
  return (
    <LoadingSpinner
      size="lg"
      color="border-pink-400"
      message={artistName ? `Loading ${artistName} song...` : 'Loading song...'}
      className="min-h-64"
    />
  );
}

export function GameLoadingSpinner() {
  return (
    <LoadingSpinner
      size="md"
      color="border-purple-400"
      message="Preparing game..."
    />
  );
}

export function PageLoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      </div>
      
      <div className="relative z-10">
        <LoadingSpinner
          size="xl"
          color="border-pink-400"
          message="Loading K-Pop Heardle..."
        />
      </div>
    </div>
  );
}
