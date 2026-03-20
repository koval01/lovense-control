const RATE_LIMIT_WINDOW_SEC = 60;

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

export function checkRateLimit(
  ip: string,
  suffix: string,
  maxRequests: number
): [boolean, string] {
  const now = Date.now() / 1000;
  const key = `${ip}:${suffix}`;
  let entry = rateLimitMap.get(key);
  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_SEC) {
    entry = { count: 0, windowStart: now };
    rateLimitMap.set(key, entry);
  }
  entry.count++;
  if (entry.count > maxRequests) {
    return [false, 'Too many requests. Try again later.'];
  }
  return [true, ''];
}

export const RATE_LIMIT_ROOMS = 10;
export const RATE_LIMIT_JOIN = 30;
export const RATE_LIMIT_REGISTER_SESSION = 30;
