import { spawnSync } from 'node:child_process';

/**
 * True when `sourcePath` has at least one audio stream. A silent/screen-
 * capture upload has none — the HLS ladder (hls-ladder.ts) needs to know
 * this UP FRONT, because ffmpeg's `-var_stream_map` must not reference an
 * `a:N` output stream that doesn't exist (an optional `-map 0:a:0?` alone
 * only skips the map; a stale `a:N` still left in `-var_stream_map` fails the
 * whole HLS mux with "Unable to map stream").
 */
export function hasAudioStream(ffprobePath: string, sourcePath: string): boolean {
  const result = spawnSync(ffprobePath, [
    '-v',
    'error',
    '-select_streams',
    'a',
    '-show_entries',
    'stream=index',
    '-of',
    'csv=p=0',
    sourcePath,
  ]);
  return result.status === 0 && result.stdout.toString().trim().length > 0;
}
