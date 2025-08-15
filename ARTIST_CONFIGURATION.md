# Artist Configuration Guide

This guide explains how to add new artists to the K-Pop Heardle application.

## Quick Start - Adding a New Artist

To add a new artist, you only need to update **one file**: `src/config/artists.ts`

### Step 1: Get iTunes Artist ID

1. Go to [iTunes Search API](https://itunes.apple.com/search?term=ARTIST_NAME&entity=song&media=music&limit=1)
2. Replace `ARTIST_NAME` with your artist's name
3. Look for the `artistId` in the response

### Step 2: Add Artist Configuration

Add a new object to the `ARTISTS` array in `src/config/artists.ts`:

```typescript
{
  id: 'artist-slug',                    // URL-friendly identifier (lowercase, hyphens)
  name: 'ARTIST NAME',                  // Official artist name
  displayName: 'Artist Name',           // How to display the name
  itunesArtistId: '1234567890',        // iTunes artist ID from Step 1
  searchTerms: ['Artist Name', '아티스트'],  // Search terms (include Korean if applicable)
  theme: {
    primaryColor: 'blue',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-600',
    accentColor: 'bg-blue-500 hover:bg-blue-600',
    spinnerColor: 'border-blue-400',
    borderColor: 'border-blue-400',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800'
  },
  metadata: {
    description: 'Brief description of the artist',
    imageUrl: '/groups/artist-image.jpg',  // Add image to public/groups/
    songCount: 50,                         // Approximate number of songs
    releaseYear: 2020                      // Debut year
  }
}
```

### Step 3: Add Artist Image

1. Add the artist's image to `public/groups/`
2. Use a square aspect ratio (recommended: 400x400px)
3. Supported formats: JPG, PNG, WebP

### Step 4: Test

1. Start the development server: `npm run dev`
2. Your new artist should appear on the homepage
3. Click to test the game functionality

## That's It! 🎉

The application will automatically:
- ✅ Create API routes for the new artist
- ✅ Fetch songs from iTunes
- ✅ Apply the artist's theme colors
- ✅ Generate the game interface
- ✅ Handle daily and practice modes

## Configuration Reference

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | URL-friendly identifier | `'blackpink'` |
| `name` | string | Official artist name | `'BLACKPINK'` |
| `displayName` | string | Display name | `'BLACKPINK'` |
| `itunesArtistId` | string | iTunes artist ID | `'1001336677'` |
| `searchTerms` | string[] | Search terms for iTunes | `['BLACKPINK', '블랙핑크']` |
| `theme` | object | Color theme configuration | See below |
| `metadata` | object | Artist metadata | See below |

### Theme Configuration

```typescript
theme: {
  primaryColor: 'pink',                      // Base color name
  gradientFrom: 'from-pink-500',            // Tailwind gradient start
  gradientTo: 'to-rose-600',               // Tailwind gradient end
  accentColor: 'bg-pink-500 hover:bg-pink-600',  // Button colors
  spinnerColor: 'border-pink-400',          // Loading spinner
  borderColor: 'border-pink-400',           // Border colors
  bgColor: 'bg-pink-50',                   // Light background
  textColor: 'text-pink-800'              // Dark text
}
```

### Metadata Configuration

```typescript
metadata: {
  description: 'Brief artist description',   // Shown on homepage
  imageUrl: '/groups/artist.jpg',           // Image path
  songCount: 100,                           // Approximate song count
  releaseYear: 2015                         // Debut year
}
```

## Available Color Themes

Common Tailwind color combinations:

- **Pink**: `pink-500`, `rose-600`
- **Purple**: `purple-500`, `indigo-600`
- **Blue**: `blue-500`, `cyan-600`
- **Green**: `green-500`, `emerald-600`
- **Orange**: `orange-500`, `red-600`
- **Yellow**: `yellow-500`, `amber-600`

## Troubleshooting

### Artist Not Appearing
- Check that the artist ID is unique
- Verify the iTunes Artist ID is correct
- Ensure all required fields are present

### No Songs Loading
- Verify the iTunes Artist ID
- Check the search terms include the artist's name
- Try different search term variations

### Theme Not Working
- Use valid Tailwind CSS classes
- Check color names are consistent
- Ensure gradients use valid color values

### Images Not Loading
- Verify image path is correct
- Check image exists in `public/groups/`
- Ensure image format is supported (JPG, PNG, WebP)

## Advanced Configuration

### Custom Search Terms
Include variations of the artist name to improve song matching:
```typescript
searchTerms: [
  'TWICE',           // Official name
  '트와이스',           // Korean name
  'twice',           // Lowercase
  'Twice'            // Title case
]
```

### Testing iTunes API
Test your artist ID directly:
```
https://itunes.apple.com/lookup?id=YOUR_ARTIST_ID&entity=song&limit=5
```

### Validation
The configuration is automatically validated on startup. Check the console for any errors.

## Need Help?

If you encounter issues:
1. Check the browser console for errors
2. Verify your configuration matches the examples
3. Test the iTunes Artist ID manually
4. Ensure all required fields are present

## Configuration Schema

The full TypeScript interface:

```typescript
interface ArtistConfig {
  id: string;
  name: string;
  displayName: string;
  itunesArtistId: string;
  searchTerms: string[];
  theme: ArtistTheme;
  metadata: ArtistMetadata;
}

interface ArtistTheme {
  primaryColor: string;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  spinnerColor: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
}

interface ArtistMetadata {
  description: string;
  imageUrl: string;
  songCount: number;
  releaseYear: number;
}
```
