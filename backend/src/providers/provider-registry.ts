import { ApiError } from '../common/api-error';
import { parsePublicHttpUrl } from '../security/url-safety';
import { hostMatches, type VideoProvider } from './video-provider';

export function selectProvider(rawUrl: string, providers: VideoProvider[]) {
  const url = parsePublicHttpUrl(rawUrl);
  const provider = providers.find((candidate) => candidate.hosts.some((domain) => hostMatches(url.hostname, domain)));
  if (!provider) {
    throw new ApiError(400, 'UNSUPPORTED_LINK', 'That link is not on a supported video platform.');
  }
  return { url, provider };
}

const YOUTUBE = 'YouTube is not connected. The official YouTube Data API can return metadata for videos the caller may view, but it does not provide video file downloads. No download was attempted.';
const TIKTOK = 'TikTok is not connected. No official TikTok API for downloading arbitrary public videos is configured. No download was attempted.';
const INSTAGRAM = 'Instagram is not connected. No official Instagram API for downloading arbitrary Reels is configured. No download was attempted.';

export function futurePlatformProviders(): VideoProvider[] {
  return [
    unavailable('youtube', ['youtube.com', 'youtu.be', 'youtube-nocookie.com'], YOUTUBE),
    unavailable('tiktok', ['tiktok.com'], TIKTOK),
    unavailable('instagram', ['instagram.com'], INSTAGRAM),
  ];
}

function unavailable(platform: string, hosts: string[], message: string): VideoProvider {
  return {
    platform,
    hosts,
    unavailableMessage: message,
    isConfigured: () => false,
    lookup: async () => {
      throw new ApiError(503, 'PROVIDER_NOT_CONFIGURED', message);
    },
  };
}
