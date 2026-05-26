'use client';

import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

interface AnimatedBackgroundProps {
  blobCount?: 2 | 3;
  opacity?: number;
  subtle?: boolean;
}

/**
 * Animated blob background component used across pages.
 * Returns null when the user prefers reduced motion.
 */
export function AnimatedBackground({
  blobCount = 3,
  opacity = 70,
  subtle = false,
}: AnimatedBackgroundProps) {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  if (prefersReducedMotion) return null;

  const actualOpacity = subtle ? Math.round(opacity * 0.4) : opacity;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute -top-40 -right-40 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob will-change-transform"
        style={{ opacity: actualOpacity / 100 }}
      />
      <div
        className="absolute -bottom-40 -left-40 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000 will-change-transform"
        style={{ opacity: actualOpacity / 100 }}
      />
      {blobCount === 3 && (
        <div
          className="absolute top-40 left-40 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000 will-change-transform"
          style={{ opacity: actualOpacity / 100 }}
        />
      )}
    </div>
  );
}

export default AnimatedBackground;
