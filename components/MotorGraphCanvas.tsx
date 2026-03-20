'use client';

import { useRef, useEffect } from 'react';
import type { ToyFeature } from '@/lib/lovense-domain';
import { useIsMobile } from '@/hooks/use-mobile';
import { ensureMotorHistories, paintMotorGraph, stepMotorHistories } from '@/components/motor-graph-draw';

export function MotorGraphCanvas({
  features,
  levelsRef,
}: {
  features: ToyFeature[];
  levelsRef: React.MutableRefObject<Record<string, number>>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<Record<string, number[]>>({});
  const rafRef = useRef<number>(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    ensureMotorHistories(features, historyRef);

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

        stepMotorHistories(features, historyRef, levelsRef);
        paintMotorGraph(ctx, width, height, features, historyRef, isMobile);
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [features, levelsRef, isMobile]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}
