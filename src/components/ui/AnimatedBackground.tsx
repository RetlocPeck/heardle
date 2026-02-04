'use client';

interface AnimatedBackgroundProps {
  /**
   * Number of blobs to render (default: 3)
   */
  blobCount?: 2 | 3;
  /**
   * Opacity of the blobs (default: 70)
   */
  opacity?: number;
  /**
   * Whether to use reduced opacity for overlays (default: false)
   */
  subtle?: boolean;
}

/**
 * Animated blob background component used across pages.
 * Creates a decorative animated gradient effect.
 */
export function AnimatedBackground({ 
  blobCount = 3, 
  opacity = 70,
  subtle = false 
}: AnimatedBackgroundProps) {
  const actualOpacity = subtle ? Math.round(opacity * 0.4) : opacity;
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top-right purple blob */}
      <div 
        className={`absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob`}
        style={{ opacity: actualOpacity / 100 }}
      />
      
      {/* Bottom-left pink blob */}
      <div 
        className={`absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000`}
        style={{ opacity: actualOpacity / 100 }}
      />
      
      {/* Center-left indigo blob (optional third blob) */}
      {blobCount === 3 && (
        <div 
          className={`absolute top-40 left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000`}
          style={{ opacity: actualOpacity / 100 }}
        />
      )}
    </div>
  );
}

export default AnimatedBackground;
