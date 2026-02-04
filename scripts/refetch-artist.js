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

// Import shared utilities
const { fetchAllTracksForArtist } = require('./apple-music-utils');

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const SONGS_DIR = path.join(DATA_DIR, 'songs');
const ARTWORK_DIR = path.join(DATA_DIR, 'artwork');

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
    const { songs, artwork, appleMusicId: fetchedId } = await fetchAllTracksForArtist(appleMusicId);
    
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
