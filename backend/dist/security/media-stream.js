"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openAllowedMedia = openAllowedMedia;
const node_stream_1 = require("node:stream");
const api_error_1 = require("../common/api-error");
const url_safety_1 = require("./url-safety");
async function openAllowedMedia(sourceUrl, options) {
    const fetchImpl = options.fetchImpl ?? fetch;
    let current = sourceUrl;
    let response = null;
    for (let hop = 0; hop < 3; hop += 1) {
        if (!(0, url_safety_1.isAllowedMediaUrl)(current)) {
            throw new api_error_1.ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The file address from Facebook is not on an allowed media host.');
        }
        let next;
        try {
            next = await fetchImpl(current, { redirect: 'manual', signal: AbortSignal.timeout(options.timeoutMs) });
        }
        catch (error) {
            if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
                throw new api_error_1.ApiError(504, 'PROVIDER_TIMEOUT', 'The video file host did not respond before the timeout.');
            }
            throw new api_error_1.ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file host could not be reached.');
        }
        if (next.status >= 300 && next.status < 400) {
            const location = next.headers.get('location');
            await next.body?.cancel();
            if (!location)
                throw new api_error_1.ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file host sent an incomplete redirect.');
            current = new URL(location, current).toString();
            continue;
        }
        response = next;
        break;
    }
    if (!response)
        throw new api_error_1.ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file host redirected too many times.');
    if (!response.ok || !response.body) {
        await response.body?.cancel();
        throw new api_error_1.ApiError(502, 'VIDEO_NOT_AVAILABLE', `The video file host returned HTTP ${response.status}.`);
    }
    const contentType = (response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (!contentType.startsWith('video/') && contentType !== 'application/octet-stream') {
        await response.body.cancel();
        throw new api_error_1.ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file host did not return a video file.');
    }
    const lengthHeader = response.headers.get('content-length');
    const contentLength = lengthHeader ? Number(lengthHeader) : undefined;
    if (contentLength !== undefined && (!Number.isFinite(contentLength) || contentLength > options.maxBytes)) {
        await response.body.cancel();
        throw new api_error_1.ApiError(413, 'FILE_TOO_LARGE', 'The video file exceeds the configured size limit.');
    }
    const nodeStream = node_stream_1.Readable.fromWeb(response.body);
    return {
        stream: capBytes(nodeStream, options.maxBytes),
        contentType,
        contentLength: Number.isFinite(contentLength) ? contentLength : undefined,
    };
}
function capBytes(source, maxBytes) {
    const output = new node_stream_1.PassThrough();
    let seen = 0;
    source.on('data', (chunk) => {
        seen += chunk.length;
        if (seen > maxBytes) {
            const error = new api_error_1.ApiError(413, 'FILE_TOO_LARGE', 'The video file exceeds the configured size limit.');
            source.destroy(error);
            output.destroy(error);
            return;
        }
        output.write(chunk);
    });
    source.on('end', () => output.end());
    source.on('error', (error) => output.destroy(error));
    return output;
}
//# sourceMappingURL=media-stream.js.map