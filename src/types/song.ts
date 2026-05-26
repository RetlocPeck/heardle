// Generic song interface that works for any artist
export interface Song {
  id: string;
  name: string;
  artists: string[];
  album: string;
  previewUrl: string;
  duration: number;
  trackUrl: string; // Generic URL to track (Apple Music, iTunes, etc.)
  artworkUrl: string;
  trackId: string | number; // Apple Music uses strings, iTunes uses numbers
}

// ============================================
// Apple Music API Types
// ============================================

export interface AppleMusicArtwork {
  width: number;
  height: number;
  url: string; // Template URL with {w}x{h} placeholders
  bgColor?: string;
  textColor1?: string;
  textColor2?: string;
  textColor3?: string;
  textColor4?: string;
}

export interface AppleMusicTrack {
  id: string;
  type: 'songs';
  href: string;
  attributes: {
    albumName: string;
    artistName: string;
    artwork: AppleMusicArtwork;
    composerName?: string;
    contentRating?: string;
    discNumber?: number;
    durationInMillis: number;
    genreNames: string[];
    hasLyrics?: boolean;
    isrc?: string;
    name: string; // Track title
    playParams?: {
      id: string;
      kind: string;
    };
    previews?: Array<{
      url: string; // 30-second preview URL
    }>;
    releaseDate: string;
    trackNumber?: number;
    url: string; // Apple Music web URL
  };
}

export interface AppleMusicArtist {
  id: string;
  type: 'artists';
  href: string;
  attributes: {
    name: string;
    genreNames: string[];
    artwork?: AppleMusicArtwork;
    editorialArtwork?: {
      subscriptionHero?: {
        width: number;
        height: number;
        url: string;
      };
      superHeroWide?: {
        width: number;
        height: number;
        url: string;
      };
      // Other variants may exist
    };
    url: string; // Apple Music artist page URL
  };
  relationships?: {
    albums?: {
      href: string;
      next?: string;
      data?: Array<{ id: string; type: string; href: string }>;
    };
  };
}

export interface AppleMusicResponse {
  data: AppleMusicTrack[];
  next?: string; // Pagination URL
  meta?: {
    total?: number;
  };
}

export interface AppleMusicArtistResponse {
  data: AppleMusicArtist[];
}

export interface AppleMusicAlbum {
  id: string;
  type: 'albums';
  href: string;
  attributes?: {
    name: string;
    artistName: string;
    artwork?: AppleMusicArtwork;
    releaseDate?: string;
    trackCount?: number;
    genreNames?: string[];
    isSingle?: boolean;
    isComplete?: boolean;
  };
  relationships?: {
    tracks?: {
      href?: string;
      data?: AppleMusicTrack[];
    };
  };
}

/** Album tagged with the storefront it was fetched from, for multi-storefront catalog builds. */
export interface AppleMusicAlbumWithStorefront extends AppleMusicAlbum {
  _storefront: string;
}

/**
 * Minimal track shape produced when adapting a cached `Song` into a filterable track.
 * Satisfies `GenericTrack` (i.e. `AppleMusicTrack`) from `trackFilters.ts`.
 */
export interface SongFilterTrackAdapter {
  id: string | number;
  attributes: {
    name: string;
    albumName: string;
    previews: Array<{ url: string }>;
  };
}

// ============================================
// Apple Music Conversion Functions
// ============================================

/**
 * Format Apple Music artwork URL with specific dimensions
 */
export function formatAppleMusicArtworkUrl(
  template: string,
  width: number,
  height: number
): string {
  return template.replace('{w}', width.toString()).replace('{h}', height.toString());
}

/**
 * Convert Apple Music track to our generic Song format
 */
export function convertAppleMusicTrackToSong(track: AppleMusicTrack): Song {
  // Extract preview URL (first preview if available)
  const previewUrl = track.attributes.previews?.[0]?.url || '';
  
  // Format artwork URL to 300x300 (or keep template for dynamic sizing)
  const artworkUrl = formatAppleMusicArtworkUrl(
    track.attributes.artwork.url,
    300,
    300
  );
  
  return {
    id: `applemusic-${track.id}`,
    name: track.attributes.name,
    artists: [track.attributes.artistName],
    album: track.attributes.albumName,
    previewUrl,
    duration: track.attributes.durationInMillis,
    trackUrl: track.attributes.url,
    artworkUrl,
    trackId: track.id,
  };
}

/**
 * Check if an object is an Apple Music track
 */
export function isAppleMusicTrack(obj: unknown): obj is AppleMusicTrack {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).id === 'string' &&
    (obj as Record<string, unknown>).type === 'songs' &&
    typeof (obj as Record<string, unknown>).attributes === 'object' &&
    (obj as Record<string, unknown>).attributes !== null &&
    typeof ((obj as Record<string, unknown>).attributes as Record<string, unknown>).name === 'string' &&
    typeof ((obj as Record<string, unknown>).attributes as Record<string, unknown>).artistName === 'string'
  );
}

// ============================================
// Type guards and utility functions
// ============================================

export function isSong(obj: unknown): obj is Song {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    Array.isArray(o.artists) &&
    typeof o.album === 'string' &&
    typeof o.previewUrl === 'string' &&
    typeof o.duration === 'number' &&
    typeof o.trackUrl === 'string' &&
    typeof o.artworkUrl === 'string' &&
    (typeof o.trackId === 'number' || typeof o.trackId === 'string')
  );
}

