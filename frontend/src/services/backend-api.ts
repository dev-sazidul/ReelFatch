import { VideoLookupError, type AuthorizedVideoProvider, type AuthorizedVideoResult, type DownloadProgress } from '@/services/platform-integrations';

type ApiFailure = { code?: string; message?: string; detail?: string; title?: string };

type LookupResponse = {
  lookupId?: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  sourceLabel?: string;
  qualities?: AuthorizedVideoResult['qualities'];
  reportedFormats?: AuthorizedVideoResult['reportedFormats'];
};

type DownloadStatusResponse = {
  jobId?: string;
  status?: 'ready' | 'streaming' | 'completed' | 'failed';
  errorCode?: string;
  errorMessage?: string;
};

export function createBackendVideoProvider(baseUrl: string): AuthorizedVideoProvider {
  const root = baseUrl.replace(/\/$/, '');
  return {
    async lookup(url, signal) {
      let response: Response;
      try {
        response = await fetch(`${root}/api/videos/lookup`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ url }),
          signal: signal ?? AbortSignal.timeout(25_000),
        });
      } catch {
        throw new VideoLookupError('The ReelFetch server could not be reached. Please try again in a moment.', { code: 'SERVER_UNREACHABLE' });
      }
      const body = await readBody(response);
      if (!response.ok) throw toLookupError(response.status, body);
      const lookup = body as LookupResponse | null;
      if (!lookup?.lookupId || !lookup.sourceLabel) {
        throw new VideoLookupError('The server response did not include video details.', { status: response.status, code: 'INVALID_RESPONSE' });
      }
      return {
        title: lookup.title,
        description: lookup.description,
        thumbnailUrl: lookup.thumbnailUrl,
        sourceLabel: lookup.sourceLabel,
        qualities: lookup.qualities ?? [],
        reportedFormats: lookup.reportedFormats,
        sourceReference: lookup.lookupId,
      };
    },
    async download(sourceReference, qualityId, onProgress) {
      const created = await requestJson(`${root}/api/videos/downloads`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ lookupId: sourceReference, qualityId }),
        signal: AbortSignal.timeout(20_000),
      });
      const jobId = (created as { jobId?: string }).jobId;
      if (!jobId) throw new VideoLookupError('The server did not start a download job.', { code: 'INVALID_RESPONSE' });

      const fileUrl = `${root}/api/videos/downloads/${encodeURIComponent(jobId)}/file`;
      triggerNativeDownload(fileUrl);
      onProgress?.({ loaded: 0 });

      // Poll job status briefly to surface server-side extraction/transfer failures if they occur early
      for (let attempt = 0; attempt < 6; attempt += 1) {
        await delay(1000);
        try {
          const statusResp = await fetch(`${root}/api/videos/downloads/${encodeURIComponent(jobId)}`, {
            headers: { accept: 'application/json' },
            signal: AbortSignal.timeout(8_000),
          });
          if (!statusResp.ok) break;
          const job = (await readBody(statusResp)) as DownloadStatusResponse | null;
          if (!job) break;
          if (job.status === 'failed') {
            throw new VideoLookupError(job.errorMessage || 'The video file could not be transferred.', {
              code: job.errorCode || 'VIDEO_NOT_AVAILABLE',
            });
          }
          if (job.status === 'completed') {
            onProgress?.({ loaded: 1, total: 1 });
            return;
          }
        } catch (err) {
          if (err instanceof VideoLookupError) throw err;
          break;
        }
      }
    },
  };
}

function triggerNativeDownload(fileUrl: string) {
  const anchor = document.createElement('a');
  anchor.href = fileUrl;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function requestJson(url: string, init: RequestInit) {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new VideoLookupError('The ReelFetch server could not be reached. Please try again in a moment.', { code: 'SERVER_UNREACHABLE' });
  }
  const body = await readBody(response);
  if (!response.ok) throw toLookupError(response.status, body);
  return body ?? {};
}

async function readBody(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as ApiFailure;
  } catch {
    return null;
  }
}

function toLookupError(status: number, body: ApiFailure | null) {
  const fallback = body?.detail || body?.title || `The server returned HTTP ${status}.`;
  return new VideoLookupError(body?.message || fallback, {
    status,
    code: body?.code,
    responseSummary: body?.code,
  });
}

export function filenameFrom(disposition: string | null) {
  if (!disposition) return 'video.mp4';
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;\s]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      /* fallback below */
    }
  }
  const asciiMatch = disposition.match(/filename="([^"]+)"/);
  return asciiMatch?.[1] || 'video.mp4';
}
