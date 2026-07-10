import { describe, expect, it } from 'vitest';
import { HLS_RENDITIONS, buildHlsLadderArgs } from './hls-ladder';

describe('buildHlsLadderArgs', () => {
  it('ships the 480/720/1080p ladder', () => {
    expect(HLS_RENDITIONS.map((r) => r.label)).toEqual(['480p', '720p', '1080p']);
  });

  it('splits the input into one branch per rendition and scales each to its height', () => {
    const args = buildHlsLadderArgs('https://example.com/source.mp4');
    const filterComplexIndex = args.indexOf('-filter_complex') + 1;
    const filterComplex = args[filterComplexIndex];

    expect(filterComplex).toContain('split=3');
    expect(filterComplex).toContain('scale=w=-2:h=480');
    expect(filterComplex).toContain('scale=w=-2:h=720');
    expect(filterComplex).toContain('scale=w=-2:h=1080');
  });

  it('names each variant stream so %v resolves to a readable rendition folder', () => {
    const args = buildHlsLadderArgs('https://example.com/source.mp4');
    const varStreamMapIndex = args.indexOf('-var_stream_map') + 1;

    expect(args[varStreamMapIndex]).toBe('v:0,a:0,name:480p v:1,a:1,name:720p v:2,a:2,name:1080p');
  });

  it('outputs a VOD HLS playlist with a named master playlist', () => {
    const args = buildHlsLadderArgs('https://example.com/source.mp4');

    expect(args).toContain('vod');
    expect(args).toContain('master.m3u8');
    expect(args[args.length - 1]).toBe('%v/playlist.m3u8');
  });

  it('uses the given input URL directly (works for both signed HTTPS and file:// URLs)', () => {
    const args = buildHlsLadderArgs('file:///tmp/source.mp4');
    expect(args[args.indexOf('-i') + 1]).toBe('file:///tmp/source.mp4');
  });
});
