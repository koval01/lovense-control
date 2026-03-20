import type { Env } from './env';

export function getAllowedOrigin(origin: string | null, env: Env): string {
  const corsOrigins = env.CORS_ORIGINS?.trim();
  const isProduction = env.BRIDGE_ENV?.toLowerCase() === 'production';
  if (!corsOrigins) {
    return isProduction ? '' : origin || '*';
  }
  const allowed = corsOrigins.split(',').map((o) => o.trim()).filter(Boolean);
  if (allowed.length === 0) return isProduction ? '' : origin || '*';
  if (origin && allowed.includes(origin)) return origin;
  return allowed[0] ?? '';
}

export function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allow = getAllowedOrigin(origin, env);
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
  if (allow) headers['Access-Control-Allow-Origin'] = allow;
  return headers;
}
