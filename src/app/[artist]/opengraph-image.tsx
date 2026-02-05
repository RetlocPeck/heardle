import { ImageResponse } from 'next/og';
import { getArtistById } from '@/config/artists';

// Image metadata
export const alt = 'K-Pop Heardle - Daily Music Guessing Game';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Map theme primary colors to gradient hex values
const colorGradients: Record<string, { from: string; to: string }> = {
  pink: { from: '#ec4899', to: '#e11d48' },
  purple: { from: '#a855f7', to: '#4f46e5' },
  blue: { from: '#3b82f6', to: '#06b6d4' },
  green: { from: '#22c55e', to: '#10b981' },
  orange: { from: '#f97316', to: '#dc2626' },
  rose: { from: '#f43f5e', to: '#ec4899' },
  violet: { from: '#8b5cf6', to: '#a855f7' },
  indigo: { from: '#4f46e5', to: '#7c3aed' },
  cyan: { from: '#06b6d4', to: '#3b82f6' },
  emerald: { from: '#10b981', to: '#14b8a6' },
  // Featured artist gold
  gold: { from: '#fbbf24', to: '#f59e0b' },
  // Default fallback
  default: { from: '#a855f7', to: '#ec4899' },
};

export default async function Image({
  params,
}: {
  params: Promise<{ artist: string }>;
}) {
  const { artist: artistId } = await params;
  const artist = getArtistById(artistId);

  if (!artist) {
    // Return a generic error image
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 72, color: 'white', fontWeight: 'bold' }}>
            K-Pop Heardle
          </div>
          <div style={{ fontSize: 36, color: 'rgba(255,255,255,0.8)', marginTop: 20 }}>
            Artist Not Found
          </div>
        </div>
      ),
      { ...size }
    );
  }

  // Get gradient colors based on theme or featured status
  const gradientColors = artist.featured
    ? colorGradients.gold
    : colorGradients[artist.theme.primaryColor] || colorGradients.default;

  return new ImageResponse(
    (
      <div
        style={{
          background: `linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #581c87 100%)`,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Decorative gradient circle */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${gradientColors.from}40, ${gradientColors.to}20)`,
            filter: 'blur(60px)',
          }}
        />

        {/* Content container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          {/* Featured badge */}
          {artist.featured && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#fbbf24',
                color: '#000',
                padding: '8px 20px',
                borderRadius: 50,
                fontSize: 24,
                fontWeight: 'bold',
                marginBottom: 24,
              }}
            >
              <span>★</span>
              <span>Featured Artist</span>
            </div>
          )}

          {/* Artist name */}
          <div
            style={{
              fontSize: 96,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.1,
              textShadow: '0 4px 30px rgba(0,0,0,0.5)',
            }}
          >
            {artist.displayName}
          </div>

          {/* Heardle text */}
          <div
            style={{
              fontSize: 56,
              fontWeight: 'bold',
              background: `linear-gradient(90deg, ${gradientColors.from}, ${gradientColors.to})`,
              backgroundClip: 'text',
              color: 'transparent',
              marginTop: 8,
            }}
          >
            Heardle
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              color: 'rgba(255,255,255,0.8)',
              marginTop: 24,
              textAlign: 'center',
            }}
          >
            {artist.fandom
              ? `Calling all ${artist.fandom}! Guess the song.`
              : 'Daily Music Guessing Game'}
          </div>

          {/* URL */}
          <div
            style={{
              fontSize: 24,
              color: 'rgba(255,255,255,0.5)',
              marginTop: 40,
            }}
          >
            heardle.live/{artistId}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
