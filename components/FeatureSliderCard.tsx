'use client';

/**
 * Slider card for a single feature in traditional mode.
 * Power (0-100%) and limit controls.
 * Uses native range inputs for reliable, responsive interaction.
 */

import type { ToyFeature } from '@/lib/lovense-domain';

export interface FeatureSliderCardProps {
  feature: ToyFeature;
  currentPercentage: number;
  limit: number;
  onLevelChange: (featureId: string, percentage: number) => void;
  onLimitChange: (featureId: string, value: number) => void;
}

export function FeatureSliderCard({
  feature,
  currentPercentage,
  limit,
  onLevelChange,
  onLimitChange,
}: FeatureSliderCardProps) {
  const Icon = feature.icon;
  const actualLevel = Math.round((currentPercentage / 100) * limit);

  return (
    <div className="space-y-4 p-4 rounded-xl bg-zinc-800/30 border border-zinc-800">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: feature.color, boxShadow: `0 0 10px ${feature.color}80` }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-zinc-100">{feature.toyName}</div>
          <div className="text-xs text-zinc-400">{feature.featureName}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold" style={{ color: feature.color }}>
            {actualLevel}
          </div>
          <div className="text-xs text-zinc-500">Max: {limit}</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-zinc-400">
          <span>Power (0-100%)</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={currentPercentage}
          onChange={(e) => onLevelChange(feature.id, Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-zinc-700 accent-zinc-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-zinc-400"
          style={
            {
              accentColor: feature.color,
              '--thumb-bg': feature.color,
            } as React.CSSProperties
          }
        />
      </div>

      <div className="space-y-1 pt-2 border-t border-zinc-800">
        <div className="flex justify-between text-xs text-zinc-400">
          <span>Limit (0-{feature.maxLevel})</span>
        </div>
        <input
          type="range"
          min={0}
          max={feature.maxLevel}
          step={1}
          value={limit}
          onChange={(e) => onLimitChange(feature.id, Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-zinc-700 accent-zinc-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-zinc-400"
          style={
            {
              accentColor: feature.color,
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
}
