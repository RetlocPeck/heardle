import type { ArtistTheme } from './artists';

/**
 * Predefined color schemes for dynamic theme generation
 */
const COLOR_SCHEMES: ArtistTheme[] = [
  {
    primaryColor: 'pink',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-rose-600',
    accentColor: 'bg-pink-500 hover:bg-pink-600',
    spinnerColor: 'border-pink-400',
    borderColor: 'border-pink-400',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-800'
  },
  {
    primaryColor: 'purple',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-indigo-600',
    accentColor: 'bg-purple-500 hover:bg-purple-600',
    spinnerColor: 'border-purple-400',
    borderColor: 'border-purple-400',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-800'
  },
  {
    primaryColor: 'blue',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-600',
    accentColor: 'bg-blue-500 hover:bg-blue-600',
    spinnerColor: 'border-blue-400',
    borderColor: 'border-blue-400',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800'
  },
  {
    primaryColor: 'green',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-emerald-600',
    accentColor: 'bg-green-500 hover:bg-green-600',
    spinnerColor: 'border-green-400',
    borderColor: 'border-green-400',
    bgColor: 'bg-green-50',
    textColor: 'text-green-800'
  },
  {
    primaryColor: 'orange',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-red-600',
    accentColor: 'bg-orange-500 hover:bg-orange-600',
    spinnerColor: 'border-orange-400',
    borderColor: 'border-orange-400',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-800'
  },
  {
    primaryColor: 'rose',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-pink-600',
    accentColor: 'bg-rose-500 hover:bg-rose-600',
    spinnerColor: 'border-rose-400',
    borderColor: 'border-rose-400',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-800'
  },
  {
    primaryColor: 'violet',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-600',
    accentColor: 'bg-violet-500 hover:bg-violet-600',
    spinnerColor: 'border-violet-400',
    borderColor: 'border-violet-400',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-800'
  },
  {
    primaryColor: 'indigo',
    gradientFrom: 'from-indigo-600',
    gradientTo: 'to-purple-700',
    accentColor: 'bg-indigo-600 hover:bg-indigo-700',
    spinnerColor: 'border-indigo-500',
    borderColor: 'border-indigo-500',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-800'
  },
  {
    primaryColor: 'cyan',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-blue-600',
    accentColor: 'bg-cyan-500 hover:bg-cyan-600',
    spinnerColor: 'border-cyan-400',
    borderColor: 'border-cyan-400',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-800'
  },
  {
    primaryColor: 'emerald',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-600',
    accentColor: 'bg-emerald-500 hover:bg-emerald-600',
    spinnerColor: 'border-emerald-400',
    borderColor: 'border-emerald-400',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-800'
  },
];

/**
 * Generate a deterministic theme based on artist ID
 * Same artist ID always gets the same theme
 */
export function generateTheme(artistId: string): ArtistTheme {
  // Simple hash function for deterministic selection
  let hash = 0;
  for (let i = 0; i < artistId.length; i++) {
    const char = artistId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % COLOR_SCHEMES.length;
  return COLOR_SCHEMES[index];
}

/**
 * Get theme for an artist, using custom theme if provided, otherwise generating one
 */
export function getArtistTheme(artistId: string, customTheme?: ArtistTheme): ArtistTheme {
  return customTheme || generateTheme(artistId);
}
