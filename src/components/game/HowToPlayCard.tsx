'use client';

import type { Song } from '@/types/song';
import { MAX_TRIES } from '@/lib/constants/game';

interface HowToPlayCardProps {
  artistDisplayName: string;
  availableSongs: Song[];
  currentSong: Song | null;
}

export default function HowToPlayCard({
  artistDisplayName,
  availableSongs,
  currentSong,
}: HowToPlayCardProps) {
  return (
    <>
      <h3 className="text-lg font-bold text-white mb-3 text-center">🎯 How to Play</h3>
      <ul className="space-y-2 text-white/80 text-sm mx-auto max-w-md">
        <li className="flex items-start space-x-2">
          <span className="text-pink-400 mt-0.5">🎵</span>
          <span>Listen to the song preview (starts with 1 second)</span>
        </li>
        <li className="flex items-start space-x-2">
          <span className="text-purple-400 mt-0.5">💭</span>
          <span>Guess the {artistDisplayName} song title or click Skip</span>
        </li>
        <li className="flex items-start space-x-2">
          <span className="text-indigo-400 mt-0.5">⏰</span>
          <span>Each wrong guess or skip gives you more time</span>
        </li>
        <li className="flex items-start space-x-2">
          <span className="text-rose-400 mt-0.5">🎯</span>
          <span>You have {MAX_TRIES} tries to get it right</span>
        </li>
        <li className="flex items-start space-x-2">
          <span className="text-cyan-400 mt-0.5">⏭️</span>
          <span>Use Skip to hear more before guessing</span>
        </li>
      </ul>

      {/* Warning: No autocomplete available */}
      {availableSongs.length === 0 && (
        <div className="mt-4 p-3 bg-blue-500/20 border border-blue-400/30 rounded-2xl">
          <p className="text-blue-200 text-sm">
            <strong>💡 Note:</strong> Song autocomplete is currently unavailable.
            You can still play by typing the exact song title manually!
          </p>
        </div>
      )}

      {/* Warning: No preview available */}
      {currentSong && !currentSong.previewUrl && (
        <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-2xl">
          <p className="text-yellow-200 text-sm">
            <strong>⚠️ Note:</strong> Song preview is not available for this track.
            You can still play by guessing the song title!
          </p>
        </div>
      )}
    </>
  );
}
