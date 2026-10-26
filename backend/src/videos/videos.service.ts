import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApiError } from '../common/api-error';
import type { AppConfig } from '../config/app-config';
import { APP_CONFIG } from '../config/app-config';
import { FacebookVideoProvider } from '../providers/facebook/facebook.provider';
import { futurePlatformProviders, selectProvider } from '../providers/provider-registry';
import type { VideoProvider } from '../providers/video-provider';
import { redactUrl } from '../security/url-safety';
import { openAllowedMedia } from '../security/media-stream';
import { DownloadJobStore, LookupStore, toPublicLookup } from './video-store';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);
  private readonly lookups = new LookupStore();
  private readonly jobs = new DownloadJobStore();
  private readonly providers: VideoProvider[];

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    facebook: FacebookVideoProvider,
  ) {
    this.providers = [facebook, ...futurePlatformProviders()];
  }

  async lookup(rawUrl: string) {
    const { url, provider } = selectProvider(rawUrl, this.providers);
    this.logger.log(`lookup start platform=${provider.platform} url=${redactUrl(url.toString())}`);
    const result = await provider.lookup(url);
    const stored = this.lookups.save(result, this.config.lookupTtlMs);
    this.logger.log(`lookup stored platform=${provider.platform} qualities=${result.qualities.length}`);
    return toPublicLookup(stored);
  }

  getLookup(lookupId: string) {
    const record = this.requireLookup(lookupId);
    return toPublicLookup(record);
  }

  async createDownload(lookupId: string, qualityId: string) {
    const record = this.requireLookup(lookupId);
    const quality = record.qualities.find((item) => item.id === qualityId && item.available);
    if (!quality) throw new ApiError(400, 'QUALITY_UNAVAILABLE', 'That quality is not available for this video.');
    if (record.platform !== 'facebook') {
      throw new ApiError(503, 'PROVIDER_NOT_CONFIGURED', 'No download provider is configured for this platform.');
    }
    const facebook = this.facebook();
    await facebook.getAuthorizedSource(record.videoId);
    const job = this.jobs.create(lookupId, qualityId, this.config.lookupTtlMs);
    this.logger.log(`download job ready id=${job.jobId}`);
    return { jobId: job.jobId, status: job.status };
  }

  getDownload(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) throw new ApiError(404, 'JOB_NOT_FOUND', 'That download job does not exist or has expired.');
    return {
      jobId: job.jobId,
      status: job.status,
      errorCode: job.errorCode,
      errorMessage: job.errorMessage,
    };
  }

  async openDownload(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) throw new ApiError(404, 'JOB_NOT_FOUND', 'That download job does not exist or has expired.');
    const record = this.requireLookup(job.lookupId);
    if (record.platform !== 'facebook') {
      throw new ApiError(503, 'PROVIDER_NOT_CONFIGURED', 'No download provider is configured for this platform.');
    }
    try {
      const source = await this.facebook().getAuthorizedSource(record.videoId);
      const media = await openAllowedMedia(source.sourceUrl, {
        timeoutMs: this.config.downloadTimeoutMs,
        maxBytes: this.config.maxDownloadBytes,
      });
      this.jobs.update(job.jobId, { status: 'streaming' });
      media.stream.on('end', () => this.jobs.update(job.jobId, { status: 'completed' }));
      media.stream.on('error', (error: Error) => {
        this.logger.warn(`download failed id=${job.jobId} message=${error.message}`);
        this.jobs.update(job.jobId, { status: 'failed', errorCode: 'VIDEO_NOT_AVAILABLE', errorMessage: 'The video file could not be transferred.' });
      });
      return { ...media, filename: source.filename };
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file could not be transferred.');
      this.jobs.update(job.jobId, { status: 'failed', errorCode: apiError.code, errorMessage: apiError.message });
      throw apiError;
    }
  }

  private requireLookup(lookupId: string) {
    if (!/^[a-f0-9]{32}$/.test(lookupId)) throw new ApiError(400, 'INVALID_REQUEST', 'The lookup id is not valid.');
    const record = this.lookups.get(lookupId);
    if (!record) throw new ApiError(404, 'LOOKUP_NOT_FOUND', 'That lookup does not exist or has expired. Check the link again.');
    return record;
  }

  private facebook() {
    const facebook = this.providers.find((provider) => provider.platform === 'facebook');
    if (!(facebook instanceof FacebookVideoProvider)) {
      throw new ApiError(503, 'PROVIDER_NOT_CONFIGURED', 'The Facebook provider is not registered.');
    }
    return facebook;
  }
}
