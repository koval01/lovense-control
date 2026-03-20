'use client';

/**
 * Canvas-based waveform graph showing motor level history for a toy's features.
 */

import type { Toy, ToyFeature } from '@/lib/lovense-domain';
import { BatteryIndicator } from '@/components/status/BatteryIndicator';
import { useI18n } from '@/contexts/i18n-context';
import { MotorGraphCanvas } from '@/components/MotorGraphCanvas';

export interface MotorGraphProps {
  toy: Toy;
  features: ToyFeature[];
  levelsRef: React.MutableRefObject<Record<string, number>>;
  compact?: boolean;
  ultraCompact?: boolean;
  splitView?: boolean;
}

export function MotorGraph({
  toy,
  features,
  levelsRef,
  compact = false,
  ultraCompact = false,
  splitView = false,
}: MotorGraphProps) {
  const { t } = useI18n();

  return (
    <div
      className={`relative w-full min-w-0 shrink-0 bg-[var(--vkui--color_background_secondary)] ${
        ultraCompact
          ? 'h-10 min-h-[40px] md:h-[72px] md:min-h-[72px]'
          : compact
          ? 'h-20 min-h-[78px] md:h-[72px] md:min-h-[72px]'
          : 'h-24 min-h-[92px] md:h-24 md:min-h-[92px]'
      }`}
    >
      <div className={`absolute ${splitView ? 'left-2.5' : 'left-4'} flex items-center gap-1.5 z-10 ${ultraCompact ? 'top-1.5' : compact ? 'top-2' : 'top-3'}`}>
        <span className={`${ultraCompact ? 'text-[10px]' : compact ? 'text-xs' : 'text-sm'} font-medium text-[var(--vkui--color_text_secondary)]`}>
          {toy.name}
        </span>
        <span className="text-[var(--app-text-secondary)]">
          <BatteryIndicator level={toy.battery} />
        </span>
      </div>
      <MotorGraphCanvas features={features} levelsRef={levelsRef} />
      <div className={`absolute bottom-0 left-0 right-0 text-center z-10 ${ultraCompact ? 'pb-0.5' : 'pb-1'}`}>
        <span className={`${ultraCompact ? 'text-[9px]' : 'text-[10px]'} font-medium uppercase tracking-wider text-[var(--vkui--color_text_secondary)]`}>
          {t('maxLevel')}
        </span>
      </div>
    </div>
  );
}
