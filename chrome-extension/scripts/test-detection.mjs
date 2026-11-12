import assert from 'node:assert/strict';
import { detectVideoPage, PLATFORMS } from '../src/platforms.js';
import { buildHandoffUrl, decideHandoff } from '../src/handoff.js';

const cases = [
  ['https://www.facebook.com/watch?v=1', 'available', 'facebook'],
  ['https://m.facebook.com/reel/1', 'available', 'facebook'],
  ['https://fb.watch/abc', 'available', 'facebook'],
  ['https://www.youtube.com/watch?v=abc', 'available', 'youtube'],
  ['https://youtu.be/abc', 'available', 'youtube'],
  ['https://www.youtube-nocookie.com/embed/abc', 'available', 'youtube'],
  ['https://www.tiktok.com/@name/video/1', 'available', 'tiktok'],
  ['https://vm.tiktok.com/abc', 'available', 'tiktok'],
  ['https://www.instagram.com/reel/abc/', 'available', 'instagram'],
  ['https://x.com/name/status/1', 'available', 'x'],
  ['https://twitter.com/name/status/1', 'available', 'x'],
  ['https://www.pinterest.com/pin/1/', 'available', 'pinterest'],
  ['https://pin.it/abc', 'available', 'pinterest'],
  ['https://www.reddit.com/r/videos/comments/abc/title/', 'available', 'reddit'],
  ['https://redd.it/abc', 'available', 'reddit'],
  ['https://vimeo.com/1', 'unsupported', null],
  ['https://example.com/video', 'unsupported', null],
  ['javascript:alert(1)', 'invalid', null],
  ['https://user:pass@youtube.com/watch?v=1', 'invalid', null],
  ['https://127.0.0.1/video', 'invalid', null],
  ['http://localhost/watch', 'invalid', null],
  ['https://youtube.com:8080/watch?v=1', 'invalid', null],
  ['', 'empty', null],
];

for (const [input, state, id] of cases) {
  const detected = detectVideoPage(input);
  assert.equal(detected.state, state, `${input} -> ${detected.state}, expected ${state}`);
  assert.equal(detected.platform?.id ?? null, id, input);
}

const longUrl = `https://www.youtube.com/watch?v=${'a'.repeat(2100)}`;
assert.equal(detectVideoPage(longUrl).state, 'invalid');

const comingSoon = [{ id: 'youtube', name: 'YouTube', badge: 'YT', status: 'coming-soon', domains: ['youtube.com'] }];
assert.equal(detectVideoPage('https://youtube.com/watch?v=1', comingSoon).state, 'coming-soon');

const handoff = decideHandoff('https://youtu.be/abc');
assert.equal(handoff.type, 'handoff');
const target = new URL(handoff.target);
assert.equal(target.origin, 'https://bestdownloader.site');
assert.equal(target.searchParams.get('url'), 'https://youtu.be/abc');
assert.equal(buildHandoffUrl('https://youtu.be/abc?t=1'), 'https://bestdownloader.site/?url=https%3A%2F%2Fyoutu.be%2Fabc%3Ft%3D1');

const blocked = decideHandoff('https://example.com/a');
assert.equal(blocked.type, 'notice');
assert.equal(blocked.detection.state, 'unsupported');

assert.equal(PLATFORMS.filter((item) => item.status === 'available').length, 7);

console.log(`platform detection: ${cases.length + 4} checks passed`);
