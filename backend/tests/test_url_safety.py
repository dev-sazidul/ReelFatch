import pytest

from app.errors import ApiError
from app.security.url_safety import is_allowed_media_url, parse_public_http_url, redact_url


def _invalid(raw: str) -> str:
    with pytest.raises(ApiError) as caught:
        parse_public_http_url(raw)
    assert caught.value.code == 'INVALID_URL'
    return caught.value.message


def test_accepts_public_facebook_links_and_rejects_local_or_credentialed_targets():
    assert parse_public_http_url('https://www.facebook.com/watch/?v=123456789012345').hostname == 'www.facebook.com'
    _invalid('https://user:secret@facebook.com/watch')
    _invalid('http://127.0.0.1/video.mp4')
    _invalid('http://localhost/video')
    _invalid('file:///tmp/video.mp4')


def test_invalid_url_messages_match_the_previous_api():
    assert _invalid('   ') == 'Enter one http or https video link.'
    assert _invalid('https://www.facebook.com/' + 'a' * 2000) == 'Enter one http or https video link.'
    assert _invalid('not a url') == 'Enter a complete link beginning with https:// or http://.'
    assert _invalid('https://') == 'Enter a complete link beginning with https:// or http://.'
    assert _invalid('ftp://www.facebook.com/reel/123456789012345') == 'Only http and https links can be checked.'
    assert _invalid('https://user:pw@www.facebook.com/') == 'Links that include a username or password are not accepted.'
    assert _invalid('https://www.facebook.com:8443/reel/123456789012345') == 'Only standard web ports are accepted.'
    assert _invalid('https://[::1]/') == 'That host is not allowed.'
    assert _invalid('https://printer.local/') == 'That host is not allowed.'
    assert _invalid('https://metadata.google.internal/') == 'That host is not allowed.'
    assert parse_public_http_url('http://www.facebook.com:443/reel/123456789012345').port == 443


def test_media_fetches_stay_on_facebook_cdn_hosts():
    assert is_allowed_media_url('https://video.xx.fbcdn.net/file.mp4') is True
    assert is_allowed_media_url('https://scontent.xx.fbcdn.net/thumb.jpg') is True
    assert is_allowed_media_url('https://cdn.fbsbx.com/file.mp4') is True
    assert is_allowed_media_url('https://evil.example/video.mp4') is False
    assert is_allowed_media_url('http://video.xx.fbcdn.net/file.mp4') is False
    assert is_allowed_media_url('https://127.0.0.1/file.mp4') is False
    assert is_allowed_media_url('https://graph.facebook.com/v26.0/123') is False
    assert is_allowed_media_url('https://user@video.xx.fbcdn.net/file.mp4') is False
    assert is_allowed_media_url('https://video.xx.fbcdn.net:8443/file.mp4') is False
    assert is_allowed_media_url('https://fbcdn.net.evil.example/file.mp4') is False


def test_redacts_sensitive_query_parameters():
    output = redact_url('https://www.facebook.com/watch/?v=123&access_token=secret-value')
    assert 'secret-value' not in output
    assert 'access_token=%5Bredacted%5D' in output
    assert redact_url('https://www.facebook.com/watch/?v=123') == 'https://www.facebook.com/watch/?v=123'
