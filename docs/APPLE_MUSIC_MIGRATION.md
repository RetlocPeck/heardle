# Apple Music API Migration Guide

## Status: Implementation Ready for Testing

All code has been migrated to use Apple Music API. **Before you can test**, you need to complete the Apple Developer setup steps below.

## What's Been Done

### ✅ Code Implementation Complete

1. **JWT Token Generator** - `scripts/generate-apple-music-token.js`
   - Script ready to generate developer tokens
   - Requires your Apple Developer credentials

2. **Type Definitions** - `src/types/song.ts`
   - Added `AppleMusicTrack`, `AppleMusicArtist`, `AppleMusicResponse` types
   - Created `convertAppleMusicTrackToSong()` function
   - Updated `Song` interface with generic `trackUrl` field
   - Artwork URL templating support

3. **Apple Music Service** - `src/lib/services/appleMusicService.ts`
   - Complete service implementation with singleton pattern
   - Methods: `searchSongs()`, `getRandomSong()`, `getDailySong()`, `getArtistArtwork()`
   - Pagination handling (fetches all tracks across multiple pages)
   - Artist search fallback if ID doesn't work
   - In-memory caching

4. **Track Filters Updated** - `src/lib/services/trackFilters.ts`
   - Now works with both iTunes AND Apple Music track formats
   - Generic track normalization functions
   - All 12 filters updated to use normalized getters

5. **Song Deduplication Updated** - `src/lib/utils/songDeduplication.ts`
   - Updated to work with generic track types
   - Version scoring and selection logic unchanged

6. **API Routes Migrated** - 3 routes updated:
   - `/api/[artist]/daily` - Uses AppleMusicService
   - `/api/[artist]/random` - Uses AppleMusicService
   - `/api/[artist]/songs` - Uses AppleMusicService

7. **NEW: Artwork Endpoint** - `src/app/api/[artist]/artwork/route.ts`
   - Fetches high-res artist artwork from Apple Music
   - Returns standard (600x600) and high-res (1200x1200) URLs
   - Includes editorial banners if available

8. **Components Updated**:
   - GameResultCard: "Listen on Apple Music" button
   - AudioPlayer: "Listen on Apple Music" button, uses `trackUrl`

9. **Environment Template** - `.env.example`
   - Documents required environment variables

## What YOU Need to Do

### Step 1: Apple Developer Account Setup

**Prerequisite:** Apple Developer Program membership ($99/year)

1. Go to https://developer.apple.com/account
2. Navigate to **Certificates, Identifiers & Profiles**
3. Go to **Keys** section
4. Click the **+** button to create a new key
5. Name it "MusicKit Key for K-Pop Heardle"
6. Enable **MusicKit** checkbox
7. Click **Continue**, then **Register**
8. **Download the .p8 file** (you can only download once!)
9. Save it as `AuthKey_XXXXXXXXXX.p8` in your project root
10. Note the **Key ID** (10 characters) - shown on confirmation page
11. Note your **Team ID** (top-right corner) - also 10 characters

### Step 2: Generate JWT Developer Token

1. Open `scripts/generate-apple-music-token.js`
2. Update these lines with your values:
   ```javascript
   const TEAM_ID = 'YOUR_TEAM_ID';     // Replace with your 10-char Team ID
   const KEY_ID = 'YOUR_KEY_ID';       // Replace with your 10-char Key ID
   const KEY_FILE = 'AuthKey_XXXXXXXXXX.p8'; // Replace with your .p8 filename
   ```

3. Run the generator:
   ```bash
   node scripts/generate-apple-music-token.js
   ```

4. The script will create `.env.local` with your tokens
5. **Set a calendar reminder** for 6 months from now to regenerate the token

### Step 3: Test Artist IDs

Your current iTunes artist IDs should work with Apple Music API (same catalog). Test with:

```bash
# Example: Test TWICE
curl -H "Authorization: Bearer YOUR_TOKEN_FROM_ENV" \
  "https://api.music.apple.com/v1/catalog/us/artists/1203816887"
```

If it returns artist data, the ID works! Repeat for a few artists to verify.

### Step 4: Test the Application

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Test with TWICE first (Featured artist):
   - Navigate to `/twice`
   - Check that tracks load
   - Verify audio preview plays
   - Confirm filtering removes remixes/versions

3. Test Daily Challenge:
   - Should select consistent song for today's date
   - Test across multiple page reloads

4. Test Practice Mode:
   - Should select random songs
   - Verify exclusion of recently played works

5. Test Artwork Endpoint:
   ```bash
   curl http://localhost:3000/api/twice/artwork
   ```
   - Should return artwork URLs
   - Check if bannerUrl is present

### Step 5: Verify All Artists

Test a sample of artists with different catalog sizes:
- Small catalog: KATSEYE (15 songs)
- Medium catalog: ITZY (40 songs)
- Large catalog: BTS (150 songs)

### Step 6: Cleanup (After Successful Testing)

Once everything works:
1. Delete `src/lib/services/itunesService.ts`
2. Remove iTunes types from `src/types/song.ts`
3. Remove the `.p8` file from git (add to `.gitignore`)

## Troubleshooting

### "Apple Music developer token not configured"
- Verify `.env.local` exists with `APPLE_MUSIC_DEV_TOKEN`
- Check token isn't empty or invalid
- Restart dev server after adding token

### "No tracks found"
- Check artist ID in `src/config/artists.ts`
- Try searching for artist: `/v1/catalog/us/search?types=artists&term=ARTIST_NAME`
- Verify token has correct permissions

### Preview URLs don't play
- Check browser console for CORS errors
- Verify preview URLs are in response: `attributes.previews[0].url`
- Try different browser

### Rate limit errors (429)
- Apple Music API allows 20 req/sec
- Your caching should prevent this
- Add delays between requests if needed

## Architecture Notes

### Current Audio Player Retained
- Your existing `<audio>` element-based player works perfectly
- No need for MusicKit JS playback (would lose game timing control)
- MusicKit JS can be added later for advanced features

### Caching Strategy
- Tracks cached per artist in memory (same as before)
- Artwork cached separately
- Cache persists for session (cleared on refresh)

### Pagination
- Apple Music returns max 100 tracks per request
- Service automatically fetches all pages
- Artists with 100+ songs will make multiple API calls on first load

## Next Steps After Testing

1. **Deploy to Vercel** - Environment variables set in Vercel dashboard
2. **Monitor rate limits** - Check Vercel logs for 429 errors
3. **Token expiry** - Set up monitoring/alerts 30 days before expiry
4. **Artist artwork** - Implement `ArtistBanner` component to display banners
5. **Storefront selection** - Add JP/KR storefront support for better K-pop catalog

## Questions?

- Check the plan: `c:\Users\Colter\.cursor\plans\migrate_to_apple_music_api_52f541ed.plan.md`
- Review Apple Music API docs: https://developer.apple.com/documentation/applemusicapi
- MusicKit JS docs: https://js-cdn.music.apple.com/musickit/v3/docs/
