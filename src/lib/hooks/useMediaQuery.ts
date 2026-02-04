'use client';

import { useState, useEffect } from 'react';
import { BREAKPOINTS } from '@/lib/constants';

/**
 * Hook that returns true if the media query matches.
 * 
 * @param query - CSS media query string (e.g., '(max-width: 768px)')
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event listener
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener (modern API with fallback)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Hook that returns true if the viewport is mobile-sized (< 1024px).
 * Matches Tailwind's lg breakpoint.
 */
export function useMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.MOBILE_MAX}px)`);
}

/**
 * Hook that returns true if the viewport is tablet-sized or smaller (< 768px).
 * Matches Tailwind's md breakpoint.
 */
export function useTablet(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.MD - 0.02}px)`);
}

/**
 * Hook that returns true if the viewport is small mobile (< 640px).
 * Matches Tailwind's sm breakpoint.
 */
export function useSmallMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.SM - 0.02}px)`);
}

/**
 * Hook that returns the current breakpoint name.
 */
export function useBreakpoint(): 'sm' | 'md' | 'lg' | 'xl' {
  const isSmall = useSmallMobile();
  const isTablet = useTablet();
  const isMobile = useMobile();

  if (isSmall) return 'sm';
  if (isTablet) return 'md';
  if (isMobile) return 'lg';
  return 'xl';
}

export default useMediaQuery;
