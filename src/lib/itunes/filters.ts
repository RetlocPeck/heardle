import { FilterResult } from './types';
import { deduplicateSongVersions, FilteredTrack } from '@/lib/utils/songDeduplication';
import { ITunesTrack } from '@/types/song';

export class SongFilters {
  /**
   * Apply hard filtering rules to tracks
   */
  private applyHardFilters(tracks: ITunesTrack[]): FilterResult {
    const validTracks: ITunesTrack[] = [];
    const filteredOutTracks: FilteredTrack[] = [];

    tracks.forEach((track: ITunesTrack) => {
      const originalTrackName = track.trackName;
      const trackName = track.trackName?.toLowerCase() || '';
      const collectionName = track.collectionName?.toLowerCase() || '';
      
      // Check 1: Missing track name or preview URL
      if (!track.trackName || !track.previewUrl) {
        filteredOutTracks.push({ 
          track, 
          reason: `Missing ${!track.trackName ? 'track name' : 'preview URL'}` 
        });
        return;
      }
      
      // Check 2: Square brackets anywhere in the title
      if (/\[.*\]/.test(originalTrackName)) {
        filteredOutTracks.push({ 
          track, 
          reason: 'Contains square brackets [...]' 
        });
        return;
      }
      
      // Check 3: "ver." anywhere in the song name
      if (/ver\./i.test(originalTrackName)) {
        filteredOutTracks.push({ 
          track, 
          reason: 'Contains "ver." anywhere in title' 
        });
        return;
      }
      
      // Check 4: Unwanted words between hyphens - -
      const hyphenPattern = /-\s*(version|ver\.|japanese|kor|korean|english|eng|instrumental|inst\.|remix|mix|edit)\s*-/i;
      const hyphenMatch = hyphenPattern.exec(originalTrackName);
      if (hyphenMatch) {
        filteredOutTracks.push({ 
          track, 
          reason: `Contains "${hyphenMatch[1]}" between hyphens` 
        });
        return;
      }
      
      // Check 5: Unwanted patterns in parentheses or brackets (HARD FILTER)
      const unwantedPatterns = [
        'remix', 'version', 'ver\\.', 'edit', 'mixed', 'mix', 'instrumental', 'inst\\.',
        'japanese', 'korean', 'english', 'kor', 'eng', 'jap'
      ];
      
      let foundUnwantedPattern = false;
      let unwantedReason = '';
      
      for (const pattern of unwantedPatterns) {
        const inParentheses = new RegExp(`\\([^)]*${pattern}[^)]*\\)`, 'i');
        const inBrackets = new RegExp(`\\[[^\\]]*${pattern}[^\\]]*\\]`, 'i');
        
        if (inParentheses.test(trackName)) {
          foundUnwantedPattern = true;
          unwantedReason = `Contains "${pattern.replace('\\\\', '')}" in parentheses`;
          break;
        }
        
        if (inBrackets.test(trackName)) {
          foundUnwantedPattern = true;
          unwantedReason = `Contains "${pattern.replace('\\\\', '')}" in brackets`;
          break;
        }
      }
      
      if (foundUnwantedPattern) {
        filteredOutTracks.push({ 
          track, 
          reason: unwantedReason 
        });
        return;
      }
      
      // Check 6: Albums with remix in parentheses
      const hasRemixInAlbumParentheses = /\([^)]*remix[^)]*\)/i.test(collectionName);
      if (hasRemixInAlbumParentheses) {
        filteredOutTracks.push({ 
          track, 
          reason: 'Album contains "remix" in parentheses' 
        });
        return;
      }
      
      // If we get here, the track passed all hard filters
      validTracks.push(track);
    });

    return { valid: validTracks, filtered: filteredOutTracks };
  }

  /**
   * Apply smart deduplication to tracks
   */
  private applyDeduplication(validTracks: ITunesTrack[], filteredOutTracks: FilteredTrack[]): ITunesTrack[] {
    return deduplicateSongVersions(validTracks, filteredOutTracks);
  }

  /**
   * Remove duplicate tracks by ID (final safety check)
   */
  private removeDuplicateIds(tracks: ITunesTrack[]): ITunesTrack[] {
    return tracks.filter((track, index, self) =>
      index === self.findIndex(t => t.trackId === track.trackId)
    );
  }

  /**
   * Apply all filtering and deduplication steps
   */
  processTracks(tracks: ITunesTrack[]): FilterResult {
    // Step 1: Apply hard filtering
    const { valid: hardFiltered, filtered: hardFilteredOut } = this.applyHardFilters(tracks);
    
    // Step 2: Apply smart deduplication
    const deduplicatedTracks = this.applyDeduplication(hardFiltered, hardFilteredOut);
    
    // Step 3: Remove duplicate IDs
    const finalTracks = this.removeDuplicateIds(deduplicatedTracks);
    
    // Combine all filtered out tracks
    const allFilteredOut = [...hardFilteredOut];
    
    return {
      valid: finalTracks,
      filtered: allFilteredOut
    };
  }

  /**
   * Get filtering statistics
   */
  getFilterStats(originalCount: number, finalCount: number): {
    original: number;
    final: number;
    filtered: number;
    percentageKept: number;
  } {
    const filtered = originalCount - finalCount;
    const percentageKept = originalCount > 0 ? (finalCount / originalCount) * 100 : 0;
    
    return {
      original: originalCount,
      final: finalCount,
      filtered,
      percentageKept: Number(percentageKept.toFixed(1))
    };
  }
}
