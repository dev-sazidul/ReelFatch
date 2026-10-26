import assert from 'node:assert/strict';
import test from 'node:test';
import type { AppConfig } from '../../config/app-config';
import { ApiError } from '../../common/api-error';
import { FacebookVideoProvider } from './facebook.provider';
import { mapGraphFailure } from './facebook-graph.client';

const baseConfig: AppConfig = {
  port: 3000,
  corsOrigins: ['http://localhost:5173'],
  graphApiVersion: 'v26.0',
  facebookUserAccessToken: '',
  facebookPageAccessToken: '',
  requestTimeoutMs: 1000,
  downloadTimeoutMs: 1000,
  maxDownloadBytes: 1000,
  rateLimitTtlMs: 60000,
  rateLimitLimit: 10,
  lookupTtlMs: 60000,
};

function provider(token: string, fetchImpl: typeof fetch) {
  return new FacebookVideoProvider({ ...baseConfig, facebookUserAccessToken: token }, fetchImpl);
}

test('missing token returns PROVIDER_NOT_CONFIGURED and does not call Facebook', async () => {
  let calls = 0;
  const facebook = provider('', async () => {
    calls += 1;
    return new Response('{}');
  });
  await assert.rejects(
    () => facebook.lookup(new URL('https://www.facebook.com/watch/?v=123456789012345')),
    (error: unknown) => error instanceof ApiError && error.code === 'PROVIDER_NOT_CONFIGURED',
  );
  assert.equal(calls, 0);
});

test('a share redirect resolves an id and does not invent a file without a token', async () => {
  const urls: string[] = [];
  const facebook = provider('', async (input) => {
    urls.push(String(input));
    return new Response(null, { status: 302, headers: { location: 'https://www.facebook.com/reel/1761930238257177' } });
  });
  await assert.rejects(
    () => facebook.lookup(new URL('https://www.facebook.com/share/v/1CFYs2VsvF/')),
    (error: unknown) => error instanceof ApiError && error.code === 'PROVIDER_NOT_CONFIGURED' && error.message.includes('1761930238257177'),
  );
  assert.equal(urls.some((url) => url.includes('graph.facebook.com')), false);
});

test('a Graph source is kept off the public lookup and is not invented when absent', async () => {
  const source = 'https://video.xx.fbcdn.net/secret-file.mp4?e=1';
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    assert.equal(url.includes('access_token'), false);
    assert.equal((init?.headers as { authorization?: string }).authorization, 'Bearer EAA-test-token-value');
    assert.match(url, /\/v26\.0\/123456789012345\?/);
    return Response.json({
      id: '123456789012345',
      name: 'Owned video',
      picture: 'https://scontent.xx.fbcdn.net/thumb.jpg',
      source,
      format: [{ width: 720, height: 1280 }],
    });
  };
  const facebook = provider('EAA-test-token-value', fetchImpl);
  const lookup = await facebook.lookup(new URL('https://www.facebook.com/watch/?v=123456789012345'));
  assert.equal(JSON.stringify(lookup).includes('secret-file'), false);
  assert.deepEqual(lookup.qualities, [{ id: 'source', label: 'Original file', available: true, format: 'mp4' }]);
  assert.deepEqual(lookup.reportedFormats, [{ width: 720, height: 1280 }]);

  const empty = provider('EAA-test-token-value', async () => Response.json({ id: '123456789012345', name: 'No file' }));
  await assert.rejects(
    () => empty.lookup(new URL('https://www.facebook.com/reel/123456789012345')),
    (error: unknown) => error instanceof ApiError && error.code === 'VIDEO_NOT_AVAILABLE',
  );
});

test('a non-Facebook media host is refused', async () => {
  const facebook = provider('EAA-test-token-value', async () => Response.json({
    id: '123456789012345',
    source: 'https://evil.example/video.mp4',
  }));
  await assert.rejects(
    () => facebook.getAuthorizedSource('123456789012345'),
    (error: unknown) => error instanceof ApiError && error.code === 'VIDEO_NOT_AVAILABLE',
  );
});

test('Graph permission and token errors keep their public codes', () => {
  assert.equal(mapGraphFailure(400, { code: 190, message: 'bad token EAA-test-token-value' }, ['EAA-test-token-value']).code, 'PROVIDER_UNAUTHORIZED');
  assert.equal(mapGraphFailure(403, { code: 10, message: 'permission' }, []).code, 'VIDEO_NOT_PERMITTED');
  assert.equal(mapGraphFailure(400, { code: 190, message: 'bad token EAA-test-token-value' }, ['EAA-test-token-value']).message.includes('EAA-test-token-value'), false);
  const providerError = mapGraphFailure(500, { code: 1, message: 'boom EAA-test-token-value' }, ['EAA-test-token-value']);
  assert.equal(providerError.code, 'PROVIDER_ERROR');
  assert.equal(providerError.message.includes('EAA-test-token-value'), false);
});
