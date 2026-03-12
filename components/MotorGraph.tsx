'use client';

/**
 * Canvas-based waveform graph showing motor level history for a toy's features.
 */

import { useRef, useEffect } from 'react';
import type { Toy, ToyFeature } from '@/lib/lovense-domain';
import { useIsMobile } from '@/hooks/use-mobile';
import { BatteryIndicator } from '@/components/status/BatteryIndicator';

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

  useEffect(() => {
    features.forEach((f) => {
      if (!historyRef.current[f.id]) historyRef.current[f.id] = Array(100).fill(0);
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
          if (history.length > 100) history.shift();
        });

        ctx.clearRect(0, 0, width, height);

        features.forEach((f) => {
          const data = historyRef.current[f.id];
          if (!data || data.length < 2) return;

          ctx.beginPath();
          ctx.strokeStyle = f.color;
          ctx.lineWidth = isMobile ? 1.5 : 2;
          ctx.lineJoin = 'round';

          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, `${f.color}2A`);
          gradient.addColorStop(1, `${f.color}00`);

          ctx.moveTo(0, height);
          const amplitude = height * 0.62;
          const len = data.length;
          for (let j = 0; j < len; j++) {
            const x = (j / (len - 1)) * width;
            const y = height - (data[j] / f.maxLevel) * amplitude;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.lineTo(width, height);
          ctx.fillStyle = gradient;
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
      className={`relative w-full min-w-0 shrink-0 ${
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
    </div>
  );
}
