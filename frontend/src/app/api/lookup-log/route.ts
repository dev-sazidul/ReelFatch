import { formatLookupLog, redactUrl, type LookupLogEvent } from '@/services/lookup-log';

const MAX_BODY_CHARS = 8_000;

async function readBody(request: Request) {
  if (!request.body) return '';
  const reader = request.body.pipeThrough(new TextDecoderStream()).getReader();
  let body = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return body;
    body += value;
    if (body.length > MAX_BODY_CHARS) {
      await reader.cancel();
      throw new Error('Lookup log body is too large.');
    }
  }
}

/**
 * Development-only lookup logger, moved from the Vite dev-server plugin.
 * Prints a redacted summary of each Find Video attempt to the `npm run dev` terminal.
 * Production builds answer 404, as the Vite build did.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return new Response(null, { status: 404 });
  }
  try {
    const event = JSON.parse(await readBody(request)) as LookupLogEvent;
    if (!event || typeof event.detail !== 'string' || typeof event.outcome !== 'string') {
      return new Response(null, { status: 400 });
    }
    console.log(formatLookupLog({ ...event, url: event.url ? redactUrl(event.url) : undefined }));
    return new Response(null, { status: 204 });
  } catch {
    console.error('[reel-fetch] could not record the lookup log');
    return new Response(null, { status: 400 });
  }
}
