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
 * Component that fetches and displays artist artwork from Apple Music API
 * Uses Intersection Observer for lazy loading to prevent rate limiting
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

    // Fetch artist artwork from Apple Music API with delay
    const fetchArtwork = async () => {
      try {
        // Add delay to stagger requests and avoid rate limiting
        if (fetchDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, fetchDelay));
        }

        const response = await fetch(`/api/${artistId}/artwork`);
        
        if (response.ok) {
          const data: { artwork: ArtistArtwork } = await response.json();
          
          // Use standard or high-res URL based on requested size
          const appleUrl = width > 600 ? data.artwork.highResUrl : data.artwork.standardUrl;
          
          if (appleUrl) {
            console.log(`✅ Using Apple Music artwork for ${artistId}`);
            setImageUrl(appleUrl);
          } else {
            console.warn(`⚠️ No Apple Music artwork found for ${artistId}`);
            setHasError(true);
          }
        } else {
          console.warn(`⚠️ Failed to fetch artwork for ${artistId}: ${response.status}`);
          setHasError(true);
        }
      } catch (error) {
        console.error(`❌ Error fetching artwork for ${artistId}:`, error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtwork();
  }, [artistId, width, isVisible, fetchDelay]);

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
