'use client';

import { Circle, Square, Play, Pause, MoveVertical, Repeat2 } from 'lucide-react';
import { useI18n } from '@/contexts/i18n-context';

export interface ControlSidebarProps {
  isRecording: boolean;
  isPlaying: boolean;
  hasRecording: boolean;
  patternCount: number;
  activePatternIndex: number;
  hasGroups: boolean;
  onRecordToggle: () => void;
  onPlayToggle: () => void;
  onPatternCycle: () => void;
  onResetGroups: () => void;
}

export function ControlSidebar({
  isRecording,
  isPlaying,
  hasRecording,
  patternCount,
  activePatternIndex,
  hasGroups,
  onRecordToggle,
  onPlayToggle,
  onPatternCycle,
  onResetGroups,
}: ControlSidebarProps) {
  const { t } = useI18n();

  const recordAriaLabel = isRecording ? t('stop') : t('record');
  const recordCaption = isRecording
    ? t('stop', undefined, { location: 'sidebarCaption' })
    : t('record', undefined, { location: 'sidebarCaption' });
  const playAriaLabel = isPlaying ? t('pause') : t('play');
  const playCaption = isPlaying
    ? t('pause', undefined, { location: 'sidebarCaption' })
    : t('play', undefined, { location: 'sidebarCaption' });
  const resetGroupsAriaLabel = t('resetGroups');
  const resetGroupsCaption = t('resetGroups', undefined, { location: 'sidebarCaption' });
  const patternLabel = `Pattern ${activePatternIndex + 1}/${patternCount}`;

  const actions = [
    {
      id: 'record',
      label: recordCaption,
      ariaLabel: recordAriaLabel,
      active: isRecording,
      disabled: false,
      onClick: onRecordToggle,
      icon: isRecording ? Square : Circle,
    },
    {
      id: 'play',
      label: playCaption,
      ariaLabel: playAriaLabel,
      active: isPlaying,
      disabled: !hasRecording && !isPlaying,
      onClick: onPlayToggle,
      icon: isPlaying ? Pause : Play,
    },
    ...(patternCount > 1
      ? [
          {
            id: 'pattern',
            label: patternLabel,
            ariaLabel: 'Switch pattern',
            active: false,
            disabled: isRecording || isPlaying,
            onClick: onPatternCycle,
            icon: Repeat2,
          },
        ]
      : []),
    ...(hasGroups
      ? [
          {
            id: 'reset',
            label: resetGroupsCaption,
            ariaLabel: resetGroupsAriaLabel,
            active: false,
            disabled: false,
            onClick: onResetGroups,
            icon: MoveVertical,
          },
        ]
      : []),
  ];

  return (
    <div className="w-full h-full">
      <div
        className={`grid gap-1.5 md:gap-2 p-2 md:p-3 ${
        hasGroups
          ? patternCount > 1
            ? 'grid-cols-4 md:grid-cols-1'
            : 'grid-cols-3 md:grid-cols-1'
          : patternCount > 1
            ? 'grid-cols-3 md:grid-cols-1'
            : 'grid-cols-2 md:grid-cols-1'
        }`}
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              aria-label={action.ariaLabel}
              aria-pressed={action.active}
              disabled={action.disabled}
              className={`h-12 md:h-20 rounded-lg md:rounded-full md:w-20 md:mx-auto flex flex-col items-center justify-center gap-1 md:gap-1.5 border transition-all ${
                action.active
                  ? 'border-transparent text-white'
                  : 'border-[var(--vkui--color_separator_secondary)] bg-transparent text-[var(--vkui--color_text_primary)]'
              } ${
                action.disabled && !action.active
                  ? 'opacity-45 cursor-not-allowed'
                  : 'hover:border-[var(--vkui--color_stroke_accent)] hover:-translate-y-0.5 active:translate-y-0'
              }`}
              style={action.active ? { background: 'var(--app-gradient-accent)' } : undefined}
            >
              <Icon className="w-4 h-4 md:w-[18px] md:h-[18px]" />
              <span className="text-[10px] md:text-[11px] leading-none text-center max-w-full truncate">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
