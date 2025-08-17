import { ITunesTrack } from '@/types/song';

export interface FilteredTrack {
  track: ITunesTrack;
  reason: string;
}

/**
 * Normalize song name for grouping (remove most parentheses content to group identical songs)
 */
function normalizeSongName(songName: string): string {
  return songName
    .replace(/\s*\(feat\.[^)]*\)/gi, '') // Remove (feat. ...) 
    .replace(/\s*\(with[^)]*\)/gi, '') // Remove (with ...) 
    .replace(/\s*\(acoustic\)/gi, '') // Remove (acoustic)
    .replace(/\s*\(instrumental\)/gi, '') // Remove (instrumental)
    .replace(/\s*\(piano ver\.\)/gi, '') // Remove (piano ver.)
    .replace(/\s*\(orchestra ver\.\)/gi, '') // Remove (orchestra ver.)
    .replace(/\s*\(live\)/gi, '') // Remove (live)
    .replace(/\s*\(demo\)/gi, '') // Remove (demo)
    .replace(/\s*\(remix\)/gi, '') // Remove (remix)
    .replace(/\s*\(edit\)/gi, '') // Remove (edit)
    .replace(/\s*\(single\)/gi, '') // Remove (single)
    .replace(/\s*\(ep\)/gi, '') // Remove (ep)
    .replace(/\s*\(album\)/gi, '') // Remove (album)
    .replace(/\s*\([^)]*\)/g, '') // Remove ALL remaining parentheses content
    .replace(/\s*:\s*/g, ': ') // Normalize colon spacing
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
 * Returns both the deduplicated tracks and the filtered out tracks
 */
export function deduplicateSongVersions(
  validTracks: ITunesTrack[], 
  filteredOutTracks: FilteredTrack[]
): { deduplicatedTracks: ITunesTrack[], filteredOutTracks: FilteredTrack[] } {
  // First, filter out unwanted versions (acoustic, instrumental, etc.)
  const filteredTracks = validTracks.filter(track => {
    const trackName = track.trackName?.toLowerCase() || '';
    
    // Filter out unwanted versions
    if (trackName.includes('(acoustic)') || 
        trackName.includes('(instrumental)') ||
        trackName.includes('(piano ver.)') ||
        trackName.includes('(orchestra ver.)') ||
        trackName.includes('(live)') ||
        trackName.includes('(demo)') ||
        trackName.includes('(remix)') ||
        trackName.includes('(edit)')) {
      
      filteredOutTracks.push({
        track,
        reason: `Filtered out unwanted version: ${track.trackName}`
      });
      return false;
    }
    
    return true;
  });
  
  // Group tracks by normalized song name (removing features, parentheses)
  const songGroups = new Map<string, ITunesTrack[]>();
  
  filteredTracks.forEach(track => {
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
  
  // Return both the deduplicated tracks and the filtered out tracks
  return { deduplicatedTracks, filteredOutTracks };
}
