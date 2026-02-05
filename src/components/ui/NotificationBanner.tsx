'use client';

import { useState, useEffect, useRef } from 'react';

interface NotificationBannerProps {
  /** Unique ID for this notification (used for dismissal tracking) */
  id: string;
  /** Notification message */
  message: string;
  /** Optional emoji/icon */
  icon?: string;
  /** Show dismiss button */
  dismissible?: boolean;
}

/**
 * Notification banner component that appears under the navbar
 * Supports localStorage-based dismissal so users only see it once
 */
export default function NotificationBanner({
  id,
  message,
  icon = '🎉',
  dismissible = true,
}: NotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cancel any pending timeouts when id changes
    // This prevents old animations/dismissals from affecting the new notification
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    
    // Reset animation state when id changes to ensure new notification animates in
    setIsAnimating(false);
    
    // Check if user has dismissed this notification
    // Wrap in try-catch for private browsing mode / disabled localStorage
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(`notification-${id}-dismissed`) === 'true';
    } catch (error) {
      // localStorage not available (private browsing, disabled, etc.)
      // Default to showing notification
      console.warn('localStorage not available, notification will show every time:', error);
    }
    
    if (!dismissed) {
      setIsVisible(true);
      // Trigger animation after mount with small delay for new notification
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(true);
        animationTimeoutRef.current = null;
      }, 100);
    } else {
      // If dismissed, hide immediately
      setIsVisible(false);
    }
    
    // Cleanup: cancel BOTH timeouts if component unmounts or id changes
    // This prevents state updates on unmounted components and memory leaks
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
        dismissTimeoutRef.current = null;
      }
    };
  }, [id]);


  const handleDismiss = () => {
    // Cancel animation timeout if user dismisses before animation completes
    // This prevents the animation from flickering back to visible
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    
    // Save dismissal state IMMEDIATELY to ensure it persists even if:
    // - Component unmounts during animation
    // - id prop changes during animation
    // - User navigates away during animation
    // Wrap in try-catch for private browsing mode / disabled localStorage
    try {
      localStorage.setItem(`notification-${id}-dismissed`, 'true');
    } catch (error) {
      // localStorage not available (private browsing, quota exceeded, etc.)
      // Notification will show again on next visit, but that's acceptable
      console.warn('Failed to save notification dismissal:', error);
    }
    
    setIsAnimating(false);
    
    // Store timeout ref so it can be cancelled if component unmounts or id changes
    dismissTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      dismissTimeoutRef.current = null;
    }, 350); // CSS animation is 300ms + 50ms buffer for React render/paint delays
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        relative z-10 backdrop-blur-md bg-gradient-to-r from-purple-500/20 to-pink-500/20 
        border-b border-white/10 transition-all duration-300 ease-out
        ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="relative flex items-center justify-center py-2 sm:py-3">
          {/* Centered Icon + Message */}
          <div className="flex items-center gap-2 sm:gap-3 justify-center">
            <span className="text-lg sm:text-xl flex-shrink-0" aria-hidden="true">
              {icon}
            </span>
            <p className="text-white text-xs sm:text-sm lg:text-base font-medium leading-snug text-center">
              {message}
            </p>
          </div>

          {/* Dismiss Button - Positioned absolutely on the right */}
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="
                absolute right-0 flex-shrink-0 text-white/60 hover:text-white 
                transition-colors p-1 sm:p-1.5 
                rounded-lg hover:bg-white/10
                focus:outline-none focus:ring-2 focus:ring-white/20
              "
              aria-label="Dismiss notification"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
