'use client';

import type { ToyFeature } from '@/lib/lovense-domain';
import { useI18n } from '@/contexts/i18n-context';
import { LimitControlCard } from './LimitControlCard';

export interface LimitControlsProps {
  features: ToyFeature[];
  limits: Record<string, number>;
  onLimitChange: (featureId: string, value: number) => void;
  editableFeatures?: ToyFeature[];
  readOnlyFeatures?: ToyFeature[];
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

  return (
    <div className="p-3 md:p-4 space-y-3 md:space-y-4 overflow-y-auto">
      {editable.length > 0 ? (
        <>
          <div className="px-1 text-xs md:text-sm font-medium text-[var(--app-text-secondary)]">{t('myToys')}</div>
          {editable.map((feature) => (
            <LimitControlCard
              key={feature.id}
              feature={feature}
              isReadOnly={false}
              limit={limits[feature.id] ?? feature.maxLevel}
              partnerLimits={partnerLimits}
              onLimitChange={onLimitChange}
              t={t}
            />
          ))}
        </>
      ) : null}
      {readOnly.length > 0 ? (
        <>
          <div className="px-1 text-xs md:text-sm font-medium text-[var(--app-text-secondary)]">{t('partnerTheirToysTitle')}</div>
          {readOnly.map((feature) => (
            <LimitControlCard
              key={feature.id}
              feature={feature}
              isReadOnly
              limit={limits[feature.id] ?? feature.maxLevel}
              partnerLimits={partnerLimits}
              onLimitChange={onLimitChange}
              t={t}
            />
          ))}
        </>
      ) : null}
    </div>
  );
}
