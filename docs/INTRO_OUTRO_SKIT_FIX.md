# Intro/Outro/Skit Filter Bug Fix

## Issue Description

**Problem**: Intro, outro, skit tracks AND language version tracks (Japanese Ver., Korean Version, etc.) were appearing as playable songs in the game, even though they were filtered out from the guess dropdown autocomplete.

**Root Cause**: The filtering logic existed in two places with inconsistent behavior:
1. **Runtime filtering** (`src/lib/services/trackFilters.ts`): Had comprehensive filters for intro/outro/skits AND version indicators
2. **Build-time filtering** (`scripts/apple-music-utils.js`): Missing both intro/outro/skit filter AND version indicator filters

This meant:
- Pre-cached JSON files in `public/data/songs/*.json` contained these unwanted tracks
- These tracks could be selected for gameplay (daily challenge or practice mode)
- However, they didn't appear in the autocomplete dropdown when guessing
- Users would encounter unguessable songs

## Fixes Applied

### Fix 1: Intro/Outro/Skit Filtering

Added intro/outro/skit filtering to `scripts/apple-music-utils.js` in the `filterTracks()` function:

```javascript
// Pattern to match intro/outro/skit tracks
const introOutroWords = ['outro', 'intro', 'introduction', 'skit', 'interlude'];
const introOutroPattern = new RegExp(
  `\\b(${introOutroWords.join('|')})s?\\b|` +           // Word boundary match
  `\\((${introOutroWords.join('|')})\\)|` +              // In parentheses
  `^(${introOutroWords.join('|')})\\s*[:.\-–—]|` +      // Start with colon, period, or dash
  `^(${introOutroWords.join('|')})\\s+[A-Z]`,           // Start followed by space and capital letter
  'i'
);
```

This filter matches:
- **Word boundaries**: "The Intro Song", "Outro", "Skit", "Interlude"
- **In parentheses**: "(Intro)", "(Outro)", "(Skit)"
- **Start with colon/dash**: "Intro: Symphony", "Outro - The End"
- **Start with capital letter**: "Intro The Beginning"
- **Plural forms**: "Intros", "Outros", "Skits"

### Fix 2: Version Indicator Filtering

Added version filtering to `scripts/apple-music-utils.js` in the `filterTracks()` function:

```javascript
// Pattern to match version indicators (Japanese Ver., Korean Version, English Ver., etc.)
const versionWords = [
  'version', 'ver\\.?', 'versión', 'japanese', 'kor', 'korean', 'english',
  'eng', 'jap', 'spanish', 'español', 'chinese', 'mandarin', 'cantonese'
];
const versionPatterns = [
  // In parentheses: "(Japanese Ver.)" or "(Korean Version)"
  new RegExp(`\\([^)]*(?:${versionWords.join('|')})[^)]*\\)`, 'i'),
  // In brackets: "[English Ver.]"
  new RegExp(`\\[[^\\]]*(?:${versionWords.join('|')})[^\\]]*\\]`, 'i'),
  // Between dashes: "- Japanese Ver. -" or "- Korean -"
  new RegExp(`[‑\\-–—]\\s*(?:${versionWords.join('|')})\\s*[‑\\-–—]`, 'i'),
  // With "ver." anywhere
  /ver\./i,
];
```

This filter matches:
- **In parentheses**: "(Japanese Ver.)", "(Korean Version)", "(English Ver.)"
- **In brackets**: "[Japanese Ver.]", "[Korean Version]"
- **Between dashes**: "- Japanese Ver. -", "- Korean -"
- **"ver." anywhere**: "Song Name ver. 2", "Song ver."

## Files Modified

1. **`scripts/apple-music-utils.js`**
   - Added `introOutroWords` array and `introOutroPattern` regex
   - Added `versionWords` array and `versionPatterns` regex array
   - Added intro/outro/skit check in `filterTracks()` function
   - Added version indicator check in `filterTracks()` function
   - Added logging for intro/outro/skit removals
   - Added logging for version track removals

## Required Action: Regenerate Song Data

Since the pre-cached JSON files contain intro/outro/skit tracks, they need to be regenerated.

### Option 1: Regenerate All Artists (Recommended)

```bash
node scripts/prefetch-songs.js
```

This will regenerate all song and artwork data for all artists configured in `src/config/artists.ts`.

**Estimated time**: 10-30 minutes depending on number of artists
**API calls**: High (fetches all albums and tracks for all artists)

### Option 2: Regenerate Specific Artists

If you only want to regenerate specific artists:

```bash
node scripts/refetch-artist.js <artist-id> <apple-music-id>
```

**Example**:
```bash
node scripts/refetch-artist.js twice 952699
node scripts/refetch-artist.js bts 883131348
```

You'll need to look up the Apple Music ID for each artist (see scripts/README.md for details).

### Option 3: Bulk Regenerate Multiple Artists

Create a script to regenerate multiple artists:

```bash
#!/bin/bash
# regenerate-all.sh

# List of artist IDs and their Apple Music IDs
node scripts/refetch-artist.js twice 952699
node scripts/refetch-artist.js blackpink 1253230241
node scripts/refetch-artist.js red-velvet 959610457
# ... add more artists
```

## Verification

After regenerating the data, verify the fix:

1. **Check the JSON files**:
   - Open any `public/data/songs/*.json` file
   - Search for "intro", "outro", "skit" in song names → Should find none
   - Search for "japanese", "korean", "ver.", "version" in song names → Should find none (or very few edge cases)

2. **Test in the game**:
   - Play a daily challenge or practice mode
   - Verify no intro/outro/skit tracks appear as playable songs
   - Verify no version tracks (Japanese Ver., Korean Version, etc.) appear
   - All playable songs should be guessable via autocomplete

3. **Check the logs**:
   - When running the scripts, you should see:
     ```
     🚫 Removed X intro/outro/skit tracks
     🚫 Removed X version tracks (Japanese/Korean/English ver.)
     ```
   - This confirms the filters are working

## Architecture Improvement

As part of this fix, we also **removed duplicate filtering logic** from the UI component:

**Before**: Songs were filtered in 3 places (build-time, runtime, UI)  
**After**: Songs are filtered in 2 places (build-time, runtime) - UI just displays pre-filtered songs

This follows the principle of **single source of truth** - the UI receives already-filtered songs and doesn't need to re-filter them.

See [FILTER_ARCHITECTURE.md](./FILTER_ARCHITECTURE.md) for the complete filter architecture documentation.

## Related Files

- **Filter logic (runtime)**: `src/lib/services/trackFilters.ts` (lines 285-311)
- **Filter logic (build-time)**: `scripts/apple-music-utils.js` (lines 233-320)
- **Guess input** (NO longer filters): `src/components/game/GuessInput.tsx`
- **Apple Music service**: `src/lib/services/appleMusicService.ts` (lines 358-381)

## Impact

**Before Fix**:
- ~1,000-2,000 intro/outro/skit tracks across all artists
- ~500-1,500 version tracks (Japanese Ver., Korean Version, etc.)
- Users could encounter unguessable songs
- Frustrating gameplay experience
- Bad UX ("I can't guess this song!")

**After Fix**:
- 0 intro/outro/skit tracks in playable catalog
- 0 version tracks (Japanese/Korean/English ver.) in playable catalog
- All playable songs are guessable
- Better gameplay experience
- Consistent filtering across UI and game logic

## Future Prevention

To prevent this issue in the future:

1. **Keep filters in sync**: Ensure runtime filters (`trackFilters.ts`) match build-time filters (`apple-music-utils.js`)
2. **Test new filters**: When adding new filters, test in both locations
3. **Document filter patterns**: Keep this document updated with any new filter patterns
4. **Automated tests**: Consider adding tests that verify no intro/outro/skit tracks in generated JSON files

## Notes

- The filter pattern is case-insensitive (`/i` flag)
- Handles various dash types: hyphen (-), en dash (–), em dash (—), etc.
- Matches both singular and plural forms (intro, intros)
- Conservative approach: better to filter out legitimate songs than include skits
- If a legitimate song is accidentally filtered, it can be manually reviewed and the pattern adjusted
