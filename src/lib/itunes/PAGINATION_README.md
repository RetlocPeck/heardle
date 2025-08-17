# iTunes Service Pagination

## Overview

The iTunes service now supports full pagination to fetch all available songs for an artist, not just the first 200. This is implemented internally while maintaining the same public API.

## How It Works

### 1. **Automatic Pagination**
- When you call `searchSongs(artistId)`, the service automatically fetches ALL available songs
- Uses offset-based pagination internally
- Respects rate limits with 100ms delays between requests
- Stops when no more songs are available

### 2. **Pagination Strategies**

#### **Artist ID Lookup (Primary)**
- Most reliable method
- Fetches songs page by page until all are retrieved
- Automatically detects when all songs have been fetched

#### **Artist Name Search (Fallback)**
- Used when Artist ID lookup fails
- Searches by multiple terms (e.g., "TWICE", "트와이스")
- Implements smart stopping after 3 consecutive empty pages

### 3. **Progress Tracking**
The service provides detailed logging during pagination:
```
📊 Pagination: Starting pagination for artist twice: 150 total tracks available
📄 Page 1: Found 200 tracks (offset: 0, limit: 200)
📊 Pagination Progress: 200/150 (133.3%) - Page 1/1
🎯 Pagination Complete: 150 tracks from 1 pages (100.0% coverage)
```

## Public API (Unchanged)

```typescript
// These methods work exactly the same but now fetch ALL songs
const songs = await itunesService.searchSongs('twice');
const randomSong = await itunesService.getRandomSong('twice');
const dailySong = await itunesService.getDailySong('2024-01-15', 'twice');
```

## Advanced Pagination Options

### **PageOpts Interface**
```typescript
interface PageOpts {
  limit?: number;      // Songs per page (default: 200)
  offset?: number;     // Starting offset (default: 0)
  entity?: string;     // Entity type (default: 'song')
  media?: string;      // Media type (default: 'music')
}
```

### **PaginationResult Interface**
```typescript
interface PaginationResult {
  tracks: Song[];           // All fetched tracks
  totalAvailable: number;   // Total available on iTunes
  pagesFetched: number;     // Number of pages fetched
  hasMore: boolean;         // Whether more pages exist
}
```

## New Methods

### **getArtistPaginationDetails(artistId)**
Get detailed pagination information for an artist:
```typescript
const details = await itunesService.getArtistPaginationDetails('twice');
console.log(`Fetched ${details.tracks.length} songs from ${details.pagesFetched} pages`);
console.log(`Coverage: ${((details.tracks.length / details.totalAvailable) * 100).toFixed(1)}%`);
```

## Internal Implementation

### **Client Layer**
- `fetchAllArtistSongs()`: Fetches all songs using Artist ID lookup
- `searchAllByArtistName()`: Fetches all songs using name search
- Automatic offset calculation and page management

### **Search Pipeline**
- Orchestrates multiple search strategies
- Falls back gracefully if primary method fails
- Maintains search order preference

### **Rate Limiting**
- 100ms delay between page requests
- Respectful to iTunes API
- Configurable delays for production use

## Benefits

1. **Complete Coverage**: Now fetches ALL available songs, not just first 200
2. **Better Random Selection**: Larger song pool for daily/random selection
3. **Improved Search**: More comprehensive song search within artist catalogs
4. **Transparent**: No changes needed to existing code
5. **Efficient**: Smart pagination with automatic stopping

## Example Usage

```typescript
import ITunesService from '@/lib/itunes';

const itunesService = ITunesService.getInstance();

// This now fetches ALL songs automatically
const allSongs = await itunesService.searchSongs('twice');
console.log(`Found ${allSongs.length} songs for TWICE`);

// Get pagination details
const paginationDetails = await itunesService.getArtistPaginationDetails('twice');
console.log(`Coverage: ${((paginationDetails.tracks.length / paginationDetails.totalAvailable) * 100).toFixed(1)}%`);

// All existing methods work the same but with more songs
const randomSong = await itunesService.getRandomSong('twice');
const dailySong = await itunesService.getDailySong('2024-01-15', 'twice');
```

## Debug Mode

In development mode, you'll see detailed pagination logs:
- Page-by-page progress
- Track counts per page
- Overall completion status
- Coverage percentages

Set `DEBUG=true` environment variable for additional logging in production.
