'use client';

import { useMemo, useRef, useState } from 'react';
import { useI18n } from '@/contexts/i18n-context';
import { ToyControlContainer } from '@/components/ToyControlContainer';
import { OnboardingLayout } from '@/components/home/onboarding/OnboardingLayout';
import { DEMO_TOYS, buildDemoSteps } from '@/components/home/onboarding/demo/constants';
import { useDemoWalkthrough } from '@/components/home/onboarding/demo/useDemoWalkthrough';
import { buildSpotlightRect, buildTooltipPosition } from '@/components/home/onboarding/demo/geometry';
import { DemoOverlay } from '@/components/home/onboarding/demo/DemoOverlay';

interface DemoControlScreenProps {
  onContinue: () => void;
  onSkipAll: () => void;
}

export function DemoControlScreen({ onContinue, onSkipAll }: DemoControlScreenProps) {
  const { t } = useI18n();
  const [stepIndex, setStepIndex] = useState(0);
  const demoContainerRef = useRef<HTMLDivElement | null>(null);
  const steps = useMemo(() => buildDemoSteps(t), [t]);
  const isWalkthroughComplete = stepIndex >= steps.length;
  const activeStep = isWalkthroughComplete ? null : steps[stepIndex];
  const { highlightRect } = useDemoWalkthrough(demoContainerRef, activeStep);
  const viewportWidth = typeof window === 'undefined' ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 800 : window.innerHeight;
  const spotlightRect = buildSpotlightRect(highlightRect, viewportWidth, viewportHeight);
  const { pointerLeft, pointerTop, tooltipLeft, tooltipTop } = buildTooltipPosition(highlightRect, viewportWidth, viewportHeight);

  return (
    <OnboardingLayout title={t('onboardingDemoTitle')} subtitle={t('onboardingDemoSubtitle')} onSkipAll={onSkipAll}>
      <div className="mb-4 rounded-[var(--app-radius-control)] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4 relative z-10">
        <div className="text-sm font-medium text-[var(--app-text-primary)]">{t('onboardingDemoVisualTitle')}</div>
        <div className="mt-1 text-sm text-[var(--app-text-secondary)]">{t('onboardingDemoVisualDescription')}</div>
      </div>

      <div ref={demoContainerRef} className="h-[62dvh] min-h-[560px] max-h-[760px] rounded-[var(--app-radius-card)] overflow-hidden border border-[var(--app-border)] bg-[var(--app-bg-elevated)] relative z-10 shadow-[var(--app-shadow)]">
        <ToyControlContainer toys={DEMO_TOYS} onCommand={() => {}} interactive={false} demoAutoplay demoPanelView={activeStep?.panelView} />
      </div>

      {highlightRect && activeStep ? (
        <DemoOverlay
          activeStep={activeStep}
          stepIndex={stepIndex}
          totalSteps={steps.length}
          spotlightRect={spotlightRect}
          viewportWidth={viewportWidth}
          viewportHeight={viewportHeight}
          highlightRect={highlightRect}
          pointerLeft={pointerLeft}
          pointerTop={pointerTop}
          tooltipLeft={tooltipLeft}
          tooltipTop={tooltipTop}
          onNext={() => setStepIndex((prev) => prev + 1)}
          nextLabel={t('onboardingDemoNextStep')}
          finishLabel={t('onboardingDemoFinishTraining')}
        />
      ) : null}

      <ul className="mt-4 space-y-2 text-sm text-[var(--app-text-secondary)] relative z-10">
        <li>{t('onboardingDemoHint1')}</li><li>{t('onboardingDemoHint2')}</li><li>{t('onboardingDemoHint3')}</li>
      </ul>

      {isWalkthroughComplete ? (
        <div className="mt-4 rounded-[var(--app-radius-control)] border border-emerald-400/40 dark:border-emerald-400/30 bg-emerald-50/85 dark:bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300 relative z-10">
          {t('onboardingDemoCompleted')}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onContinue}
        disabled={!isWalkthroughComplete}
        className={`mt-6 w-full h-11 rounded-xl transition-colors text-sm font-medium relative z-10 ${isWalkthroughComplete ? 'app-button-primary text-white' : 'bg-zinc-400/70 text-white cursor-not-allowed dark:bg-zinc-700/70 dark:text-zinc-300'}`}
      >
        {t('onboardingContinueToQr')}
      </button>
    </OnboardingLayout>
  );
}
