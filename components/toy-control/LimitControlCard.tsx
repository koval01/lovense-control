'use client';

import { Lock } from 'lucide-react';
import type { ToyFeature } from '@/lib/lovense-domain';
import type { TranslationKey } from '@/lib/i18n';

type TFn = (key: TranslationKey, variables?: Record<string, string | number>) => string;

export function LimitControlCard({
  feature,
  isReadOnly,
  limit,
  partnerLimits,
  onLimitChange,
  t,
}: {
  feature: ToyFeature;
  isReadOnly: boolean;
  limit: number;
  partnerLimits?: Record<string, number>;
  onLimitChange: (featureId: string, value: number) => void;
  t: TFn;
}) {
  const Icon = feature.icon;
  const readOnlyLimit =
    partnerLimits && feature.id in partnerLimits ? (partnerLimits[feature.id] ?? feature.maxLevel) : feature.maxLevel;
  const effectiveLimit = isReadOnly ? readOnlyLimit : limit;
  const step = 1;
  const fillPercent = Math.round((effectiveLimit / Math.max(1, feature.maxLevel)) * 100);

  return (
    <section className="rounded-[var(--app-radius-control)] border border-[var(--app-border)] bg-[var(--app-surface-soft)]/55 px-3 py-3.5 md:px-4 md:py-4">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: feature.color,
            boxShadow: '0 4px 12px rgba(0,0,0,0.22)',
          }}
        >
          <Icon className="w-4 h-4 text-white" style={{ color: 'white' }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[var(--app-text-primary)] truncate">
            {feature.toyName}
          </div>
          <div className="text-xs text-[var(--app-text-secondary)] truncate">
            {feature.featureName}
          </div>
        </div>
        <span className="text-[11px] text-[var(--app-text-secondary)] tabular-nums">
          0-{feature.maxLevel}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={feature.maxLevel}
          step={step}
          value={effectiveLimit}
          onChange={(event) => onLimitChange(feature.id, Number(event.target.value))}
          aria-label={t('maxLevelForFeature', { feature: feature.featureName })}
          className={`feature-range ${isReadOnly ? 'opacity-70' : ''}`}
          style={{ flex: 1, ['--range-fill' as string]: `${fillPercent}%` }}
          readOnly={isReadOnly}
          disabled={isReadOnly}
        />
        <div className={`min-w-[36px] h-7 px-2 rounded-md border border-[var(--app-border)] text-xs tabular-nums flex items-center justify-center ${
          isReadOnly
            ? 'bg-[var(--app-bg)]/80 text-[var(--app-text-secondary)] font-medium'
            : 'bg-[var(--app-bg-elevated)] text-[var(--app-text-primary)] font-semibold'
        }`}>
          {effectiveLimit}
        </div>
      </div>
      {isReadOnly ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--app-text-secondary)]">
          <Lock className="w-3.5 h-3.5" />
          <span>{t('partnerLimitLabel')}</span>
        </div>
      ) : null}
    </section>
  );
}
