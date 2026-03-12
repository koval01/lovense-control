'use client';

interface BatteryIndicatorProps {
  level: number;
  showPercent?: boolean;
  className?: string;
}

function clampBattery(level: number): number {
  if (!Number.isFinite(level)) return 0;
  return Math.max(0, Math.min(100, Math.round(level)));
}

export function BatteryIndicator({
  level,
  showPercent = false,
  className = '',
}: BatteryIndicatorProps) {
  const safeLevel = clampBattery(level);
  const fillLevel = safeLevel === 0 ? 0 : Math.max(8, safeLevel);
  const isCritical = safeLevel < 10;
  const isLow = safeLevel < 30;
  const fillClass = isCritical
    ? 'bg-rose-500 dark:bg-rose-400'
    : isLow
      ? 'bg-amber-500 dark:bg-amber-400'
      : 'bg-zinc-900 dark:bg-zinc-100';

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[var(--app-text-secondary)] ${className}`}
      role="img"
      aria-label={`Battery ${safeLevel}%`}
      title={`${safeLevel}%`}
    >
      <span className="inline-flex items-center">
        <span className="relative w-4 h-2.5 rounded-[3px] border border-current/70">
          <span
            className={`absolute left-[1px] top-[1px] bottom-[1px] rounded-[2px] ${fillClass} ${
              isCritical ? 'animate-pulse' : ''
            }`}
            style={{ width: `${fillLevel}%` }}
          />
        </span>
        <span className="w-[2px] h-1.5 rounded-r-[2px] bg-current/70 ml-[1px]" />
      </span>
      {showPercent ? <span className="tabular-nums">{safeLevel}%</span> : null}
    </span>
  );
}
