# Filter Architecture

## Overview

This document explains the centralized filtering architecture for tracks/songs in the application.

## Problem: Previous Architecture (Multiple Filter Locations)

Previously, filtering logic existed in **three separate places**:

1. **Build-time** (`scripts/apple-music-utils.js`): Filtered when generating JSON files
2. **Runtime** (`src/lib/services/trackFilters.ts`): Filtered when loading songs from API/cache
3. **UI Component** (`src/components/game/GuessInput.tsx`): Filtered again in the dropdown

This caused:
- ❌ Code duplication and maintenance burden
- ❌ Inconsistent filtering logic between layers
- ❌ Bugs where songs were filtered in some places but not others
- ❌ Confusion about which filter was the "source of truth"

## Solution: Single Source of Truth

### New Architecture (Centralized Filtering)

```
┌─────────────────────────────────────────────────────────────┐
│ Build Time: scripts/apple-music-utils.js                   │
│ - Filters tracks from Apple Music API                       │
│ - Saves filtered tracks to public/data/songs/*.json        │
│ - Uses same filter logic as runtime                        │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ Runtime: src/lib/services/trackFilters.ts                  │
│ - Single source of truth for ALL filtering logic           │
│ - Applied when loading songs (cached or live API)          │
│ - Used by AppleMusicService                                 │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ API: /api/[artist]/songs                                    │
│ - Returns already-filtered songs                            │
│ - No additional filtering needed                            │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ UI: GuessInput.tsx                                          │
│ - Receives pre-filtered songs via availableSongs prop      │
│ - Only filters by user input (startsWith)                  │
│ - NO duplicate filtering logic                             │
└─────────────────────────────────────────────────────────────┘
```

## Filter Synchronization

Both build-time and runtime use the **same filter patterns**:

| Filter Type | Build-time Script | Runtime Service |
|-------------|-------------------|-----------------|
| **Intro/Outro/Skit** | ✅ `introOutroPattern` | ✅ `createIntroOutroFilter()` |
| **Version Tracks** | ✅ `versionPatterns` | ✅ Multiple version filters |
| **Missing Data** | ✅ `!hasPreview` | ✅ `createMissingDataFilter()` |
| **Non-English** | ✅ `!isEnglishOnly()` | ✅ `createNonEnglishFilter()` |
| **Instrumentals** | ✅ `excludePatterns` | ✅ `createUnwantedPatternFilter()` |

### Filters Applied

All layers filter out:

1. **Intro/Outro/Skit tracks**
   - "Intro", "Outro", "Skit", "Interlude", "Introduction"
   - In any position (start, parentheses, word boundary)

2. **Version tracks**
   - "Japanese Ver.", "Korean Version", "English Ver."
   - Language indicators in parentheses, brackets, or dashes

3. **Missing data**
   - Tracks without preview URLs
   - Tracks without names

4. **Non-English titles**
   - Tracks with Korean, Japanese, Chinese characters
   - (Keeps English-translated titles)

5. **Unwanted patterns**
   - Instrumentals, remixes, live versions
   - Karaoke, acapella, demos
   - Concert recordings, remasters

## Data Flow

### Build-Time (Pre-caching)

```typescript
// scripts/apple-music-utils.js
function filterTracks(tracks) {
  // Apply filters: intro/outro, versions, instrumentals, etc.
  const filtered = tracks.filter(track => {
    // Check all patterns...
  });
  return filtered;
}

// Saves to: public/data/songs/artist-id.json
```

### Runtime (Dynamic Loading)

```typescript
// src/lib/services/appleMusicService.ts
private processAndCacheTracks(tracks, artistId) {
  // Apply filter chain
  const filters = getDefaultFilterChain(); // From trackFilters.ts
  const { valid: validTracks } = applyFilterChain(tracks, filters);
  
  // Deduplicate and convert
  const processedTracks = deduplicateSongVersions(validTracks);
  this.availableTracks.set(artistId, processedTracks);
}
```

### UI (Display)

```typescript
// src/components/game/GuessInput.tsx
useEffect(() => {
  // NO duplicate filtering - songs are already filtered!
  const filtered = availableSongs.filter(song => 
    song.name.toLowerCase().startsWith(guess.toLowerCase())
  );
  setFilteredSongs(filtered);
}, [guess, availableSongs]);
```

## Benefits

✅ **Single Source of Truth**: All filtering logic in one place (`trackFilters.ts`)  
✅ **No Duplication**: Build-time script uses same patterns as runtime  
✅ **Consistency**: Same songs filtered everywhere  
✅ **Maintainability**: Update filter once, applies everywhere  
✅ **Performance**: UI doesn't waste time re-filtering  
✅ **Testability**: One set of filters to test  

## Updating Filters

When adding a new filter:

1. **Add to runtime filter** (`src/lib/services/trackFilters.ts`)
   ```typescript
   export function createNewFilter(): TrackFilter {
     return createFilter(
       (track) => pattern.test(getTrackName(track)),
       'Reason for filtering'
     );
   }
   
   export function getDefaultFilterChain(): TrackFilter[] {
     return [
       // ... existing filters
       createNewFilter(),
     ];
   }
   ```

2. **Add to build-time filter** (`scripts/apple-music-utils.js`)
   ```javascript
   function filterTracks(tracks) {
     // Add corresponding pattern
     const newPattern = /pattern/i;
     
     // Apply in filter logic
     if (newPattern.test(name)) {
       newCount++;
       return false;
     }
   }
   ```

3. **Regenerate pre-cached data**
   ```bash
   node scripts/prefetch-songs.js
   ```

4. **Verify**
   - Check logs for new filter counts
   - Test in UI - filtered songs should not appear

## Testing

### Verify Filters Are Working

1. **Build-time**: Check script logs
   ```
   🚫 Removed X intro/outro/skit tracks
   🚫 Removed X version tracks (Japanese/Korean/English ver.)
   ```

2. **Runtime**: Check API response
   ```bash
   curl http://localhost:3000/api/twice/songs
   # Should not contain intro/outro/skit/version tracks
   ```

3. **UI**: Check autocomplete
   - Type in guess input
   - Verify no intro/outro/skit tracks appear
   - All suggestions should be playable

### Common Issues

**Q: Songs appear in dropdown but fail to match on guess**  
A: This was the original bug - songs were filtered at one layer but not others

**Q: Some intro/outro tracks still appear**  
A: The pre-cached JSON files need regeneration with updated filters

**Q: Filter added to `trackFilters.ts` but not working at build-time**  
A: Must also add equivalent pattern to `apple-music-utils.js`

## Related Documentation

- [INTRO_OUTRO_SKIT_FIX.md](./INTRO_OUTRO_SKIT_FIX.md) - Bug fix that led to this refactor
- [scripts/README.md](../scripts/README.md) - Build-time script documentation
- [IMAGE_OPTIMIZATION.md](./IMAGE_OPTIMIZATION.md) - Similar architecture for images

## Files

### Filter Implementation
- **Runtime**: `src/lib/services/trackFilters.ts`
- **Build-time**: `scripts/apple-music-utils.js`

### Filter Usage
- **Service**: `src/lib/services/appleMusicService.ts`
- **API**: `src/app/api/[artist]/songs/route.ts`
- **UI**: `src/components/game/GuessInput.tsx`

### Scripts
- **Regenerate all**: `scripts/prefetch-songs.js`
- **Regenerate one**: `scripts/refetch-artist.js`
