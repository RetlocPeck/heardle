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
    <div className="min-h-screen theme-page relative overflow-hidden">
      <div
        className="absolute inset-0 theme-page-gradient pointer-events-none"
        aria-hidden="true"
      />
      <AnimatedBackground blobCount={blobCount} subtle={subtle} />
      <div className="relative z-[1]">{children}</div>
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
    <div className="relative z-20 theme-page-header">
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
