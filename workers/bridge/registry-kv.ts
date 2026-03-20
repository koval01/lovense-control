/** SQLite KV facade used by BridgeRegistry (Durable Object storage.kv). */
export type BridgeRegistryKv = {
  get(key: string): unknown;
  put(key: string, value: string): void;
  delete(key: string): void;
};
