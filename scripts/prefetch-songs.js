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

// Import shared utilities
const {
  BASE_URL,
  getAuthHeaders,
  sleep,
  fetchWithRetry,
  fetchAllTracksForArtist,
} = require('./apple-music-utils');

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const SONGS_DIR = path.join(DATA_DIR, 'songs');
const ARTWORK_DIR = path.join(DATA_DIR, 'artwork');

// Rate limiting
const DELAY_BETWEEN_ARTISTS = 500; // ms between each artist

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

async function fetchAllTracksForArtistByName(artistConfig) {
  const { displayName } = artistConfig;
  
  // Search for artist
  const artist = await searchArtist(displayName);
  if (!artist) {
    console.log(`  ❌ Artist not found: ${displayName}`);
    return { songs: [], artwork: null, appleMusicId: null };
  }
  
  const appleMusicId = artist.id;
  console.log(`  ✅ Found: ${artist.attributes.name} (ID: ${appleMusicId})`);
  
  // Use shared utility to fetch all tracks
  return await fetchAllTracksForArtist(appleMusicId);
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
      const { songs, artwork, appleMusicId } = await fetchAllTracksForArtistByName(artist);
      
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
