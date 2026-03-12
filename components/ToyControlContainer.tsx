'use client';

/**
 * High-level container for toy control. Float mode (bubbles) plus limit controls
 * and recording/playback in the side panel. Built with VK UI components.
 */

import dynamic from 'next/dynamic';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Box } from '@vkontakte/vkui';
import { SlidersHorizontal, Waves } from 'lucide-react';
import type { Toy, ToyFeature, FeatureGroup } from '@/lib/lovense-domain';
import { useToyFeatures } from '@/hooks/use-toy-features';
import { useFeatureGroups } from '@/hooks/use-feature-groups';
import { useBubbleLayout } from '@/hooks/use-bubble-layout';
import { useRecording } from '@/hooks/use-recording';
import { ToyGraphsPanel, ToyStatusBar, ControlSidebar, LimitControls } from '@/components/toy-control';
import { useI18n } from '@/contexts/i18n-context';
import { useIsMobile } from '@/hooks/use-mobile';

const FloatModeControls = dynamic(
  () => import('@/components/toy-control/FloatModeControls').then((m) => ({ default: m.FloatModeControls })),
  { ssr: false }
);

export interface ToyControlContainerProps {
  toys: Record<string, Toy>;
  onCommand: (toyId: string, action: string, timeSec?: number) => void;
  activeToyIds?: string[];
  interactive?: boolean;
  demoAutoplay?: boolean;
  demoPanelView?: PanelView;
}

type PanelView = 'limits' | 'float';

export function ToyControlContainer({
  toys,
  onCommand,
  activeToyIds,
  interactive = true,
  demoAutoplay = false,
  demoPanelView,
}: ToyControlContainerProps) {
  const [panelView, setPanelView] = useState<PanelView>('float');
  const [mergePreview, setMergePreview] = useState<{ sourceId: string; targetId: string } | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const bubblePositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const groupsRef = useRef<FeatureGroup[]>([]);
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const bubbleSize = isMobile ? 56 : 64;
  const bubbleBottomInset = isMobile ? 20 : 8;
  const bubbleHorizontalInset = isMobile ? 10 : 18;

  const {
    features,
    limits,
    setLimit,
    levelsRef,
    handleLevelChange,
    sendCommandForToy,
    flushPendingCommand,
    applyLevelsAndSend,
    stopAllFeatures,
  } = useToyFeatures(toys, { onCommand, activeToyIds });

  const { groups, setGroups, isFeatureInGroup, mergeFeatures, resetGroups } = useFeatureGroups(features);
  const featureLayoutKey = useMemo(
    () => features.map((feature) => feature.id).sort().join('|'),
    [features]
  );

  const handleGroupLevelChange = useCallback(
    (group: FeatureGroup, percentage: number) => {
      group.featureIds.forEach((id) => handleLevelChange(id, percentage));
    },
    [handleLevelChange]
  );

  const handleFlushBeforeStop = useCallback(
    (id: string, isGroup: boolean) => {
      if (isGroup) {
        const group = groups.find((g) => g.id === id);
        if (group) {
          const toyIds = Array.from(
            new Set(group.featureIds.map((fid) => features.find((f) => f.id === fid)?.toyId).filter(Boolean) as string[])
          );
          toyIds.forEach((toyId) => flushPendingCommand(toyId));
        }
      } else {
        const feature = features.find((f) => f.id === id);
        if (feature) flushPendingCommand(feature.toyId);
      }
    },
    [features, groups, flushPendingCommand]
  );

  const {
    bubblePositions,
    setBubblePositions,
    setBubblePosition,
    startBubbleFall,
    restYRef,
    groupRestYRef,
    resetBubblePositions,
  } = useBubbleLayout({
    features,
    groups,
    containerRef,
    bubbleSize,
    bottomInset: bubbleBottomInset,
    horizontalInset: bubbleHorizontalInset,
    onLevelChange: handleLevelChange,
    onGroupLevelChange: handleGroupLevelChange,
    onFlushBeforeStop: handleFlushBeforeStop,
  });

  const handleMergePreview = useCallback((sourceId: string, targetId: string | null) => {
    if (targetId) {
      setMergePreview({ sourceId, targetId });
    } else {
      setMergePreview((prev) => (prev?.sourceId === sourceId ? null : prev));
    }
  }, []);

  useEffect(() => {
    bubblePositionsRef.current = bubblePositions;
  }, [bubblePositions]);

  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  const {
    isRecording,
    isPlaying,
    hasRecording,
    patternCount,
    activePatternIndex,
    cyclePattern,
    startRecording,
    stopRecording,
    play,
    stopPlayback,
  } = useRecording({
    levelsRef,
    bubblePositionsRef,
    groupsRef,
    applyLevelsAndSend,
    applyBubblePositions: (positions) => {
      setBubblePositions((prev) => ({ ...prev, ...positions }));
    },
    applyGroups: (recordedGroups) => {
      const used = new Set<string>();
      const nextGroups: FeatureGroup[] = [];

      recordedGroups.forEach((featureIds, index) => {
        const normalized = Array.from(
          new Set(featureIds.filter((featureId) => features.some((f) => f.id === featureId)))
        ).filter((featureId) => {
          if (used.has(featureId)) return false;
          used.add(featureId);
          return true;
        });
        if (normalized.length < 2) return;

        const anchor = features.find((f) => f.id === normalized[0]) ?? features.find((f) => normalized.includes(f.id));
        const stableId = normalized.slice().sort().join('__');
        nextGroups.push({
          id: `playback-group-${index}-${stableId}`,
          featureIds: normalized,
          name: 'Gruppe',
          color: anchor?.color ?? 'var(--app-accent)',
        });
      });

      setGroups(nextGroups);
    },
    stopAllFeatures,
    enabled: features.length > 0,
  });

  const handleRecordToggle = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const dropAllBubbles = useCallback(() => {
    const rectHeight = containerRef.current?.getBoundingClientRect().height ?? 0;

    groups.forEach((group) => {
      const anchorId = group.featureIds[0];
      if (!anchorId) return;
      const pos = bubblePositionsRef.current[anchorId];
      if (!pos) return;
      startBubbleFall(group.id, pos.x, pos.y, rectHeight, true);
    });

    features.forEach((feature) => {
      if (isFeatureInGroup(feature.id)) return;
      const pos = bubblePositionsRef.current[feature.id];
      if (!pos) return;
      startBubbleFall(feature.id, pos.x, pos.y, rectHeight, false);
    });
  }, [groups, features, isFeatureInGroup, startBubbleFall]);

  const handlePlayToggle = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
      dropAllBubbles();
    } else {
      play();
    }
  }, [isPlaying, play, stopPlayback, dropAllBubbles]);

  useEffect(() => {
    setMergePreview(null);
    resetGroups();
    resetBubblePositions();
  }, [featureLayoutKey, resetGroups, resetBubblePositions]);

  useEffect(() => {
    if (!demoPanelView) return;
    setPanelView(demoPanelView);
  }, [demoPanelView]);

  useEffect(() => {
    if (!demoAutoplay || features.length === 0) return;
    if (panelView === 'float') {
      const leadFeature = features[0];
      if (!leadFeature) return;

      const levelUpdateMs = 70;
      let rafId = 0;
      let lastLevelUpdateTs = -Infinity;
      let isInitialized = false;
      let holdUntilTs = 0;
      let segmentStartTs = 0;
      let segmentDurationMs = 0;
      let fromX = 0;
      let fromY = 0;
      let toX = 0;
      let toY = 0;
      let currentX = 0;
      let currentY = 0;

      const easeInOut = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

      const pickNextTarget = (
        baseX: number,
        baseY: number,
        minX: number,
        maxX: number,
        minY: number,
        maxY: number
      ) => {
        const rangeY = Math.max(1, maxY - minY);
        const usesSmallStep = Math.random() < 0.6;
        const distance = (usesSmallStep ? 0.14 + Math.random() * 0.18 : 0.32 + Math.random() * 0.35) * rangeY;
        const direction = Math.random() < 0.5 ? -1 : 1;
        let nextY = clamp(baseY + direction * distance, minY, maxY);
        if (Math.abs(nextY - baseY) < rangeY * 0.08) {
          nextY = clamp(baseY + direction * rangeY * 0.2, minY, maxY);
        }

        const lateral = (Math.random() - 0.5) * Math.max(8, (maxX - minX) * 0.9);
        const nextX = clamp(baseX + lateral, minX, maxX);

        return { nextX, nextY };
      };

      const animate = (now: number) => {
        if (!containerRef.current) {
          rafId = requestAnimationFrame(animate);
          return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const maxX = Math.max(0, rect.width - bubbleSize);
        const maxY = Math.max(0, rect.height - bubbleSize - bubbleBottomInset);
        const centerX = maxX * 0.5;
        const minX = clamp(centerX - 18, 0, maxX);
        const maxDriftX = clamp(centerX + 18, 0, maxX);
        const minY = clamp(maxY * 0.06, 0, maxY);
        const maxDriftY = clamp(maxY * 0.92, minY, maxY);

        if (!isInitialized) {
          currentX = centerX;
          currentY = minY + (maxDriftY - minY) * 0.72;
          fromX = currentX;
          fromY = currentY;
          toX = currentX;
          toY = currentY;
          segmentStartTs = now;
          segmentDurationMs = 1;
          holdUntilTs = now + 120;
          isInitialized = true;
        }

        if (holdUntilTs !== 0 && now >= holdUntilTs) {
          holdUntilTs = 0;
          fromX = currentX;
          fromY = currentY;
          const { nextX, nextY } = pickNextTarget(fromX, fromY, minX, maxDriftX, minY, maxDriftY);
          toX = nextX;
          toY = nextY;
          const rangeY = Math.max(1, maxDriftY - minY);
          const distanceRatio = Math.abs(toY - fromY) / rangeY;
          const baseDuration = 240 + Math.random() * 760;
          segmentDurationMs = baseDuration + distanceRatio * 320;
          if (Math.random() < 0.18) {
            segmentDurationMs *= 0.55;
          }
          segmentStartTs = now;
        }

        if (holdUntilTs === 0) {
          const progress = clamp((now - segmentStartTs) / segmentDurationMs, 0, 1);
          const eased = easeInOut(progress);
          currentX = fromX + (toX - fromX) * eased;
          currentY = fromY + (toY - fromY) * eased;

          if (progress >= 1) {
            currentX = toX;
            currentY = toY;
            holdUntilTs = now + (45 + Math.random() * 240);
          }
        }

        const level = Math.round(Math.max(0, Math.min(100, (1 - currentY / rect.height) * 100)));
        setBubblePosition(leadFeature.id, currentX, currentY);
        if (now - lastLevelUpdateTs >= levelUpdateMs) {
          handleLevelChange(leadFeature.id, level);
          lastLevelUpdateTs = now;
        }

        rafId = requestAnimationFrame(animate);
      };

      rafId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(rafId);
    }

    const interval = setInterval(() => {
      const feature = features[Math.floor(Math.random() * features.length)];
      const level = 25 + Math.round(Math.random() * 75);
      handleLevelChange(feature.id, level);
    }, 1450);

    return () => clearInterval(interval);
  }, [
    bubbleBottomInset,
    bubbleSize,
    demoAutoplay,
    features,
    handleLevelChange,
    panelView,
    setBubblePosition,
  ]);

  if (features.length === 0) return null;

  const rootHeightClass = interactive ? 'h-[68dvh] min-h-[420px] md:h-[90%]' : 'h-full';

  return (
    <div
      className={`overflow-hidden ${rootHeightClass} flex flex-col md:rounded-[var(--app-radius-card)] md:border md:border-[var(--vkui--color_separator_secondary)] md:shadow-[var(--app-shadow)] relative`}
      data-demo-target="control-root"
    >
      {!interactive && (
        <div className="absolute top-2 right-2 z-20 px-2 py-1 rounded-md text-xs bg-[var(--app-bg-elevated)] text-[var(--app-text-secondary)] border border-[var(--app-border)] pointer-events-none">
          Demo
        </div>
      )}
      <div data-demo-target="graph">
        <ToyGraphsPanel
          toys={toys}
          features={features}
          levelsRef={levelsRef}
          compact={!interactive}
          ultraCompact={interactive && isMobile}
        />
      </div>

      <div data-demo-target="status-bar">
        <ToyStatusBar toyCount={Object.keys(toys).length} />
      </div>

      <div className="flex flex-col md:flex-row flex-1 min-h-0 md:h-full border-t border-[var(--vkui--color_separator_secondary)]">
        <div className="flex flex-col min-h-0 flex-1 md:border-r border-[var(--vkui--color_separator_secondary)]">
          <div className="px-0 md:p-3 md:pb-2 shrink-0">
            <div
              className="grid grid-cols-2 gap-1 p-1 md:rounded-xl md:bg-[var(--vkui--color_background_content)] md:border md:border-[var(--vkui--color_separator_secondary)]"
              data-demo-target="tabs"
            >
              <button
                type="button"
                onClick={() => {
                  if (interactive) setPanelView('limits');
                }}
                className={`h-9 md:h-10 rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 md:gap-2 ${
                  panelView === 'limits'
                    ? 'bg-[var(--vkui--color_background_accent)] text-[var(--vkui--color_text_contrast)]'
                    : 'text-[var(--vkui--color_text_secondary)] hover:text-[var(--vkui--color_text_primary)]'
                }`}
                aria-pressed={panelView === 'limits'}
                disabled={!interactive}
                data-demo-target="tab-limits"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {t('maxLevel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (interactive) setPanelView('float');
                }}
                className={`h-9 md:h-10 rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 md:gap-2 ${
                  panelView === 'float'
                    ? 'bg-[var(--vkui--color_background_accent)] text-[var(--vkui--color_text_contrast)]'
                    : 'text-[var(--vkui--color_text_secondary)] hover:text-[var(--vkui--color_text_primary)]'
                }`}
                aria-pressed={panelView === 'float'}
                disabled={!interactive}
                data-demo-target="tab-float"
              >
                <Waves className="w-4 h-4" />
                {t('floatMode')}
              </button>
            </div>
          </div>
          <Box
            style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}
            className={`px-0 pb-0 md:px-0 md:pb-0 ${interactive ? '' : 'pointer-events-none'}`}
          >
            {panelView === 'limits' ? (
              <div
                className="absolute inset-0 overflow-y-auto md:rounded-none md:border-0 md:bg-[var(--vkui--color_background_content)]"
                data-demo-target="limits-area"
              >
                <LimitControls
                  features={features}
                  limits={limits}
                  onLimitChange={setLimit}
                />
              </div>
            ) : (
              <div
                className="absolute inset-0 touch-none md:rounded-none md:border-0 md:bg-[var(--vkui--color_background_content)]"
                style={{ touchAction: 'none' }}
                ref={containerRef}
                data-demo-target="float-area"
              >
                <FloatModeControls
                  features={features}
                  groups={groups}
                  bubbleSize={bubbleSize}
                  horizontalInset={bubbleHorizontalInset}
                  bubblePositions={bubblePositions}
                  mergePreview={mergePreview}
                  containerRef={containerRef}
                  restYRef={restYRef}
                  groupRestYRef={groupRestYRef}
                  isFeatureInGroup={isFeatureInGroup}
                  onLevelChange={handleLevelChange}
                  onGroupLevelChange={handleGroupLevelChange}
                  onMergePreview={handleMergePreview}
                  onMerge={(sourceId, targetId, dropX, dropY) => {
                    const targetWasInGroup = isFeatureInGroup(targetId);
                    if (!targetWasInGroup && dropX != null && dropY != null) {
                      setBubblePosition(sourceId, dropX, dropY);
                    }
                    mergeFeatures(sourceId, targetId);
                    setMergePreview(null);
                  }}
                  onBubblePositionChange={setBubblePosition}
                  onBubbleFall={startBubbleFall}
                />
              </div>
            )}
          </Box>
        </div>

        <div data-demo-target="sidebar">
          <ControlSidebar
            isRecording={isRecording}
            isPlaying={isPlaying}
            hasRecording={hasRecording}
            patternCount={patternCount}
            activePatternIndex={activePatternIndex}
            hasGroups={groups.length > 0}
            onRecordToggle={interactive ? handleRecordToggle : () => {}}
            onPlayToggle={interactive ? handlePlayToggle : () => {}}
            onPatternCycle={interactive ? cyclePattern : () => {}}
            onResetGroups={
              interactive
                ? () => {
                    resetGroups();
                    resetBubblePositions();
                  }
                : () => {}
            }
          />
        </div>
      </div>
    </div>
  );
}
