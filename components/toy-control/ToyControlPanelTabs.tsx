'use client';

import { SlidersHorizontal, Waves } from 'lucide-react';

const tabBtn =
  'h-9 md:h-10 rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 md:gap-2';

export function ToyControlPanelTabs(props: {
  t: (key: 'maxLevel' | 'floatMode') => string;
  interactive: boolean;
  panelView: 'limits' | 'float';
  setPanelView: (v: 'limits' | 'float') => void;
}) {
  const { t, interactive, panelView, setPanelView } = props;
  const active = 'bg-[var(--vkui--color_background_accent)] text-[var(--vkui--color_text_contrast)]';
  const idle = 'text-[var(--vkui--color_text_secondary)] hover:text-[var(--vkui--color_text_primary)]';
  return (
    <div className="px-0 md:p-3 md:pb-2 shrink-0">
      <div
        className="grid grid-cols-2 gap-1 p-1 md:rounded-xl md:bg-[var(--vkui--color_background_content)] md:border md:border-[var(--vkui--color_separator_secondary)]"
        data-demo-target="tabs"
      >
        <button
          type="button"
          onClick={() => interactive && setPanelView('limits')}
          className={`${tabBtn} ${panelView === 'limits' ? active : idle}`}
          aria-pressed={panelView === 'limits'}
          disabled={!interactive}
          data-demo-target="tab-limits"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {t('maxLevel')}
        </button>
        <button
          type="button"
          onClick={() => interactive && setPanelView('float')}
          className={`${tabBtn} ${panelView === 'float' ? active : idle}`}
          aria-pressed={panelView === 'float'}
          disabled={!interactive}
          data-demo-target="tab-float"
        >
          <Waves className="w-4 h-4" />
          {t('floatMode')}
        </button>
      </div>
    </div>
  );
}
