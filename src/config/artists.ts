import { generateTheme } from './theme';

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

export interface ArtistConfig {
  id: string;
  name: string;
  displayName: string;
  searchTerms: string[];
  appleMusicArtistId?: string;
  theme: ArtistTheme;
  featured?: boolean;
}

// =============================================================================
// CUSTOM THEMES - For artists with specific brand colors
// =============================================================================

const CUSTOM_THEMES: Record<string, ArtistTheme> = {
  // TWICE - Apricot/Peach pink (official color)
  twice: {
    primaryColor: 'pink',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-rose-600',
    accentColor: 'bg-pink-500 hover:bg-pink-600',
    spinnerColor: 'border-pink-400',
    borderColor: 'border-pink-400',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-800'
  },
  // BTS - Purple (official ARMY color)
  bts: {
    primaryColor: 'purple',
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-indigo-700',
    accentColor: 'bg-purple-600 hover:bg-purple-700',
    spinnerColor: 'border-purple-400',
    borderColor: 'border-purple-400',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-800'
  },
  // BLACKPINK - Black/Pink (official colors)
  blackpink: {
    primaryColor: 'pink',
    gradientFrom: 'from-gray-800',
    gradientTo: 'to-pink-600',
    accentColor: 'bg-pink-600 hover:bg-pink-700',
    spinnerColor: 'border-pink-400',
    borderColor: 'border-pink-400',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-800'
  },
  // Red Velvet - Red & pastel colors
  'red-velvet': {
    primaryColor: 'red',
    gradientFrom: 'from-red-500',
    gradientTo: 'to-pink-600',
    accentColor: 'bg-red-500 hover:bg-red-600',
    spinnerColor: 'border-red-400',
    borderColor: 'border-red-400',
    bgColor: 'bg-red-50',
    textColor: 'text-red-800'
  },
  // Kpop Demon Hunters - Red/Dark (brand specific)
  'kpop-demon-hunters': {
    primaryColor: 'red',
    gradientFrom: 'from-red-600',
    gradientTo: 'to-red-800',
    accentColor: 'bg-red-600 hover:bg-red-700',
    spinnerColor: 'border-red-500',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-800'
  },
};

/**
 * Get theme for an artist - uses custom theme if defined, otherwise generates one
 */
function getTheme(id: string): ArtistTheme {
  return CUSTOM_THEMES[id] || generateTheme(id);
}

// =============================================================================
// ARTIST DATA - Simplified with auto-generated themes
// =============================================================================

type ArtistData = Omit<ArtistConfig, 'theme'>;

const ARTISTS_DATA: ArtistData[] = [
  // Featured Artists
  { id: 'twice', name: 'TWICE', displayName: 'TWICE', searchTerms: ['TWICE', '트와이스'], featured: true },
  { id: 'bts', name: 'BTS', displayName: 'BTS', searchTerms: ['BTS', '방탄소년단', 'Bangtan Boys'] },
  { id: 'blackpink', name: 'BLACKPINK', displayName: 'BLACKPINK', searchTerms: ['BLACKPINK', '블랙핑크'] },
  
  // Girl Groups
  { id: 'le-sserafim', name: 'LE SSERAFIM', displayName: 'LE SSERAFIM', searchTerms: ['LE SSERAFIM', '르세라핌'] },
  { id: 'itzy', name: 'ITZY', displayName: 'ITZY', searchTerms: ['ITZY', '있지'] },
  { id: 'aespa', name: 'aespa', displayName: 'aespa', searchTerms: ['aespa', '에스파', 'AESPA'] },
  { id: 'newjeans', name: 'NewJeans', displayName: 'NewJeans', searchTerms: ['NewJeans', '뉴진스'] },
  { id: 'ive', name: 'IVE', displayName: 'IVE', searchTerms: ['IVE', '아이브'] },
  { id: 'i-dle', name: 'i-dle', displayName: 'i-dle', searchTerms: ['i-dle', '아이들', 'G-idle', '(G)-idle'] },
  { id: 'red-velvet', name: 'Red Velvet', displayName: 'Red Velvet', searchTerms: ['Red Velvet', '레드벨벳'] },
  { id: 'dreamcatcher', name: 'Dreamcatcher', displayName: 'Dreamcatcher', searchTerms: ['Dreamcatcher', '드림캐쳐'] },
  { id: 'everglow', name: 'EVERGLOW', displayName: 'EVERGLOW', searchTerms: ['EVERGLOW', '에버글로우'] },
  { id: 'stayc', name: 'STAYC', displayName: 'STAYC', searchTerms: ['STAYC', '스테이씨'] },
  { id: 'kiss-of-life', name: 'KISS OF LIFE', displayName: 'KISS OF LIFE', searchTerms: ['KISS OF LIFE', '키스 오브 라이프'] },
  { id: 'katseye', name: 'KATSEYE', displayName: 'KATSEYE', searchTerms: ['KATSEYE'] },
  { id: 'triples', name: 'tripleS', displayName: 'tripleS', searchTerms: ['tripleS', 'triple S', '트리플에스'], appleMusicArtistId: '1651595986' },
  { id: 'babymonster', name: 'BABYMONSTER', displayName: 'BABYMONSTER', searchTerms: ['BABYMONSTER', '베이비몬스터'] },
  { id: 'girls-generation', name: "Girls' Generation", displayName: "Girls' Generation", searchTerms: ["Girls' Generation", '소녀시대', 'SNSD'], appleMusicArtistId: '357463500' },
  { id: 'mamamoo', name: 'MAMAMOO', displayName: 'MAMAMOO', searchTerms: ['MAMAMOO', '마마무'] },
  { id: 'gfriend', name: 'GFRIEND', displayName: 'GFRIEND', searchTerms: ['GFRIEND', '여자친구'] },
  { id: 'xg', name: 'XG', displayName: 'XG', searchTerms: ['XG', 'Xtraordinary Girls'] },
  { id: 'ioi', name: 'I.O.I', displayName: 'I.O.I', searchTerms: ['I.O.I', '아이오아이'] },
  { id: 'aoa', name: 'AOA', displayName: 'AOA', searchTerms: ['AOA', '에이오에이'] },
  { id: 'chung-ha', name: 'CHUNG HA', displayName: 'CHUNG HA', searchTerms: ['CHUNG HA', '청하'] },
  { id: 'fromis-9', name: 'fromis_9', displayName: 'fromis_9', searchTerms: ['fromis_9', '프로미스나인'] },
  { id: 'wjsn', name: 'WJSN', displayName: 'WJSN', searchTerms: ['WJSN', '우주소녀', 'Cosmic Girls'] },
  { id: 'loona', name: 'LOONA', displayName: 'LOONA', searchTerms: ['LOONA', '이달의 소녀'] },
  { id: 'weeekly', name: 'Weeekly', displayName: 'Weeekly', searchTerms: ['Weeekly', '위클리'] },
  { id: 'nmixx', name: 'NMIXX', displayName: 'NMIXX', searchTerms: ['NMIXX', '엔믹스'] },
  { id: 'kep1er', name: 'Kep1er', displayName: 'Kep1er', searchTerms: ['Kep1er', '케플러'] },
  { id: 'illit', name: 'ILLIT', displayName: 'ILLIT', searchTerms: ['ILLIT', '아일릿'] },
  { id: 'tri-be', name: 'TRI.BE', displayName: 'TRI.BE', searchTerms: ['TRI.BE', '트라이비'] },
  { id: 'h1-key', name: 'H1-KEY', displayName: 'H1-KEY', searchTerms: ['H1-KEY', '하이키'] },
  { id: 'billlie', name: 'Billlie', displayName: 'Billlie', searchTerms: ['Billlie', '빌리'] },
  { id: 'viviz', name: 'VIVIZ', displayName: 'VIVIZ', searchTerms: ['VIVIZ', '비비지'] },
  { id: 'kara', name: 'KARA', displayName: 'KARA', searchTerms: ['KARA', '카라'] },
  { id: 'clc', name: 'CLC', displayName: 'CLC', searchTerms: ['CLC', '씨엘씨'] },
  { id: 'momoland', name: 'MOMOLAND', displayName: 'MOMOLAND', searchTerms: ['MOMOLAND', '모모랜드'] },
  { id: 'exid', name: 'EXID', displayName: 'EXID', searchTerms: ['EXID', '이엑스아이디'] },
  { id: 'oh-my-girl', name: 'OH MY GIRL', displayName: 'OH MY GIRL', searchTerms: ['OH MY GIRL', '오마이걸'] },
  { id: 'apink', name: 'Apink', displayName: 'Apink', searchTerms: ['Apink', '에이핑크'] },
  { id: 'sistar', name: 'SISTAR', displayName: 'SISTAR', searchTerms: ['SISTAR', '씨스타'] },
  { id: '2ne1', name: '2NE1', displayName: '2NE1', searchTerms: ['2NE1', '투애니원'] },
  { id: 'wonder-girls', name: 'Wonder Girls', displayName: 'Wonder Girls', searchTerms: ['Wonder Girls', '원더걸스'] },
  { id: 'miss-a', name: 'miss A', displayName: 'miss A', searchTerms: ['miss A', '미쓰에이'] },
  { id: 'fx', name: 'f(x)', displayName: 'f(x)', searchTerms: ['f(x)', '에프엑스'] },
  { id: 't-ara', name: 'T-ara', displayName: 'T-ara', searchTerms: ['T-ara', '티아라'] },
  { id: 'secret', name: 'Secret', displayName: 'Secret', searchTerms: ['Secret', '시크릿'] },
  { id: '4minute', name: '4minute', displayName: '4minute', searchTerms: ['4minute', '포미닛'] },

  // Boy Groups
  { id: 'stray-kids', name: 'Stray Kids', displayName: 'Stray Kids', searchTerms: ['Stray Kids', '스트레이 키즈', 'SKZ'] },
  { id: 'seventeen', name: 'SEVENTEEN', displayName: 'SEVENTEEN', searchTerms: ['SEVENTEEN', '세븐틴', 'SVT'] },
  { id: 'enhypen', name: 'ENHYPEN', displayName: 'ENHYPEN', searchTerms: ['ENHYPEN', '엔하이픈'] },
  { id: 'tomorrow-x-together', name: 'TOMORROW X TOGETHER', displayName: 'TXT', searchTerms: ['TOMORROW X TOGETHER', '투모로우바이투게더', 'TXT'] },
  { id: 'ateez', name: 'ATEEZ', displayName: 'ATEEZ', searchTerms: ['ATEEZ', '에이티즈'] },
  { id: 'nct-127', name: 'NCT 127', displayName: 'NCT 127', searchTerms: ['NCT 127', '엔시티 127'] },
  { id: 'nct-dream', name: 'NCT DREAM', displayName: 'NCT DREAM', searchTerms: ['NCT DREAM', '엔시티 드림'] },
  { id: 'nct-u', name: 'NCT U', displayName: 'NCT U', searchTerms: ['NCT U', '엔시티 유'] },
  { id: 'exo', name: 'EXO', displayName: 'EXO', searchTerms: ['EXO', '엑소'] },
  { id: 'bigbang', name: 'BIGBANG', displayName: 'BIGBANG', searchTerms: ['BIGBANG', '빅뱅'] },
  { id: 'super-junior', name: 'Super Junior', displayName: 'Super Junior', searchTerms: ['Super Junior', '슈퍼주니어', 'SuJu'] },
  { id: 'shinee', name: 'SHINee', displayName: 'SHINee', searchTerms: ['SHINee', '샤이니'] },
  { id: 'got7', name: 'GOT7', displayName: 'GOT7', searchTerms: ['GOT7', '갓세븐'] },
  { id: 'monsta-x', name: 'MONSTA X', displayName: 'MONSTA X', searchTerms: ['MONSTA X', '몬스타엑스'] },
  { id: 'nct', name: 'NCT', displayName: 'NCT', searchTerms: ['NCT', '엔시티'] },
  { id: 'wayv', name: 'WayV', displayName: 'WayV', searchTerms: ['WayV', '웨이브이', '威神V'] },
  { id: 'riize', name: 'RIIZE', displayName: 'RIIZE', searchTerms: ['RIIZE', '라이즈'] },
  { id: 'treasure', name: 'TREASURE', displayName: 'TREASURE', searchTerms: ['TREASURE', '트레저'] },
  { id: 'the-boyz', name: 'THE BOYZ', displayName: 'THE BOYZ', searchTerms: ['THE BOYZ', '더보이즈'] },
  { id: 'ikon', name: 'iKON', displayName: 'iKON', searchTerms: ['iKON', '아이콘'] },
  { id: 'winner', name: 'WINNER', displayName: 'WINNER', searchTerms: ['WINNER', '위너'] },
  { id: 'day6', name: 'DAY6', displayName: 'DAY6', searchTerms: ['DAY6', '데이식스'] },
  { id: 'pentagon', name: 'PENTAGON', displayName: 'PENTAGON', searchTerms: ['PENTAGON', '펜타곤'] },
  { id: 'sf9', name: 'SF9', displayName: 'SF9', searchTerms: ['SF9', '에스에프나인'] },
  { id: 'oneus', name: 'ONEUS', displayName: 'ONEUS', searchTerms: ['ONEUS', '원어스'] },
  { id: 'onewe', name: 'ONEWE', displayName: 'ONEWE', searchTerms: ['ONEWE', '원위'] },
  { id: 'verivery', name: 'VERIVERY', displayName: 'VERIVERY', searchTerms: ['VERIVERY', '베리베리'] },
  { id: 'cravity', name: 'CRAVITY', displayName: 'CRAVITY', searchTerms: ['CRAVITY', '크래비티'] },
  { id: 'p1harmony', name: 'P1Harmony', displayName: 'P1Harmony', searchTerms: ['P1Harmony', '피원하모니'] },
  { id: 'kard', name: 'KARD', displayName: 'KARD', searchTerms: ['KARD', '카드'] },
  { id: 'astro', name: 'ASTRO', displayName: 'ASTRO', searchTerms: ['ASTRO', '아스트로'] },
  { id: 'victon', name: 'VICTON', displayName: 'VICTON', searchTerms: ['VICTON', '빅톤'] },
  { id: 'ab6ix', name: 'AB6IX', displayName: 'AB6IX', searchTerms: ['AB6IX', '에이비식스'] },
  { id: 'cix', name: 'CIX', displayName: 'CIX', searchTerms: ['CIX', '씨아이엑스'] },
  { id: 'to1', name: 'TO1', displayName: 'TO1', searchTerms: ['TO1', '티오원'] },
  { id: 'tempest', name: 'TEMPEST', displayName: 'TEMPEST', searchTerms: ['TEMPEST', '템페스트'] },
  { id: 'omega-x', name: 'OMEGA X', displayName: 'OMEGA X', searchTerms: ['OMEGA X', '오메가엑스'] },
  { id: 'xikers', name: 'xikers', displayName: 'xikers', searchTerms: ['xikers', '싸이커스'] },
  { id: 'zerobaseone', name: 'ZEROBASEONE', displayName: 'ZEROBASEONE', searchTerms: ['ZEROBASEONE', '제로베이스원', 'ZB1'] },
  { id: 'boynextdoor', name: 'BOYNEXTDOOR', displayName: 'BOYNEXTDOOR', searchTerms: ['BOYNEXTDOOR', '보이넥스트도어'] },
  { id: 'tws', name: 'TWS', displayName: 'TWS', searchTerms: ['TWS', '투어스'] },
  { id: 'btob', name: 'BTOB', displayName: 'BTOB', searchTerms: ['BTOB', '비투비'] },
  { id: 'highlight', name: 'Highlight', displayName: 'Highlight', searchTerms: ['Highlight', '하이라이트', 'BEAST', '비스트'] },
  { id: 'infinite', name: 'INFINITE', displayName: 'INFINITE', searchTerms: ['INFINITE', '인피니트'] },
  { id: 'vixx', name: 'VIXX', displayName: 'VIXX', searchTerms: ['VIXX', '빅스'] },
  { id: 'block-b', name: 'Block B', displayName: 'Block B', searchTerms: ['Block B', '블락비'] },
  { id: 'b1a4', name: 'B1A4', displayName: 'B1A4', searchTerms: ['B1A4', '비원에이포'] },
  { id: 'teen-top', name: 'TEEN TOP', displayName: 'TEEN TOP', searchTerms: ['TEEN TOP', '틴탑'] },
  { id: 'myname', name: 'MYNAME', displayName: 'MYNAME', searchTerms: ['MYNAME', '마이네임'] },
  { id: 'nu-est', name: "NU'EST", displayName: "NU'EST", searchTerms: ["NU'EST", '뉴이스트'] },
  // NOTE: Boyfriend removed - no playable songs available (empty cache file)
  // { id: 'boyfriend', name: 'Boyfriend', displayName: 'Boyfriend', searchTerms: ['Boyfriend', '보이프렌드'] },
  { id: 'ukiss', name: 'U-KISS', displayName: 'U-KISS', searchTerms: ['U-KISS', '유키스'] },

  // Solo Artists
  { id: 'iu', name: 'IU', displayName: 'IU', searchTerms: ['IU', '아이유', 'Lee Ji-eun'] },
  { id: 'taeyeon', name: 'Taeyeon', displayName: 'Taeyeon', searchTerms: ['Taeyeon', '태연'] },
  { id: 'sunmi', name: 'Sunmi', displayName: 'Sunmi', searchTerms: ['Sunmi', '선미'] },
  { id: 'hyuna', name: 'HyunA', displayName: 'HyunA', searchTerms: ['HyunA', '현아'] },
  { id: 'jessi', name: 'Jessi', displayName: 'Jessi', searchTerms: ['Jessi', '제시'] },
  { id: 'jeon-somi', name: 'Jeon Somi', displayName: 'SOMI', searchTerms: ['SOMI', '전소미', 'Jeon Somi'], appleMusicArtistId: '1218803768' },
  { id: 'yuqi', name: 'Yuqi', displayName: 'Yuqi', searchTerms: ['Yuqi', '우기', 'Song Yuqi'] },
  { id: 'kwon-eunbi', name: 'Kwon Eunbi', displayName: 'Kwon Eunbi', searchTerms: ['Kwon Eunbi', '권은비'] },
  { id: 'baekhyun', name: 'Baekhyun', displayName: 'Baekhyun', searchTerms: ['Baekhyun', '백현'] },
  { id: 'kai', name: 'KAI', displayName: 'KAI', searchTerms: ['KAI', '카이', 'Kim Jongin'] },
  { id: 'taemin', name: 'Taemin', displayName: 'Taemin', searchTerms: ['Taemin', '태민'] },
  { id: 'g-dragon', name: 'G-Dragon', displayName: 'G-Dragon', searchTerms: ['G-Dragon', '지드래곤', 'GD'] },
  { id: 'taeyang', name: 'Taeyang', displayName: 'Taeyang', searchTerms: ['Taeyang', '태양'] },
  { id: 'jay-park', name: 'Jay Park', displayName: 'Jay Park', searchTerms: ['Jay Park', '박재범'] },
  { id: 'dean', name: 'DEAN', displayName: 'DEAN', searchTerms: ['DEAN', '딘', 'Kwon Hyuk'] },
  { id: 'crush', name: 'Crush', displayName: 'Crush', searchTerms: ['Crush', '크러쉬'] },
  { id: 'zico', name: 'Zico', displayName: 'Zico', searchTerms: ['Zico', '지코'] },
  
  // Special
  { id: 'kpop-demon-hunters', name: 'Kpop Demon Hunters', displayName: 'Kpop Demon Hunters', searchTerms: ['Kpop Demon Hunters'] },
];

// =============================================================================
// EXPORTED ARTISTS ARRAY
// =============================================================================

export const ARTISTS: ArtistConfig[] = ARTISTS_DATA.map(artist => ({
  ...artist,
  theme: getTheme(artist.id),
}));

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getArtistById(id: string): ArtistConfig | null {
  return ARTISTS.find(a => a.id === id) || null;
}

export function getArtistByName(name: string): ArtistConfig | null {
  const lowerName = name.toLowerCase();
  return ARTISTS.find(a => 
    a.name.toLowerCase() === lowerName ||
    a.displayName.toLowerCase() === lowerName ||
    a.searchTerms.some(t => t.toLowerCase() === lowerName)
  ) || null;
}

export function getArtistsSorted(): ArtistConfig[] {
  return [...ARTISTS].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.displayName.localeCompare(b.displayName);
  });
}

export function getAllArtists(): ArtistConfig[] {
  return ARTISTS;
}

// =============================================================================
// VALIDATION (development only)
// =============================================================================

if (process.env.NODE_ENV === 'development') {
  const ids = new Set<string>();
  for (const artist of ARTISTS) {
    if (ids.has(artist.id)) {
      console.warn(`⚠️ Duplicate artist ID found: ${artist.id}`);
    }
    ids.add(artist.id);
    
    if (!artist.theme) {
      console.warn(`⚠️ Artist ${artist.id} has no theme`);
    }
  }
  console.log(`✅ Loaded ${ARTISTS.length} artists`);
}
