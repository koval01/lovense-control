'use client';

import type { ControlSidebarAction } from './control-sidebar-actions';

export function ControlSidebarButtons({
  actions,
  hasGroups,
  patternCount,
}: {
  actions: ControlSidebarAction[];
  hasGroups: boolean;
  patternCount: number;
}) {
  return (
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
  );
}
