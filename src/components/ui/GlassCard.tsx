'use client';

import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Responsive padding: 'sm' = p-2 sm:p-3, 'md' = p-2 sm:p-3 lg:p-6, 'lg' = p-6 */
  padding?: 'sm' | 'md' | 'lg';
  /** Responsive border radius: 'sm' = rounded-2xl, 'md' = rounded-2xl sm:rounded-3xl, 'lg' = rounded-3xl */
  rounded?: 'sm' | 'md' | 'lg';
  /** Use full height */
  fullHeight?: boolean;
  /** Make it a flex column */
  flexCol?: boolean;
}

const paddingClasses = {
  sm: 'p-2 sm:p-3',
  md: 'p-2 sm:p-3 lg:p-6',
  lg: 'p-6',
} as const;

const roundedClasses = {
  sm: 'rounded-2xl',
  md: 'rounded-2xl sm:rounded-3xl',
  lg: 'rounded-3xl',
} as const;

/**
 * Glassmorphism card component with consistent styling
 * Used throughout the app for visual consistency
 */
export default function GlassCard({
  children,
  className = '',
  padding = 'md',
  rounded = 'md',
  fullHeight = false,
  flexCol = false,
}: GlassCardProps) {
  const baseClasses = 'relative z-10 overflow-visible backdrop-blur-xl bg-white/5 border border-white/20';
  const paddingClass = paddingClasses[padding];
  const roundedClass = roundedClasses[rounded];
  const heightClass = fullHeight ? 'h-full' : '';
  const flexClass = flexCol ? 'flex flex-col' : '';

  return (
    <div className={`${baseClasses} ${roundedClass} ${paddingClass} ${heightClass} ${flexClass} ${className}`}>
      {children}
    </div>
  );
}
