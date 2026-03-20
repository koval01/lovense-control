'use client';

import { Skeleton } from '@vkontakte/vkui';
import type { TranslationKey } from '@/lib/i18n';

export function HomePartnerSetupLoading({ t }: { t: (key: TranslationKey) => string }) {
  return (
    <div className="mt-4 space-y-3" aria-busy="true" aria-label={t('connecting')}>
      <Skeleton width="100%" height={16} borderRadius={6} />
      <Skeleton width="85%" height={16} borderRadius={6} />
      <Skeleton width="70%" height={16} borderRadius={6} />
      <div className="pt-6 space-y-3">
        <Skeleton width="100%" height={44} borderRadius={12} />
        <Skeleton width="100%" height={44} borderRadius={12} />
      </div>
      <div className="pt-4 flex gap-3">
        <Skeleton width={140} height={40} borderRadius={12} />
        <Skeleton width={100} height={40} borderRadius={12} />
      </div>
    </div>
  );
}
