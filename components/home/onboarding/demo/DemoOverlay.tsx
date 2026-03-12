'use client';

import { motion } from 'motion/react';
import type { DemoStep } from '@/components/home/onboarding/demo/constants';
import type { SpotlightRect } from '@/components/home/onboarding/demo/geometry';

interface DemoOverlayProps {
  activeStep: DemoStep;
  stepIndex: number;
  totalSteps: number;
  spotlightRect: SpotlightRect;
  viewportWidth: number;
  viewportHeight: number;
  highlightRect: DOMRect;
  pointerLeft: number;
  pointerTop: number;
  tooltipLeft: number;
  tooltipTop: number;
  onNext: () => void;
  nextLabel: string;
  finishLabel: string;
}

export function DemoOverlay(props: DemoOverlayProps) {
  const { activeStep, stepIndex, totalSteps, spotlightRect, viewportWidth, viewportHeight, highlightRect, pointerLeft, pointerTop, tooltipLeft, tooltipTop, onNext, nextLabel, finishLabel } = props;

  return (
    <>
      {spotlightRect && (
        <>
          <div className="fixed z-20 pointer-events-none bg-black/72 backdrop-blur-[3px]" style={{ left: 0, top: 0, width: '100vw', height: `${spotlightRect.top}px` }} />
          <div className="fixed z-20 pointer-events-none bg-black/72 backdrop-blur-[3px]" style={{ left: 0, top: `${spotlightRect.top}px`, width: `${spotlightRect.left}px`, height: `${Math.max(0, spotlightRect.bottom - spotlightRect.top)}px` }} />
          <div className="fixed z-20 pointer-events-none bg-black/72 backdrop-blur-[3px]" style={{ left: `${spotlightRect.right}px`, top: `${spotlightRect.top}px`, width: `${Math.max(0, viewportWidth - spotlightRect.right)}px`, height: `${Math.max(0, spotlightRect.bottom - spotlightRect.top)}px` }} />
          <div className="fixed z-20 pointer-events-none bg-black/72 backdrop-blur-[3px]" style={{ left: 0, top: `${spotlightRect.bottom}px`, width: '100vw', height: `${Math.max(0, viewportHeight - spotlightRect.bottom)}px` }} />
        </>
      )}
      <div className="fixed z-30 pointer-events-none rounded-xl border-2 border-white/85" style={{ left: spotlightRect?.left ?? highlightRect.left - 6, top: spotlightRect?.top ?? highlightRect.top - 6, width: spotlightRect ? Math.max(0, spotlightRect.right - spotlightRect.left) : highlightRect.width + 12, height: spotlightRect ? Math.max(0, spotlightRect.bottom - spotlightRect.top) : highlightRect.height + 12 }} />
      <motion.div className="fixed z-40 pointer-events-none w-8 h-8 rounded-full border-2 border-white bg-white/20" style={{ left: pointerLeft, top: pointerTop }} animate={{ scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }} transition={{ duration: 1.1, repeat: Infinity }} />
      <motion.div className="fixed z-40 pointer-events-auto max-w-[320px] rounded-[var(--app-radius-control)] bg-[var(--app-bg-elevated)] text-[var(--app-text-primary)] border border-[var(--app-border)] px-3 py-2 text-sm shadow-[var(--app-shadow-strong)]" style={{ left: tooltipLeft, top: tooltipTop }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div>{activeStep.explanation}</div>
        <button type="button" onClick={onNext} className="app-button-primary mt-2 h-8 px-3 rounded-[10px] text-xs font-medium">
          {stepIndex === totalSteps - 1 ? finishLabel : nextLabel}
        </button>
      </motion.div>
    </>
  );
}
