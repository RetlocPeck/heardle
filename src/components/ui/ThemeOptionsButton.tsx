'use client';

import { useCallback, useEffect, useLayoutEffect as _useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/components/ui/ThemeProvider';
import { resolveEffectiveTheme, type Theme } from '@/lib/theme';

const useLayoutEffect = typeof window !== 'undefined' ? _useLayoutEffect : useEffect;

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

function ThemeIcon({ theme, className }: { theme: Theme; className?: string }) {
  const isDark = resolveEffectiveTheme(theme) === 'dark';
  return isDark ? <SunIcon className={className} /> : <MoonIcon className={className} />;
}

const themeOptions: { value: Theme; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
];

interface MenuPosition {
  top: number;
  right: number;
}

export default function ThemeOptionsButton() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }
    updateMenuPosition();
    const handleScroll = () => setOpen(false);
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    const timer = window.setTimeout(() => {
      document.addEventListener('pointerdown', handlePointerDown);
    }, 0);

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const selectTheme = (value: Theme) => {
    setTheme(value);
    setOpen(false);
  };

  const menu = open && menuPosition && mounted ? (
    createPortal(
      <div
        ref={menuRef}
        style={{ top: menuPosition.top, right: menuPosition.right }}
        className="
          fixed z-[1100] min-w-[220px]
          theme-glass-surface rounded-xl sm:rounded-2xl p-3 sm:p-4
          shadow-[var(--glass-shadow)]
        "
      >
        <p id="theme-label" className="theme-text-muted text-xs font-semibold uppercase tracking-wide mb-3">
          Appearance
        </p>
        <div
          className="flex rounded-lg overflow-hidden border theme-glass-border p-0.5 gap-0.5"
          role="group"
          aria-labelledby="theme-label"
        >
          {themeOptions.map((option) => {
            const isActive = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => selectTheme(option.value)}
                aria-pressed={isActive}
                className={`
                  flex-1 px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors
                  ${isActive
                    ? 'theme-btn-primary shadow-sm'
                    : 'theme-text-muted theme-segment-inactive'
                  }
                `}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="
          w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 theme-icon-btn
          rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center
          transition-all duration-200 hover:scale-105 sm:hover:scale-110
        "
        aria-label="Theme options"
        aria-expanded={open}
      >
        <ThemeIcon theme={theme} className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 theme-text" />
      </button>
      {menu}
    </>
  );
}
