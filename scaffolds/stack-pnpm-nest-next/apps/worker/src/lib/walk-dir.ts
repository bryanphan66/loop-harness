import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

/** Recursively lists every file under `dir`, returning paths relative to `dir`. */
export async function walkDir(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      if (entry.isDirectory()) {
        // Nested paths come back relative to the SUBdirectory — re-prefix
        // with entry.name so the result stays relative to the original `dir`.
        const nested = await walkDir(join(dir, entry.name));
        return nested.map((relativeFile) => join(entry.name, relativeFile));
      }
      return [entry.name];
    }),
  );
  return files.flat();
}

const CONTENT_TYPES: Record<string, string> = {
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
};

export function contentTypeFor(filePath: string): string | undefined {
  const ext = filePath.slice(filePath.lastIndexOf('.'));
  return CONTENT_TYPES[ext];
}
