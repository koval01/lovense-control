'use client';

import { useMemo } from 'react';
import { useI18n } from '@/contexts/i18n-context';
import { buildControlSidebarActions } from './control-sidebar-actions';
import { ControlSidebarButtons } from './ControlSidebarButtons';

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

export function ControlSidebar(props: ControlSidebarProps) {
  const { t } = useI18n();
  const {
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
  } = props;

  const actions = useMemo(
    () =>
      buildControlSidebarActions({
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
      }),
    [
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
    ]
  );

  return (
    <div className="w-full h-full">
      <ControlSidebarButtons actions={actions} hasGroups={hasGroups} patternCount={patternCount} />
    </div>
  );
}
