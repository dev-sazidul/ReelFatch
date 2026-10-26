import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { formatLookupLog, redactUrl, type LookupLogEvent } from './src/services/lookup-log';

function readBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = '';
    request.on('data', (chunk: Buffer | string) => {
      body += chunk;
      if (body.length > 8_000) {
        reject(new Error('Lookup log body is too large.'));
        request.destroy();
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

export function lookupLogPlugin(): Plugin {
  return {
    name: 'reel-fetch-lookup-log',
    configureServer(server) {
      server.middlewares.use('/api/lookup-log', (request, response) => {
        void handleLookupLog(request, response);
      });
    },
  };
}

async function handleLookupLog(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== 'POST') {
    response.statusCode = 405;
    response.end();
    return;
  }

  try {
    const event = JSON.parse(await readBody(request)) as LookupLogEvent;
    if (!event || typeof event.detail !== 'string' || typeof event.outcome !== 'string') {
      response.statusCode = 400;
      response.end();
      return;
    }
    console.log(formatLookupLog({ ...event, url: event.url ? redactUrl(event.url) : undefined }));
    response.statusCode = 204;
    response.end();
  } catch (error) {
    console.error('[reel-fetch] could not record the lookup log');
    console.error(error instanceof Error ? error.message : 'Unknown logging error');
    response.statusCode = 400;
    response.end();
  }
}
