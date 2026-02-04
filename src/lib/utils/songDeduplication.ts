import type { FilteredTrack, GenericTrack } from '@/lib/services/trackFilters';

// Re-export for backward compatibility
export type { FilteredTrack };

/**
 * Get track name from either API format
 */
function getTrackName(track: GenericTrack): string {
  if ('trackName' in track) {
    return track.trackName || '';
  }
  if ('attributes' in track) {
    return track.attributes.name || '';
  }
  return '';
}

/**
 * Normalize song name for grouping (remove parentheses, normalize punctuation and spacing)
 */
function normalizeSongName(songName: string): string {
  return songName
    .replace(/\s*\([^)]*\)\s*/g, '') // Remove everything in parentheses
    .replace(/\s*\[[^\]]*\]\s*/g, '') // Remove everything in brackets
    .replace(/[,\.]\s*/g, ' ') // Replace commas and periods with spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .replace(/\s*-\s*/g, ' ') // Replace hyphens with spaces
    .replace(/\s*_\s*/g, ' ') // Replace underscores with spaces
    .replace(/\s*&\s*/g, ' and ') // Replace & with 'and'
    .replace(/\s*\+\s*/g, ' plus ') // Replace + with 'plus'
    .replace(/\bpt\.?\s*(\d+)\b/gi, 'part $1') // Normalize Pt.2, Pt 2, etc. to "part 2"
    .replace(/\bpart\s*(\d+)\b/gi, 'part $1') // Normalize Part 2, Part2, etc. to "part 2"
    .replace(/\bvol\.?\s*(\d+)\b/gi, 'volume $1') // Normalize Vol.2, Vol 2, etc. to "volume 2"
    .replace(/\bvolume\s*(\d+)\b/gi, 'volume $1') // Normalize Volume 2, Volume2, etc. to "volume 2"
    .replace(/\bno\.?\s*(\d+)\b/gi, 'number $1') // Normalize No.2, No 2, etc. to "number 2"
    .replace(/\bnumber\s*(\d+)\b/gi, 'number $1') // Normalize Number 2, Number2, etc. to "number 2"
    .trim()
    .toLowerCase();
}

/**
 * Score a song version for ranking (higher score = better/cleaner version)
 */
function scoreSongVersion(songName: string): number {
  let score = 100; // Base score
  
  // Heavy penalties for definite unwanted versions
  if (/\(.*soundtrack.*\)/i.test(songName)) score -= 50;
  if (/\(.*netflix.*\)/i.test(songName)) score -= 50;
  if (/\(.*film.*\)/i.test(songName)) score -= 45;
  if (/\(from.*\)/i.test(songName)) score -= 45;
  
  // Medium penalties for features and collaborations
  if (/\(feat\..*\)/i.test(songName)) score -= 30;
  if (/\(with.*\)/i.test(songName)) score -= 25;
  
  // Penalties for various unwanted patterns
  if (/\(.*remix.*\)/i.test(songName)) score -= 40;
  if (/\(.*version.*\)/i.test(songName)) score -= 35;
  if (/\(.*edit.*\)/i.test(songName)) score -= 30;
  if (/\(.*mix.*\)/i.test(songName)) score -= 35;
  if (/\(.*instrumental.*\)/i.test(songName)) score -= 40;
  if (/\(.*acoustic.*\)/i.test(songName)) score -= 30;
  if (/\(.*live.*\)/i.test(songName)) score -= 25;
  if (/\(.*demo.*\)/i.test(songName)) score -= 45;
  
  // Light penalties for other parentheses content
  if (/\(.*\)/i.test(songName)) score -= 10;
  
  // Penalties for brackets
  if (/\[.*\]/i.test(songName)) score -= 20;
  
  // Penalties for hyphens with unwanted content
  if (/-\s*(remix|version|edit|mix|instrumental|acoustic|live|demo)\s*-/i.test(songName)) score -= 30;
  
  // Bonus for clean versions (no parentheses, brackets, or unwanted hyphens)
  if (!/\(.*\)/.test(songName) && !/\[.*\]/.test(songName) && !/-\s*(remix|version|edit|mix|instrumental|acoustic|live|demo)\s*-/i.test(songName)) {
    score += 25;
  }
  
  // Bonus for shorter names (usually cleaner)
  if (songName.length < 20) score += 5;
  
  // Bonus for normalized punctuation (e.g., "part 2" instead of "pt.2")
  if (!/pt\.?\d+/i.test(songName) && !/vol\.?\d+/i.test(songName) && !/no\.?\d+/i.test(songName)) {
    score += 10;
  }
  
  return score;
}

/**
 * Deduplicate song versions and keep the best one from each group
 */
export function deduplicateSongVersions(
  validTracks: GenericTrack[], 
  filteredOutTracks: FilteredTrack[]
): GenericTrack[] {
  // Group tracks by normalized song name
  const songGroups = new Map<string, GenericTrack[]>();
  
  validTracks.forEach(track => {
    const normalizedName = normalizeSongName(getTrackName(track));
    if (!songGroups.has(normalizedName)) {
      songGroups.set(normalizedName, []);
    }
    songGroups.get(normalizedName)!.push(track);
  });
  
  const deduplicatedTracks: GenericTrack[] = [];
  let duplicatesRemoved = 0;
  
  // For each group, pick the best version
  songGroups.forEach((tracks) => {
    if (tracks.length === 1) {
      // Only one version, keep it
      deduplicatedTracks.push(tracks[0]);
    } else {
      // Multiple versions, score them and pick the best
      const scoredTracks = tracks.map(track => ({
        track,
        score: scoreSongVersion(getTrackName(track))
      }));
      
      // Sort by score (highest first)
      scoredTracks.sort((a, b) => b.score - a.score);
      
      // Keep the highest scored version
      const winner = scoredTracks[0];
      deduplicatedTracks.push(winner.track);
      
      // Add the rejected versions to filtered out tracks
      scoredTracks.slice(1).forEach(rejected => {
        const winnerName = getTrackName(winner.track);
        const reason = `Duplicate version (kept "${winnerName}" with score ${winner.score} over score ${rejected.score})`;
        filteredOutTracks.push({
          track: rejected.track,
          reason
        });
        duplicatesRemoved++;
      });
    }
  });
  
  if (duplicatesRemoved > 0) {
    // Log removed for monitoring purposes only
  }
  
  return deduplicatedTracks;
}
