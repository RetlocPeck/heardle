/**
 * Shared utilities for Apple Music API operations
 * Used by both prefetch-songs.js and refetch-artist.js
 */

// Shared constants — single source of truth with the TypeScript runtime service.
const filterRules = require('../src/config/catalog-filter-rules.json');
const amConstants = require('../src/config/apple-music-constants.json');

const BASE_URL = amConstants.baseUrl;
const STOREFRONTS = amConstants.storefronts;
// Scripts do additional per-album requests so keep their own delay (50ms vs service's 30ms).
const DELAY_BETWEEN_REQUESTS = 50;

function getAuthHeaders() {
  const token = process.env.APPLE_MUSIC_DEV_TOKEN;
  if (!token) {
    throw new Error('APPLE_MUSIC_DEV_TOKEN not found. Please set it in .env.local');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, retries = 3) {
  let lastResponse;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        lastResponse = response;
        const waitTime = (i + 1) * 2000;
        console.log(`  ⏳ Rate limited, waiting ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(1000);
    }
  }
  // If all retries exhausted due to rate limiting, return the last 429 response
  // so callers can check response.ok and handle gracefully
  return lastResponse;
}

async function fetchArtistAlbums(artistId, storefront) {
  const albums = [];
  let nextUrl = `/catalog/${storefront}/artists/${artistId}/albums?limit=100`;
  
  while (nextUrl) {
    const fullUrl = nextUrl.startsWith('http') ? nextUrl : `${BASE_URL}${nextUrl}`;
    const response = await fetchWithRetry(fullUrl, { headers: getAuthHeaders() });
    
    if (!response.ok) {
      if (response.status !== 404) {
        console.log(`  ⚠️ Album fetch failed (${storefront}): ${response.status}`);
      }
      break;
    }
    
    const data = await response.json();
    if (data.data) {
      albums.push(...data.data);
    }
    
    nextUrl = data.next || null;
    if (nextUrl) await sleep(DELAY_BETWEEN_REQUESTS);
  }
  
  return albums;
}

async function fetchAlbumTracks(albumId, storefront) {
  const url = `${BASE_URL}/catalog/${storefront}/albums/${albumId}?include=tracks`;
  const response = await fetchWithRetry(url, { headers: getAuthHeaders() });
  
  if (!response.ok) {
    return [];
  }
  
  const data = await response.json();
  return data.data?.[0]?.relationships?.tracks?.data || [];
}

async function fetchArtistArtwork(artistId) {
  const url = `${BASE_URL}/catalog/us/artists/${artistId}`;
  const response = await fetchWithRetry(url, { headers: getAuthHeaders() });
  
  if (!response.ok) {
    return null;
  }
  
  const data = await response.json();
  if (data.data?.[0]) {
    const artist = data.data[0];
    const artwork = artist.attributes.artwork;
    const editorialArtwork = artist.attributes.editorialArtwork;
    
    return {
      standardUrl: artwork ? artwork.url.replace('{w}', '600').replace('{h}', '600') : null,
      highResUrl: artwork ? artwork.url.replace('{w}', '1200').replace('{h}', '1200') : null,
      bannerUrl: editorialArtwork?.superHeroWide?.url || editorialArtwork?.subscriptionHero?.url || null,
      bgColor: artwork?.bgColor || null,
    };
  }
  return null;
}

function convertTrackToSong(track) {
  const previewUrl = track.attributes?.previews?.[0]?.url || '';
  const artworkUrl = track.attributes?.artwork?.url?.replace('{w}', '300').replace('{h}', '300') || '';
  
  return {
    id: `applemusic-${track.id}`,
    name: track.attributes?.name || 'Unknown',
    artists: [track.attributes?.artistName || 'Unknown'],
    album: track.attributes?.albumName || 'Unknown',
    previewUrl,
    duration: track.attributes?.durationInMillis || 0,
    trackUrl: track.attributes?.url || '',
    artworkUrl,
    trackId: track.id,
  };
}

/**
 * Check if a string contains only English/ASCII characters
 * Returns false for Korean, Japanese, Chinese, etc.
 */
const _nonEnglishPattern = new RegExp(filterRules.nonEnglishPatternSource);
function isEnglishOnly(str) {
  if (!str) return false;
  return !_nonEnglishPattern.test(str);
}

/**
 * Extract the base name of a song by removing version indicators
 * "MORE & MORE - Japanese ver. -" → "MORE & MORE"
 * "Feel Special (English Version)" → "Feel Special"
 */
function getBaseName(name) {
  if (!name) return '';
  
  let baseName = name;
  
  // Split on common delimiters and take the first part
  // Order matters - check longer patterns first
  const delimiters = [
    ' - ',      // "Song - Japanese ver."
    ' ((',      // Edge case
    ' (',       // "Song (English Version)"
    ' [',       // "Song [Remix]"
    ' ~',       // "Song ~Special Edition~"
    ' -',       // "Song -Version-" (no space after)
    '(',        // "Song(Version)" (no space before)
  ];
  
  for (const delimiter of delimiters) {
    const idx = baseName.indexOf(delimiter);
    if (idx > 0) {
      baseName = baseName.substring(0, idx);
      break;
    }
  }
  
  // Clean up trailing whitespace and punctuation
  baseName = baseName.trim().replace(/[\s\-:]+$/, '');
  
  return baseName;
}

/**
 * Normalize a name for comparison (lowercase, normalize special chars)
 * Keeps Korean/Japanese/Chinese characters intact
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[''`]/g, "'")  // Normalize quotes
    .replace(/[!?.,;:]/g, '') // Remove punctuation only
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}

/**
 * Deduplicate songs - keep only the simplest version of each song
 * Groups by base name, keeps the shortest full name
 */
function deduplicateSongs(songs) {
  const groups = new Map(); // baseName -> array of songs
  
  for (const song of songs) {
    const baseName = getBaseName(song.name);
    const normalizedBase = normalizeName(baseName);
    
    if (!groups.has(normalizedBase)) {
      groups.set(normalizedBase, []);
    }
    groups.get(normalizedBase).push(song);
  }
  
  const deduplicated = [];
  
  for (const [baseName, songsInGroup] of groups) {
    if (songsInGroup.length === 1) {
      deduplicated.push(songsInGroup[0]);
    } else {
      // Sort by name length (shortest first), then prefer songs with preview URLs
      songsInGroup.sort((a, b) => {
        // Prefer songs with preview URLs
        const aHasPreview = a.previewUrl ? 1 : 0;
        const bHasPreview = b.previewUrl ? 1 : 0;
        if (aHasPreview !== bHasPreview) return bHasPreview - aHasPreview;
        
        // Then prefer shorter names (simpler versions)
        return a.name.length - b.name.length;
      });
      
      // Keep only the best version (shortest name with preview)
      deduplicated.push(songsInGroup[0]);
      
      if (songsInGroup.length > 1) {
        console.log(`    🔄 Deduped "${baseName}": kept "${songsInGroup[0].name}", removed ${songsInGroup.length - 1} variants`);
      }
    }
  }
  
  return deduplicated;
}

function filterTracks(tracks) {
  // Filter out instrumentals, remixes, karaoke, intros, outros, skits, etc.
  const excludePatterns = [
    /\binstrumental\b/i,
    /\bkaraoke\b/i,
    /\bacapella\b/i,
    /\ba\s*cappella\b/i,
    /\bremix\b/i,
    /\bremaster(ed)?\b/i,
    /\bdemo\b/i,
    /\blive\b/i,
    /\bconcert\b/i,
    /\(inst\.?\)/i,
    /\(inst\)/i,
  ];
  
  // Pattern to match intro/outro/skit tracks — word lists from shared JSON.
  // Matches:
  // - Word boundary matches: "The Intro Song" -> matches "Intro"
  // - In parentheses: "(Intro)" or "(Outro)"
  // - At start with colon/period/dash: "Intro: Symphony"
  // - At start followed by space and capital: "Intro The Beginning"
  const introOutroWords = filterRules.introOutroWords;
  const introOutroPattern = new RegExp(
    `\\b(${introOutroWords.join('|')})s?\\b|` +
    `\\((${introOutroWords.join('|')})\\)|` +
    `^(${introOutroWords.join('|')})\\s*[:.\-–—]|` +
    `^(${introOutroWords.join('|')})\\s+[A-Z]`,
    'i'
  );

  // Pattern to match version indicators (Japanese Ver., Korean Version, English Ver., etc.)
  // Uses the shared dashVersionWords list (superset of the old local list).
  const versionWords = filterRules.dashVersionWords;
  const versionPatterns = [
    // In parentheses: "(Japanese Ver.)" or "(Korean Version)"
    new RegExp(`\\([^)]*(?:${versionWords.join('|')})[^)]*\\)`, 'i'),
    // In brackets: "[English Ver.]"
    new RegExp(`\\[[^\\]]*(?:${versionWords.join('|')})[^\\]]*\\]`, 'i'),
    // Between dashes: "- Japanese Ver. -" or "- Korean -"
    new RegExp(`[‑\\-–—]\\s*(?:${versionWords.join('|')})\\s*[‑\\-–—]`, 'i'),
  ];
  
  let noPreviewCount = 0;
  let nonEnglishCount = 0;
  let patternExcludeCount = 0;
  let introOutroCount = 0;
  let versionCount = 0;
  
  const filtered = tracks.filter(track => {
    const name = track.attributes?.name || '';
    const hasPreview = track.attributes?.previews?.[0]?.url;
    
    // Must have a preview URL
    if (!hasPreview) {
      noPreviewCount++;
      return false;
    }
    
    // Must be English-only (no Korean, Japanese, Chinese characters)
    if (!isEnglishOnly(name)) {
      nonEnglishCount++;
      return false;
    }
    
    // Check for intro/outro/skit patterns
    if (introOutroPattern.test(name)) {
      introOutroCount++;
      return false;
    }
    
    // Check for version indicators (Japanese Ver., Korean Version, etc.)
    for (const pattern of versionPatterns) {
      if (pattern.test(name)) {
        versionCount++;
        return false;
      }
    }
    
    // Check for excluded patterns (instrumental, remix, live, etc.)
    for (const pattern of excludePatterns) {
      if (pattern.test(name)) {
        patternExcludeCount++;
        return false;
      }
    }
    
    return true;
  });
  
  if (noPreviewCount > 0) console.log(`    ⏭️  Removed ${noPreviewCount} tracks without preview`);
  if (nonEnglishCount > 0) console.log(`    🌏 Removed ${nonEnglishCount} non-English tracks`);
  if (introOutroCount > 0) console.log(`    🚫 Removed ${introOutroCount} intro/outro/skit tracks`);
  if (versionCount > 0) console.log(`    🚫 Removed ${versionCount} version tracks (Japanese/Korean/English ver.)`);
  if (patternExcludeCount > 0) console.log(`    🚫 Removed ${patternExcludeCount} instrumental/remix/live tracks`);
  
  return filtered;
}

async function fetchAllTracksForArtist(appleMusicArtistId) {
  console.log(`  ✅ Using Apple Music ID: ${appleMusicArtistId}`);
  
  // Fetch albums from all storefronts
  const seenAlbumIds = new Set();
  const allAlbums = [];
  
  for (const storefront of STOREFRONTS) {
    const albums = await fetchArtistAlbums(appleMusicArtistId, storefront);
    for (const album of albums) {
      if (!seenAlbumIds.has(album.id)) {
        seenAlbumIds.add(album.id);
        allAlbums.push({ ...album, storefront });
      }
    }
    await sleep(DELAY_BETWEEN_REQUESTS);
  }
  
  console.log(`  📀 Found ${allAlbums.length} unique albums across ${STOREFRONTS.length} storefronts`);
  
  // Fetch tracks from all albums
  const seenTrackIds = new Set();
  const allTracks = [];
  
  for (const album of allAlbums) {
    const tracks = await fetchAlbumTracks(album.id, album.storefront);
    for (const track of tracks) {
      if (!seenTrackIds.has(track.id)) {
        seenTrackIds.add(track.id);
        allTracks.push(track);
      }
    }
    await sleep(DELAY_BETWEEN_REQUESTS);
  }
  
  console.log(`  📝 Found ${allTracks.length} unique tracks`);
  
  // Filter tracks
  const filteredTracks = filterTracks(allTracks);
  console.log(`  🔍 ${filteredTracks.length} tracks after filtering`);
  
  // Convert to song format
  const allSongs = filteredTracks.map(convertTrackToSong);
  
  // Deduplicate
  const songs = deduplicateSongs(allSongs);
  console.log(`  ✅ ${songs.length} songs after deduplication (removed ${allSongs.length - songs.length} duplicates)`);
  
  // Fetch artwork
  const artwork = await fetchArtistArtwork(appleMusicArtistId);
  
  return { songs, artwork, appleMusicId: appleMusicArtistId };
}

module.exports = {
  BASE_URL,
  STOREFRONTS,
  DELAY_BETWEEN_REQUESTS,
  getAuthHeaders,
  sleep,
  fetchWithRetry,
  fetchArtistAlbums,
  fetchAlbumTracks,
  fetchArtistArtwork,
  convertTrackToSong,
  isEnglishOnly,
  getBaseName,
  normalizeName,
  deduplicateSongs,
  filterTracks,
  fetchAllTracksForArtist,
};
