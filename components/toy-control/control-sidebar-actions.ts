import type { LucideIcon } from 'lucide-react';
import { Circle, Square, Play, Pause, MoveVertical, Repeat2 } from 'lucide-react';
import type { TranslateOptions, TranslationKey } from '@/lib/i18n';

export type ControlSidebarAction = {
  id: string;
  label: string;
  ariaLabel: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: LucideIcon;
};

export function buildControlSidebarActions(params: {
  isRecording: boolean;
  isPlaying: boolean;
  hasRecording: boolean;
  patternCount: number;
  activePatternIndex: number;
  hasGroups: boolean;
  t: (key: TranslationKey, variables?: Record<string, string | number>, options?: TranslateOptions) => string;
  onRecordToggle: () => void;
  onPlayToggle: () => void;
  onPatternCycle: () => void;
  onResetGroups: () => void;
}): ControlSidebarAction[] {
  const {
    isRecording,
    isPlaying,
    hasRecording,
    patternCount,
    activePatternIndex,
    hasGroups,
    t,
    onRecordToggle,
    onPlayToggle,
    onPatternCycle,
    onResetGroups,
  } = params;

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

  return [
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
          } satisfies ControlSidebarAction,
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
          } satisfies ControlSidebarAction,
        ]
      : []),
  ];
}
