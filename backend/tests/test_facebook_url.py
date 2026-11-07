from app.providers.facebook.url import FacebookTarget, classify_facebook_target
from tests.helpers import url


def target(raw: str) -> FacebookTarget:
    return classify_facebook_target(url(raw))


def video(video_id: str) -> FacebookTarget:
    return FacebookTarget('video', video_id=video_id)


def unresolved(link_type: str) -> FacebookTarget:
    return FacebookTarget('unresolved', link_type=link_type)  # type: ignore[arg-type]


def test_reads_numeric_ids_from_watch_reel_and_videos_links():
    assert target('https://www.facebook.com/watch/?v=123456789012345') == video('123456789012345')
    assert target('https://www.facebook.com/reel/123456789012345/') == video('123456789012345')
    assert target('https://www.facebook.com/page/videos/123456789012345') == video('123456789012345')
    assert target('https://www.facebook.com/video.php?v=1234567890') == video('1234567890')
    assert target('https://www.facebook.com/watch/?video_id=1234567890') == video('1234567890')
    assert target('https://m.facebook.com/reels/1234567890') == video('1234567890')
    assert target('https://www.facebook.com/watch/1234567890/') == video('1234567890')


def test_does_not_treat_share_codes_or_fb_watch_links_as_video_ids():
    assert target('https://www.facebook.com/share/v/1CFYs2VsvF/') == unresolved('share')
    assert target('https://fb.watch/abcXYZ/') == unresolved('short')
    assert target('https://www.facebook.com/reel/not-numeric') == unresolved('reel')
    assert target('https://www.facebook.com/zuck') == unresolved('other')
    assert target('https://www.facebook.com/watch/') == unresolved('watch')
    assert target('https://www.facebook.com/page/videos/abc') == unresolved('watch')


def test_a_non_numeric_v_does_not_fall_back_to_video_id():
    # Same as the previous API: `v` present but not numeric means no id, even if video_id is numeric.
    assert target('https://www.facebook.com/watch/?v=abc&video_id=1234567890') == unresolved('watch')


def test_ids_must_use_ascii_digits():
    assert target('https://www.facebook.com/reel/١٢٣٤٥٦٧٨٩') == unresolved('reel')
