import { ITunesTrack } from '@/types/song';

export interface FilteredTrack {
  track: ITunesTrack;
  reason: string;
}

/**
 * Normalize song name for grouping (remove parentheses and extra whitespace)
 */
function normalizeSongName(songName: string): string {
  return songName
    .replace(/\s*\([^)]*\)\s*/g, '') // Remove everything in parentheses
    .replace(/\s+/g, ' ') // Normalize whitespace
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
  
  // Light penalties for other parentheses content
  if (/\(.*\)/i.test(songName)) score -= 10;
  
  // Bonus for clean versions (no parentheses at all)
  if (!/\(.*\)/.test(songName)) score += 20;
  
  // Bonus for shorter names (usually cleaner)
  if (songName.length < 20) score += 5;
  
  return score;
}

/**
 * Deduplicate song versions and keep the best one from each group
 */
export function deduplicateSongVersions(
  validTracks: ITunesTrack[], 
  filteredOutTracks: FilteredTrack[]
): ITunesTrack[] {
  // Group tracks by normalized song name
  const songGroups = new Map<string, ITunesTrack[]>();
  
  validTracks.forEach(track => {
    const normalizedName = normalizeSongName(track.trackName);
    if (!songGroups.has(normalizedName)) {
      songGroups.set(normalizedName, []);
    }
    songGroups.get(normalizedName)!.push(track);
  });
  
  const deduplicatedTracks: ITunesTrack[] = [];
  let duplicatesRemoved = 0;
  
  // For each group, pick the best version
  songGroups.forEach((tracks, normalizedName) => {
    if (tracks.length === 1) {
      // Only one version, keep it
      deduplicatedTracks.push(tracks[0]);
    } else {
      // Multiple versions, score them and pick the best
      const scoredTracks = tracks.map(track => ({
        track,
        score: scoreSongVersion(track.trackName)
      }));
      
      // Sort by score (highest first)
      scoredTracks.sort((a, b) => b.score - a.score);
      
      // Keep the highest scored version
      const winner = scoredTracks[0];
      deduplicatedTracks.push(winner.track);
      
      // Add the rejected versions to filtered out tracks
      scoredTracks.slice(1).forEach(rejected => {
        const reason = `Duplicate version (kept "${winner.track.trackName}" with score ${winner.score} over score ${rejected.score})`;
        filteredOutTracks.push({
          track: rejected.track,
          reason
        });
        duplicatesRemoved++;
      });
    }
  });
  
  if (duplicatesRemoved > 0) {
    console.log(`🔄 Deduplication: Removed ${duplicatesRemoved} duplicate versions, kept ${deduplicatedTracks.length} unique songs`);
  }
  
  return deduplicatedTracks;
}
