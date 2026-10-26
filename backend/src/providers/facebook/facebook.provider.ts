import type { AppConfig } from '../../config/app-config';
import { facebookAccessToken } from '../../config/app-config';
import { ApiError } from '../../common/api-error';
import { isAllowedMediaUrl } from '../../security/url-safety';
import { unresolvedLinkMessage } from './facebook-url';
import { resolveFacebookVideoId } from './facebook-redirect';
import { FacebookGraphClient, type GraphVideo } from './facebook-graph.client';
import type { ProviderLookup, VideoProvider } from '../video-provider';

const NOT_CONFIGURED = 'No media provider is configured. Set FACEBOOK_PAGE_ACCESS_TOKEN or FACEBOOK_USER_ACCESS_TOKEN only for a video that token is allowed to read. No download link was created.';

export class FacebookVideoProvider implements VideoProvider {
  readonly platform = 'facebook' as const;
  readonly hosts = ['facebook.com', 'fb.watch'];
  readonly unavailableMessage = NOT_CONFIGURED;

  constructor(
    private readonly config: AppConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  isConfigured() {
    return facebookAccessToken(this.config).length > 0;
  }

  async lookup(pageUrl: URL): Promise<ProviderLookup> {
    const resolved = await resolveFacebookVideoId(pageUrl, this.fetchImpl, this.config.requestTimeoutMs);
    if (resolved.status === 'login_required') {
      throw new ApiError(403, 'LOGIN_REQUIRED', 'Facebook asked for a login. ReelFetch does not use cookies or a Facebook session, so this video was not opened.');
    }
    if (resolved.status === 'rate_limited') {
      throw new ApiError(429, 'PROVIDER_RATE_LIMITED', 'Facebook rate-limited the link check. Wait and try again.');
    }
    if (resolved.status === 'unavailable') {
      throw new ApiError(502, 'PROVIDER_ERROR', 'The Facebook link could not be resolved through a public redirect.');
    }
    if (resolved.status === 'unresolved') {
      throw new ApiError(422, 'LINK_ID_UNAVAILABLE', unresolvedLinkMessage(resolved.linkType));
    }
    if (!this.isConfigured()) {
      throw new ApiError(503, 'PROVIDER_NOT_CONFIGURED', `The link resolved to Facebook video ${resolved.videoId}. ${NOT_CONFIGURED}`);
    }
    const video = await this.readVideo(resolved.videoId);
    const lookup = this.toLookup(resolved.videoId, video);
    if (!lookup.qualities.some((item) => item.available)) {
      throw new ApiError(404, 'VIDEO_NOT_AVAILABLE', `Facebook video ${resolved.videoId} was identified, but no downloadable file URL was returned.`);
    }
    return lookup;
  }

  async getAuthorizedSource(videoId: string) {
    this.assertConfigured();
    const video = await this.readVideo(videoId);
    const sourceUrl = typeof video.source === 'string' ? video.source : '';
    if (!sourceUrl || !isAllowedMediaUrl(sourceUrl)) {
      throw new ApiError(404, 'VIDEO_NOT_AVAILABLE', 'Facebook did not return an allowed downloadable file for this video. The token may not be permitted to read it, or the video may be private or restricted.');
    }
    return { sourceUrl, filename: `facebook-${videoId}.mp4` };
  }

  private assertConfigured() {
    if (!this.isConfigured()) throw new ApiError(503, 'PROVIDER_NOT_CONFIGURED', NOT_CONFIGURED);
  }

  private readVideo(videoId: string) {
    const client = new FacebookGraphClient(
      this.config.graphApiVersion,
      facebookAccessToken(this.config),
      this.config.requestTimeoutMs,
      this.fetchImpl,
    );
    return client.getVideo(videoId);
  }

  private toLookup(videoId: string, video: GraphVideo): ProviderLookup {
    const sourceUrl = typeof video.source === 'string' ? video.source : '';
    const sourceAllowed = Boolean(sourceUrl) && isAllowedMediaUrl(sourceUrl);
    const thumbnail = typeof video.picture === 'string' && isAllowedMediaUrl(video.picture) ? video.picture : undefined;
    return {
      platform: 'facebook',
      videoId,
      title: video.name?.slice(0, 180) || undefined,
      description: video.description?.slice(0, 500) || undefined,
      thumbnailUrl: thumbnail,
      sourceLabel: 'Facebook Graph API',
      qualities: sourceAllowed
        ? [{ id: 'source', label: 'Original file', available: true, format: 'mp4' }]
        : [],
      reportedFormats: (video.format ?? [])
        .filter((item) => Number.isFinite(item.width) || Number.isFinite(item.height))
        .map((item) => ({ width: item.width, height: item.height })),
    };
  }
}
