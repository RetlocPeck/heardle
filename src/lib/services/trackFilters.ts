/**
 * Track filtering functions for music tracks
 * Uses a filter chain pattern with factory functions for cleaner code
 * Works with both iTunes and Apple Music API tracks
 */

import type { ITunesTrack, AppleMusicTrack } from '@/types/song';

// =============================================================================
// TYPES
// =============================================================================

export type GenericTrack = ITunesTrack | AppleMusicTrack;

export interface FilteredTrack {
  track: GenericTrack;
  reason: string;
}

export interface FilterResult {
  valid: GenericTrack[];
  filtered: FilteredTrack[];
}

export type TrackFilter = (
  tracks: GenericTrack[],
  filtered: FilteredTrack[]
) => { tracks: GenericTrack[]; filtered: FilteredTrack[] };

type TrackPredicate = (track: GenericTrack) => boolean;
type ReasonFn = string | ((track: GenericTrack) => string);

// =============================================================================
// TRACK ACCESSORS - Normalize data access for both APIs
// =============================================================================

export function getGenericTrackId(track: GenericTrack): string | number {
  if ('trackId' in track) return track.trackId;
  if ('id' in track) return track.id;
  return '';
}

export function getTrackName(track: GenericTrack): string {
  if ('trackName' in track) return track.trackName || '';
  if ('attributes' in track) return track.attributes.name || '';
  return '';
}

export function getAlbumName(track: GenericTrack): string {
  if ('collectionName' in track) return track.collectionName || '';
  if ('attributes' in track) return track.attributes.albumName || '';
  return '';
}

export function getPreviewUrl(track: GenericTrack): string {
  if ('previewUrl' in track) return track.previewUrl || '';
  if ('attributes' in track && track.attributes.previews) {
    return track.attributes.previews[0]?.url || '';
  }
  return '';
}

// =============================================================================
// FILTER FACTORY - Creates filters with minimal boilerplate
// =============================================================================

/**
 * Factory function that creates a filter from a predicate.
 * If the predicate returns true, the track is FILTERED OUT.
 * 
 * @param shouldFilter - Returns true if track should be filtered out
 * @param reason - Static string or function that returns the reason
 */
function createFilter(shouldFilter: TrackPredicate, reason: ReasonFn): TrackFilter {
  return (tracks, filtered) => {
    const valid: GenericTrack[] = [];
    const newFiltered = [...filtered];

    for (const track of tracks) {
      if (shouldFilter(track)) {
        newFiltered.push({
          track,
          reason: typeof reason === 'function' ? reason(track) : reason,
        });
      } else {
        valid.push(track);
      }
    }

    return { tracks: valid, filtered: newFiltered };
  };
}

/**
 * Creates a filter that matches a regex pattern against track name
 */
function createPatternFilter(pattern: RegExp, reason: string): TrackFilter {
  return createFilter(
    (track) => pattern.test(getTrackName(track)),
    reason
  );
}

/**
 * Creates a filter that matches a regex pattern against album name
 */
function createAlbumPatternFilter(pattern: RegExp, reason: string): TrackFilter {
  return createFilter(
    (track) => pattern.test(getAlbumName(track)),
    reason
  );
}

/**
 * Check if a string contains only English/ASCII characters
 */
export function isEnglishOnly(str: string): boolean {
  if (!str) return false;
  const nonEnglishPattern = /[^\x00-\x7F]/;
  return !nonEnglishPattern.test(str);
}

// =============================================================================
// FILTER DEFINITIONS - Using factory pattern for concise definitions
// =============================================================================

/** Removes tracks missing name or preview URL */
export function createMissingDataFilter(): TrackFilter {
  return createFilter(
    (track) => !getTrackName(track) || !getPreviewUrl(track),
    (track) => `Missing ${!getTrackName(track) ? 'track name' : 'preview URL'}`
  );
}

/** Removes tracks with non-English characters in title */
export function createNonEnglishFilter(): TrackFilter {
  return createFilter(
    (track) => !isEnglishOnly(getTrackName(track)),
    'Contains non-English characters'
  );
}

/** Removes tracks with square brackets in title */
export const createBracketFilter = (): TrackFilter =>
  createPatternFilter(/\[.*\]/, 'Contains square brackets [...]');

/** Removes tracks with "ver." in title */
export const createVersionFilter = (): TrackFilter =>
  createPatternFilter(/ver\./i, 'Contains "ver." in title');

/** Removes tracks with "japanese" anywhere in title */
export const createJapaneseVersionFilter = (): TrackFilter =>
  createPatternFilter(/japanese/i, 'Contains "japanese" in title');

/** Removes tracks with excessive punctuation */
export const createPunctuationFilter = (): TrackFilter =>
  createPatternFilter(/([.,\-_&+]){3,}/, 'Contains excessive punctuation');

/** Removes tracks explicitly marked as versions */
export const createExplicitVersionFilter = (): TrackFilter =>
  createPatternFilter(
    /\(main\s+version\)|\(original\s+version\)|\(standard\s+version\)/i,
    'Explicitly marked as main/original/standard version'
  );

/** Removes tracks from remix albums */
export const createRemixAlbumFilter = (): TrackFilter =>
  createAlbumPatternFilter(/\([^)]*remix[^)]*\)/i, 'Album contains "remix" in parentheses');

/** Removes tracks with language/version words between dashes */
export function createDashVersionFilter(): TrackFilter {
  const dashChars = '[‑\\-–—‒―]';
  const versionWords = [
    'version', 'ver\\.', 'versión', 'japanese', 'kor', 'korean', 'english',
    'eng', 'spanish', 'español', 'instrumental', 'inst\\.', 'remix', 'mix',
    'edit', 'acoustic', 'acapella', 'live', 'demo', 'radio', 'extended',
    'short', 'long', 'rem',
  ];
  const pattern = new RegExp(`${dashChars}\\s*(${versionWords.join('|')})\\s*${dashChars}`, 'i');

  return createFilter(
    (track) => pattern.test(getTrackName(track)),
    (track) => {
      const match = pattern.exec(getTrackName(track));
      return match ? `Contains "${match[1]}" between dashes` : 'Contains version word between dashes';
    }
  );
}

/** Removes tracks with unwanted patterns in parentheses/brackets/hyphens */
export function createUnwantedPatternFilter(): TrackFilter {
  const patterns = [
    'remix', 'version', 'ver\\.', 'versión', 'edit', 'mixed', 'mix',
    'instrumental', 'inst\\.', 'japanese', 'korean', 'english', 'kor',
    'eng', 'jap', 'spanish', 'español', 'acoustic', 'acapella', 'live',
    'demo', 'radio', 'extended', 'short', 'long', 'original', 'clean',
    'explicit', 'clean version', 'radio edit', 'club mix', 'dance mix', 'rem',
  ];

  return (tracks, filtered) => {
    const valid: GenericTrack[] = [];
    const newFiltered = [...filtered];

    trackLoop: for (const track of tracks) {
      const trackName = getTrackName(track).toLowerCase();

      for (const pattern of patterns) {
        const inParens = new RegExp(`\\([^)]*${pattern}[^)]*\\)`, 'i');
        const inBrackets = new RegExp(`\\[[^\\]]*${pattern}[^\\]]*\\]`, 'i');
        const betweenDashes = new RegExp(`[‑\\-–—]\\s*${pattern}\\s*[‑\\-–—]`, 'i');
        const cleanPattern = pattern.replace('\\\\', '');

        if (inParens.test(trackName)) {
          newFiltered.push({ track, reason: `Contains "${cleanPattern}" in parentheses` });
          continue trackLoop;
        }
        if (inBrackets.test(trackName)) {
          newFiltered.push({ track, reason: `Contains "${cleanPattern}" in brackets` });
          continue trackLoop;
        }
        if (betweenDashes.test(trackName)) {
          newFiltered.push({ track, reason: `Contains "${cleanPattern}" between hyphens` });
          continue trackLoop;
        }
      }
      valid.push(track);
    }

    return { tracks: valid, filtered: newFiltered };
  };
}

/** Removes tracks with full version phrases */
export function createVersionPhraseFilter(): TrackFilter {
  const phrases = [
    'acoustic version', 'live version', 'demo version', 'radio edit',
    'club mix', 'dance mix', 'extended mix', 'short version', 'long version',
    'original mix', 'clean version', 'explicit version', 'instrumental version',
  ];

  return (tracks, filtered) => {
    const valid: GenericTrack[] = [];
    const newFiltered = [...filtered];

    for (const track of tracks) {
      const trackName = getTrackName(track).toLowerCase();
      const foundPhrase = phrases.find(p => trackName.includes(p));
      
      if (foundPhrase) {
        newFiltered.push({ track, reason: `Contains "${foundPhrase}" in title` });
      } else {
        valid.push(track);
      }
    }

    return { tracks: valid, filtered: newFiltered };
  };
}

/** Removes tracks with specific unwanted markers */
export function createSpecificMarkerFilter(): TrackFilter {
  const markers = [
    { pattern: /REMIXX/i, reason: 'Contains "REMIXX" in title' },
    { pattern: /x XDM/i, reason: 'Contains "x XDM" in title' },
  ];

  return (tracks, filtered) => {
    const valid: GenericTrack[] = [];
    const newFiltered = [...filtered];

    for (const track of tracks) {
      const found = markers.find(m => m.pattern.test(getTrackName(track)));
      if (found) {
        newFiltered.push({ track, reason: found.reason });
      } else {
        valid.push(track);
      }
    }

    return { tracks: valid, filtered: newFiltered };
  };
}

/** Removes intro/outro/skit tracks */
export function createIntroOutroFilter(): TrackFilter {
  const words = ['outro', 'intro', 'introduction', 'skit'];
  const pattern = new RegExp(
    `\\b(${words.join('|')})s?\\b|\\((${words.join('|')})\\)|^(${words.join('|')})[:|-]`,
    'i'
  );

  return createFilter(
    (track) => pattern.test(getTrackName(track)),
    (track) => {
      const trackName = getTrackName(track);
      const matched = words.find(w => new RegExp(`\\b${w}\\b`, 'i').test(trackName));
      return `Contains "${matched || 'intro/outro/skit'}" (intro/outro/skit filter)`;
    }
  );
}

// =============================================================================
// FILTER CHAIN APPLICATION
// =============================================================================

/**
 * Apply a chain of filters to tracks
 */
export function applyFilterChain(
  tracks: GenericTrack[],
  filters: TrackFilter[]
): FilterResult {
  let currentTracks = tracks;
  let currentFiltered: FilteredTrack[] = [];

  for (const filter of filters) {
    const result = filter(currentTracks, currentFiltered);
    currentTracks = result.tracks;
    currentFiltered = result.filtered;
  }

  return { valid: currentTracks, filtered: currentFiltered };
}

/**
 * Get the default filter chain for tracks
 */
export function getDefaultFilterChain(): TrackFilter[] {
  return [
    createMissingDataFilter(),
    createNonEnglishFilter(),
    createBracketFilter(),
    createVersionFilter(),
    createDashVersionFilter(),
    createJapaneseVersionFilter(),
    createUnwantedPatternFilter(),
    createRemixAlbumFilter(),
    createVersionPhraseFilter(),
    createPunctuationFilter(),
    createExplicitVersionFilter(),
    createSpecificMarkerFilter(),
    createIntroOutroFilter(),
  ];
}
