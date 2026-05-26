# Apple Music Artist IDs

## Overview

This document tracks which artists have explicit Apple Music artist IDs configured in `src/config/artists.ts`.

## Why Use Explicit IDs?

Using `appleMusicArtistId` provides several benefits:

✅ **Accuracy**: Guarantees the correct artist is fetched (avoids name collisions)  
✅ **Performance**: Skips the artist search API call (faster)  
✅ **Reliability**: Prevents matching wrong artists with similar names  

## Priority System

When fetching songs, the system uses this priority:

1. **Strategy 1**: Use `appleMusicArtistId` if provided (PRIORITY)
2. **Strategy 2**: Search Apple Music by artist `name` (FALLBACK)

## How to Find Apple Music Artist IDs

1. Go to [Apple Music Web Player](https://music.apple.com/)
2. Search for the artist
3. Open their artist page
4. Copy the ID from the URL: `https://music.apple.com/us/artist/artist-name/[ID]`

Example URL: `https://music.apple.com/us/artist/twice/1203816887`  
→ Artist ID: `1203816887`

> ⚠️ **Note:** The ID shown in the Apple Music web URL is sometimes a short legacy ID that differs from the actual Apple Music catalog API ID. Always verify the numeric ID works with the API before saving it here. The ID used in `src/config/artists.ts` must be the catalog API ID (typically 9-10 digits).

## Artists with Explicit IDs

| Artist | Display Name | Apple Music ID | Status |
|--------|--------------|----------------|--------|
| `twice` | TWICE | `1203816887` | ✅ Configured |
| `triples` | tripleS | `1651595986` | ✅ Configured |
| `girls-generation` | Girls' Generation | `357463500` | ✅ Configured |
| `jeon-somi` | SOMI | `1218803768` | ✅ Configured |
| `nu-est` | NU'EST | `510883930` | ✅ Configured |

## Artists Without Explicit IDs

All other artists currently rely on name-based search (Strategy 2).

### Recommended: Add IDs for Popular Artists

Consider adding explicit IDs for these high-traffic artists:

- TWICE
- BTS
- BLACKPINK
- Red Velvet
- ITZY
- Stray Kids
- SEVENTEEN
- ENHYPEN
- NewJeans
- IVE
- aespa
- (G)I-DLE

## Adding an Explicit ID

### 1. Find the ID

```bash
# Search on Apple Music Web Player
https://music.apple.com/
# Copy ID from artist page URL
```

### 2. Update Configuration

Edit `src/config/artists.ts`:

```typescript
// Before
{ 
  id: 'artist-id', 
  name: 'Artist Name', 
  displayName: 'Artist Name', 
  searchTerms: ['Artist Name', '한글'] 
}

// After
{ 
  id: 'artist-id', 
  name: 'Artist Name', 
  displayName: 'Artist Name', 
  searchTerms: ['Artist Name', '한글'],
  appleMusicArtistId: '123456789' // ✅ Added
}
```

### 3. Regenerate Data (Optional)

If you want to regenerate the song data using the explicit ID:

```bash
node scripts/refetch-artist.js artist-id 123456789
```

**Note**: This is optional. The ID will be used automatically on the next fetch.

## Troubleshooting

### Issue: Wrong Artist Data

**Symptom**: Songs don't match the expected artist

**Cause**: Name-based search matched a different artist with a similar name

**Solution**: Add explicit `appleMusicArtistId` to ensure correct artist

### Issue: No Songs Found

**Symptom**: Artist page shows "No songs found"

**Cause 1**: Incorrect Apple Music ID  
**Solution**: Verify the ID by visiting the Apple Music URL directly

**Cause 2**: Artist has no songs in Apple Music catalog  
**Solution**: Check if the artist exists on Apple Music

### Issue: Explicit ID Not Working

**Check logs**:
```
🎵 Fetching tracks for Artist Name using explicit Apple Music ID: 123456789
```

If you see this log, the ID is being used. If not:
1. Check the `appleMusicArtistId` field is spelled correctly
2. Verify it's a string (in quotes)
3. Restart the dev server

## Bulk Update Script

To add IDs for multiple artists at once, you can create a script:

```typescript
// scripts/add-apple-music-ids.js
const artistIds = {
  'twice': '1203816887',
  // Add other artists here only after verifying their IDs against the live API
};

// Script to update artists.ts with these IDs
// (Implementation left as exercise)
```

## Notes

- IDs are **optional** - the system works fine without them
- IDs provide better **accuracy and performance**
- Recommend adding IDs for:
  - Artists with common names (collision risk)
  - High-traffic artists (performance benefit)
  - Artists with known matching issues

## See Also

- [ARTIST_CONFIGURATION.md](./ARTIST_CONFIGURATION.md) - Complete artist configuration guide
- [scripts/README.md](../scripts/README.md) - Prefetch and refetch scripts
- [Apple Music API Documentation](https://developer.apple.com/documentation/applemusicapi/)
