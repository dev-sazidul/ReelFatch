"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookGraphClient = void 0;
exports.mapGraphFailure = mapGraphFailure;
const api_error_1 = require("../../common/api-error");
function mapGraphFailure(status, error, secrets) {
    const graphCode = error?.code;
    const safeMessage = (0, api_error_1.redactSensitive)(error?.message ?? 'Facebook rejected the request.', secrets);
    if (graphCode === 190 || status === 401) {
        return new api_error_1.ApiError(401, 'PROVIDER_UNAUTHORIZED', 'The Facebook access token was rejected. Check the token, its permissions, and that it has not expired.');
    }
    if (graphCode === 4 || graphCode === 17 || graphCode === 32 || graphCode === 613 || status === 429) {
        return new api_error_1.ApiError(429, 'PROVIDER_RATE_LIMITED', 'Facebook rate-limited the request. Wait and try again.');
    }
    if (graphCode === 10 || graphCode === 200 || graphCode === 273) {
        return new api_error_1.ApiError(403, 'VIDEO_NOT_PERMITTED', 'Facebook did not permit access to this video. The token must belong to a person or Page allowed to read it.');
    }
    if (graphCode === 100 || graphCode === 803 || status === 404) {
        return new api_error_1.ApiError(404, 'VIDEO_NOT_FOUND', 'Facebook could not find a video for that id. The link may not be a video, or the id may be wrong.');
    }
    return new api_error_1.ApiError(502, 'PROVIDER_ERROR', `Facebook returned HTTP ${status}${graphCode ? ` (code ${graphCode})` : ''}. ${safeMessage}`.slice(0, 300));
}
class FacebookGraphClient {
    version;
    token;
    timeoutMs;
    fetchImpl;
    constructor(version, token, timeoutMs, fetchImpl = fetch) {
        this.version = version;
        this.token = token;
        this.timeoutMs = timeoutMs;
        this.fetchImpl = fetchImpl;
    }
    async getVideo(videoId) {
        if (!/^\d{5,20}$/.test(videoId)) {
            throw new api_error_1.ApiError(400, 'INVALID_URL', 'The video id is not numeric.');
        }
        const endpoint = new URL(`https://graph.facebook.com/${this.version}/${videoId}`);
        endpoint.searchParams.set('fields', 'id,name,description,picture,source,format');
        let response;
        try {
            response = await this.fetchImpl(endpoint, {
                headers: { authorization: `Bearer ${this.token}`, accept: 'application/json' },
                redirect: 'error',
                signal: AbortSignal.timeout(this.timeoutMs),
            });
        }
        catch (error) {
            if (error instanceof Error && error.name === 'TimeoutError') {
                throw new api_error_1.ApiError(504, 'PROVIDER_TIMEOUT', 'The Facebook Graph API did not respond before the timeout.');
            }
            if (error instanceof Error && error.name === 'AbortError') {
                throw new api_error_1.ApiError(504, 'PROVIDER_TIMEOUT', 'The Facebook Graph API request was aborted.');
            }
            throw new api_error_1.ApiError(502, 'PROVIDER_ERROR', 'The Facebook Graph API could not be reached.');
        }
        let body = {};
        try {
            body = (await response.json());
        }
        catch {
            throw new api_error_1.ApiError(502, 'PROVIDER_ERROR', `Facebook returned HTTP ${response.status} with an unreadable response.`);
        }
        if (!response.ok || body.error) {
            throw mapGraphFailure(response.status, body.error, [this.token]);
        }
        return body;
    }
}
exports.FacebookGraphClient = FacebookGraphClient;
//# sourceMappingURL=facebook-graph.client.js.map