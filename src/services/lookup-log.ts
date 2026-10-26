export type LookupLogEvent = {
  outcome: 'empty' | 'invalid' | 'unsupported' | 'no-provider' | 'lookup-ok' | 'lookup-empty' | 'lookup-failed';
  url?: string;
  linkType?: string;
  detail: string;
  httpStatus?: number;
  responseSummary?: string;
};

const sensitiveQuery = /token|cookie|password|secret|auth|session|credential/i;

export function redactUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl.trim());
    for (const key of [...url.searchParams.keys()]) {
      if (sensitiveQuery.test(key)) url.searchParams.set(key, '[redacted]');
    }
    return url.toString();
  } catch {
    return rawUrl.slice(0, 300);
  }
}

export function formatLookupLog(event: LookupLogEvent) {
  const lines = [
    '[reel-fetch] video lookup',
    `  outcome: ${event.outcome}`,
    `  detail: ${event.detail}`,
  ];
  if (event.url) lines.push(`  url: ${event.url}`);
  if (event.linkType) lines.push(`  link type: ${event.linkType}`);
  if (event.httpStatus !== undefined) lines.push(`  http status: ${event.httpStatus}`);
  if (event.responseSummary) lines.push(`  response: ${event.responseSummary}`);
  if (event.outcome === 'no-provider') {
    lines.push('  http request: not sent');
  }
  return lines.join('\n');
}

export async function reportLookup(event: LookupLogEvent) {
  const safe = { ...event, url: event.url ? redactUrl(event.url) : undefined };
  try {
    await fetch('/api/lookup-log', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(safe),
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    // The page can still show its message if the dev-log endpoint is unavailable.
  }
}
