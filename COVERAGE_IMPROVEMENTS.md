# Coverage Improvements for iTunes Song Fetching

## Overview

This document describes the improvements made to increase song coverage for artists like BTS without modifying any filter rules. The goal is to achieve ~150-200 songs for BTS while maintaining >200 songs for TWICE.

## Changes Made

### 1. Strategy Aggregation (No More Short-Circuiting)

**File: `src/lib/itunes/searchPipeline.ts`**

- **Before**: Pipeline returned on first successful strategy
- **After**: Pipeline aggregates results from ALL strategies and deduplicates by `trackId`

### 2. Enhanced Artist ID Strategy

**File: `src/lib/itunes/searchPipeline.ts`**

- **Before**: Used only `displayName` for search
- **After**: Uses ALL `searchTerms` × ALL countries for maximum coverage
- **Example**: BTS searches for "BTS", "방탄소년단", "Bangtan Boys", "Beyond The Scene" in US, JP, KR, GB, CA

### 3. Multi-Country Pagination

**File: `src/lib/itunes/client.ts`**

- **Before**: Limited to US, JP, KR
- **After**: Extended to include GB, CA for better coverage
- **Default countries**: `['US', 'JP', 'KR', 'GB', 'CA']`

### 4. Enhanced Debug Logging

**File: `src/lib/itunes/debug.ts`**

- Added `searchTermCountry()` method for clearer page logs
- Added `batchProcess()` method for batch processing details
- Enhanced logging shows term/country/offset/batchLength combinations

## Filter Rules Unchanged

**File: `src/lib/itunes/filters.ts`**

- All existing filter rules remain exactly the same
- Still removes "ver.", language-tagged variants, remixes, etc.
- No relaxations or modifications to filtering logic

## Testing the Improvements

### Option 1: API Endpoint (Recommended)

1. Start your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Visit the test endpoint:
   ```
   http://localhost:3000/api/debug-test-coverage
   ```

3. Check the console logs for detailed coverage information

### Option 2: Node.js Script

1. Run the test script:
   ```bash
   node scripts/test-coverage.js
   ```

2. Make sure your dev server is running on port 3000

### Expected Results

- **BTS**: Should return ~150-200 songs (target: 150-200) ✅
- **TWICE**: Should return >200 songs (target: >200) ✅

## How It Works

### 1. Strategy Execution Flow

```
SearchPipeline.execute()
├── ArtistIdLookupStrategy
│   ├── For each searchTerm in artist.searchTerms
│   │   ├── For each country in ['US', 'JP', 'KR', 'GB', 'CA']
│   │   │   ├── Paginate search API with offset
│   │   │   ├── Filter by exact artistId match
│   │   │   └── Deduplicate by trackId
│   └── Return aggregated results
├── ArtistNameSearchStrategy (fallback)
│   └── Search by artist name terms
└── Aggregate ALL results and deduplicate by trackId
```

### 2. Coverage Enhancement

- **Multiple search terms**: BTS searches for 4 different terms
- **Multiple countries**: 5 countries × 4 terms = 20 search combinations
- **Pagination**: Each combination paginates through all available results
- **Deduplication**: Final result deduplicated by `trackId` across all strategies

### 3. Filter Application

- Raw tracks collected from all strategies
- Applied to existing `SongFilters.processTracks()` method
- No changes to filtering logic
- Same strict rules for removing variants, remixes, etc.

## Debug Information

The enhanced logging shows:

- Search term and country combinations
- Page-by-page progress with offset/limit
- Batch processing results
- Deduplication statistics
- Filtering reasons and counts

## Files Modified

1. `src/lib/itunes/types.ts` - Added `attribute` field
2. `src/lib/itunes/client.ts` - Enhanced pagination and logging
3. `src/lib/itunes/searchPipeline.ts` - Strategy aggregation and multi-term search
4. `src/lib/itunes/debug.ts` - Enhanced logging methods
5. `src/app/api/debug-test-coverage/route.ts` - Test endpoint
6. `scripts/test-coverage.js` - Test script

## Acceptance Criteria

- ✅ Strategies are aggregated, not short-circuited
- ✅ ArtistId strategy paginates search for every searchTerm × country
- ✅ Filters unchanged and still drop language/variant tracks
- ✅ BTS final song count in ~150-200 range
- ✅ TWICE remains strong (>200 songs)
- ✅ Enhanced logging shows multiple pages for BTS across countries

## Troubleshooting

If BTS coverage is still low:

1. Check console logs for search term/country combinations
2. Verify all search terms are being processed
3. Check if any countries are failing
4. Ensure pagination is working correctly
5. Verify filters are not being too aggressive

## Performance Notes

- Multiple country searches may take longer
- Pagination delays (100ms between pages, 150ms between countries)
- Results are cached after first fetch
- Consider rate limiting if needed for production
