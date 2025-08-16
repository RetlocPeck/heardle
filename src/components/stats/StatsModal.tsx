'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import Portal from '@/components/ui/Portal';

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
    if (!modalRef.current) return;
    
    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
  }, []);

  const focusLastTabbable = useCallback(() => {
    if (!modalRef.current) return;
    
    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
    }
  }, []);

  // Handle escape key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
    
    // Handle tab key for focus trap
    if (event.key === 'Tab') {
      if (!modalRef.current) return;
      
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
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
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-title"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        {/* Modal */}
        <div
          ref={modalRef}
          className="relative w-full max-w-[720px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
          style={{ maxHeight: '90vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h2 id="stats-title" className="text-2xl font-bold text-white">
                  {title}
                </h2>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110"
              aria-label="Close statistics modal"
            >
              <span className="text-white text-xl">×</span>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            {children}
          </div>
        </div>
      </div>
    </Portal>
  );
}
