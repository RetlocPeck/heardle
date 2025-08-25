'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GameMode } from '@/lib/gameLogic';

interface ModeSelectorProps {
  selectedMode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

export default function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
  const dailyRef = useRef<HTMLButtonElement | null>(null);
  const practiceRef = useRef<HTMLButtonElement | null>(null);
  const [tabWidthPx, setTabWidthPx] = useState<number | null>(null);

  // Measure current rendered widths (they change with breakpoints because of label swaps)
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 640px)'); // Tailwind sm

    const measure = (el: HTMLButtonElement | null) => {
      if (!el) return 0;
      const prev = el.style.width;
      el.style.width = 'auto';
      const w = Math.ceil(el.scrollWidth); // intrinsic width incl. padding
      el.style.width = prev;
      return w;
    };

    const compute = () => {
      if (mql.matches) {
        // Desktop/tablet: don't force equal widths
        setTabWidthPx(null);
        return;
      }
      // Mobile: make both tabs as wide as the widest label
      const d = measure(dailyRef.current);
      const p = measure(practiceRef.current);
      const max = Math.max(d, p);
      setTabWidthPx(max > 0 ? max : null);
    };

    compute();

    // Recompute when viewport crosses sm breakpoint
    const onMQChange = () => compute();
    mql.addEventListener?.('change', onMQChange);

    // Recompute on resize + content changes
    const onResize = () => compute();
    window.addEventListener('resize', onResize, { passive: true });

    // Recompute if text/icon metrics change (fonts load, etc.)
    const ro = new ResizeObserver(compute);
    if (dailyRef.current) ro.observe(dailyRef.current);
    if (practiceRef.current) ro.observe(practiceRef.current);

    return () => {
      mql.removeEventListener?.('change', onMQChange);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [selectedMode]);

  const commonBtn =
    'inline-flex items-center justify-center w-auto min-w-fit flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 hover:scale-105';
  
  return (
    <div className="flex justify-center mb-4 sm:mb-6">
      <div className="inline-flex backdrop-blur-xl bg-white/10 rounded-2xl p-1.5 sm:p-2 border border-white/20 shadow-2xl">
        <div className="flex space-x-1 sm:space-x-2">
          <button
            ref={dailyRef}
            onClick={() => onModeChange('daily')}
            className={`${commonBtn} ${
              selectedMode === 'daily' 
              ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25' 
              : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'}`}
            style={{ width: tabWidthPx ? `${tabWidthPx}px` : 'auto' }}
          >
            <span className="flex items-center justify-center gap-2 whitespace-nowrap">
              <span>📅</span>
              <span className="hidden sm:inline">Daily Challenge</span>
              <span className="sm:hidden">Daily</span>
            </span>
          </button>
          <button
            ref={practiceRef}
            onClick={() => onModeChange('practice')}
            className={`
              inline-flex items-center justify-center w-auto min-w-fit flex-none
              px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-sm sm:text-base
              transition-all duration-300 hover:scale-105
              ${selectedMode === 'practice'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
              }
            `}
            style={{ width: tabWidthPx ? `${tabWidthPx}px` : 'auto' }}
          >
            <span className="flex items-center justify-center gap-2 whitespace-nowrap">
              <span>🎮</span>
              <span className="hidden sm:inline">Practice Mode</span>
              <span className="sm:hidden">Practice</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

