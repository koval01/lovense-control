'use client';

/**
 * Lazy-loaded status views. Each view is a separate chunk for smaller initial load.
 */

import dynamic from 'next/dynamic';
import { StatusLoadingView } from './StatusLoadingView';
import { StatusLoadingFallback } from './StatusLoadingFallback';

const StatusErrorView = dynamic(
  () => import('./StatusErrorView').then((m) => ({ default: m.StatusErrorView })),
  { ssr: false }
);

const StatusQrView = dynamic(
  () => import('./StatusQrView').then((m) => ({ default: m.StatusQrView })),
  { ssr: false }
);

const StatusOnlineView = dynamic(
  () => import('./StatusOnlineView').then((m) => ({ default: m.StatusOnlineView })),
  {
    ssr: false,
    loading: () => <StatusLoadingFallback />,
  }
);

export { StatusLoadingView, StatusErrorView, StatusQrView, StatusOnlineView, StatusLoadingFallback };
