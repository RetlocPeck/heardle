'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    // Check if user has dismissed this notification
    const dismissed = localStorage.getItem(`notification-${id}-dismissed`);
    if (!dismissed) {
      setIsVisible(true);
      // Trigger animation after mount
      setTimeout(() => setIsAnimating(true), 100);
    }
  }, [id]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem(`notification-${id}-dismissed`, 'true');
    }, 300); // Match animation duration
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
