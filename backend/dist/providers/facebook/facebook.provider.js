"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookVideoProvider = void 0;
const app_config_1 = require("../../config/app-config");
const api_error_1 = require("../../common/api-error");
const url_safety_1 = require("../../security/url-safety");
const facebook_url_1 = require("./facebook-url");
const facebook_redirect_1 = require("./facebook-redirect");
const facebook_graph_client_1 = require("./facebook-graph.client");
const NOT_CONFIGURED = 'No media provider is configured. Set FACEBOOK_PAGE_ACCESS_TOKEN or FACEBOOK_USER_ACCESS_TOKEN only for a video that token is allowed to read. No download link was created.';
class FacebookVideoProvider {
    config;
    fetchImpl;
    platform = 'facebook';
    hosts = ['facebook.com', 'fb.watch'];
    unavailableMessage = NOT_CONFIGURED;
    constructor(config, fetchImpl = fetch) {
        this.config = config;
        this.fetchImpl = fetchImpl;
    }
    isConfigured() {
        return (0, app_config_1.facebookAccessToken)(this.config).length > 0;
    }
    async lookup(pageUrl) {
        const resolved = await (0, facebook_redirect_1.resolveFacebookVideoId)(pageUrl, this.fetchImpl, this.config.requestTimeoutMs);
        if (resolved.status === 'login_required') {
            throw new api_error_1.ApiError(403, 'LOGIN_REQUIRED', 'Facebook asked for a login. ReelFetch does not use cookies or a Facebook session, so this video was not opened.');
        }
        if (resolved.status === 'rate_limited') {
            throw new api_error_1.ApiError(429, 'PROVIDER_RATE_LIMITED', 'Facebook rate-limited the link check. Wait and try again.');
        }
        if (resolved.status === 'unavailable') {
            throw new api_error_1.ApiError(502, 'PROVIDER_ERROR', 'The Facebook link could not be resolved through a public redirect.');
        }
        if (resolved.status === 'unresolved') {
            throw new api_error_1.ApiError(422, 'LINK_ID_UNAVAILABLE', (0, facebook_url_1.unresolvedLinkMessage)(resolved.linkType));
        }
        if (!this.isConfigured()) {
            throw new api_error_1.ApiError(503, 'PROVIDER_NOT_CONFIGURED', `The link resolved to Facebook video ${resolved.videoId}. ${NOT_CONFIGURED}`);
        }
        const video = await this.readVideo(resolved.videoId);
        const lookup = this.toLookup(resolved.videoId, video);
        if (!lookup.qualities.some((item) => item.available)) {
            throw new api_error_1.ApiError(404, 'VIDEO_NOT_AVAILABLE', `Facebook video ${resolved.videoId} was identified, but no downloadable file URL was returned.`);
        }
        return lookup;
    }
    async getAuthorizedSource(videoId) {
        this.assertConfigured();
        const video = await this.readVideo(videoId);
        const sourceUrl = typeof video.source === 'string' ? video.source : '';
        if (!sourceUrl || !(0, url_safety_1.isAllowedMediaUrl)(sourceUrl)) {
            throw new api_error_1.ApiError(404, 'VIDEO_NOT_AVAILABLE', 'Facebook did not return an allowed downloadable file for this video. The token may not be permitted to read it, or the video may be private or restricted.');
        }
        return { sourceUrl, filename: `facebook-${videoId}.mp4` };
    }
    assertConfigured() {
        if (!this.isConfigured())
            throw new api_error_1.ApiError(503, 'PROVIDER_NOT_CONFIGURED', NOT_CONFIGURED);
    }
    readVideo(videoId) {
        const client = new facebook_graph_client_1.FacebookGraphClient(this.config.graphApiVersion, (0, app_config_1.facebookAccessToken)(this.config), this.config.requestTimeoutMs, this.fetchImpl);
        return client.getVideo(videoId);
    }
    toLookup(videoId, video) {
        const sourceUrl = typeof video.source === 'string' ? video.source : '';
        const sourceAllowed = Boolean(sourceUrl) && (0, url_safety_1.isAllowedMediaUrl)(sourceUrl);
        const thumbnail = typeof video.picture === 'string' && (0, url_safety_1.isAllowedMediaUrl)(video.picture) ? video.picture : undefined;
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
exports.FacebookVideoProvider = FacebookVideoProvider;
//# sourceMappingURL=facebook.provider.js.map