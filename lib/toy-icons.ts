/**
 * Maps toy names to icon asset paths.
 */

/** Returns the public path for a toy's icon, or null if none. */
export function getToyIcon(name: string): string | null {
  const t = name.toLowerCase();
  if (t.includes('lush')) return '/lush.png';
  if (t.includes('hush')) return '/hush.png';
  if (t.includes('edge')) return '/edge.png';
  if (t.includes('nora')) return '/nora.png';
  if (t.includes('domi')) return '/domi.png';
  if (t.includes('ferri')) return '/ferri.png';
  if (t.includes('tenera')) return '/tenera.png';
  if (t.includes('gush')) return '/gush.png';
  if (t.includes('max')) return '/max.png';
  if (t.includes('osci')) return '/osci.png';
  if (t.includes('mission')) return '/mission.png';
  return null;
}
