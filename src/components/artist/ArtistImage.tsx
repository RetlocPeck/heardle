'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface ArtistImageProps {
  artistId: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  /** Delay before fetching (for staggering requests) */
  fetchDelay?: number;
}

interface ArtistArtwork {
  standardUrl: string;
  highResUrl: string;
  bannerUrl?: string;
  bgColor?: string;
}

/**
 * Component that displays artist artwork from pre-cached static JSON files
 * 
 * PERFORMANCE OPTIMIZATION:
 * Instead of making API calls on every render, we load artwork URLs directly
 * from static JSON files in /public/data/artwork/. This dramatically improves
 * load times since:
 * - Static files are cached and served instantly from CDN
 * - No API roundtrips to Apple Music
 * - No server-side processing needed
 * 
 * Uses Intersection Observer for lazy loading to further improve performance
 */
export default function ArtistImage({
  artistId,
  alt,
  className,
  width = 300,
  height = 300,
  priority = false,
  fetchDelay = 0,
}: ArtistImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(priority); // Featured artists load immediately

  useEffect(() => {
    // If priority (featured), skip intersection observer
    if (priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' } // Start loading slightly before visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  useEffect(() => {
    if (!isVisible) return;

    // Load artist artwork from pre-cached static JSON file
    const loadArtwork = async () => {
      // Reset error state at the start of each load attempt
      // This ensures retries (e.g., from width/visibility changes) can succeed
      setHasError(false);
      setIsLoading(true);
      
      try {
        // Add delay to stagger requests (optional, mainly for visual effect now)
        if (fetchDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, fetchDelay));
        }

        // Load artwork from static JSON file (much faster than API call)
        const response = await fetch(`/data/artwork/${artistId}.json`);
        
        if (response.ok) {
          const artwork: ArtistArtwork = await response.json();
          
          // Use standard or high-res URL based on requested size
          const appleUrl = width > 600 ? artwork.highResUrl : artwork.standardUrl;
          
          if (!appleUrl) {
            // If JSON exists but lacks required URL fields, try API fallback
            console.warn(`⚠️ No artwork URL found in static file for ${artistId}, trying API fallback`);
            throw new Error('Missing artwork URL in static file');
          }
          
          // In production: use proxy for edge caching (fast after first load)
          // In development: load directly (faster than proxy overhead on localhost)
          const isDev = process.env.NODE_ENV === 'development';
          const imageUrl = isDev 
            ? appleUrl 
            : `/api/images/proxy?url=${encodeURIComponent(appleUrl)}`;
          setImageUrl(imageUrl);
          // Ensure error state is cleared on successful load
          setHasError(false);
        } else {
          // Fallback to API if static file doesn't exist
          throw new Error('Static artwork file not found');
        }
      } catch (error) {
        console.error(`❌ Error loading artwork for ${artistId}:`, error);
        
        // Try API fallback if static file load failed or was malformed
        try {
          console.log(`🔄 Attempting API fallback for ${artistId}`);
          const apiResponse = await fetch(`/api/${artistId}/artwork`);
          
          if (apiResponse.ok) {
            const data: { artwork: ArtistArtwork } = await apiResponse.json();
            const appleUrl = width > 600 ? data.artwork.highResUrl : data.artwork.standardUrl;
            
            if (appleUrl) {
              // In production: use proxy for edge caching (fast after first load)
              // In development: load directly (faster than proxy overhead on localhost)
              const isDev = process.env.NODE_ENV === 'development';
              const imageUrl = isDev 
                ? appleUrl 
                : `/api/images/proxy?url=${encodeURIComponent(appleUrl)}`;
              setImageUrl(imageUrl);
              // Ensure error state is cleared on successful load
              setHasError(false);
              return; // Success, don't set error
            }
          }
        } catch (fallbackError) {
          console.error(`❌ API fallback also failed for ${artistId}:`, fallbackError);
        }
        
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadArtwork();
    // fetchDelay intentionally excluded from deps - it's only used for initial timing
    // and shouldn't trigger re-fetches when search filters change the delay value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId, width, isVisible]);

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      {(isLoading || !imageUrl) && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50"></div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-pink-600/30">
          <div className="text-center px-4">
            <div className="text-4xl mb-2">🎵</div>
            <div className="text-white/70 text-sm">{alt}</div>
          </div>
        </div>
      )}
      
      {imageUrl && !hasError && (
        <Image
          src={imageUrl}
          alt={alt}
          width={width}
          height={height}
          className={`${className || ''} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          priority={priority}
          // Custom loader to bypass Next.js optimization for proxy URLs
          // This prevents Next.js from adding its own query params to our proxy URLs
          loader={({ src }) => src}
          // Disable automatic optimization since we're using proxy/direct URLs
          unoptimized={true}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            console.error(`❌ Failed to load image for ${artistId}`);
            setHasError(true);
            setIsLoading(false);
          }}
        />
      )}
    </div>
  );
}
