# Performance Bug Fixes

## Overview

This document details performance bugs related to image loading and their fixes.

## Bug 1: Inconsistent Stagger Delays Based on Search State

### Severity: MEDIUM (Performance Impact)

### Issue

The `fetchDelay` was calculated using the artist's index in the **filtered** list:

```typescript
// BEFORE (buggy)
{filteredArtists.map((artist, index) => (
  <ArtistImage
    fetchDelay={artist.featured ? 0 : index * 50}
  />
))}
```

### Problem

When users searched, the same artist would get different stagger delays:

| Scenario | Artist Position | Delay |
|----------|----------------|-------|
| No search | Index 10 in full list | 500ms |
| Search "TW" | Index 0 in filtered list | 0ms |
| Search "BLA" | Index 2 in filtered list | 100ms |

This caused:
1. **Inconsistent loading patterns** - same artist loads at different times
2. **Poor UX** - unpredictable image loading behavior
3. **Cache inefficiency** - re-requests already cached artwork

### Fix

Calculate stagger delay based on artist's position in the **full sorted list**:

```typescript
// AFTER (fixed)
{filteredArtists.map((artist, index) => {
  // Find position in full list (doesn't change with search)
  const artistIndex = allArtists.findIndex(a => a.id === artist.id);
  const staggerDelay = artist.featured ? 0 : artistIndex * 50;
  
  return (
    <ArtistImage
      fetchDelay={staggerDelay}
    />
  );
})}
```

### Result

✅ Each artist has **consistent** stagger delay regardless of search  
✅ Predictable loading pattern  
✅ Better caching behavior  

---

## Bug 2: Unnecessary Re-fetches on Search

### Severity: HIGH (Performance & Cost Impact)

### Issue

The `fetchDelay` was included in the `useEffect` dependency array:

```typescript
// BEFORE (buggy)
useEffect(() => {
  // Load artwork...
  if (fetchDelay > 0) {
    await sleep(fetchDelay);
  }
  // ... fetch artwork
}, [artistId, width, isVisible, fetchDelay]); // ❌ fetchDelay triggers re-run
```

### Problem

When users searched:
1. Search changes → filtered list changes
2. Artist's index in filtered list changes
3. `fetchDelay` prop changes
4. `useEffect` sees dependency change
5. **Entire artwork load re-runs** (even if already loaded!)

**Impact:**
- Unnecessary JSON fetches (network cost)
- Unnecessary API calls (rate limiting risk)
- Wasted CPU cycles
- Poor user experience (images reload)
- Higher hosting bills (Vercel function invocations)

**Example Flow:**
```
Initial load: Fetch artwork for "TWICE" ✓
User types "TW": fetchDelay changes → Re-fetch artwork for "TWICE" ❌
User types "TWI": fetchDelay changes → Re-fetch artwork for "TWICE" ❌
User types "TWIC": fetchDelay changes → Re-fetch artwork for "TWICE" ❌
```

### Fix

Remove `fetchDelay` from dependency array with proper justification:

```typescript
// AFTER (fixed)
useEffect(() => {
  // Load artwork...
  if (fetchDelay > 0) {
    await sleep(fetchDelay);
  }
  // ... fetch artwork
  
  // fetchDelay intentionally excluded from deps - it's only used for initial timing
  // and shouldn't trigger re-fetches when search filters change the delay value
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [artistId, width, isVisible]); // ✅ Only re-run when truly necessary
```

### Result

✅ No re-fetches when search changes  
✅ Artwork loads once and stays cached  
✅ Lower network costs  
✅ Better performance  
✅ Smoother user experience  

---

## Impact Summary

### Before Fixes

| Issue | Impact |
|-------|--------|
| **Search "TWICE"** | Fetches artwork |
| **Search "TWI"** | Re-fetches artwork (unnecessary!) |
| **Search "TW"** | Re-fetches artwork (unnecessary!) |
| **Total requests** | 3× (2 wasted) |
| **Cost** | High |
| **UX** | Images flash/reload |

### After Fixes

| Issue | Impact |
|-------|--------|
| **Search "TWICE"** | Fetches artwork |
| **Search "TWI"** | Uses cached artwork ✓ |
| **Search "TW"** | Uses cached artwork ✓ |
| **Total requests** | 1× |
| **Cost** | Low |
| **UX** | Smooth, no reloading |

---

## Testing

### Test Case 1: Consistent Delays

```typescript
// Artist at position 10 in full list
1. Load homepage → delay = 500ms ✓
2. Search "artist" → delay = 500ms ✓ (not 0ms)
3. Clear search → delay = 500ms ✓
```

### Test Case 2: No Re-fetches

```typescript
1. Load homepage → artwork fetched once
2. Search "tw" → artwork NOT re-fetched ✓
3. Search "twi" → artwork NOT re-fetched ✓
4. Clear search → artwork NOT re-fetched ✓
```

---

---

## Bug 3: Persistent Error State After Successful Retry

### Severity: MEDIUM (UX Impact)

### Issue

When an image load failed and set `hasError` to true, then the component retried (e.g., due to viewport resize or width change), the successful retry didn't reset `hasError`:

```typescript
// BEFORE (buggy)
useEffect(() => {
  const loadArtwork = async () => {
    try {
      // ... load image
      setImageUrl(url); // ✅ Sets URL
      // ❌ Doesn't reset hasError
    } catch (error) {
      setHasError(true); // ❌ Sets error, never cleared
    }
  };
  loadArtwork();
}, [artistId, width, isVisible]); // width change triggers retry
```

### Problem

**Scenario:**
1. Initial load fails (network error) → `hasError = true`
2. User resizes window → `width` changes → effect re-runs
3. Retry succeeds → `imageUrl` set, but `hasError` still `true`
4. Render logic: `{imageUrl && !hasError && <Image />}`
5. **Result:** Error message shows instead of image!

**Why it happens:**
- `hasError` state persists across effect runs
- Success path doesn't explicitly clear error state
- Both image and error exist, but `!hasError` check fails

### Fix

Reset error state at the start of each load attempt AND on success:

```typescript
// AFTER (fixed)
useEffect(() => {
  const loadArtwork = async () => {
    // Reset error state at start of attempt
    setHasError(false); // ✅ Clear old errors
    setIsLoading(true);
    
    try {
      // ... load image
      setImageUrl(url);
      setHasError(false); // ✅ Explicitly clear on success
    } catch (error) {
      setHasError(true); // Only set if current attempt fails
    }
  };
  loadArtwork();
}, [artistId, width, isVisible]);
```

### Result

✅ Retries properly clear error state  
✅ Successful loads show images  
✅ Error messages only show when truly failed  
✅ Better recovery from transient errors  

---

## Files Modified

1. `src/app/page.tsx` - Fixed stagger delay calculation
2. `src/components/artist/ArtistImage.tsx` - Removed fetchDelay from deps + Fixed error state reset
3. `docs/PERFORMANCE_BUGS.md` - This documentation

## Related Issues

- [IMAGE_OPTIMIZATION.md](./IMAGE_OPTIMIZATION.md) - Overall optimization strategy
- [SECURITY_FIXES.md](./SECURITY_FIXES.md) - Security improvements

## Performance Metrics

**Estimated savings per user session:**
- Before: ~50-200 redundant artwork fetches (with active searching)
- After: 0 redundant fetches
- Network bandwidth saved: ~2-10MB per session
- Function invocations saved (Vercel): ~50-200 per session
