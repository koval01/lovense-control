'use client';

import Image from 'next/image';
import { Lock, Zap } from 'lucide-react';
import type { Toy } from '@/lib/lovense-domain';
import { getToyIcon } from '@/lib/toy-icons';
import { BatteryIndicator } from '@/components/status/BatteryIndicator';
import { useI18n } from '@/contexts/i18n-context';

export interface ToyCardProps {
  toy: Toy;
  isActive: boolean;
  onToggle: (toyId: string) => void;
  /** Partner mode: owner disabled this toy for partner. */
  disabledByPartner?: boolean;
}

export function ToyCard({ toy, isActive, onToggle, disabledByPartner }: ToyCardProps) {
  const iconSrc = getToyIcon(toy.name);
  const { t } = useI18n();
  const locked = disabledByPartner === true;

  return (
    <button
      type="button"
      onClick={() => !locked && onToggle(toy.id)}
      aria-pressed={isActive}
      disabled={locked}
      className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl border md:border-[1.5px] transition-all ${
        locked
          ? 'bg-[var(--vkui--color_background_tertiary)] border-[var(--vkui--color_separator_secondary)] opacity-60 cursor-not-allowed'
          : isActive
            ? 'bg-[var(--app-surface-soft)] border-[var(--app-accent)] shadow-[0_0_0_1px_rgba(242,12,127,0.35)]'
            : 'bg-[var(--vkui--color_background_tertiary)]/80 border-[var(--vkui--color_separator_secondary)] hover:border-[var(--vkui--color_separator_secondary)]'
      }`}
      title={locked ? t('partnerModeToyDisabledByOwner') : isActive ? 'Toy enabled' : 'Toy muted'}
    >
      <div className="w-8 h-8 md:w-10 md:h-10 bg-[var(--vkui--color_background_content)] rounded-md md:rounded-lg flex items-center justify-center overflow-hidden relative">
        {iconSrc ? (
          <Image src={iconSrc} alt={toy.name} fill className="object-contain p-1" />
        ) : (
          <Zap className="w-4 h-4 md:w-5 md:h-5 text-[var(--app-accent)]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs md:text-sm font-semibold text-[var(--vkui--color_text_primary)] truncate flex items-center gap-1">
          {toy.name}
          {locked ? <Lock className="w-3 h-3 shrink-0 text-[var(--app-text-secondary)]" aria-hidden /> : null}
        </div>
        <div className="text-xs text-[var(--app-text-secondary)] font-medium">
          <BatteryIndicator level={toy.battery} showPercent />
        </div>
      </div>
    </button>
  );
}
