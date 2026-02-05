# Notification Banner Bug Fixes

## Overview

This document details bugs and fixes related to the `NotificationBanner` component.

---

## Bug 1: Incomplete Cleanup Leading to Memory Leaks

### Severity: HIGH (Memory Leak & Console Warnings)

### Issue

The cleanup function in the main `useEffect([id])` had incomplete logic:

```typescript
// BEFORE (buggy)
useEffect(() => {
  // ... setup animation and dismiss timeouts
  
  if (!dismissed) {
    // Setup...
    
    // Cleanup only cleared animationTimeoutRef
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
      // ❌ dismissTimeoutRef NOT cleared!
    };
  } else {
    // If dismissed, no cleanup returned at all!
  }
}, [id]);
```

### Problem

**Scenario 1: User dismisses, then component unmounts**
1. User clicks dismiss → `dismissTimeoutRef` set for 350ms
2. Component unmounts before 350ms
3. `dismissTimeoutRef` still running → attempts state update on unmounted component
4. **Result:** Memory leak + React console warning

**Scenario 2: Already dismissed notification**
1. Notification was previously dismissed
2. Component renders with `dismissed = true`
3. No cleanup function returned
4. If any timeouts were active, they remain active
5. **Result:** Potential memory leak

### Fix

Moved cleanup outside the if/else block to always run, and clear both timeout refs:

```typescript
// AFTER (fixed)
useEffect(() => {
  // ... setup animation and dismiss timeouts
  
  if (!dismissed) {
    // Setup animation timeout...
  } else {
    // Hide immediately
  }
  
  // Cleanup: cancel BOTH timeouts if component unmounts or id changes
  // This prevents state updates on unmounted components and memory leaks
  return () => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }
  };
}, [id]);
```

### Result

✅ All timeouts properly cancelled on unmount  
✅ All timeouts properly cancelled on `id` change  
✅ No memory leaks  
✅ No React console warnings  

---

## Bug 2: Lost Dismissal Preference on `id` Change During Animation

### Severity: HIGH (Data Loss)

### Issue

When `id` prop changed during the dismiss animation, the cleanup function cancelled the dismiss timeout, preventing the `localStorage` save:

```typescript
// BEFORE (buggy)
const handleDismiss = () => {
  setIsAnimating(false);
  
  dismissTimeoutRef.current = setTimeout(() => {
    setIsVisible(false);
    
    // Save dismissal preference AFTER animation completes
    localStorage.setItem(`notification-${id}-dismissed`, 'true'); // ❌
    
    dismissTimeoutRef.current = null;
  }, 350); // CSS animation is 300ms + 50ms buffer
};

// In useEffect cleanup:
return () => {
  if (dismissTimeoutRef.current) {
    clearTimeout(dismissTimeoutRef.current); // ❌ Cancels localStorage save!
  }
};
```

### Problem

**Scenario:**
1. User clicks dismiss → `dismissTimeoutRef` scheduled for 350ms
2. During the 350ms animation, `id` prop changes (new notification)
3. `useEffect([id])` cleanup runs → clears `dismissTimeoutRef`
4. Timeout cancelled → `localStorage.setItem` never executes
5. **Result:** User's dismissal preference is lost!

**Impact:**
- User dismisses notification
- Refreshes page
- **Dismissed notification reappears** (bad UX!)
- User has to dismiss again

### Fix

Save dismissal preference **immediately** when dismiss is clicked, not after animation:

```typescript
// AFTER (fixed)
const handleDismiss = () => {
  // Cancel animation timeout if user dismisses before animation completes
  if (animationTimeoutRef.current) {
    clearTimeout(animationTimeoutRef.current);
    animationTimeoutRef.current = null;
  }
  
  // Save dismissal state IMMEDIATELY to ensure it persists even if:
  // - Component unmounts during animation
  // - id prop changes during animation
  // - User navigates away during animation
  try {
    localStorage.setItem(`notification-${id}-dismissed`, 'true'); // ✅ Immediate!
  } catch (error) {
    console.warn('Failed to save notification dismissal:', error);
  }
  
  setIsAnimating(false);
  
  // Timeout now only handles visual unmount
  dismissTimeoutRef.current = setTimeout(() => {
    setIsVisible(false);
    dismissTimeoutRef.current = null;
  }, 350);
};
```

### Result

✅ Dismissal preference saved immediately  
✅ Persists even if component unmounts during animation  
✅ Persists even if `id` prop changes during animation  
✅ Persists even if user navigates away  
✅ Better data integrity  

---

## Bug 3: Animation Timeout Not Cancelled on User Dismiss

### Severity: MEDIUM (Visual Glitch)

### Issue

When user clicked dismiss before the entrance animation completed (100ms), the animation timeout wasn't cancelled:

```typescript
// BEFORE (buggy)
useEffect(() => {
  // Schedule entrance animation
  animationTimeoutRef.current = setTimeout(() => {
    setIsAnimating(true);
    animationTimeoutRef.current = null;
  }, 100);
  
  // ...
}, [id]);

const handleDismiss = () => {
  setIsAnimating(false); // Start exit animation
  
  // ❌ animationTimeout not cancelled!
  // It will fire and set isAnimating(true) AFTER we set it to false
  
  dismissTimeoutRef.current = setTimeout(() => {
    setIsVisible(false);
  }, 350);
};
```

### Problem

**Scenario:**
1. Component mounts → animation timeout scheduled (100ms)
2. User clicks dismiss at 50ms → `setIsAnimating(false)`
3. Exit animation starts
4. At 100ms, animation timeout fires → `setIsAnimating(true)` ❌
5. Banner flickers back to visible briefly
6. At 350ms, dismiss timeout fires → `setIsVisible(false)`
7. **Result:** Banner flickers during exit

### Fix

Cancel the animation timeout in `handleDismiss`:

```typescript
// AFTER (fixed)
const handleDismiss = () => {
  // Cancel animation timeout if user dismisses before animation completes
  // This prevents the animation from flickering back to visible
  if (animationTimeoutRef.current) {
    clearTimeout(animationTimeoutRef.current); // ✅ Cancelled!
    animationTimeoutRef.current = null;
  }
  
  // Save dismissal immediately...
  
  setIsAnimating(false);
  
  // Schedule unmount...
};
```

### Result

✅ No visual flicker on early dismiss  
✅ Smooth exit animation  
✅ Timeout properly managed  

---

## Bug 4: Dismiss Animation Timing Too Tight

### Severity: LOW (Visual Glitch on Slow Devices)

### Issue

The dismiss animation duration and setTimeout were both 300ms with no buffer:

```typescript
// BEFORE (fragile)
const handleDismiss = () => {
  setIsAnimating(false); // Triggers 300ms CSS transition
  
  dismissTimeoutRef.current = setTimeout(() => {
    setIsVisible(false); // Unmounts component
  }, 300); // ❌ Same as CSS animation duration
};
```

### Problem

On slower devices:
1. `setIsAnimating(false)` triggers React re-render
2. Browser must paint the new state
3. CSS transition starts
4. **But:** React render + browser paint have latency
5. If total latency > 0ms, CSS animation doesn't finish before component unmounts
6. **Result:** Janky exit animation, component disappears abruptly

### Fix

Added 50ms buffer to setTimeout:

```typescript
// AFTER (robust)
const handleDismiss = () => {
  setIsAnimating(false);
  
  dismissTimeoutRef.current = setTimeout(() => {
    setIsVisible(false);
    dismissTimeoutRef.current = null;
  }, 350); // CSS animation is 300ms + 50ms buffer for React render/paint delays
};
```

### Result

✅ Animation completes smoothly even on slower devices  
✅ No visual glitches  
✅ Better cross-device experience  

---

## Bug 5: Animation State Not Reset on `id` Change

### Severity: LOW (Latent Bug)

### Issue

When `id` prop changed while a notification was visible, the `isAnimating` state wasn't reset:

```typescript
// BEFORE (buggy)
useEffect(() => {
  // Cancel timeouts...
  
  if (!dismissed) {
    setIsVisible(true);
    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(true); // ❌ But never reset to false first
    }, 100);
  }
}, [id]);
```

### Problem

**Scenario:**
1. Notification A is visible and `isAnimating = true`
2. `id` prop changes to notification B
3. `setIsVisible(true)` → B appears
4. Animation timeout schedules `setIsAnimating(true)` in 100ms
5. **But** `isAnimating` is already `true` from notification A!
6. Notification B appears **instantly** without animation

### Fix

Reset `isAnimating` when `id` changes:

```typescript
// AFTER (fixed)
useEffect(() => {
  // Cancel timeouts...
  
  // Reset animation state when id changes to ensure new notification animates in
  setIsAnimating(false); // ✅ Reset first
  
  if (!dismissed) {
    setIsVisible(true);
    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(true); // Now animates from false → true
    }, 100);
  }
}, [id]);
```

### Result

✅ New notifications always animate in properly  
✅ No instant appearances  
✅ Consistent UX across `id` changes  

---

## Bug 6: Missing localStorage Safety Checks

### Severity: HIGH (Crash in Private Browsing)

### Issue

localStorage operations weren't wrapped in try-catch blocks:

```typescript
// BEFORE (crashes in private browsing)
useEffect(() => {
  const dismissed = localStorage.getItem(`notification-${id}-dismissed`) === 'true'; // ❌ Throws in private browsing
  
  if (!dismissed) {
    setIsVisible(true);
  }
}, [id]);

const handleDismiss = () => {
  localStorage.setItem(`notification-${id}-dismissed`, 'true'); // ❌ Throws if quota exceeded
};
```

### Problem

In private browsing mode or when localStorage is disabled:
- Safari throws `SecurityError`
- Firefox throws `SecurityError`
- Some browsers throw `QuotaExceededError`
- **Result:** Component crashes, entire page breaks!

### Fix

Wrapped all localStorage operations in try-catch:

```typescript
// AFTER (safe)
useEffect(() => {
  let dismissed = false;
  try {
    dismissed = localStorage.getItem(`notification-${id}-dismissed`) === 'true';
  } catch (error) {
    // localStorage not available (private browsing, disabled, etc.)
    // Default to showing notification
    console.warn('localStorage not available, notification will show every time:', error);
  }
  
  if (!dismissed) {
    setIsVisible(true);
  }
}, [id]);

const handleDismiss = () => {
  try {
    localStorage.setItem(`notification-${id}-dismissed`, 'true');
  } catch (error) {
    // localStorage not available (private browsing, quota exceeded, etc.)
    // Notification will show again on next visit, but that's acceptable
    console.warn('Failed to save notification dismissal:', error);
  }
};
```

### Result

✅ No crashes in private browsing mode  
✅ Graceful degradation when localStorage unavailable  
✅ Better browser compatibility  
✅ User can still dismiss (for current session)  

---

## Bug 7: Dismiss Timeout Could Target Wrong Notification

### Severity: MEDIUM (Data Corruption)

### Issue

When `id` changed during dismiss animation, the old timeout could save the wrong notification's dismissal:

```typescript
// BEFORE (buggy)
const handleDismiss = () => {
  setIsAnimating(false);
  
  dismissTimeoutRef.current = setTimeout(() => {
    setIsVisible(false);
    localStorage.setItem(`notification-${id}-dismissed`, 'true'); // ❌ Uses current id, not original
  }, 350);
};
```

### Problem

**Scenario:**
1. User dismisses notification A (`id = "update-2026-01"`)
2. Dismiss timeout scheduled for 350ms
3. At 200ms, `id` prop changes to notification B (`id = "update-2026-02"`)
4. At 350ms, timeout fires:
   - Uses **current** `id` value ("update-2026-02")
   - Saves dismissal for notification B (wrong!)
   - User never dismissed notification B!

### Fix (Already Fixed in Bug 2)

Capturing `id` in closure and saving immediately eliminates this issue:

```typescript
// AFTER (fixed)
const handleDismiss = () => {
  // Save IMMEDIATELY with current id
  try {
    localStorage.setItem(`notification-${id}-dismissed`, 'true'); // ✅ Saved immediately
  } catch (error) {
    console.warn('Failed to save notification dismissal:', error);
  }
  
  setIsAnimating(false);
  
  // Timeout only handles visual unmount (no localStorage operation)
  dismissTimeoutRef.current = setTimeout(() => {
    setIsVisible(false);
    dismissTimeoutRef.current = null;
  }, 350);
};
```

### Result

✅ Correct notification dismissed  
✅ No data corruption  
✅ Reliable dismissal tracking  

---

## Impact Summary

### Before Fixes

| Issue | Impact |
|-------|--------|
| Memory leaks | Console warnings, memory buildup |
| Lost dismissal preferences | User frustration, repeated dismissals |
| Visual flickers | Janky animations, poor UX |
| Private browsing crashes | Page breaks, bad accessibility |
| Wrong notification dismissed | Data corruption |

### After Fixes

| Issue | Impact |
|-------|--------|
| Memory leaks | ✅ None |
| Lost dismissal preferences | ✅ Always saved |
| Visual flickers | ✅ Smooth animations |
| Private browsing crashes | ✅ Graceful fallback |
| Wrong notification dismissed | ✅ Correct tracking |

---

## Files Modified

1. `src/components/ui/NotificationBanner.tsx` - All bug fixes
2. `docs/NOTIFICATION_BANNER.md` - Updated dismissal flow documentation
3. `docs/NOTIFICATION_BANNER_BUGS.md` - This documentation

---

## Testing Checklist

### Test Case 1: Memory Leak Prevention
- [ ] Dismiss notification
- [ ] Before 350ms, unmount component
- [ ] Check console for warnings → Should be none

### Test Case 2: Dismissal Persistence
- [ ] Dismiss notification
- [ ] Immediately refresh page
- [ ] Check if dismissed → Should stay dismissed

### Test Case 3: Private Browsing
- [ ] Open in Safari/Firefox private mode
- [ ] Load page
- [ ] Check for errors → Should be none
- [ ] Dismiss notification
- [ ] Check console → Should show warning, not crash

### Test Case 4: Animation Smoothness
- [ ] Load notification
- [ ] Immediately dismiss (within 100ms)
- [ ] Check animation → Should be smooth, no flicker

### Test Case 5: ID Change During Dismiss
- [ ] Programmatically change `id` prop during dismiss animation
- [ ] Check localStorage → Original id should be dismissed
- [ ] Check new notification → Should appear with animation

---

## Related Documentation

- [NOTIFICATION_BANNER.md](./NOTIFICATION_BANNER.md) - Component usage and features
- [PERFORMANCE_BUGS.md](./PERFORMANCE_BUGS.md) - Image loading performance fixes
- [SECURITY_FIXES.md](./SECURITY_FIXES.md) - Security improvements
