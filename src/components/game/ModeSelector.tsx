'use client';

import { GameMode } from '@/lib/game';
import { TabGroup, MODE_TABS } from '@/components/ui/TabGroup';

interface ModeSelectorProps {
  selectedMode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

export default function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
  return (
    <TabGroup
      options={MODE_TABS}
      value={selectedMode}
      onChange={onModeChange}
      variant="pink"
      className="mb-4 sm:mb-6"
    />
  );
}
