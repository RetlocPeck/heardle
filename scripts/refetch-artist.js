#!/usr/bin/env node
/**
 * Re-fetch songs for a single artist from Apple Music API
 * 
 * Usage: node scripts/refetch-artist.js <artist-id> [apple-music-id]
 * 
 * Examples:
 *   node scripts/refetch-artist.js girls-generation 357463500
 *   node scripts/refetch-artist.js jeon-somi 1218803768
 *   node scripts/refetch-artist.js triples 1651595986
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

function isEnglishOnly(str) {
  if (!str) return false;
  const nonEnglishPattern = /[^\x00-\x7F]/;
  return !nonEnglishPattern.test(str);
}

function getBaseName(name) {
  if (!name) return '';
  
  let baseName = name;
  const delimiters = [' - ', ' ((', ' (', ' [', ' ~', ' -', '('];
  
  for (const delimiter of delimiters) {
    const idx = baseName.indexOf(delimiter);
    if (idx > 0) {
      baseName = baseName.substring(0, idx);
      break;
    }
  }
  
  return baseName.trim().replace(/[\s\-:]+$/, '');
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[!?.,;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function deduplicateSongs(songs) {
  const groups = new Map();
  
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
      songsInGroup.sort((a, b) => {
        const aHasPreview = a.previewUrl ? 1 : 0;
        const bHasPreview = b.previewUrl ? 1 : 0;
        if (aHasPreview !== bHasPreview) return bHasPreview - aHasPreview;
        return a.name.length - b.name.length;
      });
      
      deduplicated.push(songsInGroup[0]);
      
      if (songsInGroup.length > 1) {
        console.log(`    🔄 Deduped "${baseName}": kept "${songsInGroup[0].name}", removed ${songsInGroup.length - 1} variants`);
      }
    }
  }
  
  return deduplicated;
}

function filterTracks(tracks) {
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
    
    if (!hasPreview) {
      noPreviewCount++;
      return false;
    }
    
    if (!isEnglishOnly(name)) {
      nonEnglishCount++;
      return false;
    }
    
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

async function fetchAllTracksForArtist(appleMusicArtistId, artistDisplayName) {
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

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: node scripts/refetch-artist.js <artist-id> [apple-music-id]');
    console.error('');
    console.error('Examples:');
    console.error('  node scripts/refetch-artist.js girls-generation 357463500');
    console.error('  node scripts/refetch-artist.js jeon-somi 1218803768');
    console.error('  node scripts/refetch-artist.js triples 1651595986');
    process.exit(1);
  }
  
  const artistId = args[0];
  const appleMusicId = args[1];
  
  if (!appleMusicId) {
    console.error('❌ Apple Music ID is required');
    console.error('   Find it at: https://music.apple.com/us/artist/...');
    process.exit(1);
  }
  
  console.log(`🎵 Refetching songs for: ${artistId}`);
  console.log(`   Apple Music ID: ${appleMusicId}\n`);
  
  // Check for token
  if (!process.env.APPLE_MUSIC_DEV_TOKEN) {
    console.error('❌ APPLE_MUSIC_DEV_TOKEN not found in .env.local');
    process.exit(1);
  }
  
  // Create directories if they don't exist
  if (!fs.existsSync(SONGS_DIR)) fs.mkdirSync(SONGS_DIR, { recursive: true });
  if (!fs.existsSync(ARTWORK_DIR)) fs.mkdirSync(ARTWORK_DIR, { recursive: true });
  
  try {
    const { songs, artwork, appleMusicId: fetchedId } = await fetchAllTracksForArtist(appleMusicId, artistId);
    
    // Save songs
    const songsPath = path.join(SONGS_DIR, `${artistId}.json`);
    fs.writeFileSync(songsPath, JSON.stringify(songs, null, 2));
    console.log(`\n💾 Saved ${songs.length} songs to: ${songsPath}`);
    
    // Save artwork
    if (artwork) {
      const artworkPath = path.join(ARTWORK_DIR, `${artistId}.json`);
      fs.writeFileSync(artworkPath, JSON.stringify(artwork, null, 2));
      console.log(`🖼️  Saved artwork to: ${artworkPath}`);
    }
    
    console.log('\n✅ Refetch complete!');
    console.log(`   Songs: ${songs.length}`);
    console.log(`   Artwork: ${artwork ? 'Yes' : 'No'}`);
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
