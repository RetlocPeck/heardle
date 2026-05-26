'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { BREAKPOINTS } from '@/lib/constants';

export interface TabOption<T extends string> {
  value: T;
  label: string;
  shortLabel?: string;
  icon?: string;
}

interface TabGroupProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Controls the active tab gradient only. Inactive tab styles follow the current theme. */
  variant?: 'pink' | 'purple' | 'pink-purple';
  equalWidthOnMobile?: boolean;
  className?: string;
}

const variantStyles = {
  pink: {
    active: 'bg-gradient-to-r from-pink-500 to-rose-600 shadow-lg shadow-pink-500/25 text-white',
  },
  purple: {
    active: 'bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25 text-white',
  },
  'pink-purple': {
    active: 'bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg text-white',
  },
};

export function TabGroup<T extends string>({
  options,
  value,
  onChange,
  variant = 'pink',
  equalWidthOnMobile = true,
  className = '',
}: TabGroupProps<T>) {
  const refs = useRef<Map<T, HTMLButtonElement | null>>(new Map());
  const [tabWidth, setTabWidth] = useState<number | null>(null);
  const isMobile = !useMediaQuery(`(min-width: ${BREAKPOINTS.SM}px)`);

  useEffect(() => {
    if (!equalWidthOnMobile || !isMobile) {
      setTabWidth(null);
      return;
    }

    const measure = (el: HTMLButtonElement | null): number => {
      if (!el) return 0;
      const prevWidth = el.style.width;
      el.style.width = 'auto';
      const w = Math.ceil(el.scrollWidth);
      el.style.width = prevWidth;
      return w;
    };

    const widths = options.map(opt => measure(refs.current.get(opt.value) || null));
    const maxWidth = Math.max(...widths);
    setTabWidth(maxWidth > 0 ? maxWidth : null);
  }, [options, isMobile, equalWidthOnMobile, value]);

  const styles = variantStyles[variant];
  const baseClasses = `
    inline-flex items-center justify-center min-w-fit
    px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold
    text-xs sm:text-base transition-all duration-200 hover:scale-105
  `.trim();

  return (
    <div className={`flex justify-center ${className}`}>
      <div className="inline-flex backdrop-blur-xl theme-tab-track rounded-2xl p-1.5 sm:p-2">
        <div className="flex space-x-1 sm:space-x-2">
          {options.map((option) => {
            const isActive = value === option.value;
            const displayLabel = isMobile && option.shortLabel ? option.shortLabel : option.label;

            return (
              <button
                key={option.value}
                ref={(el) => { refs.current.set(option.value, el); }}
                onClick={() => onChange(option.value)}
                className={`
                  ${baseClasses}
                  ${isActive ? styles.active : 'theme-tab-inactive'}
                `}
                style={{ width: tabWidth ? `${tabWidth}px` : 'auto' }}
              >
                <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                  {option.icon && <span>{option.icon}</span>}
                  <span>{displayLabel}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const MODE_TABS: TabOption<'daily' | 'practice'>[] = [
  { value: 'daily', label: 'Daily Challenge', shortLabel: 'Daily', icon: '📅' },
  { value: 'practice', label: 'Practice Mode', shortLabel: 'Practice', icon: '🎮' },
];

export default TabGroup;
