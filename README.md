# K-Pop Heardle 🎵

A stunning music guessing game featuring your favorite K-pop artists! Test your knowledge of K-pop discographies by guessing songs from short audio previews.

## ✨ Features

- **Multiple Artists**: Play with TWICE, LE SSERAFIM, and more coming soon!
- **Daily Challenges**: New song every day at midnight for each artist
- **Practice Mode**: Play unlimited games with random songs
- **Progressive Audio**: Start with 1 second, gradually increase to 15 seconds
- **Smart Autocomplete**: Search through each artist's entire catalog
- **Modern Design**: Beautiful glassmorphism UI with dark theme, gradients, and smooth animations
- **Responsive**: Looks amazing on all devices with mobile-first design

## Available Artists

### 🎀 TWICE
- **Debut**: 2015
- **Genre**: K-Pop
- **Known for**: Catchy songs and energetic performances
- **Popular tracks**: Fancy, Feel Special, More & More, I CAN'T STOP ME

### 💜 LE SSERAFIM
- **Debut**: 2022
- **Genre**: K-Pop
- **Known for**: Self-assured, bass-heavy dance-pop
- **Popular tracks**: ANTIFRAGILE, UNFORGIVEN, EASY, CRAZY, HOT

## How to Play

1. Choose your favorite artist from the home menu
2. Select Daily Challenge or Practice Mode
3. Listen to the song preview (starts with 1 second)
4. Guess the song title or click Skip to hear more
5. Each wrong guess or skip gives you more time to listen
6. You have 6 tries to get it right
7. Use Skip if you want to hear more before guessing

## Game Modes

- **Daily Mode**: One song per day per artist, same for everyone
- **Practice Mode**: Unlimited random songs for practice

## Coming Soon

We're working on adding more K-pop artists to expand your Heardle experience:
- NewJeans
- IVE
- aespa
- ITZY
- Red Velvet
- And many more!

## Prerequisites

- Node.js 18+ and npm
- Internet connection (for iTunes Search API)

## Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd heardle
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
heardle/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── [artist]/          # Dynamic artist pages
│   │   │   └── page.tsx       # Individual artist game page
│   │   ├── api/               # API routes
│   │   │   ├── [artist]/      # Artist-specific API endpoints
│   │   │   │   ├── daily/     # Daily challenge endpoints
│   │   │   │   ├── random/    # Random song endpoints
│   │   │   │   └── songs/     # Artist song catalog
│   │   │   └── itunes/        # iTunes Search API endpoints
│   │   ├── globals.css        # Global styles with animations
│   │   ├── layout.tsx         # Root layout with metadata
│   │   └── page.tsx           # Homepage with artist selection
│   ├── components/             # React components
│   │   ├── AudioPlayer.tsx    # Modern audio player with glassmorphism
│   │   ├── DynamicHeardle.tsx # Dynamic game component for any artist
│   │   ├── GameBoard.tsx      # Game progress display
│   │   ├── GuessInput.tsx     # Guess input with autocomplete
│   │   └── ModeSelector.tsx   # Game mode selector
│   └── lib/                   # Utility libraries
│       ├── gameLogic.ts       # Game logic and state management
│       └── itunes.ts          # iTunes Search API service
├── public/                     # Static assets
│   └── groups/                # Artist group photos
│       ├── twice.jpg          # TWICE group photo
│       └── lesserafim.jpg     # LE SSERAFIM group photo
├── .github/                    # GitHub templates
│   └── pull_request_template.md
└── package.json               # Dependencies and scripts
```

## How It Works

### Daily Challenge Mode
- Uses the current date as a seed for consistent song selection
- All users get the same song on the same day
- New song automatically selected at midnight

### Practice Mode
- Randomly selects songs from the artist's iTunes catalog
- New song for each game
- Unlimited play sessions

### Audio Progression
- 1st try: 1 second
- 2nd try: 2 seconds
- 3rd try: 4 seconds
- 4th try: 7 seconds
- 5th try: 10 seconds
- 6th try: 15 seconds

## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Modern utility-first CSS framework
- **Glassmorphism Design** - Modern UI with backdrop blur effects
- **CSS Animations** - Custom keyframe animations and transitions
- **iTunes Search API** - Free music data and 30-second previews
- **HTML5 Audio API** - Native browser audio playback
- **React Hooks** - State management and side effects

## API Endpoints

### Artist-Specific Endpoints
- `GET /api/[artist]/daily` - Get today's daily song for specific artist
- `GET /api/[artist]/random` - Get a random song for specific artist  
- `GET /api/[artist]/songs` - Get all available songs for specific artist

### General iTunes Endpoints
- `GET /api/itunes/daily` - Legacy iTunes daily endpoint
- `GET /api/itunes/random` - Legacy iTunes random endpoint
- `GET /api/itunes/songs` - Legacy iTunes songs endpoint

Available artists: `twice`, `le-sserafim`

## iTunes Search API

This project uses Apple's free iTunes Search API which provides:

- **No API key required** - Completely free to use
- **30-second preview URLs** - High-quality audio previews
- **Rich metadata** - Song titles, albums, artists, artwork
- **Excellent K-pop coverage** - Including TWICE's full catalog
- **No rate limiting** - For reasonable usage patterns

### How It Works

1. **Automatic Search**: The app searches iTunes for artist tracks on first use
2. **Preview URLs**: Each track includes a 30-second preview URL
3. **Native Audio**: Uses HTML5 audio for reliable playback with custom controls
4. **Caching**: Results are cached for better performance
5. **Multi-Artist Support**: Dynamic routing supports multiple K-pop artists

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- TWICE (JYP Entertainment) and LE SSERAFIM (Source Music/HYBE) for the music
- Apple for the free iTunes Search API
- The original Heardle game for inspiration
- K-pop community for endless musical inspiration

## Support

If you encounter any issues:

1. Check the browser console for error messages
2. Verify your internet connection can access iTunes
3. Check that the iTunes Search API is responding
4. Ensure your browser supports HTML5 audio

## Troubleshooting

### Common Issues:

1. **"No songs found"** - Check internet connection and iTunes API status
2. **Audio not playing** - Verify browser supports HTML5 audio and preview URLs are accessible
3. **Preview URLs not working** - Some tracks may not have previews available
4. **Search failures** - iTunes API may be temporarily unavailable
5. **Artist photos not loading** - Ensure group photos are in `public/groups/` folder

### Browser Compatibility:

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Mobile browsers**: Full support
