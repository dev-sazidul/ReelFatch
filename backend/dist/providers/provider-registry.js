"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectProvider = selectProvider;
exports.futurePlatformProviders = futurePlatformProviders;
const api_error_1 = require("../common/api-error");
const url_safety_1 = require("../security/url-safety");
const video_provider_1 = require("./video-provider");
function selectProvider(rawUrl, providers) {
    const url = (0, url_safety_1.parsePublicHttpUrl)(rawUrl);
    const provider = providers.find((candidate) => candidate.hosts.some((domain) => (0, video_provider_1.hostMatches)(url.hostname, domain)));
    if (!provider) {
        throw new api_error_1.ApiError(400, 'UNSUPPORTED_LINK', 'That link is not on a supported video platform.');
    }
    return { url, provider };
}
const YOUTUBE = 'YouTube is not connected. The official YouTube Data API can return metadata for videos the caller may view, but it does not provide video file downloads. No download was attempted.';
const TIKTOK = 'TikTok is not connected. No official TikTok API for downloading arbitrary public videos is configured. No download was attempted.';
const INSTAGRAM = 'Instagram is not connected. No official Instagram API for downloading arbitrary Reels is configured. No download was attempted.';
function futurePlatformProviders() {
    return [
        unavailable('youtube', ['youtube.com', 'youtu.be', 'youtube-nocookie.com'], YOUTUBE),
        unavailable('tiktok', ['tiktok.com'], TIKTOK),
        unavailable('instagram', ['instagram.com'], INSTAGRAM),
    ];
}
function unavailable(platform, hosts, message) {
    return {
        platform,
        hosts,
        unavailableMessage: message,
        isConfigured: () => false,
        lookup: async () => {
            throw new api_error_1.ApiError(503, 'PROVIDER_NOT_CONFIGURED', message);
        },
    };
}
//# sourceMappingURL=provider-registry.js.map