'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { getAllArtists, type ArtistConfig } from '@/config/artists';
import ArtistImage from '@/components/artist/ArtistImage';

interface RelatedArtistsProps {
  currentArtistId: string;
  maxArtists?: number;
}

// Artist categories based on the data structure
type ArtistCategory = 'girl-group' | 'boy-group' | 'solo' | 'special';

// Define category mappings for artists
const GIRL_GROUPS = new Set([
  'twice', 'blackpink', 'le-sserafim', 'itzy', 'aespa', 'newjeans', 'ive',
  'i-dle', 'red-velvet', 'dreamcatcher', 'everglow', 'stayc', 'kiss-of-life',
  'katseye', 'triples', 'babymonster', 'girls-generation', 'mamamoo', 'gfriend',
  'xg', 'ioi', 'izone', 'aoa', 'chung-ha', 'fromis-9', 'wjsn', 'loona',
  'weeekly', 'nmixx', 'kep1er', 'illit', 'tri-be', 'h1-key', 'billlie',
  'viviz', 'kara', 'clc', 'momoland', 'exid', 'oh-my-girl', 'apink',
  'sistar', '2ne1', 'wonder-girls', 'miss-a', 'fx', 't-ara', 'secret', '4minute'
]);

const BOY_GROUPS = new Set([
  'bts', 'stray-kids', 'seventeen', 'enhypen', 'tomorrow-x-together', 'ateez',
  'nct-127', 'nct-dream', 'nct-u', 'exo', 'bigbang', 'super-junior', 'shinee',
  'got7', 'monsta-x', 'nct', 'wayv', 'riize', 'treasure', 'the-boyz', 'ikon',
  'winner', 'day6', 'pentagon', 'sf9', 'oneus', 'onewe', 'verivery', 'cravity',
  'p1harmony', 'kard', 'astro', 'victon', 'ab6ix', 'cix', 'to1', 'tempest',
  'omega-x', 'xikers', 'zerobaseone', 'boynextdoor', 'tws', 'btob', 'highlight',
  'infinite', 'vixx', 'block-b', 'b1a4', 'teen-top', 'myname', 'nu-est', 'ukiss'
]);

const SOLO_ARTISTS = new Set([
  'iu', 'taeyeon', 'sunmi', 'hyuna', 'jessi', 'jeon-somi', 'yuqi', 'kwon-eunbi',
  'baekhyun', 'kai', 'taemin', 'g-dragon', 'taeyang', 'jay-park', 'dean', 'crush', 'zico'
]);

function getArtistCategory(artistId: string): ArtistCategory {
  if (GIRL_GROUPS.has(artistId)) return 'girl-group';
  if (BOY_GROUPS.has(artistId)) return 'boy-group';
  if (SOLO_ARTISTS.has(artistId)) return 'solo';
  return 'special';
}

/**
 * Get related artists based on same category, with featured artists as fallback
 */
function getRelatedArtists(
  currentArtistId: string,
  allArtists: ArtistConfig[],
  maxArtists: number
): ArtistConfig[] {
  const currentCategory = getArtistCategory(currentArtistId);
  
  // Get artists in the same category (excluding current)
  const sameCategoryArtists = allArtists.filter(
    artist => artist.id !== currentArtistId && getArtistCategory(artist.id) === currentCategory
  );
  
  // Prioritize featured artists from the same category
  const featuredSameCategory = sameCategoryArtists.filter(a => a.featured);
  const nonFeaturedSameCategory = sameCategoryArtists.filter(a => !a.featured);
  
  // Get featured artists from other categories as fallback
  const featuredOther = allArtists.filter(
    artist => artist.id !== currentArtistId && 
              artist.featured && 
              getArtistCategory(artist.id) !== currentCategory
  );
  
  // Combine and shuffle within each priority group
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  // Priority order: featured same category > non-featured same category > featured other
  const candidates = [
    ...shuffleArray(featuredSameCategory),
    ...shuffleArray(nonFeaturedSameCategory).slice(0, 3), // Limit non-featured to prevent too much randomness
    ...shuffleArray(featuredOther),
  ];
  
  return candidates.slice(0, maxArtists);
}

export default function RelatedArtists({ currentArtistId, maxArtists = 4 }: RelatedArtistsProps) {
  const relatedArtists = useMemo(() => {
    const allArtists = getAllArtists();
    return getRelatedArtists(currentArtistId, allArtists, maxArtists);
  }, [currentArtistId, maxArtists]);

  if (relatedArtists.length === 0) {
    return null;
  }

  return (
    <section className="relative z-10 mt-8 sm:mt-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">
          Try Other Artists
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {relatedArtists.map((artist) => (
            <Link
              key={artist.id}
              href={`/${artist.id}`}
              className={`group relative backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${
                artist.featured
                  ? 'bg-gradient-to-br from-amber-50/20 to-yellow-400/10 border-2 border-amber-400/60 shadow-lg shadow-amber-400/20'
                  : 'bg-white/10 border border-white/20 hover:bg-white/20'
              }`}
            >
              {/* Featured badge */}
              {artist.featured && (
                <div className="absolute left-2 top-2 z-20">
                  <div className="inline-flex items-center h-5 sm:h-6 rounded-full bg-yellow-400 text-black px-2 gap-1">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                  </div>
                </div>
              )}
              
              {/* Artist Image */}
              <div className="relative h-32 sm:h-40 overflow-hidden">
                <ArtistImage
                  artistId={artist.id}
                  alt={artist.displayName}
                  className="w-full h-full object-cover object-[center_30%] group-hover:scale-110 transition-transform duration-700"
                  width={300}
                  height={300}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              
              {/* Artist name */}
              <div className="p-2 sm:p-3">
                <div className={`text-sm sm:text-base font-semibold text-center ${
                  artist.featured ? 'text-amber-100' : 'text-white'
                }`}>
                  {artist.displayName}
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Link to all artists */}
        <div className="text-center mt-6 sm:mt-8">
          <Link
            href="/"
            className="inline-flex items-center text-white/60 hover:text-white text-sm transition-colors"
          >
            <span>View all artists</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
