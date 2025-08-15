// Generic song interface that works for any artist
export interface Song {
  id: string;
  name: string;
  artists: string[];
  album: string;
  previewUrl: string;
  duration: number;
  itunesUrl: string;
  artworkUrl: string;
  trackId: number;
}

// iTunes API response types
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

// Type guards and utility functions
export function isSong(obj: any): obj is Song {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.artists) &&
    typeof obj.album === 'string' &&
    typeof obj.previewUrl === 'string' &&
    typeof obj.duration === 'number' &&
    typeof obj.itunesUrl === 'string' &&
    typeof obj.artworkUrl === 'string' &&
    typeof obj.trackId === 'number'
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

// Convert iTunes track to our Song format
export function convertITunesTrackToSong(track: ITunesTrack): Song {
  return {
    id: `itunes-${track.trackId}`,
    name: track.trackName || 'Unknown Track',
    artists: [track.artistName || 'Unknown Artist'],
    album: track.collectionName || 'Unknown Album',
    previewUrl: track.previewUrl || '',
    duration: track.trackTimeMillis || 0,
    itunesUrl: track.trackViewUrl || '',
    artworkUrl: track.artworkUrl100?.replace('100x100', '300x300') || '',
    trackId: track.trackId
  };
}
