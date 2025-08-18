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
    const compute = () => {
      const measure = (el: HTMLButtonElement | null) => {
        if (!el) return 0;
        const prevWidth = el.style.width;
        // Measure intrinsic content width so text always fits
        el.style.width = 'auto';
        const w = Math.ceil(el.scrollWidth);
        el.style.width = prevWidth;
        return w;
      };
      const d = measure(dailyRef.current);
      const p = measure(practiceRef.current);
      const max = Math.max(d, p);
      setTabWidthPx(max > 0 ? Math.ceil(max) : null);
    };
    compute();
    window.addEventListener('resize', compute, { passive: true });
    return () => window.removeEventListener('resize', compute as any);
  }, [selectedMode]);
  return (
    <div className="flex justify-center mb-4 sm:mb-6">
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-1.5 sm:p-2 border border-white/20 shadow-2xl">
        <div className="flex space-x-1 sm:space-x-2">
          <button
            ref={dailyRef}
            onClick={() => onModeChange('daily')}
            className={`
              inline-flex items-center justify-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 transform hover:scale-105
              ${selectedMode === 'daily'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
              }
            `}
            style={{ minWidth: tabWidthPx ? `${tabWidthPx}px` : undefined }}
          >
            <span className="flex items-center justify-center space-x-1 sm:space-x-2 whitespace-nowrap">
              <span>📅</span>
              <span className="hidden sm:inline">Daily Challenge</span>
              <span className="sm:hidden">Daily</span>
            </span>
          </button>
          <button
            ref={practiceRef}
            onClick={() => onModeChange('practice')}
            className={`
              inline-flex items-center justify-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 transform hover:scale-105
              ${selectedMode === 'practice'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
              }
            `}
            style={{ minWidth: tabWidthPx ? `${tabWidthPx}px` : undefined }}
          >
            <span className="flex items-center justify-center space-x-1 sm:space-x-2 whitespace-nowrap">
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

