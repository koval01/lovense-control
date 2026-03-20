import type { Env } from './env';
import { DEFAULT_JWT_SECRET } from './env';

export function ensureProductionSecret(env: Env): void {
  if (env.BRIDGE_ENV?.toLowerCase() !== 'production') return;
  if (!env.JWT_SECRET || env.JWT_SECRET === DEFAULT_JWT_SECRET) {
    throw new Error(
      'JWT_SECRET must be set to a non-default value in production. Use a strong secret (≥32 chars) and keep it in sync with Next.js.'
    );
  }
}
