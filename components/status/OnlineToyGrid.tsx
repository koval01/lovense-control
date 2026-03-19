'use client';

import { AnimatePresence, motion } from 'motion/react';
import type { Toy } from '@/lib/lovense-domain';
import { ToyCard } from '@/components/status/ToyCard';
import { useI18n } from '@/contexts/i18n-context';
import type { TranslationKey } from '@/lib/i18n';

interface OnlineToyGridProps {
  toys: Record<string, Toy>;
  activeToyIds: string[];
  isMobile: boolean;
  onToggleToy: (toyId: string) => void;
  /** Partner mode: IDs the partner enabled; toys not in list show as disabled by owner. */
  partnerEnabledToyIds?: string[];
  readOnly?: boolean;
  sectionTitleKey?: TranslationKey;
  /** Partner “my toys”: per-toy UI cooldown after toggling policy (sync with server rate limit). */
  isToyPolicyToggleFrozen?: (toyId: string) => boolean;
}

export function OnlineToyGrid({
  toys,
  activeToyIds,
  isMobile,
  onToggleToy,
  partnerEnabledToyIds,
  readOnly = false,
  sectionTitleKey,
  isToyPolicyToggleFrozen,
}: OnlineToyGridProps) {
  const { t } = useI18n();
  return (
    <div>
      {sectionTitleKey ? (
        <div className="px-3 md:px-0 mb-2 text-xs md:text-sm font-medium text-[var(--app-text-secondary)]">
          {t(sectionTitleKey)}
        </div>
      ) : null}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: isMobile ? 8 : 12,
          marginBottom: isMobile ? 6 : 20,
          paddingLeft: isMobile ? 12 : 16,
          paddingRight: isMobile ? 12 : 16,
        }}
        className="shrink-0 md:px-0 md:mb-8 md:gap-4"
      >
      <AnimatePresence initial={false}>
        {Object.values(toys).map((toy) => {
          const disabledByPartner =
            partnerEnabledToyIds !== undefined && !partnerEnabledToyIds.includes(toy.id);
          return (
            <motion.div
              key={toy.id}
              layout
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              <ToyCard
                toy={toy}
                isActive={activeToyIds.includes(toy.id)}
                onToggle={onToggleToy}
                disabledByPartner={disabledByPartner}
                readOnly={readOnly}
                policyToggleCooldown={isToyPolicyToggleFrozen?.(toy.id) === true}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
      </div>
    </div>
  );
}
