"use client";
import { useEffect, useMemo, useState } from "react";

function nextLocalMidnight(from: Date) {
  const d = new Date(from);
  d.setMilliseconds(0);
  d.setSeconds(0);
  d.setMinutes(0);
  d.setHours(0);
  if (d <= from) d.setDate(d.getDate() + 1);
  return d;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function NextDailyCountdown({
  onRollOver,
  className = "",
}: { onRollOver?: () => void; className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const target = useMemo(() => nextLocalMidnight(now), [now]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const msLeft = target.getTime() - now.getTime();
  const totalSec = Math.max(0, Math.floor(msLeft / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  useEffect(() => {
    if (mounted && totalSec === 0 && onRollOver) {
      onRollOver();
      // Add a subtle animation effect when rolling over
      const element = document.querySelector('[data-countdown]');
      if (element) {
        element.classList.add('animate-pulse');
        setTimeout(() => element.classList.remove('animate-pulse'), 1000);
      }
    }
  }, [mounted, totalSec, onRollOver]);

  // Reserve height to prevent layout shift
  return (
    <div className={`w-full flex items-center justify-center m-0 ${className}`}>
      <div
        data-countdown
        aria-live="polite"
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 shadow-sm backdrop-blur-sm
                   text-sm text-white/90 group hover:shadow-md transition-shadow duration-200"
      >
        <span className="mr-2 opacity-80">Next daily in</span>
        <span className="font-semibold tabular-nums tracking-wider text-white"
              suppressHydrationWarning>
          {mounted ? `${pad(h)}:${pad(m)}:${pad(s)}` : "––:––:––"}
        </span>
      </div>
    </div>
  );
}
