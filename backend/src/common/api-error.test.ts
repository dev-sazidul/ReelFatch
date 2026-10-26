import assert from 'node:assert/strict';
import test from 'node:test';
import { redactSensitive } from './api-error';

test('redacts configured secrets and keeps the message short', () => {
  const token = 'EAA-user-token-value';
  const output = redactSensitive(`rejected ${token} at the edge`, [token]);
  assert.equal(output.includes(token), false);
  assert.match(output, /\[redacted\]/);
});

test('does not treat short strings as secrets', () => {
  assert.equal(redactSensitive('code 190', ['190']), 'code 190');
});
