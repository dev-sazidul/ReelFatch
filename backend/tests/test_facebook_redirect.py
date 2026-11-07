import httpx
import pytest

from app.providers.facebook.redirect import FacebookResolution, resolve_facebook_video_id
from tests.helpers import client, run, url


def head(location: str, status: int = 302):
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(status, headers={'location': location} if location else {})

    return handler


def resolve(raw: str, handler) -> FacebookResolution:
    return run(resolve_facebook_video_id(url(raw), client(handler), 1000))


def test_reads_an_id_from_a_share_redirect_without_using_the_body():
    seen: dict[str, str] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen['method'] = request.method
        seen['url'] = str(request.url)
        seen['cookie'] = request.headers.get('cookie', '')
        seen['user_agent'] = request.headers.get('user-agent', '')
        return httpx.Response(302, headers={'location': 'https://www.facebook.com/reel/1761930238257177?rdid=tracking'})

    result = resolve('https://www.facebook.com/share/v/1CFYs2VsvF/', handler)
    assert result == FacebookResolution('resolved', video_id='1761930238257177', via='redirect')
    assert seen['method'] == 'HEAD'
    assert seen['url'] == 'https://www.facebook.com/share/v/1CFYs2VsvF/'
    assert seen['cookie'] == ''
    assert seen['user_agent'] == 'ReelFetch/1.0'


def test_reads_an_id_from_an_fb_watch_redirect_and_rejects_a_short_link_with_no_id():
    resolved = resolve('https://fb.watch/abcXYZ/', head('https://www.facebook.com/watch/?v=123456789012345'))
    assert resolved == FacebookResolution('resolved', video_id='123456789012345', via='redirect')

    missing = resolve('https://fb.watch/abcXYZ/', head('https://www.facebook.com/watch/'))
    assert missing == FacebookResolution('unresolved', link_type='short')


def test_numeric_watch_and_reel_urls_do_not_need_a_redirect():
    calls = 0

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(500)

    watch = resolve('https://www.facebook.com/watch/?v=123456789012345', handler)
    reel = resolve('https://www.facebook.com/reel/123456789012345', handler)
    assert watch.status == 'resolved' and watch.via == 'url'
    assert reel.status == 'resolved'
    assert calls == 0


def test_login_rate_limit_and_off_platform_redirects_stay_distinct():
    assert resolve('https://fb.watch/abcXYZ/', head('https://www.facebook.com/login.php')).status == 'login_required'
    assert resolve('https://fb.watch/abcXYZ/', head('https://www.facebook.com/checkpoint/1')).status == 'login_required'
    assert resolve('https://fb.watch/abcXYZ/', lambda _r: httpx.Response(429)).status == 'rate_limited'
    assert resolve('https://www.facebook.com/share/v/abc/', head('https://evil.example/reel/123456789012345')).status == 'unavailable'
    assert resolve('https://www.facebook.com/share/v/abc/', head('http://www.facebook.com/reel/123456789012345')).status == 'unavailable'
    assert resolve('https://www.facebook.com/share/v/abc/', head('', status=302)).status == 'unavailable'


def test_network_errors_are_unavailable_and_other_links_are_not_requested():
    def broken(_request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError('down')

    assert resolve('https://fb.watch/abcXYZ/', broken).status == 'unavailable'
    assert resolve('https://www.facebook.com/zuck', broken) == FacebookResolution('unresolved', link_type='other')


def test_follows_relative_redirects_up_to_four_hops():
    hops: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        hops.append(str(request.url))
        if len(hops) < 3:
            return httpx.Response(302, headers={'location': f'/share/v/step{len(hops)}/'})
        return httpx.Response(302, headers={'location': '/reel/123456789012345'})

    assert resolve('https://www.facebook.com/share/v/start/', handler).video_id == '123456789012345'
    assert hops[1] == 'https://www.facebook.com/share/v/step1/'

    endless = resolve('https://www.facebook.com/share/v/start/', head('/share/v/again/'))
    assert endless == FacebookResolution('unresolved', link_type='share')


@pytest.mark.parametrize('raw', ['http://fb.watch/abc/', 'https://fb.watch:8443/abc/', 'https://user:password@fb.watch/abc/'])
def test_unsafe_initial_redirect_urls_are_never_requested(raw):
    def unexpected(_request):
        pytest.fail('Unsafe URL must not be requested')

    assert resolve(raw, unexpected).status == 'unavailable'


def test_redirect_rejects_nonstandard_ports():
    assert resolve('https://fb.watch/abc/', head('https://www.facebook.com:8443/reel/123456789012345')).status == 'unavailable'


def test_redirect_discards_body_without_reading_it():
    class UnreadableBody(httpx.AsyncByteStream):
        closed = False

        async def __aiter__(self):
            pytest.fail('HEAD response body must not be read')
            yield b''

        async def aclose(self):
            self.closed = True

    body = UnreadableBody()
    result = resolve('https://fb.watch/abc/', lambda _r: httpx.Response(
        302, headers={'location': 'https://www.facebook.com/reel/123456789012345'}, stream=body,
    ))
    assert result.status == 'resolved'
    assert body.closed
