import type { Job, JobState, Queue, Worker } from 'bullmq';

// Re-exported so consumers (api, worker) never need a direct `bullmq`
// dependency just to type-annotate a job handler, a queue/worker field, or a
// job state.
export type { Job, JobState, Queue, Worker };

/**
 * Registry of job names this stack ships. Extend the union + the two maps
 * below when a project adds another async job (cert-pdf, email-blast, ...) —
 * keeps payload/result typed per job name instead of `unknown`.
 */
export type JobName = 'transcode';

export interface TranscodeJobPayload {
  /** Storage key of the already-uploaded source video. */
  sourceKey: string;
  /** Storage key prefix HLS output (master + rendition playlists/segments) is written under. */
  outputPrefix: string;
}

export interface TranscodeRendition {
  label: '480p' | '720p' | '1080p';
  playlistKey: string;
}

export interface TranscodeJobResult {
  manifestKey: string;
  renditions: TranscodeRendition[];
  /** True when the job no-op'd because ffmpeg was unavailable (bare/dev env). */
  skipped?: boolean;
  reason?: string;
}

export interface JobPayloadMap {
  transcode: TranscodeJobPayload;
}

export interface JobResultMap {
  transcode: TranscodeJobResult;
}

export interface JobStatus {
  state: JobState | 'unknown';
  // Matches bullmq's own Job['progress'] shape rather than a guessed one.
  progress: Job<unknown, unknown, string>['progress'];
  failedReason?: string;
}
