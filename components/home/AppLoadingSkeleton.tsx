'use client';

import { Skeleton } from '@vkontakte/vkui';

/**
 * Skeleton placeholder for app loading state (i18n/onboarding not ready).
 * Mimics header + content layout.
 */
export function AppLoadingSkeleton() {
  return (
    <div
      id="main-content"
      className="h-full min-h-screen bg-[var(--app-bg)] flex flex-col items-center justify-center px-6"
    >
      <div className="w-full max-w-xl flex flex-col gap-4">
        <Skeleton
          width="100%"
          height={32}
          borderRadius={8}
          style={{ maxWidth: 200 }}
        />
        <Skeleton width="100%" height={16} borderRadius={6} />
        <Skeleton width="75%" height={16} borderRadius={6} />
        <Skeleton width="50%" height={16} borderRadius={6} />
      </div>
    </div>
  );
}
