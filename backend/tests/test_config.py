import os

import pytest

from app.config import AppConfig, facebook_access_token, load_config, load_env_file


def test_defaults_match_the_previous_api():
    config = load_config({})
    assert config == AppConfig()
    assert config.port == 3000
    assert config.cors_origins == ('http://localhost:5173', 'http://127.0.0.1:5173')
    assert config.host == '127.0.0.1'


def test_values_are_trimmed_and_validated():
    config = load_config({'PORT': ' 4000 ', 'CORS_ORIGIN': ' https://a.example , ,https://b.example', 'FACEBOOK_GRAPH_API_VERSION': ' v27.0 '})
    assert (config.port, config.cors_origins, config.graph_api_version) == (4000, ('https://a.example', 'https://b.example'), 'v27.0')
    assert load_config({'MAX_DOWNLOAD_BYTES': '1e3'}).max_download_bytes == 1000
    for bad in ('0', '-5', '1.5', 'abc'):
        with pytest.raises(ValueError, match='PORT must be a positive integer.'):
            load_config({'PORT': bad})
    with pytest.raises(ValueError, match='FACEBOOK_GRAPH_API_VERSION must look like v26.0.'):
        load_config({'FACEBOOK_GRAPH_API_VERSION': '26'})


def test_page_token_is_preferred():
    config = load_config({'FACEBOOK_USER_ACCESS_TOKEN': 'user-token-1', 'FACEBOOK_PAGE_ACCESS_TOKEN': ' page-token-1 '})
    assert facebook_access_token(config) == 'page-token-1'
    assert facebook_access_token(load_config({'FACEBOOK_USER_ACCESS_TOKEN': 'user-token-1'})) == 'user-token-1'


def test_env_file_is_read_without_overriding_the_environment(tmp_path, monkeypatch):
    env_file = tmp_path / '.env'
    env_file.write_text('REELFETCH_TEST_A=from-file\nREELFETCH_TEST_B=from-file\n', encoding='utf-8')
    monkeypatch.setenv('REELFETCH_TEST_B', 'from-shell')
    monkeypatch.delenv('REELFETCH_TEST_A', raising=False)
    load_env_file(env_file)
    assert os.environ['REELFETCH_TEST_A'] == 'from-file'
    assert os.environ['REELFETCH_TEST_B'] == 'from-shell'
    monkeypatch.delenv('REELFETCH_TEST_A')
    load_env_file(tmp_path / 'missing.env')
