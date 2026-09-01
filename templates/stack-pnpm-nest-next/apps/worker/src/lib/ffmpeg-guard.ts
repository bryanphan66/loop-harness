import { spawnSync } from 'node:child_process';

/**
 * True when `ffmpegPath` resolves to a runnable ffmpeg binary. Lets jobs
 * that depend on ffmpeg no-op gracefully (return a `skipped` result) instead
 * of crashing the worker in a bare env that never installed it.
 */
export function isFfmpegAvailable(ffmpegPath: string): boolean {
  const result = spawnSync(ffmpegPath, ['-version']);
  return result.status === 0;
}
