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

  const actualOpacity = subtle ? Math.round(opacity * 0.35) : Math.round(opacity * 0.55);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="absolute -top-48 -right-32 w-[28rem] h-[28rem] rounded-full filter blur-3xl animate-blob will-change-transform theme-blob"
        style={{ backgroundColor: 'var(--blob-1)', opacity: actualOpacity / 100 }}
      />
      <div
        className="absolute -bottom-48 -left-32 w-[26rem] h-[26rem] rounded-full filter blur-3xl animate-blob animation-delay-2000 will-change-transform theme-blob"
        style={{ backgroundColor: 'var(--blob-2)', opacity: actualOpacity / 100 }}
      />
      {blobCount === 3 && (
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full filter blur-3xl animate-blob animation-delay-4000 will-change-transform theme-blob"
          style={{ backgroundColor: 'var(--blob-3)', opacity: (actualOpacity * 0.7) / 100 }}
        />
      )}
    </div>
  );
}

export default AnimatedBackground;
