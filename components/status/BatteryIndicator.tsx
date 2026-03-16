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
  const fillLevel = safeLevel === 0 ? 0 : Math.max(6, safeLevel);
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
        <span className="relative w-[22px] h-[12px]">
          <span className="absolute inset-0 rounded-[4px] border border-current/60" />
          <span className="absolute inset-y-[2px] left-[2px] right-[2px] overflow-hidden rounded-[3px]">
            <span
              className={`absolute inset-y-0 left-0 rounded-[3px] ${fillClass} ${
                isCritical ? 'animate-pulse' : ''
              } transition-[width] duration-200 ease-out`}
              style={{ width: `${fillLevel}%` }}
            />
          </span>
        </span>
        <span className="ml-[1px] w-[2px] h-[6px] rounded-r-[2px] bg-current/60" />
      </span>
      {showPercent ? <span className="tabular-nums">{safeLevel}%</span> : null}
    </span>
  );
}
