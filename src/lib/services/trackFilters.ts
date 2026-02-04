/**
 * Track filtering functions for iTunes tracks
 * Uses a filter chain pattern for cleaner, more maintainable code
 */

import type { ITunesTrack } from '@/types/song';

export interface FilteredTrack {
  track: ITunesTrack;
  reason: string;
}

export interface FilterResult {
  valid: ITunesTrack[];
  filtered: FilteredTrack[];
}

export type TrackFilter = (
  tracks: ITunesTrack[],
  filtered: FilteredTrack[]
) => { tracks: ITunesTrack[]; filtered: FilteredTrack[] };

/**
 * Creates a filter that removes tracks missing required data
 */
export function createMissingDataFilter(): TrackFilter {
  return (tracks, filtered) => {
    const valid: ITunesTrack[] = [];
    const newFiltered = [...filtered];

    for (const track of tracks) {
      if (!track.trackName || !track.previewUrl) {
        newFiltered.push({
          track,
          reason: `Missing ${!track.trackName ? 'track name' : 'preview URL'}`,
        });
      } else {
        valid.push(track);
      }
    }

    return { tracks: valid, filtered: newFiltered };
  };
}

/**
 * Creates a filter that removes tracks with square brackets in title
 */
export function createBracketFilter(): TrackFilter {
  return (tracks, filtered) => {
    const valid: ITunesTrack[] = [];
    const newFiltered = [...filtered];

    for (const track of tracks) {
      if (/\[.*\]/.test(track.trackName || '')) {
        newFiltered.push({
          track,
          reason: 'Contains square brackets [...]',
        });
      } else {
        valid.push(track);
      }
    }

    return { tracks: valid, filtered: newFiltered };
  };
}

/**
 * Creates a filter that removes tracks with "ver." in title
 */
export function createVersionFilter(): TrackFilter {
  return (tracks, filtered) => {
    const valid: ITunesTrack[] = [];
    const newFiltered = [...filtered];

    for (const track of tracks) {
      if (/ver\./i.test(track.trackName || '')) {
        newFiltered.push({
          track,
          reason: 'Contains "ver." in title',
        });
      } else {
        valid.push(track);
      }
    }

    return { tracks: valid, filtered: newFiltered };
  };
}

/**
 * Creates a filter that removes tracks with language/version words between dashes
 */
export function createDashVersionFilter(): TrackFilter {
  const dashLikeChars = /[‑\-–—‒―]/;
  const versionWords = [
    'version', 'ver\\.', 'versión', 'japanese', 'kor', 'korean', 'english',
    'eng', 'spanish', 'español', 'instrumental', 'inst\\.', 'remix', 'mix',
    'edit', 'acoustic', 'acapella', 'live', 'demo', 'radio', 'extended',
    'short', 'long', 'rem',
  ];
  const pattern = new RegExp(
    `${dashLikeChars.source}\\s*(${versionWords.join('|')})\\s*${dashLikeChars.source}`,
    'i'
  );

  return (tracks, filtered) => {
    const valid: ITunesTrack[] = [];
    const newFiltered = [...filtered];

    for (const track of tracks) {
      const match = pattern.exec(track.trackName || '');
      if (match) {
        newFiltered.push({
          track,
          reason: `Contains "${match[1]}" between dashes`,
        });
      } else {
        valid.push(track);
      }
    }

    return { tracks: valid, filtered: newFiltered };
  };
}

/**
 * Creates a filter that removes tracks with "japanese" anywhere in title
 */
export function createJapaneseVersionFilter(): TrackFilter {
  return (tracks, filtered) => {
    const valid: ITunesTrack[] = [];
    const newFiltered = [...filtered];

    for (const track of tracks) {
      if (/japanese/i.test(track.trackName || '')) {
        newFiltered.push({
          track,
          reason: 'Contains "japanese" in title',
        });
      } else {
        valid.push(track);
      }
    }

    return { tracks: valid, filtered: newFiltered };
  };
}

/**
 * Creates a filter that removes tracks with unwanted patterns in parentheses/brackets
 */
export function createUnwantedPatternFilter(): TrackFilter {
  const patterns = [
    'remix', 'version', 'ver\\.', 'versión', 'edit', 'mixed', 'mix',
    'instrumental', 'inst\\.', 'japanese', 'korean', 'english', 'kor',
    'eng', 'jap', 'spanish', 'español', 'acoustic', 'acapella', 'live',
    'demo', 'radio', 'extended', 'short', 'long', 'original', 'clean',
    'explicit', 'clean version', 'radio edit', 'club mix', 'dance mix', 'rem',
  ];

  return (tracks, filtered) => {
    const valid: ITunesTrack[] = [];
    const newFiltered = [...filtered];

    trackLoop: for (const track of tracks) {
      const trackName = (track.trackName || '').toLowerCase();

      for (const pattern of patterns) {
        const inParentheses = new RegExp(`\\([^)]*${pattern}[^)]*\\)`, 'i');
        const inBrackets = new RegExp(`\\[[^\\]]*${pattern}[^\\]]*\\]`, 'i');
        const betweenHyphens = new RegExp(`[‑\\-–—]\\s*${pattern}\\s*[‑\\-–—]`, 'i');

        if (inParentheses.test(trackName)) {
          newFiltered.push({
            track,
            reason: `Contains "${pattern.replace('\\\\', '')}" in parentheses`,
          });
          continue trackLoop;
        }
        if (inBrackets.test(trackName)) {
          newFiltered.push({
            track,
            reason: `Contains "${pattern.replace('\\\\', '')}" in brackets`,
          });
          continue trackLoop;
        }
        if (betweenHyphens.test(trackName)) {
          newFiltered.push({
            track,
            reason: `Contains "${pattern.replace('\\\\', '')}" between hyphens`,
          });
          continue trackLoop;
        }
      }

      valid.push(track);
    }

    return { tracks: valid, filtered: newFiltered };
  };
}

/**
 * Creates a filter that removes tracks from remix albums
 */
export function createRemixAlbumFilter(): TrackFilter {
  return (tracks, filtered) => {
    const valid: ITunesTrack[] = [];
    const newFiltered = [...filtered];

    for (const track of tracks) {
      const collectionName = (track.collectionName || '').toLowerCase();
      if (/\([^)]*remix[^)]*\)/i.test(collectionName)) {
        newFiltered.push({
          track,
          reason: 'Album contains "remix" in parentheses',
        });
      } else {
        valid.push(track);
      }
    }

    return { tracks: valid, filtered: newFiltered };
  };
}

/**
 * Creates a filter that removes tracks with full version phrases
 */
export function createVersionPhraseFilter(): TrackFilter {
  const phrases = [
    'acoustic version', 'live version', 'demo version', 'radio edit',
    'club mix', 'dance mix', 'extended mix', 'short version', 'long version',
    'original mix', 'clean version', 'explicit version', 'instrumental version',
  ];

  return (tracks, filtered) => {
    const valid: ITunesTrack[] = [];
    const newFiltered = [...filtered];

    trackLoop: for (const track of tracks) {
      const trackName = (track.trackName || '').toLowerCase();

      for (const phrase of phrases) {
        if (trackName.includes(phrase)) {
          newFiltered.push({
            track,
            reason: `Contains "${phrase}" in title`,
          });
          continue trackLoop;
        }
      }

      valid.push(track);
    }

    return { tracks: valid, filtered: newFiltered };
  };
}

/**
 * Creates a filter that removes tracks with excessive punctuation
 */
export function createPunctuationFilter(): TrackFilter {
  return (tracks, filtered) => {
    const valid: ITunesTrack[] = [];
    const newFiltered = [...filtered];

    for (const track of tracks) {
      if (/([.,\-_&+]){3,}/.test((track.trackName || '').toLowerCase())) {
        newFiltered.push({
          track,
          reason: 'Contains excessive punctuation',
        });
      } else {
        valid.push(track);
      }
    }

    return { tracks: valid, filtered: newFiltered };
  };
}

/**
 * Creates a filter that removes tracks explicitly marked as versions
 */
export function createExplicitVersionFilter(): TrackFilter {
  return (tracks, filtered) => {
    const valid: ITunesTrack[] = [];
    const newFiltered = [...filtered];

    for (const track of tracks) {
      if (/\(main\s+version\)|\(original\s+version\)|\(standard\s+version\)/i.test(track.trackName || '')) {
        newFiltered.push({
          track,
          reason: 'Explicitly marked as main/original/standard version',
        });
      } else {
        valid.push(track);
      }
    }

    return { tracks: valid, filtered: newFiltered };
  };
}

/**
 * Creates a filter that removes tracks with specific unwanted markers
 */
export function createSpecificMarkerFilter(): TrackFilter {
  const markers = [
    { pattern: /REMIXX/i, reason: 'Contains "REMIXX" in title' },
    { pattern: /x XDM/i, reason: 'Contains "x XDM" in title' },
  ];

  return (tracks, filtered) => {
    const valid: ITunesTrack[] = [];
    const newFiltered = [...filtered];

    trackLoop: for (const track of tracks) {
      for (const { pattern, reason } of markers) {
        if (pattern.test(track.trackName || '')) {
          newFiltered.push({ track, reason });
          continue trackLoop;
        }
      }
      valid.push(track);
    }

    return { tracks: valid, filtered: newFiltered };
  };
}

/**
 * Creates a filter that removes intro/outro/skit tracks
 */
export function createIntroOutroFilter(): TrackFilter {
  const words = ['outro', 'intro', 'introduction', 'skit', 'outros', 'intros', 'introductions', 'skits'];
  const pattern = new RegExp(
    `\\b(${words.join('|')})\\b|` +
    `\\((${words.join('|')})\\)|` +
    `^(${words.join('|')})[:|-]|` +
    `[:|-]\\s*(${words.join('|')})\\b`,
    'i'
  );

  return (tracks, filtered) => {
    const valid: ITunesTrack[] = [];
    const newFiltered = [...filtered];

    for (const track of tracks) {
      if (pattern.test(track.trackName || '')) {
        const matchedWord = words.find(word =>
          new RegExp(`\\b${word}\\b`, 'i').test(track.trackName || '')
        ) || 'intro/outro/skit';
        newFiltered.push({
          track,
          reason: `Contains "${matchedWord}" (intro/outro/skit filter)`,
        });
      } else {
        valid.push(track);
      }
    }

    return { tracks: valid, filtered: newFiltered };
  };
}

/**
 * Apply a chain of filters to tracks
 */
export function applyFilterChain(
  tracks: ITunesTrack[],
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
 * Get the default filter chain for iTunes tracks
 */
export function getDefaultFilterChain(): TrackFilter[] {
  return [
    createMissingDataFilter(),
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
