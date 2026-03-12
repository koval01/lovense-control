'use client';

/**
 * Icon + label button for the control sidebar (mode toggle, loop, reset groups).
 */

import type { LucideIcon } from 'lucide-react';

export interface SidebarButtonProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function SidebarButton({ icon: Icon, label, active, onClick, disabled }: SidebarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-2 transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${active ? 'bg-zinc-800 text-white' : 'bg-transparent'}`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-[10px] font-medium text-center leading-tight max-w-[60px]">{label}</span>
    </button>
  );
}
