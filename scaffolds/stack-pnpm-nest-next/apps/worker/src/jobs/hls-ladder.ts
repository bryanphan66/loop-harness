import type { TranscodeRendition } from '@__PROJECT_SLUG__/queue-core';

export interface RenditionSpec {
  label: TranscodeRendition['label'];
  height: number;
  videoBitrate: string;
  audioBitrate: string;
}

/** 480/720/1080p ladder — the multi-bitrate rungs the media-pipeline playbook requires present. */
export const HLS_RENDITIONS: RenditionSpec[] = [
  { label: '480p', height: 480, videoBitrate: '800k', audioBitrate: '96k' },
  { label: '720p', height: 720, videoBitrate: '2500k', audioBitrate: '128k' },
  { label: '1080p', height: 1080, videoBitrate: '5000k', audioBitrate: '128k' },
];

/**
 * Builds the ffmpeg args for one documented command that produces the whole
 * HLS ladder + a master playlist in a single pass: `split` the input video
 * stream once per rendition, `scale` each copy, encode at its bitrate, mux
 * all variants with `-var_stream_map`. Run with `cwd` = the output dir so the
 * relative `%v/...` output patterns below land at `<cwd>/<label>/...` and the
 * master playlist at `<cwd>/master.m3u8`.
 *
 * `sourcePath` is a **local file path** (transcode.job.ts downloads the
 * signed-GET source to a tmp file up front — a job outliving the URL's TTL
 * must not hand ffmpeg a URL that can expire mid-run); the parameter still
 * accepts any string ffmpeg's `-i` understands (this fn does not care), which
 * is why the unit test below also exercises a bare `file://` URL.
 *
 * `hasAudio` (probe-audio.ts, ffprobe-detected — a silent/screen-capture
 * source has none) drives whether audio is mapped/encoded AND whether
 * `-var_stream_map` references an `a:N` stream at all: a trailing `?` on
 * `-map 0:a:0?` alone only makes the map itself optional — `-var_stream_map`
 * would still reference the now-nonexistent `a:N` output and ffmpeg would
 * fail the whole HLS mux ("Unable to map stream"), so the two must agree.
 */
export function buildHlsLadderArgs(
  sourcePath: string,
  renditions: RenditionSpec[] = HLS_RENDITIONS,
  hasAudio = true,
): string[] {
  const filterComplex = [
    `[0:v]split=${renditions.length}${renditions.map((_, i) => `[v${i}]`).join('')}`,
    ...renditions.map((r, i) => `[v${i}]scale=w=-2:h=${r.height}[v${i}out]`),
  ].join('; ');

  return [
    '-y',
    '-i',
    sourcePath,
    '-filter_complex',
    filterComplex,
    ...renditions.flatMap((r, i) => [
      '-map',
      `[v${i}out]`,
      ...(hasAudio ? ['-map', '0:a:0?'] : []),
      `-c:v:${i}`,
      'libx264',
      `-b:v:${i}`,
      r.videoBitrate,
      ...(hasAudio ? [`-c:a:${i}`, 'aac', `-b:a:${i}`, r.audioBitrate] : []),
    ]),
    '-var_stream_map',
    renditions.map((r, i) => (hasAudio ? `v:${i},a:${i},name:${r.label}` : `v:${i},name:${r.label}`)).join(' '),
    '-f',
    'hls',
    '-hls_time',
    '6',
    '-hls_playlist_type',
    'vod',
    '-master_pl_name',
    'master.m3u8',
    '-hls_segment_filename',
    '%v/segment_%03d.ts',
    '%v/playlist.m3u8',
  ];
}
