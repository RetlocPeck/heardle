'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import Portal from '@/components/ui/Portal';

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)) as HTMLElement[];
}

interface StatsModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

export default function StatsModal({ open, onClose, children, title }: StatsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus management
  const focusFirstTabbable = useCallback(() => {
    const elements = getFocusableElements(modalRef.current);
    if (elements.length > 0) elements[0].focus();
  }, []);



  // Handle escape key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
    
    // Handle tab key for focus trap
    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements(modalRef.current);
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (event.shiftKey) {
        // Shift + Tab: going backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: going forwards
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Effects for modal open/close
  useEffect(() => {
    if (!open) return;

    // Store current active element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);

    // Focus first tabbable element
    const timer = setTimeout(focusFirstTabbable, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleKeyDown, focusFirstTabbable]);

  useEffect(() => {
    if (open) return;

    // Restore body scroll
    document.body.style.overflow = '';

    // Restore focus to previous element
    if (previousActiveElement.current) {
      previousActiveElement.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-title"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 theme-modal-backdrop backdrop-blur-sm" />
        
        {/* Modal */}
        <div
          ref={modalRef}
          className="relative w-full max-w-[720px] theme-glass-surface backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-[var(--glass-shadow)] overflow-hidden"
          style={{ maxHeight: '95vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-6 border-b theme-glass-border">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 theme-icon-btn rounded-xl sm:rounded-2xl flex items-center justify-center">
                <span className="text-lg sm:text-2xl">📊</span>
              </div>
              <div>
                <h2 id="stats-title" className="text-lg sm:text-2xl font-bold theme-text">
                  {title}
                </h2>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 theme-icon-btn rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110"
              aria-label="Close statistics modal"
            >
              <span className="theme-text text-lg sm:text-xl">×</span>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(95vh - 80px)' }}>
            {children}
          </div>
        </div>
      </div>
    </Portal>
  );
}
