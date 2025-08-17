export function getPuzzleNumber(now: Date = new Date()): number {
  const start = new Date(process.env.NEXT_PUBLIC_HEARDLE_START_DATE_UTC ?? '2025-08-17T00:00:00Z');
  const msPerDay = 86_400_000;
  const utcMidnight = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const days = Math.floor((utcMidnight(now).getTime() - utcMidnight(start).getTime()) / msPerDay);
  return days + 1;
}
