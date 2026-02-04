'use client';

interface ProgressBarProps {
  /**
   * Current progress value (0-100)
   */
  progress: number;
  /**
   * Current time in seconds (for display)
   */
  currentTime?: number;
  /**
   * Total duration in seconds (for display)
   */
  totalDuration?: number;
  /**
   * Whether to show time labels
   */
  showLabels?: boolean;
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional class names
   */
  className?: string;
}

/**
 * Format time in seconds to MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const sizeClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

/**
 * Reusable progress bar component with gradient styling
 */
export function ProgressBar({
  progress,
  currentTime,
  totalDuration,
  showLabels = false,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className={`bg-white/20 rounded-full ${sizeClasses[size]} backdrop-blur-sm overflow-hidden`}>
        <div
          className={`bg-gradient-to-r from-pink-400 to-purple-500 ${sizeClasses[size]} rounded-full transition-all duration-75 ease-out shadow-lg`}
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
      {showLabels && currentTime !== undefined && totalDuration !== undefined && (
        <div className="flex justify-between text-xs sm:text-sm text-white/60 mt-2 font-medium tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      )}
    </div>
  );
}

export default ProgressBar;
