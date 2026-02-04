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

// ============================================
// iTunes API response types (DEPRECATED - Kept for filter chain compatibility)
// These types are no longer actively used but maintained for GenericTrack support
// ============================================
export interface ITunesTrack {
  wrapperType: string;
  kind: string;
  artistId: number;
  collectionId: number;
  trackId: number;
  artistName: string;
  collectionName: string;
  trackName: string;
  collectionCensoredName: string;
  trackCensoredName: string;
  artistViewUrl: string;
  collectionViewUrl: string;
  trackViewUrl: string;
  previewUrl: string;
  artworkUrl60: string;
  artworkUrl100: string;
  collectionPrice: number;
  trackPrice: number;
  collectionExplicitness: string;
  trackExplicitness: string;
  discCount: number;
  discNumber: number;
  trackCount: number;
  trackNumber: number;
  trackTimeMillis: number;
  country: string;
  currency: string;
  primaryGenreName: string;
  releaseDate: string;
}

export interface ITunesResponse {
  resultCount: number;
  results: ITunesTrack[];
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
export function isAppleMusicTrack(obj: any): obj is AppleMusicTrack {
  return (
    obj &&
    typeof obj.id === 'string' &&
    obj.type === 'songs' &&
    obj.attributes &&
    typeof obj.attributes.name === 'string' &&
    typeof obj.attributes.artistName === 'string'
  );
}

// ============================================
// Type guards and utility functions
// ============================================

export function isSong(obj: any): obj is Song {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.artists) &&
    typeof obj.album === 'string' &&
    typeof obj.previewUrl === 'string' &&
    typeof obj.duration === 'number' &&
    typeof obj.trackUrl === 'string' &&
    typeof obj.artworkUrl === 'string' &&
    (typeof obj.trackId === 'number' || typeof obj.trackId === 'string')
  );
}

export function isITunesTrack(obj: any): obj is ITunesTrack {
  return (
    obj &&
    typeof obj.trackId === 'number' &&
    typeof obj.trackName === 'string' &&
    typeof obj.artistName === 'string'
  );
}

// Convert iTunes track to our Song format (DEPRECATED)
export function convertITunesTrackToSong(track: ITunesTrack): Song {
  return {
    id: `itunes-${track.trackId}`,
    name: track.trackName || 'Unknown Track',
    artists: [track.artistName || 'Unknown Artist'],
    album: track.collectionName || 'Unknown Album',
    previewUrl: track.previewUrl || '',
    duration: track.trackTimeMillis || 0,
    trackUrl: track.trackViewUrl || '', // Updated from itunesUrl
    artworkUrl: track.artworkUrl100?.replace('100x100', '300x300') || '',
    trackId: track.trackId
  };
}
