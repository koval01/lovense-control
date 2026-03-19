'use client';

import { Lock } from 'lucide-react';
import type { ToyFeature } from '@/lib/lovense-domain';
import { useI18n } from '@/contexts/i18n-context';

export interface LimitControlsProps {
  features: ToyFeature[];
  limits: Record<string, number>;
  onLimitChange: (featureId: string, value: number) => void;
  /** Optional: explicit editable features (e.g. own toys in partner mode). */
  editableFeatures?: ToyFeature[];
  /** Optional: additional read-only features (e.g. partner toys in partner mode). */
  readOnlyFeatures?: ToyFeature[];
  /** Partner mode: partner's limits (used for read-only slider values). */
  partnerLimits?: Record<string, number>;
}

export function LimitControls({
  features,
  limits,
  onLimitChange,
  editableFeatures,
  readOnlyFeatures,
  partnerLimits,
}: LimitControlsProps) {
  const { t } = useI18n();
  const editable = editableFeatures ?? features;
  const readOnly = readOnlyFeatures ?? [];

  const renderCard = (feature: ToyFeature, isReadOnly: boolean) => {
    const Icon = feature.icon;
    const readOnlyLimit =
      partnerLimits && feature.id in partnerLimits ? (partnerLimits[feature.id] ?? feature.maxLevel) : feature.maxLevel;
    const limit = isReadOnly ? readOnlyLimit : (limits[feature.id] ?? feature.maxLevel);
    const step = Math.max(1, Math.floor(feature.maxLevel / 10));
    const fillPercent = Math.round((limit / Math.max(1, feature.maxLevel)) * 100);
    return (
      <section
        key={feature.id}
        className="rounded-[var(--app-radius-control)] border border-[var(--app-border)] bg-[var(--app-surface-soft)]/55 px-3 py-3.5 md:px-4 md:py-4"
      >
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
            value={limit}
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
            {limit}
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
  };

  return (
    <div className="p-3 md:p-4 space-y-3 md:space-y-4 overflow-y-auto">
      {editable.length > 0 ? (
        <>
          <div className="px-1 text-xs md:text-sm font-medium text-[var(--app-text-secondary)]">{t('myToys')}</div>
          {editable.map((feature) => renderCard(feature, false))}
        </>
      ) : null}
      {readOnly.length > 0 ? (
        <>
          <div className="px-1 text-xs md:text-sm font-medium text-[var(--app-text-secondary)]">{t('partnerTheirToysTitle')}</div>
          {readOnly.map((feature) => renderCard(feature, true))}
        </>
      ) : null}
    </div>
  );
}
