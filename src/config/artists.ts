export interface ArtistTheme {
  primaryColor: string;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  spinnerColor: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
}

export interface ArtistMetadata {
  imageUrl: string;
  songCount: number;
  releaseYear: number;
}

export interface ArtistConfig {
  id: string;
  name: string;
  displayName: string;
  itunesArtistId: string;
  searchTerms: string[];
  theme: ArtistTheme;
  metadata: ArtistMetadata;
}

export const ARTISTS: ArtistConfig[] = [
  {
    id: 'twice',
    name: 'TWICE',
    displayName: 'TWICE',
    itunesArtistId: '1203816887',
    searchTerms: ['TWICE', '트와이스'],
    theme: {
      primaryColor: 'pink',
      gradientFrom: 'from-pink-500',
      gradientTo: 'to-rose-600',
      accentColor: 'bg-pink-500 hover:bg-pink-600',
      spinnerColor: 'border-pink-400',
      borderColor: 'border-pink-400',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-800'
    },
    metadata: {
      imageUrl: '/groups/twice.jpg',
      songCount: 100,
      releaseYear: 2015
    }
  },
  {
    id: 'le-sserafim',
    name: 'LE SSERAFIM',
    displayName: 'LE SSERAFIM',
    itunesArtistId: '1616740364',
    searchTerms: ['LE SSERAFIM', '르세라핌'],
    theme: {
      primaryColor: 'purple',
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-indigo-600',
      accentColor: 'bg-purple-500 hover:bg-purple-600',
      spinnerColor: 'border-purple-400',
      borderColor: 'border-purple-400',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-800'
    },
    metadata: {
      imageUrl: '/groups/lesserafim.jpg',
      songCount: 50,
      releaseYear: 2022
    }
  },
  {
    id: 'itzy',
    name: 'ITZY',
    displayName: 'ITZY',
    itunesArtistId: '1451964345',
    searchTerms: ['ITZY', '있지', 'itzy'],
    theme: {
      primaryColor: 'orange',
      gradientFrom: 'from-orange-500',
      gradientTo: 'to-red-600',
      accentColor: 'bg-orange-500 hover:bg-orange-600',
      spinnerColor: 'border-orange-400',
      borderColor: 'border-orange-400',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-800'
    },
    metadata: {
      imageUrl: '/groups/itzy.jpg',
      songCount: 40,
      releaseYear: 2019
    }
  },
  {
    id: 'bts',
    name: 'BTS',
    displayName: 'BTS',
    itunesArtistId: '883131348',
    searchTerms: ['BTS', '방탄소년단', 'Bangtan Boys', 'Beyond The Scene'],
    theme: {
      primaryColor: 'purple',
      gradientFrom: 'from-purple-600',
      gradientTo: 'to-blue-600',
      accentColor: 'bg-purple-600 hover:bg-purple-700',
      spinnerColor: 'border-purple-400',
      borderColor: 'border-purple-400',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-800'
    },
    metadata: {
      imageUrl: '/groups/bts.jpg',
      songCount: 150,
      releaseYear: 2013
    }
  }
];

// Helper functions for working with artist configurations
export function getArtistById(id: string): ArtistConfig | undefined {
  return ARTISTS.find(artist => artist.id === id);
}

export function getArtistByName(name: string): ArtistConfig | undefined {
  return ARTISTS.find(artist => 
    artist.name.toLowerCase() === name.toLowerCase() ||
    artist.displayName.toLowerCase() === name.toLowerCase()
  );
}

export function getAllArtistIds(): string[] {
  return ARTISTS.map(artist => artist.id);
}

export function isValidArtistId(id: string): boolean {
  return ARTISTS.some(artist => artist.id === id);
}

// Validation function to ensure configuration integrity
export function validateArtistConfig(config: ArtistConfig): string[] {
  const errors: string[] = [];
  
  if (!config.id || config.id.trim() === '') {
    errors.push('Artist ID is required');
  }
  
  if (!config.name || config.name.trim() === '') {
    errors.push('Artist name is required');
  }
  
  if (!config.itunesArtistId || config.itunesArtistId.trim() === '') {
    errors.push('iTunes Artist ID is required');
  }
  
  if (!config.searchTerms || config.searchTerms.length === 0) {
    errors.push('At least one search term is required');
  }
  
  // Validate theme properties
  const requiredThemeProps = ['primaryColor', 'gradientFrom', 'gradientTo', 'accentColor', 'spinnerColor', 'borderColor', 'bgColor', 'textColor'];
  for (const prop of requiredThemeProps) {
    if (!config.theme[prop as keyof ArtistTheme]) {
      errors.push(`Theme property '${prop}' is required`);
    }
  }
  
  // Validate metadata properties
  if (!config.metadata.imageUrl || config.metadata.imageUrl.trim() === '') {
    errors.push('Artist image URL is required');
  }
  
  if (typeof config.metadata.songCount !== 'number' || config.metadata.songCount <= 0) {
    errors.push('Song count must be a positive number');
  }
  
  if (typeof config.metadata.releaseYear !== 'number' || config.metadata.releaseYear < 1900 || config.metadata.releaseYear > new Date().getFullYear()) {
    errors.push('Release year must be a valid year');
  }
  
  return errors;
}

// Validate all artist configurations on module load
export function validateAllConfigurations(): void {
  const allErrors: { [artistId: string]: string[] } = {};
  
  for (const artist of ARTISTS) {
    const errors = validateArtistConfig(artist);
    if (errors.length > 0) {
      allErrors[artist.id] = errors;
    }
  }
  
  // Check for duplicate IDs
  const ids = ARTISTS.map(a => a.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    console.error('Duplicate artist IDs found:', duplicateIds);
  }
  
  if (Object.keys(allErrors).length > 0) {
    console.error('Artist configuration validation errors:', allErrors);
  } else {
    console.log(`✅ All ${ARTISTS.length} artist configurations are valid`);
  }
}

// Validate configurations when this module is imported
validateAllConfigurations();
