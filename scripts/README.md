# Scripts

## apple-music-utils.js

Shared utility module containing common functions for Apple Music API operations. This module is used by both `prefetch-songs.js` and `refetch-artist.js` to avoid code duplication.

### Exported Functions

- **API Functions**: `getAuthHeaders`, `fetchWithRetry`, `fetchArtistAlbums`, `fetchAlbumTracks`, `fetchArtistArtwork`
- **Data Processing**: `convertTrackToSong`, `filterTracks`, `deduplicateSongs`
- **Helper Functions**: `sleep`, `isEnglishOnly`, `getBaseName`, `normalizeName`
- **Main Function**: `fetchAllTracksForArtist(appleMusicArtistId)` - Complete workflow to fetch and process all tracks for an artist

### Constants

- `BASE_URL` - Apple Music API base URL
- `STOREFRONTS` - List of storefronts to check (us, jp, kr)
- `DELAY_BETWEEN_REQUESTS` - Rate limiting delay (50ms)

## generate-apple-music-token.js

Generates JWT developer tokens for Apple Music API access.

### Prerequisites

1. Apple Developer Program membership
2. MusicKit Private Key (.p8 file) from Apple Developer Portal
3. Team ID and Key ID

### Usage

1. Download your MusicKit key (.p8 file) and place in project root
2. Edit the script and update:
   - `TEAM_ID` - Your 10-character team ID
   - `KEY_ID` - Your 10-character key ID
   - `KEY_FILE` - Your .p8 filename
3. Run: `node scripts/generate-apple-music-token.js`
4. Token will be saved to `.env.local`

### Token Expiry

- Max lifetime: 180 days
- Set a calendar reminder to regenerate before expiry
- Script will show expiration date when run

### Security

- Never commit `.env.local` or `.p8` files to git
- Add them to `.gitignore` if not already present
- Tokens are sensitive - treat like passwords

## prefetch-songs.js

Pre-fetches all songs for all artists configured in `src/config/artists.ts` from the Apple Music API and saves the data to `public/data/` for static serving.

### Usage

```bash
node scripts/prefetch-songs.js
# or
npm run prefetch
```

### What It Does

1. Reads all artists from `src/config/artists.ts`
2. For each artist:
   - Searches Apple Music API to find the artist
   - Fetches all albums from multiple storefronts (US, JP, KR)
   - Fetches all tracks from each album
   - Filters tracks (removes instrumentals, remixes, non-English titles, etc.)
   - Deduplicates songs with multiple versions
   - Downloads artist artwork
3. Saves songs to `public/data/songs/{artist-id}.json`
4. Saves artwork to `public/data/artwork/{artist-id}.json`
5. Generates a summary report at `public/data/summary.json`

### Rate Limiting

- 500ms delay between artists
- 50ms delay between API requests
- Automatic retry with backoff on rate limit errors (429)

## refetch-artist.js

Re-fetches songs for a single artist from the Apple Music API. Useful for updating data for specific artists without re-fetching the entire catalog.

### Usage

```bash
node scripts/refetch-artist.js <artist-id> <apple-music-id>
```

### Examples

```bash
node scripts/refetch-artist.js girls-generation 357463500
node scripts/refetch-artist.js jeon-somi 1218803768
node scripts/refetch-artist.js triples 1651595986
```

### Arguments

- `<artist-id>` - The artist ID from `src/config/artists.ts` (e.g., "twice", "bts")
- `<apple-music-id>` - The Apple Music artist ID (numeric ID from Apple Music URLs)

### Finding Apple Music Artist IDs

1. Go to Apple Music web player
2. Search for the artist
3. Open their artist page
4. The URL will contain the ID: `https://music.apple.com/us/artist/artist-name/[ID]`

### What It Does

1. Validates the Apple Music artist ID
2. Fetches all albums and tracks (same process as `prefetch-songs.js`)
3. Applies the same filtering and deduplication logic
4. Saves/overwrites the artist's song data and artwork files

### When to Use

- After adding a new artist to `src/config/artists.ts`
- When you need to refresh data for a specific artist (e.g., new releases)
- When fixing data issues for a single artist
