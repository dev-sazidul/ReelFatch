import { randomBytes } from 'node:crypto';
import type { ProviderLookup, VideoQuality } from '../providers/video-provider';

export type StoredLookup = ProviderLookup & {
  lookupId: string;
  expiresAt: number;
};

export type DownloadJob = {
  jobId: string;
  lookupId: string;
  qualityId: string;
  status: 'ready' | 'streaming' | 'completed' | 'failed';
  errorCode?: string;
  errorMessage?: string;
  createdAt: number;
  expiresAt: number;
};

export type PublicLookup = {
  lookupId: string;
  platform: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  sourceLabel: string;
  qualities: VideoQuality[];
  reportedFormats: Array<{ width?: number; height?: number }>;
};

/**
 * In-process lookup and download records. A BullMQ queue can replace DownloadJobStore
 * when Redis is available; controllers should keep calling this service instead of Redis directly.
 */
export class LookupStore {
  private readonly records = new Map<string, StoredLookup>();

  save(lookup: ProviderLookup, ttlMs: number): StoredLookup {
    const record: StoredLookup = { ...lookup, lookupId: randomBytes(16).toString('hex'), expiresAt: Date.now() + ttlMs };
    this.records.set(record.lookupId, record);
    return record;
  }

  get(lookupId: string) {
    this.purge();
    const record = this.records.get(lookupId);
    if (!record || record.expiresAt <= Date.now()) return undefined;
    return record;
  }

  private purge() {
    const now = Date.now();
    for (const [id, record] of this.records) {
      if (record.expiresAt <= now) this.records.delete(id);
    }
  }
}

export class DownloadJobStore {
  private readonly jobs = new Map<string, DownloadJob>();

  create(lookupId: string, qualityId: string, ttlMs: number): DownloadJob {
    const job: DownloadJob = {
      jobId: randomBytes(16).toString('hex'),
      lookupId,
      qualityId,
      status: 'ready',
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };
    this.jobs.set(job.jobId, job);
    return job;
  }

  get(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job || job.expiresAt <= Date.now()) return undefined;
    return job;
  }

  update(jobId: string, patch: Partial<DownloadJob>) {
    const job = this.get(jobId);
    if (!job) return undefined;
    Object.assign(job, patch);
    return job;
  }
}

export function toPublicLookup(record: StoredLookup): PublicLookup {
  return {
    lookupId: record.lookupId,
    platform: record.platform,
    title: record.title,
    description: record.description,
    thumbnailUrl: record.thumbnailUrl,
    sourceLabel: record.sourceLabel,
    qualities: record.qualities,
    reportedFormats: record.reportedFormats,
  };
}
