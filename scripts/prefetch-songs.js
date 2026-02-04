#!/usr/bin/env node
/**
 * Pre-fetch all songs for all artists from Apple Music API
 * Saves data to public/data/ for static serving
 * 
 * Run: node scripts/prefetch-songs.js
 * Or: npm run prefetch
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const BASE_URL = 'https://api.music.apple.com/v1';
const STOREFRONTS = ['us', 'jp', 'kr'];
const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const SONGS_DIR = path.join(DATA_DIR, 'songs');
const ARTWORK_DIR = path.join(DATA_DIR, 'artwork');

// Rate limiting
const DELAY_BETWEEN_ARTISTS = 500; // ms between each artist
const DELAY_BETWEEN_REQUESTS = 50; // ms between API requests

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
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        // Rate limited - wait and retry
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
}

async function searchArtist(artistName) {
  const url = `${BASE_URL}/catalog/us/search?types=artists&term=${encodeURIComponent(artistName)}&limit=5`;
  const response = await fetchWithRetry(url, { headers: getAuthHeaders() });
  
  if (!response.ok) {
    console.log(`  ⚠️ Artist search failed: ${response.status}`);
    return null;
  }
  
  const data = await response.json();
  if (data.results?.artists?.data?.length > 0) {
    return data.results.artists.data[0];
  }
  return null;
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
function isEnglishOnly(str) {
  if (!str) return false;
  // Allow: A-Z, a-z, 0-9, common punctuation, and spaces
  // This regex matches if there are ANY non-English characters
  const nonEnglishPattern = /[^\x00-\x7F]/;
  return !nonEnglishPattern.test(str);
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
  // Filter out instrumentals, remixes, karaoke, etc.
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
  
  let noPreviewCount = 0;
  let nonEnglishCount = 0;
  let patternExcludeCount = 0;
  
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
    
    // Check for excluded patterns
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
  if (patternExcludeCount > 0) console.log(`    🚫 Removed ${patternExcludeCount} instrumental/remix/live tracks`);
  
  return filtered;
}

async function fetchAllTracksForArtist(artistConfig) {
  const { displayName } = artistConfig;
  
  // Search for artist
  const artist = await searchArtist(displayName);
  if (!artist) {
    console.log(`  ❌ Artist not found: ${displayName}`);
    return { songs: [], artwork: null, appleMusicId: null };
  }
  
  const appleMusicId = artist.id;
  console.log(`  ✅ Found: ${artist.attributes.name} (ID: ${appleMusicId})`);
  
  // Fetch albums from all storefronts
  const seenAlbumIds = new Set();
  const allAlbums = [];
  
  for (const storefront of STOREFRONTS) {
    const albums = await fetchArtistAlbums(appleMusicId, storefront);
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
  
  // Filter tracks (remove instrumentals, karaoke, etc.)
  const filteredTracks = filterTracks(allTracks);
  console.log(`  🔍 ${filteredTracks.length} tracks after filtering`);
  
  // Convert to song format
  const allSongs = filteredTracks.map(convertTrackToSong);
  
  // Deduplicate - keep only simplest version of each song
  const songs = deduplicateSongs(allSongs);
  
  console.log(`  ✅ ${songs.length} songs after deduplication (removed ${allSongs.length - songs.length} duplicates)`);
  
  // Fetch artwork
  const artwork = await fetchArtistArtwork(appleMusicId);
  
  return { songs, artwork, appleMusicId };
}

async function main() {
  console.log('🎵 K-pop Heardle Song Pre-fetcher\n');
  
  // Check for token
  if (!process.env.APPLE_MUSIC_DEV_TOKEN) {
    console.error('❌ APPLE_MUSIC_DEV_TOKEN not found in .env.local');
    console.log('   Run: node scripts/generate-apple-music-token.js');
    process.exit(1);
  }
  
  // Create directories
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SONGS_DIR)) fs.mkdirSync(SONGS_DIR, { recursive: true });
  if (!fs.existsSync(ARTWORK_DIR)) fs.mkdirSync(ARTWORK_DIR, { recursive: true });
  
  // Load artists config
  // We need to parse the TypeScript file to get artist IDs
  const artistsFile = fs.readFileSync(
    path.join(process.cwd(), 'src', 'config', 'artists.ts'),
    'utf-8'
  );
  
  // Extract artist configs using regex (simplified parsing)
  const artistMatches = artistsFile.matchAll(/id:\s*['"]([^'"]+)['"]/g);
  const displayNameMatches = artistsFile.matchAll(/displayName:\s*['"]([^'"]+)['"]/g);
  
  const ids = [...artistMatches].map(m => m[1]);
  const names = [...displayNameMatches].map(m => m[1]);
  
  const artists = ids.map((id, i) => ({
    id,
    displayName: names[i] || id,
  }));
  
  console.log(`📋 Found ${artists.length} artists to process\n`);
  
  const summary = {
    total: artists.length,
    success: 0,
    failed: 0,
    totalSongs: 0,
    timestamp: new Date().toISOString(),
    artists: {},
  };
  
  // Process each artist
  for (let i = 0; i < artists.length; i++) {
    const artist = artists[i];
    console.log(`\n[${i + 1}/${artists.length}] Processing: ${artist.displayName}`);
    
    try {
      const { songs, artwork, appleMusicId } = await fetchAllTracksForArtist(artist);
      
      // Save songs
      const songsPath = path.join(SONGS_DIR, `${artist.id}.json`);
      fs.writeFileSync(songsPath, JSON.stringify(songs, null, 2));
      
      // Save artwork
      if (artwork) {
        const artworkPath = path.join(ARTWORK_DIR, `${artist.id}.json`);
        fs.writeFileSync(artworkPath, JSON.stringify(artwork, null, 2));
      }
      
      summary.success++;
      summary.totalSongs += songs.length;
      summary.artists[artist.id] = {
        displayName: artist.displayName,
        appleMusicId,
        songCount: songs.length,
        hasArtwork: !!artwork,
      };
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      summary.failed++;
      summary.artists[artist.id] = {
        displayName: artist.displayName,
        error: error.message,
      };
    }
    
    // Delay between artists to avoid rate limiting
    await sleep(DELAY_BETWEEN_ARTISTS);
  }
  
  // Save summary
  const summaryPath = path.join(DATA_DIR, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 PREFETCH COMPLETE');
  console.log('='.repeat(50));
  console.log(`✅ Success: ${summary.success}/${summary.total} artists`);
  console.log(`📝 Total songs: ${summary.totalSongs}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`📁 Data saved to: ${DATA_DIR}`);
  console.log(`📅 Timestamp: ${summary.timestamp}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
