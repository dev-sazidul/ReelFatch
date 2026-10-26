import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError } from '../common/api-error';
import { isAllowedMediaUrl, parsePublicHttpUrl, redactUrl } from './url-safety';

test('accepts public Facebook links and rejects local or credentialed targets', () => {
  assert.equal(parsePublicHttpUrl('https://www.facebook.com/watch/?v=123456789012345').hostname, 'www.facebook.com');
  assert.throws(() => parsePublicHttpUrl('https://user:secret@facebook.com/watch'), (error: unknown) => error instanceof ApiError && error.code === 'INVALID_URL');
  assert.throws(() => parsePublicHttpUrl('http://127.0.0.1/video.mp4'), (error: unknown) => error instanceof ApiError && error.code === 'INVALID_URL');
  assert.throws(() => parsePublicHttpUrl('http://localhost/video'), (error: unknown) => error instanceof ApiError && error.code === 'INVALID_URL');
  assert.throws(() => parsePublicHttpUrl('file:///tmp/video.mp4'), (error: unknown) => error instanceof ApiError && error.code === 'INVALID_URL');
});

test('media fetches stay on Facebook CDN hosts', () => {
  assert.equal(isAllowedMediaUrl('https://video.xx.fbcdn.net/file.mp4'), true);
  assert.equal(isAllowedMediaUrl('https://scontent.xx.fbcdn.net/thumb.jpg'), true);
  assert.equal(isAllowedMediaUrl('https://evil.example/video.mp4'), false);
  assert.equal(isAllowedMediaUrl('http://video.xx.fbcdn.net/file.mp4'), false);
  assert.equal(isAllowedMediaUrl('https://127.0.0.1/file.mp4'), false);
  assert.equal(isAllowedMediaUrl('https://graph.facebook.com/v26.0/123'), false);
});

test('redacts sensitive query parameters', () => {
  const output = redactUrl('https://www.facebook.com/watch/?v=123&access_token=secret-value');
  assert.equal(output.includes('secret-value'), false);
  assert.match(output, /access_token=%5Bredacted%5D/);
});
