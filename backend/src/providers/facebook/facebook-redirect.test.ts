import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveFacebookVideoId } from './facebook-redirect';

function head(location: string, status = 302): typeof fetch {
  return async () => new Response(null, { status, headers: location ? { location } : {} });
}

test('reads an id from a share redirect without using the body', async () => {
  let method = '';
  const fetchImpl: typeof fetch = async (input, init) => {
    method = init?.method ?? '';
    assert.equal(String(input), 'https://www.facebook.com/share/v/1CFYs2VsvF/');
    return new Response('<html>secret</html>', {
      status: 302,
      headers: { location: 'https://www.facebook.com/reel/1761930238257177?rdid=tracking' },
    });
  };
  const result = await resolveFacebookVideoId(new URL('https://www.facebook.com/share/v/1CFYs2VsvF/'), fetchImpl, 1000);
  assert.deepEqual(result, { status: 'resolved', videoId: '1761930238257177', via: 'redirect' });
  assert.equal(method, 'HEAD');
});

test('reads an id from an fb.watch redirect and rejects a short link with no id', async () => {
  const resolved = await resolveFacebookVideoId(
    new URL('https://fb.watch/abcXYZ/'),
    head('https://www.facebook.com/watch/?v=123456789012345'),
    1000,
  );
  assert.deepEqual(resolved, { status: 'resolved', videoId: '123456789012345', via: 'redirect' });

  const missing = await resolveFacebookVideoId(
    new URL('https://fb.watch/abcXYZ/'),
    head('https://www.facebook.com/watch/'),
    1000,
  );
  assert.deepEqual(missing, { status: 'unresolved', linkType: 'short' });
});

test('numeric watch and reel urls do not need a redirect', async () => {
  let calls = 0;
  const fetchImpl: typeof fetch = async () => {
    calls += 1;
    return new Response(null, { status: 500 });
  };
  const watch = await resolveFacebookVideoId(new URL('https://www.facebook.com/watch/?v=123456789012345'), fetchImpl, 1000);
  const reel = await resolveFacebookVideoId(new URL('https://www.facebook.com/reel/123456789012345'), fetchImpl, 1000);
  assert.equal(watch.status, 'resolved');
  assert.equal(reel.status, 'resolved');
  assert.equal(calls, 0);
});

test('login, rate limit, and off-platform redirects stay distinct', async () => {
  const login = await resolveFacebookVideoId(new URL('https://fb.watch/abcXYZ/'), head('https://www.facebook.com/login.php'), 1000);
  assert.equal(login.status, 'login_required');

  const limited = await resolveFacebookVideoId(new URL('https://fb.watch/abcXYZ/'), async () => new Response(null, { status: 429 }), 1000);
  assert.equal(limited.status, 'rate_limited');

  const foreign = await resolveFacebookVideoId(new URL('https://www.facebook.com/share/v/abc/'), head('https://evil.example/reel/123456789012345'), 1000);
  assert.equal(foreign.status, 'unavailable');
});
