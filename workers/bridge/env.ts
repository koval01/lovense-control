/** Shared worker environment shape (HTTP entry + Durable Objects). */

export interface Env {
  JWT_SECRET: string;
  BRIDGE_REGISTRY: DurableObjectNamespace;
  BRIDGE_ROOM: DurableObjectNamespace;
  ALLOW_SELF_PAIRING?: string;
  CORS_ORIGINS?: string;
  BRIDGE_ENV?: string;
}

export const DEFAULT_JWT_SECRET = 'dev_secret_bridge_min_32_bytes_long';
