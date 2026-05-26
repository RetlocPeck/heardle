# Refactor Plan — twice-heardle

**Branch:** `refactor/codebase-cleanup` (already created off `master`)
**Target executor:** Claude Sonnet
**Approach:** Phase-by-phase, one PR per phase. Verify each phase before moving on.

---

## How to use this document

Each phase has:
- **Goal** — what you're trying to achieve
- **Files affected** — exact paths
- **Changes** — concrete actions with file:line references
- **Verify** — how to confirm the phase worked
- **Commit** — suggested commit message

Rules:
1. Do not skip the verification step. Each phase builds on the last.
2. After every phase, run `npm run build` and `npm run lint`. Both must pass.
3. Do not "improve while you're there" outside of the listed scope. Each PR should review easily.
4. When in doubt about a deletion, grep the codebase first to confirm zero usages. The plan lists confirmed-dead items, but new code may have been added since the plan was written.
5. Never bypass git hooks, never force-push.

---

## Phase 0 — Preflight

The working tree has 44 modified files from a previous session. Inspect with `git status` and `git diff --stat`. If they're meaningful changes, commit them first. If they're line-ending noise, run `git checkout -- .` to discard them before starting Phase 1.

Confirm the dev server runs (`npm run dev`) and the home page loads. This is your baseline for visual comparison after each phase.

---

## Phase 1 — Delete dead code

**Goal:** Remove ~1100 lines of unreferenced code with zero behavior change.

**Pre-flight grep (run each before deleting to confirm zero non-self imports):**

```bash
# Files to delete entirely — each should return only the file's own definition
grep -rn "useAudioControl" src/ --include="*.ts" --include="*.tsx"
grep -rn "from '@/components/ui/ProgressBar'" src/ --include="*.ts" --include="*.tsx"
grep -rn "from '@/components/ui/Button'" src/ --include="*.ts" --include="*.tsx"
grep -rn "useArtistConfig" src/ --include="*.ts" --include="*.tsx"
grep -rn "useModal" src/ --include="*.ts" --include="*.tsx"
grep -rn "from '@/lib/utils/gameUtils'" src/ --include="*.ts" --include="*.tsx"
grep -rn "from '@/lib/utils/debugUtils'" src/ --include="*.ts" --include="*.tsx"
```

If any of these return imports outside the file itself, **stop and re-investigate** — the plan may be stale.

### Files to delete entirely

| Path | Lines | Confirmed dead because |
|---|---|---|
| `src/lib/hooks/useAudioControl.ts` | 173 | Only referenced by itself |
| `src/components/ui/ProgressBar.tsx` | 76 | Only referenced by itself |
| `src/components/ui/Button.tsx` | 112 | Only referenced by itself |
| `src/lib/hooks/useArtistConfig.ts` | 57 | Only referenced by itself |
| `src/lib/hooks/useModal.ts` | 17 | Only referenced by itself |
| `src/lib/utils/gameUtils.ts` | 182 | Not imported anywhere; `share.ts` has the only used share logic |
| `src/lib/utils/debugUtils.ts` | 163 | References a non-existent `itunesService` window global |

### Partial deletions within files

**`src/lib/hooks/useMediaQuery.ts`** — keep `useMediaQuery` and the default export. Delete:
- `useMobile` (lines 54-56)
- `useTablet` (lines 62-64)
- `useSmallMobile` (lines 70-72)
- `useBreakpoint` (lines 77-86)

**`src/lib/utils/stringUtils.ts`** — keep `normalizeString`, `normalizedStringMatch`, `hashCode`. Delete:
- `partialStringMatch` (lines 47-53)
- `formatTime` (lines 58-62)
- `toTitleCase` (lines 67-73)
- `truncateString` (lines 78-81)
- `isValidUrl` (lines 99-106)
- `createSlug` (lines 111-117)

**`src/lib/utils/dateUtils.ts`** — keep `getTodayString`, `getDateString`, `parseDateString`, `isTodayInLocalTimezone`, `getLocalPuzzleNumber`, `isValidClientDate`, `getSafeDateString`. Delete:
- `isToday` (lines 39-41) — duplicates `isTodayInLocalTimezone`
- `isPastDate` (lines 46-48)
- `isFutureDate` (lines 53-55)
- `daysDifference` (lines 60-65)
- `formatDateForDisplay` (lines 70-78)
- `getWeekStart` (lines 83-89)
- `isSameWeek` (lines 94-96)
- `getNextDayString` (lines 101-105)
- `getPreviousDayString` (lines 110-114)
- `getCurrentLocalTime` (lines 127-132)
- `getTimeUntilMidnight` (lines 137-143)

**`src/types/song.ts`** — delete the iTunes section:
- `ITunesTrack` interface (lines 128-158)
- `ITunesResponse` interface (lines 160-163)
- `isITunesTrack` function (lines 240-247)
- `convertITunesTrackToSong` function (lines 249-262)

**`src/lib/services/trackFilters.ts`** — `GenericTrack` now equals `AppleMusicTrack`:
- Line 13: change `export type GenericTrack = ITunesTrack | AppleMusicTrack;` to `export type GenericTrack = AppleMusicTrack;`
- Remove the iTunes-specific branches in the accessor functions:
  - `getGenericTrackId` (lines 37-41) — drop the `'trackId' in track` branch
  - `getTrackName` (lines 43-47) — drop the `'trackName' in track` branch
  - `getAlbumName` (lines 49-53) — drop the `'collectionName' in track` branch
  - `getPreviewUrl` (lines 55-61) — drop the `'previewUrl' in track` branch
- Remove the now-unused iTunes import on line 7

### Verify

```bash
npm run build
npm run lint
npm run dev  # spot-check home page, artist page, daily game, practice game
```

Expected: build passes, no new lint errors, app behaves identically.

### Commit

```
chore: delete unreferenced code

Removes ~1100 lines of dead code accumulated from prior refactors:
- Unused UI components (Button, ProgressBar)
- Unused hooks (useAudioControl, useArtistConfig, useModal, breakpoint helpers)
- Unused utilities (gameUtils, debugUtils, half of stringUtils and dateUtils)
- Deprecated iTunes types and conversion code
```

---

## Phase 2 — Consolidate storage services

**Goal:** Three storage services adopt the existing `BaseStorageService<T>` instead of duplicating its logic. Delete the redundant `ClientDailyChallengeStorage` wrapper.

### 2a. Delete the proxy wrapper

`src/lib/services/clientDailyChallengeStorage.ts` is a pass-through that adds no value — the underlying `DailyChallengeStorage` already guards `typeof window`.

1. Delete the file.
2. Update imports in:
   - `src/components/game/DynamicHeardle.tsx` — replace `ClientDailyChallengeStorage` with `DailyChallengeStorage` (3 usages)
   - `src/app/[artist]/page.tsx` — same (1 usage)
   - `src/lib/hooks/useDailyRolloverDetection.ts` — same (1 usage)

### 2b. Refactor `dailyChallengeStorage.ts` onto `BaseStorageService`

The base class is in `src/lib/services/baseStorageService.ts` and already exposes `getItem`, `setItem`, `removeItem`, `getKeysByPrefix`, `dispatchEvent`, plus the `isBrowser` guard.

Rewrite `DailyChallengeStorage` to:
- Extend `BaseStorageService<never>` (we use per-key storage, not a single blob, so `T` is unused — define `STORAGE_KEY` as the prefix and `getDefault` as `null as never`)
- Replace direct `localStorage.*` calls (lines 66, 90, 137, 149, 152) with the inherited helpers
- Replace `console.log/warn/error` (11 occurrences) with `Logger.*` from `@/lib/utils/logger`
- Use `this.dispatchEvent(DAILY_CHALLENGE_UPDATED_EVENT, {...})` instead of the manual `new CustomEvent` + `window.dispatchEvent` (lines 70-74)
- Drop the private `getTodayDate` and `isToday` helpers (lines 31-40) — they're one-line wrappers around `getTodayString` / `isTodayInLocalTimezone` from dateUtils

Keep the public API identical: `saveDailyChallenge`, `loadDailyChallenge`, `isDailyChallengeCompleted`, `hasDailyChallenge`, `clearDailyChallenge`, `clearAllDailyChallenges`, `getCompletionStats`.

### 2c. Refactor `statisticsStorage.ts` onto `BaseStorageService`

This one uses a single JSON blob (`GlobalStats`), so `T = GlobalStats`:
- Extend `BaseStorageService<GlobalStats>`
- Set `STORAGE_KEY = STORAGE_KEYS.STATISTICS` (from `@/lib/constants`)
- Implement `getDefault()` returning `getDefaultStats()` output
- Override `parseStored()` to call `mergeWithDefaults` so backward compatibility is preserved
- Replace `getStoredStats()` body (lines 35-52) with `this.getStored()`
- Replace `saveStats()` body (lines 96-106) with `this.save(stats)` then `this.dispatchEvent('statistics-updated', stats)`
- Replace `clearAllStats()` body (lines 191-200) with `this.clear()` then `this.dispatchEvent('statistics-updated', this.getDefault())`
- Route the 3 `console.error` calls through `Logger.error`

### 2d. Refactor `practiceModeStorage.ts` onto `BaseStorageService`

Uses a single blob (`Record<string, PracticeSongHistory>`), so `T = Record<string, PracticeSongHistory>`:
- Extend `BaseStorageService<Record<string, PracticeSongHistory>>`
- `getDefault()` returns `{}`
- Replace `getStoredHistory()` (lines 21-36) with `this.getStored()`
- Replace `saveHistory()` (lines 38-46) with `this.save(history)`
- Replace `clearAllHistory()` (lines 106-114) with `this.clear()`
- Route the 3 `console.error` calls through `Logger.error`

### Verify

- Play a daily game on `/twice`, refresh — saved state should restore
- Win a daily game — statistics modal should reflect the new win
- Play 3 practice games — recent songs exclusion should work (no immediate repeat)
- `npm run build` passes

### Commit

```
refactor: adopt BaseStorageService across storage services

Removes ~150 lines of duplicated localStorage boilerplate across
dailyChallengeStorage, statisticsStorage, and practiceModeStorage.
Deletes the no-op ClientDailyChallengeStorage proxy; callers now
import DailyChallengeStorage directly. All raw console.* in storage
code routed through Logger.
```

---

## Phase 3 — Consolidate rollover detection

**Goal:** One source of truth for "the daily puzzle just rolled over."

There are currently three: a hook (`useDailyRolloverDetection.ts`), an inline implementation in `DynamicHeardle.tsx`, and a callback in `NextDailyCountdown`. Keep the hook, delete the rest.

### 3a. `src/components/game/DynamicHeardle.tsx`

Delete lines 62-123 (the entire `useEffect` block for rollover detection plus the `puzzleNumber` state on line 39).

Replace with:
1. Import `useDailyRolloverDetection` and `useNewDailyChallengeListener` from `@/lib/hooks/useDailyRolloverDetection`
2. Inside the component body:
   ```tsx
   useDailyRolloverDetection({
     artistId: params.artist as string,
     enabled: mode === 'daily',
   });
   useNewDailyChallengeListener(params.artist as string, () => {
     if (mode !== 'daily') return;
     gameLogic.resetGame();
     setGameState(gameLogic.getGameState());
     loadSong(params.artist as string);
   });
   ```
3. In `recordGameResult`, replace the `puzzleNumber` argument to `saveDailyChallenge` with `getLocalPuzzleNumber()` (the function is already imported).

### 3b. `src/app/[artist]/page.tsx`

The `onRollOver` callback on `NextDailyCountdown` (lines 140-161) now duplicates the hook's work. Remove the callback entirely; the hook handles clearing storage and dispatching events.

If `NextDailyCountdown` requires the prop, make it optional in its props interface. Otherwise remove the prop.

### 3c. Audit `NextDailyCountdown.tsx`

Open the file and confirm whether its rollover detection now overlaps with the hook. If it does (likely), remove the duplicate logic — the countdown should only display time until midnight, not trigger app-wide state changes.

### Verify

- Open the daily game on `/twice` before midnight
- Manually advance system time past midnight (or wait, or temporarily mock `getLocalPuzzleNumber`)
- The page should detect rollover within 30 seconds (the hook's poll interval)
- After rollover, the game should reset to a fresh puzzle without manual refresh

### Commit

```
refactor: consolidate daily-rollover detection into one hook

Removes the inline rollover effect in DynamicHeardle (62 lines) and
the onRollOver callback in NextDailyCountdown's parent. The existing
useDailyRolloverDetection hook is now the single source of truth.
```

---

## Phase 4 — Performance fixes (USER-VISIBLE)

**Goal:** Eliminate the hover lag on artist cards and the mobile audio player stutter.

This phase is the one users will actually notice. Test on a real mobile device or Chrome DevTools mobile emulation with 4× CPU throttling before and after — capture before/after screenshots if possible.

### 4a. Home page artist cards (`src/app/page.tsx`)

The cards stack `backdrop-blur-xl` on top of animated `filter blur-xl` blobs, then animate 5+ properties via `transition-all duration-500`. Each is fine alone; together they overwhelm mobile GPUs.

Changes:

1. **Line 122** — replace `transition-all duration-500` with `transition-[transform,box-shadow] duration-300`. Animating only composited properties skips paint/layout work.

2. **Line 122** — remove `backdrop-blur-xl`. The cards have `bg-white/10` which is already enough visual separation from the animated background. The blur effect is barely visible behind the blobs anyway, and this is the single biggest GPU win.

3. **Line 128** — the gradient overlay div: replace `transition-opacity duration-500` (it's already `opacity-0 group-hover:opacity-20`, so this is fine — *only* change the duration to `duration-300`).

4. **Line 174** — `ArtistImage` className: replace `group-hover:scale-110 transition-transform duration-700` with `group-hover:scale-110 transition-transform duration-300`.

5. **Line 119** — delete `style={{ animationDelay: ${index * 200}ms }}`. There is no entrance animation consuming it. The `artistIndex * 50` stagger on line 113 is separately passed to `ArtistImage` via `fetchDelay` and is fine.

6. **Line 17** — wrap the `filteredArtists` calculation in `useMemo`:
   ```tsx
   const filteredArtists = useMemo(
     () => allArtists.filter(artist =>
       artist.name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
       artist.displayName.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
       artist.searchTerms.some(term => term.toLowerCase().startsWith(searchTerm.toLowerCase()))
     ),
     [allArtists, searchTerm]
   );
   ```

### 4b. Animated background (`src/components/ui/AnimatedBackground.tsx`)

Three constantly-animating blurred blobs run behind every page. Make them cheaper and respect user preferences.

Changes:

1. Add a `prefers-reduced-motion` check. If the user opts out of motion, return `null` from the component entirely.
   ```tsx
   const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
   if (prefersReducedMotion) return null;
   ```
   Import `useMediaQuery` from `@/lib/hooks/useMediaQuery`.

2. Reduce blob size from `w-80 h-80` (lines 33, 39, 46) to `w-64 h-64`. Smaller blurred buffers are cheaper to composite.

3. Add `will-change: transform` to the blob divs only (Tailwind: `will-change-transform`). This hints the compositor to upload the blob to a layer once instead of re-rasterizing.

### 4c. Audio player (`src/components/game/AudioPlayer.tsx`)

Three concrete problems. Fix all three.

**Problem 1: Double-update of `currentTime`.** Lines 51-53 (`timeupdate` listener) and lines 89-104 (RAF loop) both call `setCurrentTime`. Pick one.

Delete the entire RAF-based effect (lines 80-112) including the `lastUpdateTimeRef` (line 31) and `animationFrameRef` (line 30) refs. Keep the `timeupdate` listener — it fires roughly 4 times per second, which is plenty for a 1-15s preview bar. Remove all other references to `animationFrameRef` in the cleanup code (lines 41-43, 283-288, 293-296, 312-315).

**Problem 2: 75ms transition fighting with per-frame state updates.**

Lines 522 and 537 — the progress bar fill divs. Remove `transition-all duration-75 ease-out`. With state updating multiple times per second, the transition restarts before completing and produces a stuttering effect rather than smooth motion. Without the transition, the bar updates discretely with each `timeupdate` event, which appears smoother because the browser doesn't fight with itself.

Keep the `shadow-lg` and gradient classes; only remove the `transition-*` utilities.

**Problem 3: Full component remount on every guess.**

`src/components/game/DynamicHeardle.tsx:336`:
```tsx
key={`${currentSong?.id}-${gameLogic.getCurrentAudioDuration()}`}
```

Change to:
```tsx
key={currentSong?.id}
```

The component already has a `useEffect` keyed on `[song.previewUrl, duration, isGameWon, disabled, onEnded]` (line 180) that handles duration changes. The full remount is redundant and re-runs all 7 useEffects every wrong guess.

### 4d. Tap-state on mobile

Buttons across the app use `hover:scale-105` / `hover:scale-110`. On touch devices, this fires on tap and produces a brief scaling effect that feels janky on weak GPUs.

Two options — pick one and apply consistently:

**Option A (recommended):** Gate hover effects behind a hover-capable media query. Add this to `src/app/globals.css`:
```css
@media (hover: none) {
  .hover\:scale-105:hover,
  .hover\:scale-110:hover {
    transform: none;
  }
}
```

**Option B:** Find-and-replace `hover:scale-105` with `[@media(hover:hover)]:hover:scale-105` (and same for 110). More verbose but more explicit.

### 4e. GlassCard blur on the audio card

`src/components/game/DynamicHeardle.tsx:334-343` wraps `AudioPlayer` in a `GlassCard` which applies `backdrop-blur-xl`. On mobile, this is the most expensive single blur on the page because it sits over a constantly-updating progress bar.

Option: add a `blur?: boolean` prop to `GlassCard` (default `true` for backward compat), and pass `blur={false}` to the audio card on mobile breakpoints. Use a media query to apply only on small screens — desktop GPUs handle it fine.

Or simpler: drop `backdrop-blur-xl` from `GlassCard` entirely (line 42 of `GlassCard.tsx`). The `bg-white/5 border-white/20` gives plenty of glass effect without the GPU cost. Audit visually on desktop after the change.

### Verify

1. Open Chrome DevTools → Performance tab → enable 4× CPU throttle and 6× Slowdown
2. Record while hovering across the home page artist grid. Before: scattered red frames, FPS drops to ~20-30. After: should hold ~60fps.
3. On a real mobile device, play a daily game and make several guesses. Audio progress bar should advance smoothly. Tap interactions should feel immediate.
4. Reduced-motion: enable "Reduce motion" in OS accessibility settings, reload — blobs should not render.

### Commit

```
perf: fix hover lag on cards and audio stutter on mobile

- Drop backdrop-blur-xl from artist cards (largest mobile GPU win)
- Narrow card hover transitions from transition-all to transform+shadow only
- Memoize filteredArtists on home page
- Make AnimatedBackground respect prefers-reduced-motion; shrink blobs
- AudioPlayer: remove dual-update mechanism (RAF + timeupdate);
  keep timeupdate listener only
- AudioPlayer: drop 75ms transition on progress bar (was fighting
  per-frame updates and producing stutter)
- DynamicHeardle: stop remounting AudioPlayer on every duration change
- Disable hover scale effects on touch devices
```

---

## Phase 5 — AudioPlayer refactor (higher risk)

**Goal:** Reduce `AudioPlayer.tsx` from 590 lines / 7 useEffects to ~300 lines / 3 useEffects.

Only attempt this **after Phase 4 has shipped and been verified on real devices.** Audio is fragile across iOS Safari / Chrome Android / desktop — regressions are easy.

### 5a. Recreate `useAudioControl` hook

Recreate `src/lib/hooks/useAudioControl.ts` (deleted in Phase 1) with a tighter scope. The previous version was unused; this one will replace the inline logic in AudioPlayer.

Scope:
- Owns the `<audio>` element ref
- Manages `isPlaying`, `isLoading`, `currentTime` state
- Provides `play()`, `pause()`, `stop()`, `setSource(url)` actions
- Handles `timeupdate`, `ended`, `loadstart`, `canplay`, `error` listeners
- Handles `visibilitychange`, `pagehide`, `blur` to stop audio when backgrounded

What it does **not** own:
- The duration timeout (game-specific — stays in AudioPlayer)
- The autoplay-on-game-end logic (game-specific — stays in AudioPlayer)

### 5b. Rewrite `AudioPlayer.tsx`

Use the hook. The remaining component should have three useEffects:

1. **Source setup** — when `song.previewUrl` changes, call `setSource(url)` from the hook.
2. **Duration limit** — when `duration` changes (and game is active), set a `setTimeout` to call `stop()` after `duration` ms. Clear on unmount or duration change.
3. **Auto-play on win/loss** — when `isGameWon || disabled` transitions from `false` to `true` *during the session* (not on first mount of a saved finished game), call `play()` with a brief muted preroll for autoplay-policy compatibility.

Use a `useRef` for "has this component already mounted with a finished game" instead of the current `hasMountedRef` + `prevIsOverRef` dance.

### 5c. Collapse the JSX

The current component has:
- Three separate header blocks for "you won / game over / playing" (lines 482-516)
- Two near-identical progress bar blocks (lines 518-531 vs 533-546)

Collapse the progress bars into one with a computed `totalSeconds` (`isGameWon || disabled ? 30 : duration / 1000`).

Collapse the header into one block with a computed `headerContent` variable.

### 5d. Remove the duplicate `formatTime`

`AudioPlayer.tsx:435-439` redeclares `formatTime`. There's already `formatTime` in `stringUtils.ts` — but Phase 1 deleted it. Add a small inline helper in the file, or move the canonical version back to `stringUtils.ts` if you'd rather. Either way, don't have two copies.

### Verify

Test on at least three devices: desktop Chrome, iOS Safari, Android Chrome. Walk through:
1. Daily mode, first guess → audio plays for 1s and stops
2. Skip → next guess duration extends correctly
3. Win → autoplay starts the full preview
4. Lose all 6 → full preview is available behind the play button
5. Refresh on a completed game → audio is prepared but does *not* auto-play
6. Background the tab during playback → audio stops
7. Switch songs (practice mode "new song") → audio resets, no overlap

### Commit

```
refactor: simplify AudioPlayer using useAudioControl hook

Extracts generic audio lifecycle (source, play/pause, timeupdate,
visibility-pause) into useAudioControl. AudioPlayer now contains
only game-specific logic: duration timeouts and post-game autoplay.
Reduces from 590 lines / 7 useEffects to ~280 / 3.
```

---

## Phase 6 — Logging hygiene

**Goal:** Route all logging through the existing `Logger` utility so production users don't see debug noise.

Current state: 120 raw `console.*` calls across 22 files. The biggest offenders:
- `src/lib/services/appleMusicService.ts` — 41 calls
- `src/lib/services/dailyChallengeStorage.ts` — 11 (Phase 2 may have already addressed these)
- `src/lib/game.ts` — 10
- `src/components/game/AudioPlayer.tsx` — 7 (Phase 5 may have already addressed these)
- `src/components/game/DynamicHeardle.tsx` — 6
- `src/components/game/GuessInput.tsx` — 5

### Rules

- `console.log` with debug context (🎵 / 🔍 emoji prefixes, gameplay events) → **delete entirely**. These were debugging breadcrumbs; users currently see them on every guess.
- `console.log` with operational context ("Loaded X songs", "Cached artwork") → `Logger.debug` or `Logger.info`. Strip emojis from the message — Logger adds its own.
- `console.warn` → `Logger.warn`
- `console.error` → `Logger.error`
- Server-side route handlers can keep `console.error` *if* they're already wrapped in the standardized `handleApiError` from `apiErrorHandler.ts` (which is the right place for it). Don't double-log.

### Procedure

Go file by file, largest first:
1. `appleMusicService.ts` — most logs here are gameplay/debug noise that shouldn't ship to production. Route through Logger and let production strip them via the `NODE_ENV === 'production'` gate in `logger.ts`.
2. `game.ts` — the 🎵 GameLogic logs are diagnostic, not user-facing. Replace with `Logger.debug`.
3. `DynamicHeardle.tsx`, `GuessInput.tsx`, `AudioPlayer.tsx` — same pattern.

### Verify

Build for production (`npm run build`) and run (`npm start`). Open the browser console and play a game. You should see warnings and errors only, no debug spam.

### Commit

```
chore: route all logging through Logger utility

Replaces 120 raw console.* calls across 22 files with the existing
Logger helpers (Logger.debug/info/warn/error). Debug-level logs are
now silenced in production via the NODE_ENV gate. Removes emoji
prefixes that were duplicated by Logger's own formatter.
```

---

## Phase 7 — Small wins

**Goal:** Pick up the leftover cleanups identified during the audit.

### 7a. Cache the Apple Music token check

`src/lib/services/appleMusicService.ts:48-60` — `getAuthHeaders()` re-reads `process.env.APPLE_MUSIC_DEV_TOKEN` on every API call and logs an error each time it's missing. Read once at module load:

```ts
const APPLE_MUSIC_TOKEN = process.env.APPLE_MUSIC_DEV_TOKEN;
if (!APPLE_MUSIC_TOKEN && typeof window === 'undefined') {
  Logger.error('APPLE_MUSIC_DEV_TOKEN not configured');
}
```

Then `getAuthHeaders` becomes a one-liner that throws if `APPLE_MUSIC_TOKEN` is undefined.

### 7b. Collapse `GameResultCard.tsx` mobile/desktop variants

Lines 28-45 declare 11 ternary class variables for `mobile` vs `desktop`. The mobile variant is just `text-X sm:text-Y lg:text-Z` patterns — Tailwind already does responsive sizing. The `variant` prop adds no value over responsive utilities.

Rewrite the component to use one set of responsive classes throughout. Remove the `variant` prop. Update callers in `DynamicHeardle.tsx` (lines 375, 424) to drop the prop.

### 7c. Extract `getFocusableElements` in `StatsModal.tsx`

Lines 21-23 and 42-44 both query the same selector string. Extract a helper:

```ts
const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)) as HTMLElement[];
}
```

Use in both effects.

### 7d. Audit `docs/` folder

The `docs/` directory contains 18 markdown files including `CLEANUP_GUIDE.md`, `PERFORMANCE_BUGS.md`, `NOTIFICATION_BANNER_BUGS.md`, `MIGRATION_SUCCESS.md`, `INTRO_OUTRO_SKIT_FIX.md`. These appear to be progress notes from past sessions rather than living documentation.

For each file:
- If the issue it describes is fixed and the doc is just a postmortem, delete it.
- If it documents current behavior (e.g. `FILTER_ARCHITECTURE.md`, `ARTIST_CONFIGURATION.md`, `SEO.md`), keep it.
- If it's a guide that's now stale, either update or delete.

Use judgment. Ask the user if unsure on any specific file.

### Commit

```
chore: small cleanups

- Cache APPLE_MUSIC_DEV_TOKEN at module load
- Collapse GameResultCard mobile/desktop variants into responsive utilities
- Extract getFocusableElements helper in StatsModal
- Prune stale postmortem docs
```

---

## Post-audit remediation plan

The Phase 7 audit found a few remaining refactor gaps. Handle these as separate PRs, in order. The first two phases below address behavior and maintainability risks; the later phases are cleanup and consolidation.

---

## Phase 8 — Fix ownership and effect correctness

**Goal:** Remove duplicate runtime ownership and stale effect patterns that can cause browser-specific or mode-switch bugs.

### 8a. Make daily rollover detection single-owner

Current issue: `useDailyRolloverDetection` is mounted in both:
- `src/app/[artist]/page.tsx`
- `src/components/game/DynamicHeardle.tsx`

This creates two polling intervals and two focus/visibility listener sets for the same artist/mode. It also duplicates global event dispatching, which is risky after the Firefox recursion bug.

Change:
1. Keep rollover polling in one place only. Preferred: keep it in `DynamicHeardle`, because that component owns game reset/reload behavior.
2. Remove the `useDailyRolloverDetection` import and call from `src/app/[artist]/page.tsx`.
3. Keep `DailyChallengeStatus` updated through the existing `DAILY_CHALLENGE_UPDATED_EVENT` dispatch from storage/page actions.
4. Memoize the callback passed to `useNewDailyChallengeListener`, or change the hook to store `onNewDaily` in a ref so event listeners do not tear down and reattach on every render.

### 8b. Fix `GameLogic` mode lifecycle

Current issue: `DynamicHeardle` creates `new GameLogic(mode)` once with `useState`, then `mode` can change while the same instance remains alive. This can leave `gameState.mode` stale after switching between daily and practice.

Change one of these ways:
- Preferred: create a new `GameLogic` instance when `mode` or `artistId` changes, and load a fresh/saved state through a reducer-like flow.
- Simpler: key `DynamicHeardle` by mode from `src/app/[artist]/page.tsx` so the component remounts intentionally on mode changes.

Avoid suppressing `react-hooks/exhaustive-deps` in the load effect. If dependencies are hard to express, split the effect into smaller effects or move mutable game logic behind stable callbacks.

### 8c. Replace direct `matchMedia` usage in `DynamicHeardle`

Current issue: `DynamicHeardle` uses `MediaQueryList.addEventListener` directly. Older Safari/iOS WebView environments need the legacy `addListener` fallback.

Change:
- Reuse the existing `useMediaQuery('(max-width: 1023.98px)')` hook instead of maintaining a local media-query effect.

### 8d. Clean up timeout effects

Files:
- `src/components/game/GuessInput.tsx`
- `src/components/game/AudioPlayer.tsx`
- `src/lib/hooks/useAudioControl.ts`
- `src/components/ui/buttons/ShareButton.tsx`

Change:
- Store blur/reset/autoplay/unmute timers in refs when they can outlive the current render.
- Clear timers on unmount and before creating a replacement timer.
- For `ShareButton`, distinguish copy success from copy failure; do not show "copied" UI after a clipboard error.

### Verify

- Switch daily -> practice -> daily on an artist page. The game mode and game state should be correct after each switch.
- Complete a daily game in Firefox and Chrome. No recursion/runtime error.
- Simulate midnight rollover or temporarily shorten the rollover interval. Exactly one reload/reset should occur.
- Test on iOS Safari or Safari responsive mode. No `matchMedia.addEventListener` runtime error.
- `npm run build`
- `npm run lint`

### Commit

```
fix: tighten game lifecycle and rollover ownership

- Make daily rollover polling single-owner
- Fix GameLogic lifecycle when switching modes
- Reuse useMediaQuery for Safari-compatible breakpoint detection
- Track and clean up UI/audio timers
```

---

## Phase 9 — Consolidate catalog filtering and Apple Music duplication

**Goal:** Make runtime and script-side catalog filtering use one source of truth so generated data cannot drift from app behavior.

### 9a. Extract shared filter constants

Current issue: filter and version-detection logic is duplicated between:
- `src/lib/services/trackFilters.ts`
- `scripts/apple-music-utils.js`

Repeated patterns include intro/outro/skit words, version words, dash handling, excluded pattern lists, and English-only checks.

Change:
1. Create a shared data module that can be consumed by both runtime code and scripts. Keep it simple:
   - `src/lib/catalog/filterRules.ts` for typed constants and regex builders, or
   - `config/catalog-filter-rules.json` if script compatibility is easier.
2. Update `trackFilters.ts` to build filters from those shared rules.
3. Update `scripts/apple-music-utils.js` to use the same rules rather than maintaining its own regex list.

If importing TS from Node scripts is too much for this phase, use a JSON/common JS rules file first. Do not introduce build tooling just for this cleanup.

### 9b. Consolidate track accessors and dedupe helpers

Current issue:
- `getTrackName` exists in both `trackFilters.ts` and `songDeduplication.ts`.
- Runtime dedupe logic and script dedupe logic both normalize names and rank versions separately.

Change:
1. Move accessors and normalization helpers to one module, e.g. `src/lib/catalog/trackAccessors.ts` and `src/lib/catalog/songVersioning.ts`.
2. Have `trackFilters.ts`, `songDeduplication.ts`, and scripts consume those helpers.
3. Keep public behavior unchanged: generated song counts may change only if current duplicated logic was already inconsistent. If counts change, document why in the PR.

### 9c. Type the Apple Music filtering path

Current issue: `appleMusicService.ts` uses several `any` casts around album storefront metadata and runtime filter adapters.

Change:
- Define an explicit `AppleMusicAlbumWithStorefront` type instead of `album as any`.
- Define an explicit `SongFilterTrackAdapter` type for adapting cached `Song` objects into filterable tracks.
- Replace `(t: any)` and `as any` in the filtering path.
- Keep `(window as any).appleMusicService` only if the dev debug global is still useful; otherwise delete it.

### 9d. Decide script/runtime API sharing boundary

Apple Music fetch flow is duplicated between runtime service and scripts. Do not over-engineer this unless it removes real drift.

Recommended split:
- Shared: auth header construction, storefront constants, request delay constants, filter/dedupe logic.
- Separate: CLI progress logging, file writes, script argument parsing, Next.js API route response handling.

### Verify

- Regenerate one known artist with `scripts/refetch-artist.js`.
- Compare filtered song output before/after for a sample artist.
- Daily/practice song APIs still return valid songs.
- Autocomplete still excludes unwanted versions.
- `npm run build`
- `npm run lint`

### Commit

```
refactor: centralize catalog filtering rules

- Share intro/outro/version filter rules between runtime and scripts
- Consolidate track accessors and song-version normalization
- Remove any casts from Apple Music filtering path
```

---

## Phase 10 — Simplify page and component structure

**Goal:** Reduce UI duplication without changing the visual design.

### 10a. Render result/instruction cards once in `DynamicHeardle`

Current issue: `DynamicHeardle` renders separate mobile and desktop branches for `HowToPlayCard` / `GameResultCard` and hides them with responsive classes.

Change:
- Keep a single source of truth for each card's props.
- If separate placement is still required for the grid, extract a small `GameSideCard` component or compute `const sideCard = ...` once and render it in the appropriate responsive container.
- Avoid maintaining two divergent sets of card props.

### 10b. Extract common page shell primitives

Repeated visual shell appears across:
- `src/app/page.tsx`
- `src/app/[artist]/page.tsx`
- `src/app/artists/page.tsx`
- `src/app/featured/page.tsx`

Change:
- Add a lightweight `PageShell` or `AppBackgroundLayout` for the root gradient + animated background + common z-index layout.
- Add a `ResponsiveContainer` for the repeated horizontal padding stack.
- Add a `PageHeader` only if it actually reduces duplication without hiding page-specific content.

Keep this scoped. Do not rewrite page layout wholesale.

### 10c. Extract artist-card rendering

Current issue: artist cards and featured-card styling are repeated across the home, all-artists, featured, and related-artists views.

Change:
- Extract an `ArtistCard` component with size/context variants only if the call sites share enough structure.
- Move the featured badge/card treatment into the component.
- Preserve existing routes and SEO structure.

### 10d. Split `DailyChallengeStatus`

Current issue: `src/components/artist/ArtistHeader.tsx` mixes `DailyChallengeStatus` with an apparently unused default `ArtistHeader` export.

Change:
- Move `DailyChallengeStatus` to `src/components/artist/DailyChallengeStatus.tsx`.
- Delete `ArtistHeader` if unused, or reintroduce it intentionally where it belongs.
- Replace `event: any` with a typed custom event detail.

### Verify

- Home, `/artists`, `/featured`, and an artist page look unchanged.
- Daily status pill updates after win/loss and after reload.
- Mobile and desktop game layouts still show exactly one result/instruction card in the intended location.
- `npm run build`
- `npm run lint`

### Commit

```
refactor: reduce duplicated page and artist UI

- Extract shared page shell/container primitives
- Consolidate artist-card rendering
- Render game result/instruction props from one source
- Split DailyChallengeStatus from unused ArtistHeader code
```

---

## Phase 11 — Storage, events, and async I/O hardening

**Goal:** Tighten abstractions that were made cleaner but still have drift.

### 11a. Decide the `DailyChallengeStorage` abstraction

Current issue: `DailyChallengeStorage` extends `BaseStorageService<never>` but bypasses the base `getStored/save/clear` model with per-key JSON. The behavior is fine, but the abstraction is misleading.

Change one of these ways:
- Add first-class keyed-record helpers to `BaseStorageService`, or
- Create a separate `KeyedStorageService` base, or
- Remove inheritance from `DailyChallengeStorage` and compose small localStorage helpers directly.

Avoid the `never` default hack in the final shape.

### 11b. Type custom events

Current issue: custom event dispatch/listen logic is spread across page, storage, stats, and rollover code with casts like `as EventListener`.

Change:
- Add typed helpers such as:
  - `emitDailyChallengeUpdated(detail)`
  - `onDailyChallengeUpdated(handler)`
  - `emitStatisticsUpdated(detail)`
  - `onStatisticsUpdated(handler)`
- Centralize all custom event names in `src/lib/constants.ts`.
- Use typed detail interfaces for daily challenge and statistics update events.

### 11c. Revisit `CachedDataService` sync file I/O

Current issue: `cachedDataService.ts` uses synchronous file reads. This is acceptable for a small app, but it blocks the Node event loop in request paths.

Change:
- If keeping sync I/O: memoize loaded JSON in memory so each file is read once per server process.
- If changing to async I/O: update `AppleMusicService` call sites to await cached reads and keep API route behavior unchanged.

Preferred low-risk path: add in-memory memoization first; convert to async later only if profiling shows it matters.

### 11d. Clean remaining type escapes and singleton helper drift

Change:
- Replace `any` in type guards with `unknown`.
- Remove unused `createSingleton` from `baseStorageService.ts` if the repo intentionally prefers explicit singleton classes.
- Replace `NodeJS.Timeout` in client hooks with `ReturnType<typeof setTimeout>` / `ReturnType<typeof setInterval>`.
- Add a narrow type for the nonstandard `freeze` event or remove it if not worth the cast.

### Verify

- Daily save/load/clear still works after refresh.
- Stats modal updates after daily and practice games.
- Practice recent-song exclusion still works.
- API routes still serve cached songs/artwork.
- `npm run build`
- `npm run lint`

### Commit

```
refactor: harden storage and custom event abstractions

- Replace DailyChallengeStorage never-based inheritance
- Add typed custom event helpers
- Memoize cached data reads
- Remove remaining low-value type escapes
```

---

## Final verification

After all phases, including post-audit remediation:

1. `npm run build` — passes with no warnings
2. `npm run lint` — passes
3. Manual QA:
   - Home page loads, search works, hover animations are smooth
   - Click into an artist — daily game loads
   - Make a guess — audio progresses smoothly, board updates
   - Skip → audio extends → win → autoplay full preview
   - Stats button → modal opens, focus trap works, escape closes
   - Practice mode → new song works, doesn't repeat
   - Refresh during an in-progress daily — state restores
4. Mobile QA on a real device:
   - Touch interactions feel immediate
   - Audio progress bar is smooth
   - Scrolling the artist grid is 60fps
5. Lighthouse audit (Chrome DevTools) on home page and `/twice`:
   - Performance score should improve noticeably
   - "Avoid an excessive DOM size", "Reduce JavaScript execution time" warnings should be lower

## Total impact

| Phase | Net lines | Risk | User-visible |
|---|---|---|---|
| 1 | -1100 | very low | no |
| 2 | -150 | low | no |
| 3 | -80 | low | no (but more correct) |
| 4 | ~0 | low-medium | **yes — perf win** |
| 5 | -300 | medium-high | minor (audio more robust) |
| 6 | ~0 | low | no (cleaner production console) |
| 7 | -50 | low | no |
| **Total** | **~-1700 lines, no functionality lost** | | |
