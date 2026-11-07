import httpx
import pytest

from app.errors import ApiError
from app.security.media_stream import open_allowed_media
from tests.helpers import factory, run

SOURCE = 'https://video.xx.fbcdn.net/file.mp4'


async def _read(handler, max_bytes: int = 1000, source: str = SOURCE) -> tuple[bytes, str, int | None]:
    opened = await open_allowed_media(source, timeout_ms=1000, max_bytes=max_bytes, client_factory=factory(handler))
    data = b''.join([chunk async for chunk in opened.stream])
    return data, opened.content_type, opened.content_length


def rejects(coroutine) -> ApiError:
    with pytest.raises(ApiError) as caught:
        run(coroutine)
    return caught.value


def test_streams_a_video_from_an_allowed_host():
    data, content_type, length = run(_read(lambda _r: httpx.Response(200, content=b'abc', headers={'content-type': 'video/mp4; codecs=avc1'})))
    assert (data, content_type, length) == (b'abc', 'video/mp4', 3)


def test_follows_cdn_redirects_but_refuses_other_hosts():
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.host == 'video.xx.fbcdn.net':
            return httpx.Response(302, headers={'location': 'https://other.fbcdn.net/file.mp4'})
        return httpx.Response(200, content=b'ok', headers={'content-type': 'application/octet-stream'})

    assert run(_read(handler))[0] == b'ok'

    off_host = lambda _r: httpx.Response(302, headers={'location': 'https://evil.example/file.mp4'})  # noqa: E731
    assert rejects(_read(off_host)).message == 'The file address from Facebook is not on an allowed media host.'
    assert rejects(_read(lambda _r: httpx.Response(302))).message == 'The video file host sent an incomplete redirect.'
    loop = lambda _r: httpx.Response(302, headers={'location': SOURCE})  # noqa: E731
    assert rejects(_read(loop)).message == 'The video file host redirected too many times.'


def test_rejects_non_video_responses_and_http_errors():
    assert rejects(_read(lambda _r: httpx.Response(200, text='<html>', headers={'content-type': 'text/html'}))).message == 'The video file host did not return a video file.'
    assert rejects(_read(lambda _r: httpx.Response(403))).message == 'The video file host returned HTTP 403.'


def test_enforces_the_size_limit_from_the_header_and_the_body():
    declared = lambda _r: httpx.Response(200, content=b'x' * 10, headers={'content-type': 'video/mp4', 'content-length': '5000'})  # noqa: E731
    error = rejects(_read(declared))
    assert (error.status_code, error.code) == (413, 'FILE_TOO_LARGE')

    def undeclared(_request: httpx.Request) -> httpx.Response:
        async def body():
            for _ in range(20):
                yield b'x' * 100

        return httpx.Response(200, content=body(), headers={'content-type': 'video/mp4'})

    assert rejects(_read(undeclared)).code == 'FILE_TOO_LARGE'
