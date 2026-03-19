'use client';

import { motion, AnimatePresence } from 'motion/react';
import type { Toy } from '@/lib/lovense-domain';
import { fadeVariants } from '@/constants/animation-variants';
import { useIsMobile } from '@/hooks/use-mobile';
import { EmptyState } from './EmptyState';
import { OnlineToyGrid } from '@/components/status/OnlineToyGrid';
import { OnlineControlsPanel } from '@/components/status/OnlineControlsPanel';

import type { TranslationKey } from '@/lib/i18n';

export interface StatusOnlineViewProps {
  toys: Record<string, Toy>;
  activeToyIds: string[];
  onToggleToy: (toyId: string) => void;
  localToys?: Record<string, Toy>;
  localEnabledToyIds?: string[];
  onToggleLocalToy?: (toyId: string) => void;
  /** Partner “my toys”: freeze toggle while policy cooldown active. */
  isLocalToyPolicyToggleFrozen?: (toyId: string) => boolean;
  children: React.ReactNode;
  /** Partner mode: toy IDs the partner enabled for us; others show as disabled. */
  partnerEnabledToyIds?: string[];
  /** When toys are empty, show this title/hint instead of the default "No Toys Found" (e.g. partner mode: "Waiting for partner"). */
  emptyStateTitleKey?: TranslationKey;
  emptyStateHintKey?: TranslationKey;
}

export function StatusOnlineView({
  toys,
  activeToyIds,
  onToggleToy,
  localToys,
  localEnabledToyIds,
  onToggleLocalToy,
  isLocalToyPolicyToggleFrozen,
  children,
  partnerEnabledToyIds,
  emptyStateTitleKey,
  emptyStateHintKey,
}: StatusOnlineViewProps) {
  const toyIds = Object.keys(toys);
  const localToyIds = Object.keys(localToys ?? {});
  const activeCount = toyIds.filter((toyId) => activeToyIds.includes(toyId)).length;
  const isMobile = useIsMobile();
  const isPartnerSplit = localToys !== undefined && localEnabledToyIds !== undefined && onToggleLocalToy !== undefined;

  return (
    <motion.div
      key="online"
      variants={fadeVariants}
      initial={false}
      animate="animate"
      exit="exit"
      className="w-full max-w-5xl mx-auto px-0 md:px-6 pt-2 md:pt-4 h-full min-h-0 flex flex-col overflow-hidden"
    >
      {toyIds.length === 0 && !isPartnerSplit ? (
        <EmptyState
          className="flex-1"
          {...(emptyStateTitleKey && emptyStateHintKey
            ? { titleKey: emptyStateTitleKey, hintKey: emptyStateHintKey }
            : {})}
        />
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden md:overflow-visible">
          {isPartnerSplit ? (
            <>
              <OnlineToyGrid
                toys={localToys}
                activeToyIds={localEnabledToyIds}
                isMobile={isMobile}
                onToggleToy={onToggleLocalToy}
                isToyPolicyToggleFrozen={isLocalToyPolicyToggleFrozen}
                sectionTitleKey="myToys"
              />
              <OnlineToyGrid
                toys={toys}
                activeToyIds={partnerEnabledToyIds ?? []}
                isMobile={isMobile}
                onToggleToy={() => {}}
                partnerEnabledToyIds={partnerEnabledToyIds}
                readOnly
                sectionTitleKey="partnerTheirToysTitle"
              />
            </>
          ) : (
            <OnlineToyGrid
              toys={toys}
              activeToyIds={activeToyIds}
              isMobile={isMobile}
              onToggleToy={onToggleToy}
              partnerEnabledToyIds={partnerEnabledToyIds}
            />
          )}
          <OnlineControlsPanel activeCount={activeCount}>{children}</OnlineControlsPanel>
        </div>
      )}
    </motion.div>
  );
}
