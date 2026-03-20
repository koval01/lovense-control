const BRIDGE_PATH_PREFIX = '/bridge';

/** Normalize path: /bridge/rooms -> /rooms, /bridge/ws -> /ws. Supports same-domain routing. */
export function normalizeBridgePath(path: string): string {
  if (path.startsWith(BRIDGE_PATH_PREFIX)) {
    const rest = path.slice(BRIDGE_PATH_PREFIX.length) || '/';
    return rest.startsWith('/') ? rest : `/${rest}`;
  }
  return path;
}
