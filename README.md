# K-Pop Heardle 🎵

A comprehensive music guessing game featuring your favorite K-pop artists! Test your knowledge of K-pop discographies by guessing songs from short audio previews.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://heardle.live)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## ✨ Features

### 🎮 Game Modes
- **Daily Challenges**: New song every day at midnight for each artist (same for all players)
- **Practice Mode**: Unlimited random songs for practice sessions
- **Progressive Audio**: Start with 1 second, gradually increase to 15 seconds
- **Smart Autocomplete**: Search through each artist's entire catalog with intelligent filtering

### 🎨 Modern Design
- **Glassmorphism UI**: Beautiful backdrop blur effects and modern aesthetics
- **Artist-Specific Themes**: Each artist has unique color schemes (auto-generated or custom)
- **Responsive Design**: Optimized for all devices with mobile-first approach
- **Dark Theme**: Elegant dark interface with smooth animations
- **Dynamic Artist Artwork**: Fetched from Apple Music API

### 📊 Statistics & Sharing
- **Game Statistics**: Track your performance and accuracy over time
- **Share Results**: Share your daily challenge results with friends
- **Local Storage**: Persistent game state and statistics
- **Daily Rollover**: Automatic detection of new daily challenges

### 🌐 Multi-Artist Support
Currently featuring **100+ K-pop artists** including:

**Girl Groups**: TWICE, LE SSERAFIM, BLACKPINK, NewJeans, IVE, aespa, ITZY, Red Velvet, Girls' Generation, NMIXX, Kep1er, ILLIT, Dreamcatcher, MAMAMOO, GFRIEND, LOONA, WJSN, fromis_9, STAYC, KISS OF LIFE, BABYMONSTER, and more

**Boy Groups**: BTS, Stray Kids, SEVENTEEN, ENHYPEN, TXT, ATEEZ, NCT 127/DREAM/U, EXO, BIGBANG, Super Junior, SHINee, GOT7, MONSTA X, RIIZE, TREASURE, THE BOYZ, and more

**Solo Artists**: IU, Taeyeon, Sunmi, HyunA, G-Dragon, Taeyang, Baekhyun, Taemin, and more

## 🎯 How to Play

1. **Choose Your Artist**: Select from 100+ K-pop artists on the homepage
2. **Pick Your Mode**: Daily Challenge (one song per day) or Practice Mode (unlimited)
3. **Listen & Guess**: Start with 1 second of audio, guess the song title
4. **Progressive Reveals**: Each wrong guess or skip gives you more audio time
5. **Win Condition**: Guess correctly within 6 tries to win
6. **Share Results**: Share your daily challenge performance with friends

### Audio Progression System
| Try | Duration |
|-----|----------|
| 1   | 1 second |
| 2   | 2 seconds |
| 3   | 4 seconds |
| 4   | 7 seconds |
| 5   | 10 seconds |
| 6   | 15 seconds (final) |

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** and npm
- **Apple Music Developer Token** (for API access)
- **Modern browser** with HTML5 audio support

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/retlocpeck/heardle.git
cd heardle
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file:
```env
APPLE_MUSIC_DEV_TOKEN=your_apple_music_jwt_token
APPLE_MUSIC_KEY_ID=your_key_id
APPLE_MUSIC_TEAM_ID=your_team_id
```

4. **Generate Apple Music token** (if needed)
```bash
node scripts/generate-apple-music-token.js
```

5. **Pre-fetch song data** (recommended for production)
```bash
npm run prefetch
```

6. **Run development server**
```bash
npm run dev
```

7. **Open in browser**
Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production
```bash
npm run build:full  # Includes prefetch step
npm start
```

## 🏗️ Project Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS 4 with custom glassmorphism components
- **Audio**: HTML5 Audio API with custom controls
- **Data Source**: Apple Music API with static pre-generation
- **Analytics**: Vercel Speed Insights for performance monitoring

### Data Pipeline
```
Apple Music API → Pre-fetch Script → Static JSON → Runtime Cache → Game Logic → Audio Player
```

The project uses a **static pre-generation** strategy:
1. **Build Time**: `npm run prefetch` fetches all artist catalogs from Apple Music API
2. **Runtime**: API routes serve pre-cached JSON data (no live API calls needed)
3. **Fallback**: If cache misses, falls back to live Apple Music API

### Project Structure
```
heardle/
├── public/
│   ├── data/                    # Pre-fetched static data
│   │   ├── songs/               # Artist song catalogs (JSON)
│   │   ├── artwork/             # Artist artwork URLs (JSON)
│   │   └── summary.json         # Prefetch metadata
│   └── favicons/                # Favicon assets
├── scripts/
│   ├── prefetch-songs.js        # Song/artwork pre-fetcher
│   └── generate-apple-music-token.js
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── [artist]/            # Dynamic artist game pages
│   │   └── api/[artist]/        # Artist API routes
│   ├── components/
│   │   ├── game/                # Game components
│   │   ├── stats/               # Statistics components
│   │   └── ui/                  # Reusable UI components
│   ├── config/
│   │   ├── artists.ts           # Artist configurations
│   │   └── theme.ts             # Theme generation
│   └── lib/
│       ├── hooks/               # Custom React hooks
│       ├── services/            # Business logic
│       │   ├── appleMusicService.ts
│       │   ├── cachedDataService.ts
│       │   └── trackFilters.ts
│       └── utils/               # Utility functions
├── keys/                        # Apple Music API keys (gitignored)
└── docs/                        # Documentation
```

## 🔧 API Endpoints

### Artist-Specific Routes

- **`GET /api/[artist]/daily`** - Get today's daily challenge song
  - Query: `?date=YYYY-MM-DD` (optional)

- **`GET /api/[artist]/random`** - Get random song for practice mode
  - Query: `?exclude=trackId1,trackId2` (optional)

- **`GET /api/[artist]/songs`** - Get all songs for artist

- **`GET /api/[artist]/artwork`** - Get artist artwork URLs

## 🎵 Apple Music Integration

### Why Apple Music API?
- **Complete catalogs**: Full artist discographies including Japanese/Korean releases
- **High-quality previews**: 30-second AAC audio files
- **Artist artwork**: High-resolution artist images and banners
- **Multi-storefront**: Queries US, Japan, and Korea storefronts for complete coverage

### Track Filtering
Songs are filtered to ensure quality gameplay:
- Removes remixes, instrumentals, live versions
- Filters out non-English titles (Korean/Japanese characters)
- Removes intros, outros, skits, and interludes
- Deduplicates versions (keeps shortest/simplest)

## 🎨 Adding New Artists

1. **Add to configuration** in `src/config/artists.ts`:
```typescript
{ id: 'artist-slug', name: 'Artist Name', displayName: 'Display Name', searchTerms: ['Artist Name', '아티스트'] }
```

2. **Run prefetch** to generate data:
```bash
npm run prefetch
```

3. **Deploy** - Artist automatically appears with auto-generated theme

See [docs/ARTIST_CONFIGURATION.md](docs/ARTIST_CONFIGURATION.md) for detailed setup.

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Development server (Turbopack)
npm run build        # Production build
npm run build:full   # Prefetch + build
npm run prefetch     # Pre-fetch all artist data
npm run lint         # ESLint
npm start            # Production server
```

## 🐛 Troubleshooting

### Common Issues

**"No songs found" Error**
- Run `npm run prefetch` to generate song data
- Check that artist exists in `artists.ts`
- Verify Apple Music API token is valid

**Audio Not Playing**
- Check browser HTML5 audio support
- Some tracks may lack preview URLs
- Verify device audio permissions

**Missing Artist Images**
- Run `npm run prefetch` to fetch artwork
- Check network connectivity to Apple Music API

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Apple Inc.** for the Apple Music API
- **All K-pop artists** and their entertainment companies
- **Original Heardle** game for the concept inspiration
- **Next.js**, **Tailwind CSS**, and **Vercel** for the amazing tools

---

**Made with 💜 for the K-pop community** | [Live Demo](https://heardle.live) | [GitHub](https://github.com/retlocpeck/heardle)
