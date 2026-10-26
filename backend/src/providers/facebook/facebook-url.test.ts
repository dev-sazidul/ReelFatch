import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyFacebookTarget } from './facebook-url';

function target(raw: string) {
  return classifyFacebookTarget(new URL(raw));
}

test('reads numeric ids from watch, reel, and videos links', () => {
  assert.deepEqual(target('https://www.facebook.com/watch/?v=123456789012345'), { kind: 'video', videoId: '123456789012345' });
  assert.deepEqual(target('https://www.facebook.com/reel/123456789012345/'), { kind: 'video', videoId: '123456789012345' });
  assert.deepEqual(target('https://www.facebook.com/page/videos/123456789012345'), { kind: 'video', videoId: '123456789012345' });
});

test('does not treat share codes or fb.watch links as video ids', () => {
  assert.deepEqual(target('https://www.facebook.com/share/v/1CFYs2VsvF/'), { kind: 'unresolved', linkType: 'share' });
  assert.deepEqual(target('https://fb.watch/abcXYZ/'), { kind: 'unresolved', linkType: 'short' });
  assert.deepEqual(target('https://www.facebook.com/reel/not-numeric'), { kind: 'unresolved', linkType: 'reel' });
  assert.deepEqual(target('https://www.facebook.com/zuck'), { kind: 'unresolved', linkType: 'other' });
});
