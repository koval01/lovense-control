'use client';

/**
 * Canvas-based waveform graph showing motor level history for a toy's features.
 * Lovense design: single = pink, dual = pink + blue per feature, leading-edge markers, MAX LEVEL.
 */

import { useRef, useEffect } from 'react';
import type { Toy, ToyFeature } from '@/lib/lovense-domain';
import { useIsMobile } from '@/hooks/use-mobile';
import { BatteryIndicator } from '@/components/status/BatteryIndicator';
import { useI18n } from '@/contexts/i18n-context';

const HISTORY_LENGTH = 220;

export interface MotorGraphProps {
  toy: Toy;
  features: ToyFeature[];
  levelsRef: React.MutableRefObject<Record<string, number>>;
  compact?: boolean;
  ultraCompact?: boolean;
  splitView?: boolean;
}

export function MotorGraph({
  toy,
  features,
  levelsRef,
  compact = false,
  ultraCompact = false,
  splitView = false,
}: MotorGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<Record<string, number[]>>({});
  const rafRef = useRef<number>(0);
  const isMobile = useIsMobile();
  const { t } = useI18n();

  useEffect(() => {
    features.forEach((f) => {
      if (!historyRef.current[f.id]) historyRef.current[f.id] = Array(HISTORY_LENGTH).fill(0);
    });

    const draw = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        const scaledWidth = Math.max(1, Math.floor(width * dpr));
        const scaledHeight = Math.max(1, Math.floor(height * dpr));

        if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
          canvas.width = scaledWidth;
          canvas.height = scaledHeight;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        features.forEach((f) => {
          const pct = levelsRef.current[f.id] ?? 0;
          const targetLevel = (pct / 100) * f.maxLevel;
          const history = historyRef.current[f.id];
          if (!history) return;
          const last = history[history.length - 1] ?? 0;
          const smoothed = last + (targetLevel - last) * 0.25;
          history.push(smoothed);
          if (history.length > HISTORY_LENGTH) history.shift();
        });

        ctx.clearRect(0, 0, width, height);

        const lineWidth = isMobile ? 1.5 : 2;
        const markerRadius = isMobile ? 3 : 4;

        features.forEach((f, idx) => {
          const data = historyRef.current[f.id];
          if (!data || data.length < 2) return;

          const amplitude = height * 0.62;
          const len = data.length;
          const points: { x: number; y: number }[] = [];

          for (let j = 0; j < len; j++) {
            const x = (j / (len - 1 || 1)) * width;
            const y = height - (data[j] / f.maxLevel) * amplitude;
            points.push({ x, y });
          }

          const first = points[0];
          const lastPt = points[points.length - 1];
          if (!first || !lastPt) return;

          // Stroke: feature-specific color (single = pink, dual = pink + blue per Lovense)
          ctx.strokeStyle = f.color;
          ctx.lineWidth = lineWidth;
          ctx.lineJoin = 'round';

          ctx.beginPath();
          ctx.moveTo(first.x, first.y);
          for (let j = 1; j < points.length; j++) {
            ctx.lineTo(points[j].x, points[j].y);
          }
          ctx.stroke();

          // Fill under curve with gradient
          const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
          fillGradient.addColorStop(0, `${f.color}2A`);
          fillGradient.addColorStop(1, `${f.color}00`);

          ctx.beginPath();
          ctx.moveTo(first.x, height);
          for (let j = 0; j < points.length; j++) {
            ctx.lineTo(points[j].x, points[j].y);
          }
          ctx.lineTo(lastPt.x, height);
          ctx.closePath();
          ctx.fillStyle = fillGradient;
          ctx.fill();

          // Leading-edge marker (Lovense style)
          ctx.beginPath();
          ctx.arc(lastPt.x, lastPt.y, markerRadius, 0, Math.PI * 2);
          ctx.fillStyle = f.color;
          ctx.fill();
        });
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [features, levelsRef, isMobile]);

  return (
    <div
      className={`relative w-full min-w-0 shrink-0 bg-[var(--vkui--color_background_secondary)] ${
        ultraCompact
          ? 'h-10 min-h-[40px] md:h-[72px] md:min-h-[72px]'
          : compact
          ? 'h-20 min-h-[78px] md:h-[72px] md:min-h-[72px]'
          : 'h-24 min-h-[92px] md:h-24 md:min-h-[92px]'
      }`}
    >
      <div className={`absolute ${splitView ? 'left-2.5' : 'left-4'} flex items-center gap-1.5 z-10 ${ultraCompact ? 'top-1.5' : compact ? 'top-2' : 'top-3'}`}>
        <span className={`${ultraCompact ? 'text-[10px]' : compact ? 'text-xs' : 'text-sm'} font-medium text-[var(--vkui--color_text_secondary)]`}>
          {toy.name}
        </span>
        <span className="text-[var(--app-text-secondary)]">
          <BatteryIndicator level={toy.battery} />
        </span>
      </div>
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className={`absolute bottom-0 left-0 right-0 text-center z-10 ${ultraCompact ? 'pb-0.5' : 'pb-1'}`}>
        <span className={`${ultraCompact ? 'text-[9px]' : 'text-[10px]'} font-medium uppercase tracking-wider text-[var(--vkui--color_text_secondary)]`}>
          {t('maxLevel')}
        </span>
      </div>
    </div>
  );
}
