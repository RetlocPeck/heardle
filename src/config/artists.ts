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
  featured?: boolean;
}

export const ARTISTS: ArtistConfig[] = [
  // Featured artists will appear first in the list
  // To add more featured artists, simply set featured: true
  {
    id: 'twice',
    name: 'TWICE',
    displayName: 'TWICE',
    itunesArtistId: '1203816887',
    searchTerms: ['TWICE', '트와이스'],
    featured: true,
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
  },
  {
    id: 'kpop-demon-hunters',
    name: 'Kpop Demon Hunters',
    displayName: 'Kpop Demon Hunters',
    itunesArtistId: '1820264140',
    searchTerms: ['Kpop Demon Hunters', 'K-pop Demon Hunters'],
    theme: {
      primaryColor: 'red',
      gradientFrom: 'from-red-600',
      gradientTo: 'to-red-800',
      accentColor: 'bg-red-600 hover:bg-red-700',
      spinnerColor: 'border-red-500',
      borderColor: 'border-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800'
    },
    metadata: {
      imageUrl: '/groups/kpop-demon-hunters.jpg',
      songCount: 30,
      releaseYear: 2025
    }
  },
  {
    id: 'blackpink',
    name: 'BLACKPINK',
    displayName: 'BLACKPINK',
    itunesArtistId: '1141774019',
    searchTerms: ['BLACKPINK', '블랙핑크', 'Black Pink'],
    theme: {
      primaryColor: 'black',
      gradientFrom: 'from-gray-800',
      gradientTo: 'to-black',
      accentColor: 'bg-black hover:bg-gray-800',
      spinnerColor: 'border-gray-600',
      borderColor: 'border-gray-600',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-800'
    },
    metadata: {
      imageUrl: '/groups/blackpink.jpg',
      songCount: 60,
      releaseYear: 2016
    }
  },
  {
    id: 'aespa',
    name: 'aespa',
    displayName: 'aespa',
    itunesArtistId: '1540251304',
    searchTerms: ['aespa', '에스파', 'AESPA'],
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
      imageUrl: '/groups/aespa.jpg',
      songCount: 35,
      releaseYear: 2020
    }
  },
  {
    id: 'i-dle',
    name: 'i-dle',
    displayName: 'i-dle',
    itunesArtistId: '1378887586',
    searchTerms: ['i-dle', '아이들', 'idle', 'G-idle', '(G)-idle', 'GIDLE'],
    theme: {
      primaryColor: 'emerald',
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-teal-600',
      accentColor: 'bg-emerald-500 hover:bg-emerald-600',
      spinnerColor: 'border-emerald-400',
      borderColor: 'border-emerald-400',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-800'
    },
    metadata: {
      imageUrl: '/groups/i-dle.jpg',
      songCount: 45,
      releaseYear: 2018
    }
  },
  {
    id: 'dreamcatcher',
    name: 'Dreamcatcher',
    displayName: 'Dreamcatcher',
    itunesArtistId: '1194912387',
    searchTerms: ['Dreamcatcher', '드림캐쳐', 'Dream Catcher'],
    theme: {
      primaryColor: 'indigo',
      gradientFrom: 'from-indigo-600',
      gradientTo: 'to-purple-700',
      accentColor: 'bg-indigo-600 hover:bg-indigo-700',
      spinnerColor: 'border-indigo-500',
      borderColor: 'border-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-800'
    },
    metadata: {
      imageUrl: '/groups/dreamcatcher.jpg',
      songCount: 45,
      releaseYear: 2017
    }
  },
  {
    id: 'everglow',
    name: 'EVERGLOW',
    displayName: 'EVERGLOW',
    itunesArtistId: '1456576473',
    searchTerms: ['EVERGLOW', '에버글로우', 'Everglow'],
    theme: {
      primaryColor: 'fuchsia',
      gradientFrom: 'from-fuchsia-500',
      gradientTo: 'to-pink-600',
      accentColor: 'bg-fuchsia-500 hover:bg-fuchsia-600',
      spinnerColor: 'border-fuchsia-400',
      borderColor: 'border-fuchsia-400',
      bgColor: 'bg-fuchsia-50',
      textColor: 'text-fuchsia-800'
    },
    metadata: {
      imageUrl: '/groups/everglow.jpg',
      songCount: 35,
      releaseYear: 2019
    }
  },
  {
    id: 'newjeans',
    name: 'NewJeans',
    displayName: 'NewJeans',
    itunesArtistId: '1635469693',
    searchTerms: ['NewJeans', '뉴진스', 'New Jeans'],
    theme: {
      primaryColor: 'green',
      gradientFrom: 'from-green-500',
      gradientTo: 'to-emerald-600',
      accentColor: 'bg-green-500 hover:bg-green-600',
      spinnerColor: 'border-green-400',
      borderColor: 'border-green-400',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800'
    },
    metadata: {
      imageUrl: '/groups/newjeans.jpg',
      songCount: 25,
      releaseYear: 2022
    }
  },
  {
    id: 'ive',
    name: 'IVE',
    displayName: 'IVE',
    itunesArtistId: '1594159996',
    searchTerms: ['IVE', '아이브', 'Ive'],
    theme: {
      primaryColor: 'rose',
      gradientFrom: 'from-rose-500',
      gradientTo: 'to-pink-600',
      accentColor: 'bg-rose-500 hover:bg-rose-600',
      spinnerColor: 'border-rose-400',
      borderColor: 'border-rose-400',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-800'
    },
    metadata: {
      imageUrl: '/groups/ive.jpg',
      songCount: 30,
      releaseYear: 2021
    }
  },
  {
    id: 'katseye',
    name: 'KATSEYE',
    displayName: 'KATSEYE',
    itunesArtistId: '1754284416',
    searchTerms: ['KATSEYE', 'Katseye', 'katseye'],
    theme: {
      primaryColor: 'violet',
      gradientFrom: 'from-violet-500',
      gradientTo: 'to-purple-600',
      accentColor: 'bg-violet-500 hover:bg-violet-600',
      spinnerColor: 'border-violet-400',
      borderColor: 'border-violet-400',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-800'
    },
    metadata: {
      imageUrl: '/groups/katseye.jpg',
      songCount: 15,
      releaseYear: 2024
    }
  },
  {
    id: 'red-velvet',
    name: 'Red Velvet',
    displayName: 'Red Velvet',
    itunesArtistId: '906961899',
    searchTerms: ['Red Velvet', '레드벨벳', 'RedVelvet'],
    theme: {
      primaryColor: 'red',
      gradientFrom: 'from-red-500',
      gradientTo: 'to-pink-600',
      accentColor: 'bg-red-500 hover:bg-red-600',
      spinnerColor: 'border-red-400',
      borderColor: 'border-red-400',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800'
    },
    metadata: {
      imageUrl: '/groups/red-velvet.jpg',
      songCount: 80,
      releaseYear: 2014
    }
  },
  {
    id: 'p1harmony',
    name: 'P1Harmony',
    displayName: 'P1Harmony',
    itunesArtistId: '1536862708',
    searchTerms: ['P1Harmony', '피원하모니', 'P1 Harmony', 'P1H'],
    theme: {
      primaryColor: 'teal',
      gradientFrom: 'from-teal-500',
      gradientTo: 'to-cyan-600',
      accentColor: 'bg-teal-500 hover:bg-teal-600',
      spinnerColor: 'border-teal-400',
      borderColor: 'border-teal-400',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-800'
    },
    metadata: {
      imageUrl: '/groups/p1harmony.jpg',
      songCount: 45,
      releaseYear: 2020
    }
  },
  {
    id: 'ioi',
    name: 'I.O.I',
    displayName: 'I.O.I',
    itunesArtistId: '1110816583',
    searchTerms: ['I.O.I', '아이오아이', 'IOI', 'Ideal of Idol'],
    theme: {
      primaryColor: 'sky',
      gradientFrom: 'from-sky-500',
      gradientTo: 'to-blue-600',
      accentColor: 'bg-sky-500 hover:bg-sky-600',
      spinnerColor: 'border-sky-400',
      borderColor: 'border-sky-400',
      bgColor: 'bg-sky-50',
      textColor: 'text-sky-800'
    },
    metadata: {
      imageUrl: '/groups/ioi.jpg',
      songCount: 15,
      releaseYear: 2016
    }
  },
  {
    id: 'aoa',
    name: 'AOA',
    displayName: 'AOA',
    itunesArtistId: '1080563762',
    searchTerms: ['AOA', '에이오에이', 'Ace of Angels'],
    theme: {
      primaryColor: 'amber',
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-orange-600',
      accentColor: 'bg-amber-500 hover:bg-amber-600',
      spinnerColor: 'border-amber-400',
      borderColor: 'border-amber-400',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-800'
    },
    metadata: {
      imageUrl: '/groups/aoa.jpg',
      songCount: 60,
      releaseYear: 2012
    }
  },
  {
    id: 'ateez',
    name: 'ATEEZ',
    displayName: 'ATEEZ',
    itunesArtistId: '1439301205',
    searchTerms: ['ATEEZ', '에이티즈', 'Ateez'],
    theme: {
      primaryColor: 'slate',
      gradientFrom: 'from-slate-600',
      gradientTo: 'to-gray-700',
      accentColor: 'bg-slate-600 hover:bg-slate-700',
      spinnerColor: 'border-slate-500',
      borderColor: 'border-slate-500',
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-800'
    },
    metadata: {
      imageUrl: '/groups/ateez.jpg',
      songCount: 70,
      releaseYear: 2018
    }
  },
  {
    id: 'kard',
    name: 'KARD',
    displayName: 'KARD',
    itunesArtistId: '1215832588',
    searchTerms: ['KARD', '카드', 'K.A.R.D'],
    theme: {
      primaryColor: 'yellow',
      gradientFrom: 'from-yellow-500',
      gradientTo: 'to-amber-600',
      accentColor: 'bg-yellow-500 hover:bg-yellow-600',
      spinnerColor: 'border-yellow-400',
      borderColor: 'border-yellow-400',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800'
    },
    metadata: {
      imageUrl: '/groups/kard.jpg',
      songCount: 40,
      releaseYear: 2017
    }
  },
  {
    id: 'girls-generation',
    name: "Girls' Generation",
    displayName: "Girls' Generation",
    itunesArtistId: '357463500',
    searchTerms: ["Girls' Generation", '소녀시대', 'SNSD', 'GG', 'Soshi'],
    theme: {
      primaryColor: 'pink',
      gradientFrom: 'from-pink-400',
      gradientTo: 'to-rose-500',
      accentColor: 'bg-pink-400 hover:bg-pink-500',
      spinnerColor: 'border-pink-300',
      borderColor: 'border-pink-300',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-800'
    },
    metadata: {
      imageUrl: '/groups/girls-generation.jpg',
      songCount: 120,
      releaseYear: 2007
    }
  },
  {
    id: 'mamamoo',
    name: 'MAMAMOO',
    displayName: 'MAMAMOO',
    itunesArtistId: '818951094',
    searchTerms: ['MAMAMOO', '마마무', 'Mamamoo'],
    theme: {
      primaryColor: 'lime',
      gradientFrom: 'from-lime-500',
      gradientTo: 'to-green-600',
      accentColor: 'bg-lime-500 hover:bg-lime-600',
      spinnerColor: 'border-lime-400',
      borderColor: 'border-lime-400',
      bgColor: 'bg-lime-50',
      textColor: 'text-lime-800'
    },
    metadata: {
      imageUrl: '/groups/mamamoo.jpg',
      songCount: 80,
      releaseYear: 2014
    }
  },
  {
    id: 'stray-kids',
    name: 'Stray Kids',
    displayName: 'Stray Kids',
    itunesArtistId: '1304823362',
    searchTerms: ['Stray Kids', '스트레이 키즈', 'SKZ', 'StrayKids'],
    theme: {
      primaryColor: 'zinc',
      gradientFrom: 'from-zinc-600',
      gradientTo: 'to-slate-700',
      accentColor: 'bg-zinc-600 hover:bg-zinc-700',
      spinnerColor: 'border-zinc-500',
      borderColor: 'border-zinc-500',
      bgColor: 'bg-zinc-50',
      textColor: 'text-zinc-800'
    },
    metadata: {
      imageUrl: '/groups/stray-kids.jpg',
      songCount: 90,
      releaseYear: 2018
    }
  },
  {
    id: 'seventeen',
    name: 'SEVENTEEN',
    displayName: 'SEVENTEEN',
    itunesArtistId: '999644772',
    searchTerms: ['SEVENTEEN', '세븐틴', 'SVT', 'Seventeen'],
    theme: {
      primaryColor: 'rose',
      gradientFrom: 'from-rose-400',
      gradientTo: 'to-pink-500',
      accentColor: 'bg-rose-400 hover:bg-rose-500',
      spinnerColor: 'border-rose-300',
      borderColor: 'border-rose-300',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-800'
    },
    metadata: {
      imageUrl: '/groups/seventeen.jpg',
      songCount: 110,
      releaseYear: 2015
    }
  },
  {
    id: 'enhypen',
    name: 'ENHYPEN',
    displayName: 'ENHYPEN',
    itunesArtistId: '1541011620',
    searchTerms: ['ENHYPEN', '엔하이픈', 'Enhypen'],
    theme: {
      primaryColor: 'orange',
      gradientFrom: 'from-orange-400',
      gradientTo: 'to-red-500',
      accentColor: 'bg-orange-400 hover:bg-orange-500',
      spinnerColor: 'border-orange-300',
      borderColor: 'border-orange-300',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-800'
    },
    metadata: {
      imageUrl: '/groups/enhypen.jpg',
      songCount: 55,
      releaseYear: 2020
    }
  },
  {
    id: 'babymonster',
    name: 'BABYMONSTER',
    displayName: 'BABYMONSTER',
    itunesArtistId: '1715981813',
    searchTerms: ['BABYMONSTER', '베이비몬스터', 'Baby Monster', 'BMON'],
    theme: {
      primaryColor: 'emerald',
      gradientFrom: 'from-emerald-400',
      gradientTo: 'to-teal-500',
      accentColor: 'bg-emerald-400 hover:bg-emerald-500',
      spinnerColor: 'border-emerald-300',
      borderColor: 'border-emerald-300',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-800'
    },
    metadata: {
      imageUrl: '/groups/babymonster.jpg',
      songCount: 20,
      releaseYear: 2023
    }
  },
  {
    id: 'stayc',
    name: 'STAYC',
    displayName: 'STAYC',
    itunesArtistId: '1538881438',
    searchTerms: ['STAYC', '스테이씨', 'StayC'],
    theme: {
      primaryColor: 'cyan',
      gradientFrom: 'from-cyan-400',
      gradientTo: 'to-blue-500',
      accentColor: 'bg-cyan-400 hover:bg-cyan-500',
      spinnerColor: 'border-cyan-300',
      borderColor: 'border-cyan-300',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-800'
    },
    metadata: {
      imageUrl: '/groups/stayc.jpg',
      songCount: 35,
      releaseYear: 2020
    }
  },
  {
    id: 'kiss-of-life',
    name: 'KISS OF LIFE',
    displayName: 'KISS OF LIFE',
    itunesArtistId: '1694672936',
    searchTerms: ['KISS OF LIFE', '키스 오브 라이프', 'KOL', 'Kiss of Life'],
    theme: {
      primaryColor: 'purple',
      gradientFrom: 'from-purple-400',
      gradientTo: 'to-indigo-500',
      accentColor: 'bg-purple-400 hover:bg-purple-500',
      spinnerColor: 'border-purple-300',
      borderColor: 'border-purple-300',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-800'
    },
    metadata: {
      imageUrl: '/groups/kiss-of-life.jpg',
      songCount: 25,
      releaseYear: 2023
    }
  },
  {
    id: 'xg',
    name: 'XG',
    displayName: 'XG',
    itunesArtistId: '1609409493',
    searchTerms: ['XG', 'Xtraordinary Girls'],
    theme: {
      primaryColor: 'gray',
      gradientFrom: 'from-gray-500',
      gradientTo: 'to-slate-600',
      accentColor: 'bg-gray-500 hover:bg-gray-600',
      spinnerColor: 'border-gray-400',
      borderColor: 'border-gray-400',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-800'
    },
    metadata: {
      imageUrl: '/groups/xg.jpg',
      songCount: 20,
      releaseYear: 2022
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

export function getArtistsSorted(): ArtistConfig[] {
  return [...ARTISTS].sort((a, b) => {
    // Featured artists come first
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    
    // Then sort alphabetically by display name
    return a.displayName.localeCompare(b.displayName);
  });
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
  
  // featured property is optional, so no validation needed
  
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
  }
}

// Validate configurations when this module is imported
validateAllConfigurations();
