import { Readable, PassThrough } from 'node:stream';
import { ApiError } from '../common/api-error';
import { isAllowedMediaUrl } from './url-safety';

export type OpenedMedia = {
  stream: Readable;
  contentType: string;
  contentLength?: number;
};

export async function openAllowedMedia(
  sourceUrl: string,
  options: { timeoutMs: number; maxBytes: number; fetchImpl?: typeof fetch },
): Promise<OpenedMedia> {
  const fetchImpl = options.fetchImpl ?? fetch;
  let current = sourceUrl;
  let response: Response | null = null;

  for (let hop = 0; hop < 3; hop += 1) {
    if (!isAllowedMediaUrl(current)) {
      throw new ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The file address from Facebook is not on an allowed media host.');
    }
    let next: Response;
    try {
      next = await fetchImpl(current, { redirect: 'manual', signal: AbortSignal.timeout(options.timeoutMs) });
    } catch (error) {
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        throw new ApiError(504, 'PROVIDER_TIMEOUT', 'The video file host did not respond before the timeout.');
      }
      throw new ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file host could not be reached.');
    }
    if (next.status >= 300 && next.status < 400) {
      const location = next.headers.get('location');
      await next.body?.cancel();
      if (!location) throw new ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file host sent an incomplete redirect.');
      current = new URL(location, current).toString();
      continue;
    }
    response = next;
    break;
  }

  if (!response) throw new ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file host redirected too many times.');
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new ApiError(502, 'VIDEO_NOT_AVAILABLE', `The video file host returned HTTP ${response.status}.`);
  }

  const contentType = (response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (!contentType.startsWith('video/') && contentType !== 'application/octet-stream') {
    await response.body.cancel();
    throw new ApiError(502, 'VIDEO_NOT_AVAILABLE', 'The video file host did not return a video file.');
  }

  const lengthHeader = response.headers.get('content-length');
  const contentLength = lengthHeader ? Number(lengthHeader) : undefined;
  if (contentLength !== undefined && (!Number.isFinite(contentLength) || contentLength > options.maxBytes)) {
    await response.body.cancel();
    throw new ApiError(413, 'FILE_TOO_LARGE', 'The video file exceeds the configured size limit.');
  }

  const nodeStream = Readable.fromWeb(response.body as import('node:stream/web').ReadableStream);
  return {
    stream: capBytes(nodeStream, options.maxBytes),
    contentType,
    contentLength: Number.isFinite(contentLength) ? contentLength : undefined,
  };
}

function capBytes(source: Readable, maxBytes: number) {
  const output = new PassThrough();
  let seen = 0;
  source.on('data', (chunk: Buffer) => {
    seen += chunk.length;
    if (seen > maxBytes) {
      const error = new ApiError(413, 'FILE_TOO_LARGE', 'The video file exceeds the configured size limit.');
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
