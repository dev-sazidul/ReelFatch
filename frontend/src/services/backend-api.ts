import { VideoLookupError, type AuthorizedVideoProvider, type AuthorizedVideoResult, type DownloadProgress } from '@/services/platform-integrations';

type ApiFailure = { code?: string; message?: string };

type LookupResponse = {
  lookupId?: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  sourceLabel?: string;
  qualities?: AuthorizedVideoResult['qualities'];
  reportedFormats?: AuthorizedVideoResult['reportedFormats'];
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
          signal: signal ?? AbortSignal.timeout(20_000),
        });
      } catch {
        throw new VideoLookupError('The ReelFetch server could not be reached. Start the backend, then try again.', { code: 'SERVER_UNREACHABLE' });
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

      let file: Response;
      try {
        file = await fetch(`${root}/api/videos/downloads/${jobId}/file`, { signal: AbortSignal.timeout(120_000) });
      } catch {
        throw new VideoLookupError('The download connection was interrupted.', { code: 'SERVER_UNREACHABLE' });
      }
      if (!file.ok) throw toLookupError(file.status, await readBody(file));
      await saveFile(file, onProgress);
    },
  };
}

async function requestJson(url: string, init: RequestInit) {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new VideoLookupError('The ReelFetch server could not be reached. Start the backend, then try again.', { code: 'SERVER_UNREACHABLE' });
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
  return new VideoLookupError(body?.message || `The server returned HTTP ${status}.`, {
    status,
    code: body?.code,
    responseSummary: body?.code,
  });
}

async function saveFile(response: Response, onProgress?: (progress: DownloadProgress) => void) {
  const totalHeader = response.headers.get('content-length');
  const total = totalHeader ? Number(totalHeader) : undefined;
  const reader = response.body?.getReader();
  if (!reader) throw new VideoLookupError('The download response did not include a file.', { code: 'INVALID_RESPONSE' });

  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    loaded += value.byteLength;
    onProgress?.({ loaded, total: Number.isFinite(total) ? total : undefined });
  }

  const type = response.headers.get('content-type') || 'video/mp4';
  const blob = new Blob(chunks as BlobPart[], { type });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filenameFrom(response.headers.get('content-disposition'));
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

function filenameFrom(disposition: string | null) {
  const match = disposition?.match(/filename="([A-Za-z0-9._-]+)"/);
  return match?.[1] || 'facebook-video.mp4';
}
