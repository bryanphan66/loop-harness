import { describe, expect, it } from 'vitest';
import { isFfmpegAvailable } from './ffmpeg-guard';

describe('isFfmpegAvailable', () => {
  it('returns false for a binary that does not exist', () => {
    expect(isFfmpegAvailable('/no/such/binary-ffmpeg')).toBe(false);
  });

  it('returns true for a real, always-present binary (proxy for "ffmpeg on PATH")', () => {
    // `true` ignores all args and always exits 0 — a portable stand-in so
    // this guard-logic unit test has no hard dependency on ffmpeg being
    // installed. The real ffmpeg path is exercised in transcode.job.test.ts
    // (which itself skips cleanly when ffmpeg is absent).
    expect(isFfmpegAvailable('true')).toBe(true);
  });
});
