import json
import re

import httpx
import pytest

from app.errors import ApiError
from app.providers.facebook.graph_client import map_graph_failure
from app.providers.facebook.provider import FacebookVideoProvider
from tests.helpers import config, factory, run, url

TOKEN = 'EAA-test-token-value'


def provider(token: str, handler) -> FacebookVideoProvider:
    return FacebookVideoProvider(config(facebook_user_access_token=token), factory(handler))


def rejects(coroutine) -> ApiError:
    with pytest.raises(ApiError) as caught:
        run(coroutine)
    return caught.value


def test_missing_token_returns_provider_not_configured_and_does_not_call_facebook():
    calls = 0

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(200, json={})

    error = rejects(provider('', handler).lookup(url('https://www.facebook.com/watch/?v=123456789012345')))
    assert error.code == 'PROVIDER_NOT_CONFIGURED'
    assert error.status_code == 503
    assert calls == 0


def test_a_share_redirect_resolves_an_id_and_does_not_invent_a_file_without_a_token():
    urls: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        urls.append(str(request.url))
        return httpx.Response(302, headers={'location': 'https://www.facebook.com/reel/1761930238257177'})

    error = rejects(provider('', handler).lookup(url('https://www.facebook.com/share/v/1CFYs2VsvF/')))
    assert error.code == 'PROVIDER_NOT_CONFIGURED'
    assert '1761930238257177' in error.message
    assert not any('graph.facebook.com' in item for item in urls)


def test_a_graph_source_is_kept_off_the_public_lookup_and_is_not_invented_when_absent():
    source = 'https://video.xx.fbcdn.net/secret-file.mp4?e=1'

    def handler(request: httpx.Request) -> httpx.Response:
        target = str(request.url)
        assert 'access_token' not in target
        assert request.headers['authorization'] == f'Bearer {TOKEN}'
        assert re.search(r'/v26\.0/123456789012345\?', target)
        assert 'fields=id%2Cname%2Cdescription%2Cpicture%2Csource%2Cformat' in target
        return httpx.Response(200, json={
            'id': '123456789012345',
            'name': 'Owned video',
            'picture': 'https://scontent.xx.fbcdn.net/thumb.jpg',
            'source': source,
            'format': [{'width': 720, 'height': 1280}],
        })

    lookup = run(provider(TOKEN, handler).lookup(url('https://www.facebook.com/watch/?v=123456789012345')))
    assert 'secret-file' not in json.dumps([q.to_json() for q in lookup.qualities]) + str(lookup.thumbnail_url) + str(lookup.title)
    assert [q.to_json() for q in lookup.qualities] == [{'id': 'source', 'label': 'Original file', 'available': True, 'format': 'mp4'}]
    assert lookup.reported_formats == [{'width': 720, 'height': 1280}]
    assert lookup.title == 'Owned video'
    assert lookup.thumbnail_url == 'https://scontent.xx.fbcdn.net/thumb.jpg'

    empty = provider(TOKEN, lambda _r: httpx.Response(200, json={'id': '123456789012345', 'name': 'No file'}))
    error = rejects(empty.lookup(url('https://www.facebook.com/reel/123456789012345')))
    assert error.code == 'VIDEO_NOT_AVAILABLE'
    assert error.status_code == 404


def test_a_non_facebook_media_host_is_refused():
    facebook = provider(TOKEN, lambda _r: httpx.Response(200, json={'id': '123456789012345', 'source': 'https://evil.example/video.mp4'}))
    assert rejects(facebook.get_authorized_source('123456789012345')).code == 'VIDEO_NOT_AVAILABLE'


def test_graph_permission_and_token_errors_keep_their_public_codes():
    assert map_graph_failure(400, {'code': 190, 'message': f'bad token {TOKEN}'}, [TOKEN]).code == 'PROVIDER_UNAUTHORIZED'
    assert map_graph_failure(403, {'code': 10, 'message': 'permission'}, []).code == 'VIDEO_NOT_PERMITTED'
    assert TOKEN not in map_graph_failure(400, {'code': 190, 'message': f'bad token {TOKEN}'}, [TOKEN]).message
    provider_error = map_graph_failure(500, {'code': 1, 'message': f'boom {TOKEN}'}, [TOKEN])
    assert provider_error.code == 'PROVIDER_ERROR'
    assert TOKEN not in provider_error.message
    assert provider_error.message.startswith('Facebook returned HTTP 500 (code 1). boom [redacted]')
    assert map_graph_failure(400, {'code': 613}, []).code == 'PROVIDER_RATE_LIMITED'
    assert map_graph_failure(400, {'code': 100}, []).code == 'VIDEO_NOT_FOUND'
    assert map_graph_failure(502, None, []).message == 'Facebook returned HTTP 502. Facebook rejected the request.'


def test_graph_transport_failures_map_to_provider_errors():
    def refused(_request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError('refused')

    assert rejects(provider(TOKEN, refused).get_authorized_source('123456789012345')).message == 'The Facebook Graph API could not be reached.'

    redirected = provider(TOKEN, lambda _r: httpx.Response(302, headers={'location': 'https://example.com/'}))
    assert rejects(redirected.get_authorized_source('123456789012345')).code == 'PROVIDER_ERROR'

    unreadable = provider(TOKEN, lambda _r: httpx.Response(200, text='<html>'))
    assert rejects(unreadable.get_authorized_source('123456789012345')).message == 'Facebook returned HTTP 200 with an unreadable response.'

    graph_error = provider(TOKEN, lambda _r: httpx.Response(400, json={'error': {'code': 190, 'message': f'bad {TOKEN}'}}))
    error = rejects(graph_error.get_authorized_source('123456789012345'))
    assert (error.status_code, error.code) == (401, 'PROVIDER_UNAUTHORIZED')


def test_non_numeric_ids_never_reach_graph():
    assert rejects(provider(TOKEN, lambda _r: httpx.Response(500)).get_authorized_source('../me')).code == 'INVALID_URL'
