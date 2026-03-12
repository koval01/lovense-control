'use client';

import Image from 'next/image';
import { Zap } from 'lucide-react';
import type { Toy } from '@/lib/lovense-domain';
import { getToyIcon } from '@/lib/toy-icons';
import { BatteryIndicator } from '@/components/status/BatteryIndicator';

export interface ToyCardProps {
  toy: Toy;
  isActive: boolean;
  onToggle: (toyId: string) => void;
}

export function ToyCard({ toy, isActive, onToggle }: ToyCardProps) {
  const iconSrc = getToyIcon(toy.name);

  return (
    <button
      type="button"
      onClick={() => onToggle(toy.id)}
      aria-pressed={isActive}
      className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border transition-colors ${
        isActive
          ? 'bg-[var(--app-surface-soft)] border-[var(--app-accent)]'
          : 'bg-[var(--vkui--color_background_tertiary)] border-[var(--vkui--color_separator_secondary)] opacity-65'
      }`}
      title={isActive ? 'Toy enabled' : 'Toy muted'}
    >
      <div className="w-8 h-8 md:w-10 md:h-10 bg-[var(--vkui--color_background_content)] rounded-md md:rounded-lg flex items-center justify-center overflow-hidden relative">
        {iconSrc ? (
          <Image src={iconSrc} alt={toy.name} fill className="object-contain p-1" />
        ) : (
          <Zap className="w-4 h-4 md:w-5 md:h-5 text-[var(--app-accent)]" />
        )}
      </div>
      <div>
        <div className="text-xs md:text-sm font-semibold text-[var(--vkui--color_text_primary)]">{toy.name}</div>
        <div className="text-xs text-[var(--app-text-secondary)] font-medium">
          <BatteryIndicator level={toy.battery} showPercent />
        </div>
      </div>
    </button>
  );
}
