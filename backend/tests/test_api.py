"""End-to-end checks of the HTTP surface: routes, status codes, error bodies, headers."""
import httpx
import logging
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.helpers import config, factory

TOKEN = 'EAA-test-token-value'
VIDEO = '123456789012345'
SOURCE = 'https://video.xx.fbcdn.net/secret-file.mp4?e=1'


def facebook_handler(request: httpx.Request) -> httpx.Response:
    if request.url.host == 'graph.facebook.com':
        return httpx.Response(200, json={'id': VIDEO, 'name': 'Owned video', 'source': SOURCE, 'format': [{'width': 720, 'height': 1280}]})
    if request.url.host == 'video.xx.fbcdn.net':
        return httpx.Response(200, content=b'video-bytes', headers={'content-type': 'video/mp4'})
    if request.method == 'HEAD':
        return httpx.Response(302, headers={'location': f'https://www.facebook.com/reel/{VIDEO}'})
    return httpx.Response(500)


@pytest.fixture
def api():
    app = create_app(config(), factory(facebook_handler))
    with TestClient(app) as client:
        yield client


@pytest.fixture
def api_with_token():
    app = create_app(config(facebook_page_access_token=TOKEN, max_download_bytes=1_000_000), factory(facebook_handler))
    with TestClient(app) as client:
        yield client


def test_health_reports_configuration_without_the_token(api, api_with_token):
    assert api.get('/api/health').json() == {
        'status': 'ok',
        'providers': {
            'facebook': {'mode': 'graph-api', 'configured': False, 'graphApiVersion': 'v26.0'},
            'youtube': {'configured': False, 'reason': 'Official Data API does not provide video files.'},
            'tiktok': {'configured': False, 'reason': 'No authorized download provider is configured.'},
            'instagram': {'configured': False, 'reason': 'No authorized download provider is configured.'},
        },
    }
    response = api_with_token.get('/api/health')
    assert response.json()['providers']['facebook']['configured'] is True
    assert TOKEN not in response.text


def test_lookup_errors_use_the_previous_codes_and_status(api):
    def post(body):
        return api.post('/api/videos/lookup', json=body)

    response = post({'url': f'https://www.facebook.com/reel/{VIDEO}'})
    assert response.status_code == 503
    assert response.json()['code'] == 'PROVIDER_NOT_CONFIGURED'
    assert VIDEO in response.json()['message']
    assert set(response.json()) == {'code', 'message'}

    assert post({'url': 'https://www.facebook.com/share/v/abc/'}).json()['code'] == 'PROVIDER_NOT_CONFIGURED'
    assert (post({'url': 'https://example.com/x'}).status_code, post({'url': 'https://example.com/x'}).json()['code']) == (400, 'UNSUPPORTED_LINK')
    assert post({'url': 'nope'}).json() == {'code': 'INVALID_URL', 'message': 'Enter a complete link beginning with https:// or http://.'}
    assert post({'url': 'https://youtu.be/abc'}).status_code == 503
    assert post({'url': 'https://www.facebook.com/zuck'}).status_code == 422


def test_lookup_body_validation_matches_the_previous_messages(api):
    missing = api.post('/api/videos/lookup', json={})
    assert missing.status_code == 400
    assert missing.json() == {
        'code': 'INVALID_REQUEST',
        'message': 'url must be shorter than or equal to 2000 characters url must be longer than or equal to 1 characters url must be a string',
    }
    extra = api.post('/api/videos/lookup', json={'url': 'https://fb.watch/x', 'debug': True})
    assert extra.json()['message'] == 'property debug should not exist'
    assert api.post('/api/videos/lookup', json={'url': ''}).json()['message'] == 'url must be longer than or equal to 1 characters'
    assert api.post('/api/videos/lookup', json={'url': 'x' * 2001}).json()['message'] == 'url must be shorter than or equal to 2000 characters'
    assert api.post('/api/videos/lookup', content='{bad', headers={'content-type': 'application/json'}).status_code == 400
    assert api.post('/api/videos/lookup', content='url=x', headers={'content-type': 'text/plain'}).json()['code'] == 'INVALID_REQUEST'


def test_download_body_and_ids_are_validated(api):
    bad = api.post('/api/videos/downloads', json={'lookupId': 'x', 'qualityId': 'hd'})
    assert bad.status_code == 400
    assert bad.json()['message'] == 'lookupId must match /^[a-f0-9]{32}$/ regular expression qualityId must be one of the following values: source'
    missing = api.post('/api/videos/downloads', json={'lookupId': 'a' * 32, 'qualityId': 'source'})
    assert (missing.status_code, missing.json()['code']) == (404, 'LOOKUP_NOT_FOUND')
    assert api.get('/api/videos/lookups/not-an-id').json() == {'code': 'INVALID_REQUEST', 'message': 'The lookup id is not valid.'}
    assert api.get('/api/videos/downloads/' + 'b' * 32).json()['code'] == 'JOB_NOT_FOUND'
    gone = api.get(f'/api/videos/downloads/{"b" * 32}/file')
    assert (gone.status_code, gone.json()['code'], gone.headers['cache-control']) == (404, 'JOB_NOT_FOUND', 'no-store')


def test_full_lookup_and_download_flow(api_with_token):
    lookup = api_with_token.post('/api/videos/lookup', json={'url': 'https://www.facebook.com/share/v/1CFYs2VsvF/'})
    assert lookup.status_code == 201
    body = lookup.json()
    assert list(body) == ['lookupId', 'platform', 'title', 'sourceLabel', 'qualities', 'reportedFormats']
    assert body['qualities'] == [{'id': 'source', 'label': 'Original file', 'available': True, 'format': 'mp4'}]
    assert 'secret-file' not in lookup.text

    assert api_with_token.get(f'/api/videos/lookups/{body["lookupId"]}').json() == body

    unavailable = api_with_token.post('/api/videos/downloads', json={'lookupId': body['lookupId'], 'qualityId': 'source'})
    assert unavailable.status_code == 201
    job = unavailable.json()
    assert job['status'] == 'ready'
    assert api_with_token.get(f'/api/videos/downloads/{job["jobId"]}').json() == {'jobId': job['jobId'], 'status': 'ready'}

    file = api_with_token.get(f'/api/videos/downloads/{job["jobId"]}/file')
    assert file.status_code == 200
    assert file.content == b'video-bytes'
    assert file.headers['content-type'] == 'video/mp4'
    assert file.headers['content-disposition'] == f'attachment; filename="facebook-{VIDEO}.mp4"'
    assert file.headers['content-length'] == '11'
    assert file.headers['cache-control'] == 'no-store'
    assert api_with_token.get(f'/api/videos/downloads/{job["jobId"]}').json()['status'] == 'completed'


def test_unknown_routes_and_methods_return_the_previous_404(api):
    response = api.get('/api/nothing')
    assert response.status_code == 404
    assert response.json() == {'code': 'INVALID_REQUEST', 'message': 'Cannot GET /api/nothing'}
    assert api.delete('/api/videos/lookup').json()['message'] == 'Cannot DELETE /api/videos/lookup'
    assert api.get('/docs').status_code == 404


def test_rate_limit_is_per_route_and_skips_health():
    app = create_app(config(rate_limit_limit=2), factory(facebook_handler))
    with TestClient(app) as client:
        first = client.get('/api/videos/lookups/x')
        assert first.headers['x-ratelimit-limit'] == '2'
        assert first.headers['x-ratelimit-remaining'] == '1'
        client.get('/api/videos/lookups/x')
        blocked = client.get('/api/videos/lookups/x')
        assert blocked.status_code == 429
        assert blocked.json() == {'code': 'RATE_LIMITED', 'message': 'Too many requests. Wait a moment and try again.'}
        assert int(blocked.headers['retry-after']) > 0
        assert client.get('/api/videos/downloads/x').status_code == 404
        for _ in range(5):
            assert client.get('/api/health').status_code == 200


def test_cors_allows_only_configured_origins(api):
    allowed = api.get('/api/health', headers={'origin': 'http://localhost:5173'})
    assert allowed.headers['access-control-allow-origin'] == 'http://localhost:5173'
    denied = api.get('/api/health', headers={'origin': 'https://evil.example'})
    assert 'access-control-allow-origin' not in denied.headers


def test_download_does_not_log_token_or_source_url(api_with_token, caplog):
    with caplog.at_level(logging.INFO):
        test_full_lookup_and_download_flow(api_with_token)
    assert SOURCE not in caplog.text
    assert 'secret-file' not in caplog.text
    assert TOKEN not in caplog.text


def test_unexpected_exception_logs_only_its_type(caplog):
    app = create_app(config(), factory(facebook_handler))

    @app.get('/test-error')
    async def broken():
        raise RuntimeError(f'{TOKEN} {SOURCE}')

    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get('/test-error')
    assert response.status_code == 500
    assert response.json()['code'] == 'INTERNAL_ERROR'
    assert TOKEN not in caplog.text + response.text
    assert SOURCE not in caplog.text + response.text


def test_body_limit_stops_reading_before_buffering_the_entire_request():
    from fastapi import HTTPException
    from starlette.requests import Request
    from app.videos.validation import MAX_BODY_BYTES, read_json_body
    from tests.helpers import run

    calls = 0

    async def receive():
        nonlocal calls
        calls += 1
        assert calls <= 2, 'Oversized body should not be read to completion'
        return {'type': 'http.request', 'body': b'x' * (MAX_BODY_BYTES // 2 + 1), 'more_body': True}

    request = Request({'type': 'http', 'headers': [(b'content-type', b'application/json')]}, receive)
    with pytest.raises(HTTPException) as caught:
        run(read_json_body(request))
    assert caught.value.status_code == 413
    assert calls == 2
