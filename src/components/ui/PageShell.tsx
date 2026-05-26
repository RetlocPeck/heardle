'use client';

import { ReactNode } from 'react';
import AnimatedBackground from '@/components/ui/AnimatedBackground';

interface PageShellProps {
  children: ReactNode;
  blobCount?: 2 | 3;
  subtle?: boolean;
}

/**
 * Root page wrapper: full-screen gradient background + animated blobs.
 * Use for every top-level page to ensure visual consistency.
 */
export function PageShell({ children, blobCount = 3, subtle = false }: PageShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <AnimatedBackground blobCount={blobCount} subtle={subtle} />
      {children}
    </div>
  );
}

interface PageHeaderProps {
  children: ReactNode;
}

/**
 * Glassmorphism header bar with consistent horizontal padding.
 */
export function PageHeader({ children }: PageHeaderProps) {
  return (
    <div className="relative z-10 backdrop-blur-md bg-white/10 border-b border-white/20">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {children}
      </div>
    </div>
  );
}

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Content wrapper with consistent responsive horizontal padding.
 * Compose with a `py-*` class via `className` for vertical spacing.
 */
export function ResponsiveContainer({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div className={`relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 ${className}`}>
      {children}
    </div>
  );
}
