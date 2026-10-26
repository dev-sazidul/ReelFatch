import assert from 'node:assert/strict';
import test from 'node:test';
import type { AppConfig } from '../config/app-config';
import { ApiError } from '../common/api-error';
import { FacebookVideoProvider } from './facebook/facebook.provider';
import { futurePlatformProviders, selectProvider } from './provider-registry';

const config = {
  port: 3000,
  corsOrigins: [],
  graphApiVersion: 'v26.0',
  facebookUserAccessToken: '',
  facebookPageAccessToken: '',
  requestTimeoutMs: 1000,
  downloadTimeoutMs: 1000,
  maxDownloadBytes: 1000,
  rateLimitTtlMs: 1000,
  rateLimitLimit: 10,
  lookupTtlMs: 1000,
} satisfies AppConfig;

const providers = [new FacebookVideoProvider(config), ...futurePlatformProviders()];

test('selects Facebook and leaves other platforms unconfigured', () => {
  const facebook = selectProvider('https://www.facebook.com/watch/?v=123456789012345', providers);
  assert.equal(facebook.provider.platform, 'facebook');

  const youtube = selectProvider('https://www.youtube.com/watch?v=abcdefghijk', providers);
  assert.equal(youtube.provider.platform, 'youtube');
  assert.equal(youtube.provider.isConfigured(), false);

  const tiktok = selectProvider('https://www.tiktok.com/@name/video/123456789012345', providers);
  assert.equal(tiktok.provider.platform, 'tiktok');
  assert.equal(tiktok.provider.isConfigured(), false);
});

test('rejects unsupported hosts and invalid URLs', () => {
  assert.throws(
    () => selectProvider('https://example.com/video', providers),
    (error: unknown) => error instanceof ApiError && error.code === 'UNSUPPORTED_LINK',
  );
  assert.throws(
    () => selectProvider('not a url', providers),
    (error: unknown) => error instanceof ApiError && error.code === 'INVALID_URL',
  );
});

test('an unconfigured platform reports PROVIDER_NOT_CONFIGURED', async () => {
  const { url, provider } = selectProvider('https://youtu.be/abcdefghijk', providers);
  await assert.rejects(
    () => provider.lookup(url),
    (error: unknown) => error instanceof ApiError && error.code === 'PROVIDER_NOT_CONFIGURED',
  );
});
