'use client';

import { GameMode } from '@/lib/gameLogic';

interface ModeSelectorProps {
  selectedMode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

export default function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="bg-white rounded-lg shadow-lg p-1 border border-gray-200">
        <div className="flex space-x-1">
          <button
            onClick={() => onModeChange('daily')}
            className={`
              px-6 py-3 rounded-md font-semibold transition-all duration-200
              ${selectedMode === 'daily'
                ? 'bg-pink-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            Daily Challenge
          </button>
          <button
            onClick={() => onModeChange('practice')}
            className={`
              px-6 py-3 rounded-md font-semibold transition-all duration-200
              ${selectedMode === 'practice'
                ? 'bg-pink-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            Practice Mode
          </button>
        </div>
      </div>
    </div>
  );
}

