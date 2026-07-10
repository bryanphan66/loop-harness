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
 */
export function buildHlsLadderArgs(inputUrl: string, renditions: RenditionSpec[] = HLS_RENDITIONS): string[] {
  const filterComplex = [
    `[0:v]split=${renditions.length}${renditions.map((_, i) => `[v${i}]`).join('')}`,
    ...renditions.map((r, i) => `[v${i}]scale=w=-2:h=${r.height}[v${i}out]`),
  ].join('; ');

  return [
    '-y',
    '-i',
    inputUrl,
    '-filter_complex',
    filterComplex,
    ...renditions.flatMap((r, i) => [
      '-map',
      `[v${i}out]`,
      '-map',
      '0:a:0',
      `-c:v:${i}`,
      'libx264',
      `-b:v:${i}`,
      r.videoBitrate,
      `-c:a:${i}`,
      'aac',
      `-b:a:${i}`,
      r.audioBitrate,
    ]),
    '-var_stream_map',
    renditions.map((r, i) => `v:${i},a:${i},name:${r.label}`).join(' '),
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
