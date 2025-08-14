# K-Pop Heardle 🎵

A fun and challenging music guessing game featuring your favorite K-pop artists! Test your knowledge of K-pop discographies by guessing songs from short audio previews.

## Features

- **Multiple Artists**: Play with TWICE, LE SSERAFIM, and more coming soon!
- **Daily Challenges**: New song every day at midnight for each artist
- **Practice Mode**: Play unlimited games with random songs
- **Progressive Audio**: Start with 1 second, gradually increase to 15 seconds
- **Smart Autocomplete**: Search through each artist's entire catalog
- **Beautiful UI**: Modern, responsive design with artist-specific color themes

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
cd twice-heardle
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
twice-heardle/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   └── itunes/        # iTunes Search API endpoints
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main page
│   ├── components/             # React components
│   │   ├── AudioPlayer.tsx    # HTML5 audio player for previews
│   │   ├── GameBoard.tsx      # Game progress display
│   │   ├── GuessInput.tsx     # Guess input form
│   │   ├── ModeSelector.tsx   # Game mode selector
│   │   └── TWICEHeardle.tsx   # Main game component
│   └── lib/                   # Utility libraries
│       ├── gameLogic.ts       # Game logic and state
│       └── itunes.ts          # iTunes Search API service
├── public/                     # Static assets
└── package.json               # Dependencies and scripts
```

## How It Works

### Daily Challenge Mode
- Uses the current date as a seed for consistent song selection
- All users get the same song on the same day
- New song automatically selected at midnight

### Practice Mode
- Randomly selects songs from TWICE's iTunes catalog
- New song for each game
- Unlimited play sessions

### Audio Progression
- 1st try: 1 second
- 2nd try: 2 seconds
- 3rd try: 4 seconds
- 4th try: 8 seconds
- 5th try: 15 seconds
- 6th try: 15 seconds

## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **iTunes Search API** - Free music data and 30-second previews
- **HTML5 Audio API** - Native browser audio playback
- **React Hooks** - State management and side effects

## API Endpoints

- `GET /api/itunes/daily` - Get today's daily song
- `GET /api/itunes/random` - Get a random TWICE song
- `GET /api/itunes/songs` - Get all available TWICE songs

## iTunes Search API

This project uses Apple's free iTunes Search API which provides:

- **No API key required** - Completely free to use
- **30-second preview URLs** - High-quality audio previews
- **Rich metadata** - Song titles, albums, artists, artwork
- **Excellent K-pop coverage** - Including TWICE's full catalog
- **No rate limiting** - For reasonable usage patterns

### How It Works

1. **Automatic Search**: The app searches iTunes for TWICE tracks on first use
2. **Preview URLs**: Each track includes a 30-second preview URL
3. **Native Audio**: Uses HTML5 audio for reliable playback
4. **Caching**: Results are cached for better performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- TWICE and JYP Entertainment for the music
- Apple for the free iTunes Search API
- The Heardle game for inspiration

## Support

If you encounter any issues:

1. Check the browser console for error messages
2. Verify your internet connection can access iTunes
3. Check that the iTunes Search API is responding
4. Ensure your browser supports HTML5 audio

## Troubleshooting

### Common Issues:

1. **"No TWICE songs found"** - Check internet connection and iTunes API status
2. **Audio not playing** - Verify browser supports HTML5 audio and preview URLs are accessible
3. **Preview URLs not working** - Some tracks may not have previews available
4. **Search failures** - iTunes API may be temporarily unavailable

### Browser Compatibility:

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Mobile browsers**: Full support
