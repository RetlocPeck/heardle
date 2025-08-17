'use client';
import { useState } from 'react';
import { buildShareText, ShareGameState } from '@/utils/share';

export default function ShareButton({ state, className }: { state: ShareGameState; className?: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const onShare = async () => {
    const text = buildShareText(state);
    try {
      // Force copy to clipboard
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      
      // Reset the copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers or if clipboard fails
      console.error('Clipboard copy failed:', error);
      // Show error state briefly
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={onShare}
      className={className ?? 'mt-3 w-full rounded-xl bg-green-500 text-white px-4 py-2 hover:opacity-90 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25'}
      aria-label="Share your result"
      title="Share your result"
      disabled={isCopied}
    >
      {isCopied ? (
        <span className="flex items-center justify-center space-x-2">
          <span>📋</span>
          <span>Copied to clipboard!</span>
        </span>
      ) : (
        <span className="flex items-center justify-center space-x-2">
          <span>🔁</span>
          <span>Share Result</span>
        </span>
      )}
    </button>
  );
}
