from app.errors import redact_sensitive


def test_redacts_configured_secrets_and_keeps_the_message_short():
    token = 'EAA-user-token-value'
    output = redact_sensitive(f'rejected {token} at the edge', [token])
    assert token not in output
    assert '[redacted]' in output
    assert len(redact_sensitive('x' * 1000, [])) == 400


def test_does_not_treat_short_strings_as_secrets():
    assert redact_sensitive('code 190', ['190']) == 'code 190'
