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
- **Artist-Specific Themes**: Each artist has unique color schemes and styling
- **Responsive Design**: Optimized for all devices with mobile-first approach
- **Dark Theme**: Elegant dark interface with smooth animations
- **Custom Audio Player**: Modern controls with progress visualization

### 📊 Statistics & Sharing
- **Game Statistics**: Track your performance and accuracy over time
- **Share Results**: Share your daily challenge results with friends
- **Local Storage**: Persistent game state and statistics
- **Daily Rollover**: Automatic detection of new daily challenges

### 🌐 Multi-Artist Support
Currently featuring **32+ K-pop artists** including:
- **TWICE** (Featured) - 2015 debut, known for catchy pop hits
- **LE SSERAFIM** - 2022 debut, self-assured dance-pop
- **BTS** - Global superstars with diverse discography
- **BLACKPINK** - Powerful concepts and international hits
- **NewJeans** - Y2K-inspired minimalist pop
- **IVE** - Royal teen crush concept
- **aespa** - AI-concept and experimental sounds
- **Red Velvet** - Dual concept: red (pop) and velvet (R&B)
- **ITZY** - Teen crush with empowering messages
- **Girls' Generation (SNSD)** - Legendary girl group pioneers
- **SEVENTEEN** - Self-producing idols with diverse music
- **Stray Kids** - Hard-hitting hip-hop and EDM fusion
- **ENHYPEN** - Dark, mysterious vampire-themed concepts
- **TOMORROW X TOGETHER (TXT)** - Dreamy pop-rock storytelling
- And many more including ATEEZ, MAMAMOO, Dreamcatcher, KARD, P1Harmony, and rising groups like BABYMONSTER, KATSEYE, KISS OF LIFE

## 🎯 How to Play

1. **Choose Your Artist**: Select from 32+ K-pop artists on the homepage
2. **Pick Your Mode**: Daily Challenge (one song per day) or Practice Mode (unlimited)
3. **Listen & Guess**: Start with 1 second of audio, guess the song title
4. **Progressive Reveals**: Each wrong guess or skip gives you more audio time
5. **Win Condition**: Guess correctly within 6 tries to win
6. **Share Results**: Share your daily challenge performance with friends

### Audio Progression System
- **Try 1**: 1 second
- **Try 2**: 2 seconds  
- **Try 3**: 4 seconds
- **Try 4**: 7 seconds
- **Try 5**: 10 seconds
- **Try 6**: 15 seconds (final chance)

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** and npm
- **Internet connection** for iTunes Search API
- **Modern browser** with HTML5 audio support

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/twice-heardle.git
cd twice-heardle
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm run dev
```

4. **Open in browser**
Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production
```bash
npm run build
npm start
```

## 🏗️ Project Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS 4 with custom glassmorphism components
- **Audio**: HTML5 Audio API with custom controls
- **Data Source**: iTunes Search API (free, no API key required)
- **Analytics**: Vercel Analytics for performance monitoring
- **Fonts**: Geist Sans and Geist Mono for modern typography

### Project Structure
```
twice-heardle/
├── public/                          # Static assets
│   ├── groups/                      # Artist photos (32+ images)
│   ├── favicon.svg                  # Custom musical note favicon
│   ├── site.webmanifest            # PWA manifest
│   └── og-image.png                # Social media sharing image
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── [artist]/              # Dynamic artist pages
│   │   │   └── page.tsx           # Artist-specific game interface
│   │   ├── api/                   # API Routes
│   │   │   └── [artist]/          # Artist-specific endpoints
│   │   │       ├── daily/         # Daily challenge API
│   │   │       ├── random/        # Random song API
│   │   │       └── songs/         # Song catalog API
│   │   ├── (demo)/               # Demo pages
│   │   │   └── stats-demo/       # Statistics demonstration
│   │   ├── globals.css           # Global styles & animations
│   │   ├── layout.tsx            # Root layout with SEO metadata
│   │   └── page.tsx              # Homepage with artist grid
│   ├── components/                # React Components
│   │   ├── ui/                   # Reusable UI components
│   │   ├── stats/                # Statistics components
│   │   ├── AudioPlayer.tsx       # Custom audio player with glassmorphism
│   │   ├── DynamicHeardle.tsx    # Main game component (639 lines)
│   │   ├── GameBoard.tsx         # Game progress visualization
│   │   ├── GuessInput.tsx        # Smart autocomplete input
│   │   ├── ModeSelector.tsx      # Daily/Practice mode toggle
│   │   ├── ShareButton.tsx       # Social sharing functionality
│   │   └── Statistics.tsx        # Game statistics tracking
│   ├── config/                   # Configuration
│   │   └── artists.ts            # Artist configurations (880+ lines)
│   ├── lib/                      # Core Libraries
│   │   ├── cache/                # Caching utilities
│   │   ├── features/             # Feature flags and configs
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # Business logic services
│   │   ├── utils/                # Utility functions
│   │   ├── gameLogic.ts          # Core game state machine
│   │   └── itunes.ts             # iTunes Search API integration
│   ├── types/                    # TypeScript type definitions
│   │   └── song.ts               # Song and iTunes API types
│   └── utils/                    # Additional utilities
│       └── share.ts              # Social sharing utilities
├── reports/                      # Generated reports
├── ARTIST_CONFIGURATION.md       # Artist setup guide
├── TIMEZONE_FIX_SUMMARY.md      # Timezone handling documentation
└── package.json                 # Dependencies and scripts
```

## 🔧 API Endpoints

### Artist-Specific Routes
All endpoints support dynamic artist routing:

- **`GET /api/[artist]/daily`** - Get today's daily challenge song
  - Query: `?date=YYYY-MM-DD` (optional, for timezone handling)
  - Returns: Song object with preview URL and metadata

- **`GET /api/[artist]/random`** - Get random song for practice mode
  - Query: `?exclude=trackId1,trackId2` (optional, to avoid repeats)
  - Returns: Random song excluding specified track IDs

- **`GET /api/[artist]/songs`** - Get all available songs for artist
  - Returns: Array of all songs in artist's catalog

### Available Artist IDs
`twice`, `le-sserafim`, `bts`, `blackpink`, `newjeans`, `ive`, `aespa`, `itzy`, `red-velvet`, `girls-generation`, `seventeen`, `stray-kids`, `enhypen`, `tomorrow-x-together`, `dreamcatcher`, `mamamoo`, `ateez`, `kard`, `p1harmony`, and more...

## 🎵 iTunes Integration

### Why iTunes Search API?
- **Completely free** - No API keys or rate limits
- **High-quality previews** - 30-second AAC audio files
- **Comprehensive metadata** - Song titles, albums, artwork, duration
- **Excellent K-pop coverage** - Includes major labels and indie artists
- **Real-time data** - Always up-to-date with latest releases

### How It Works
1. **Artist Search**: Queries iTunes using artist ID and search terms
2. **Song Filtering**: Deduplicates versions (clean, explicit, remixes)
3. **Preview URLs**: Streams 30-second previews via HTML5 audio
4. **Caching**: Local storage reduces API calls and improves performance
5. **Fallback Handling**: Graceful degradation when previews unavailable

### Data Processing Pipeline
```
iTunes API → Song Deduplication → Local Cache → Game Logic → Audio Player
```

## 🎨 Adding New Artists

### Quick Setup (5 minutes)
1. **Get iTunes Artist ID**: Search [iTunes API](https://itunes.apple.com/search?term=ARTIST_NAME&entity=song&limit=1)
2. **Add to Configuration**: Edit `src/config/artists.ts` with artist details
3. **Add Artist Image**: Place square image in `public/groups/artist-name.jpg`
4. **Test**: Artist automatically appears on homepage with full functionality

### Configuration Example
```typescript
{
  id: 'artist-slug',
  name: 'ARTIST NAME',
  displayName: 'Artist Name',
  itunesArtistId: '1234567890',
  searchTerms: ['Artist Name', '아티스트명'],
  theme: {
    primaryColor: 'blue',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-600',
    // ... (full theme configuration)
  },
  metadata: {
    imageUrl: '/groups/artist-name.jpg',
    songCount: 50,
    releaseYear: 2020
  }
}
```

See [ARTIST_CONFIGURATION.md](ARTIST_CONFIGURATION.md) for detailed setup guide.

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build production application
npm start           # Start production server
npm run lint        # Run ESLint for code quality
```

### Development Tools
- **Next.js 15**: Latest features including Turbopack for fast dev server
- **TypeScript**: Strict type checking for reliability
- **ESLint**: Code quality and consistency enforcement
- **Tailwind CSS**: Utility-first styling with custom configurations

## 🐛 Troubleshooting

### Common Issues

**"No songs found" Error**
- Check internet connection stability
- Verify iTunes Search API availability
- Confirm artist ID is correct in configuration

**Audio Not Playing**
- Ensure browser supports HTML5 audio
- Check if preview URLs are accessible (some tracks lack previews)
- Verify device audio settings and permissions

**Game State Issues**
- Clear browser local storage to reset game data
- Check for JavaScript errors in browser console
- Ensure cookies/storage are enabled

**Artist Images Missing**
- Verify image files exist in `public/groups/` directory
- Check image file format (JPG, PNG, WebP supported)
- Ensure correct image path in artist configuration

### Browser Compatibility
- **Chrome/Edge**: ✅ Full support with all features
- **Firefox**: ✅ Full support with all features
- **Safari**: ✅ Full support (may require user gesture for audio)
- **Mobile Safari**: ✅ Optimized for iOS with touch controls
- **Android Chrome**: ✅ Full mobile experience

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

### Music & Artists
- All featured K-pop artists and their respective entertainment companies
- **JYP Entertainment** (TWICE), **Source Music/HYBE** (LE SSERAFIM)
- **SM Entertainment** (aespa, Red Velvet, Girls' Generation)
- **YG Entertainment** (BLACKPINK), **ADOR/HYBE** (NewJeans)
- And all other amazing K-pop artists featured in the game

### Technical Resources
- **Apple Inc.** for the free iTunes Search API
- **Vercel** for hosting and analytics platform
- **Next.js Team** for the incredible React framework
- **Tailwind Labs** for the utility-first CSS framework

### Inspiration
- **Original Heardle** game for the core concept
- **K-pop community** for endless musical inspiration and support
- **Web audio pioneers** for HTML5 audio innovations

## 🌟 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Adding new artists (most common contribution)
- Bug fixes and performance improvements
- UI/UX enhancements
- Feature requests and ideas

### Quick Contribution Guide
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📞 Support

For support, feature requests, or bug reports:

1. **Check existing issues** on GitHub
2. **Search documentation** for common solutions
3. **Create new issue** with detailed description
4. **Join discussions** for community support

---

**Made with 💜 for the K-pop community** | [Live Demo](https://heardle.live) | [GitHub](https://github.com/yourusername/twice-heardle)
