import type { ToyFeature } from '@/lib/lovense-domain';

const HISTORY_LENGTH = 220;

export function ensureMotorHistories(
  features: ToyFeature[],
  historyRef: React.MutableRefObject<Record<string, number[]>>
): void {
  features.forEach((f) => {
    if (!historyRef.current[f.id]) historyRef.current[f.id] = Array(HISTORY_LENGTH).fill(0);
  });
}

export function stepMotorHistories(
  features: ToyFeature[],
  historyRef: React.MutableRefObject<Record<string, number[]>>,
  levelsRef: React.MutableRefObject<Record<string, number>>
): void {
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
}

export function paintMotorGraph(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  features: ToyFeature[],
  historyRef: React.MutableRefObject<Record<string, number[]>>,
  isMobile: boolean
): void {
  ctx.clearRect(0, 0, width, height);

  const lineWidth = isMobile ? 1.5 : 2;
  const markerRadius = isMobile ? 3 : 4;

  features.forEach((f) => {
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

    ctx.strokeStyle = f.color;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (let j = 1; j < points.length; j++) {
      ctx.lineTo(points[j].x, points[j].y);
    }
    ctx.stroke();

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

    ctx.beginPath();
    ctx.arc(lastPt.x, lastPt.y, markerRadius, 0, Math.PI * 2);
    ctx.fillStyle = f.color;
    ctx.fill();
  });
}
