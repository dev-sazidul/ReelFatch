import pytest

from app.errors import ApiError
from app.providers.facebook.provider import FacebookVideoProvider
from app.providers.registry import future_platform_providers, select_provider
from tests.helpers import config, run

providers = [FacebookVideoProvider(config()), *future_platform_providers()]


def test_selects_facebook_and_leaves_other_platforms_unconfigured():
    _url, facebook = select_provider('https://www.facebook.com/watch/?v=123456789012345', providers)
    assert facebook.platform == 'facebook'

    _url, youtube = select_provider('https://www.youtube.com/watch?v=abcdefghijk', providers)
    assert youtube.platform == 'youtube'
    assert youtube.is_configured() is False

    _url, tiktok = select_provider('https://www.tiktok.com/@name/video/123456789012345', providers)
    assert tiktok.platform == 'tiktok'
    assert tiktok.is_configured() is False

    _url, short = select_provider('https://fb.watch/abc/', providers)
    assert short.platform == 'facebook'


def test_rejects_unsupported_hosts_and_invalid_urls():
    with pytest.raises(ApiError) as unsupported:
        select_provider('https://example.com/video', providers)
    assert unsupported.value.code == 'UNSUPPORTED_LINK'

    with pytest.raises(ApiError) as invalid:
        select_provider('not a url', providers)
    assert invalid.value.code == 'INVALID_URL'

    with pytest.raises(ApiError) as lookalike:
        select_provider('https://notfacebook.com/reel/123456789012345', providers)
    assert lookalike.value.code == 'UNSUPPORTED_LINK'


def test_an_unconfigured_platform_reports_provider_not_configured():
    url, provider = select_provider('https://youtu.be/abcdefghijk', providers)
    with pytest.raises(ApiError) as caught:
        run(provider.lookup(url))
    assert caught.value.code == 'PROVIDER_NOT_CONFIGURED'
    assert caught.value.status_code == 503
