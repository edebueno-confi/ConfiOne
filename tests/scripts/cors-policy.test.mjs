import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedCorsOrigin, resolveCorsOrigin } from '../../supabase/functions/_shared/cors-policy.mjs';

test('permite Production e Preview conhecidos e rejeita origem indevida', () => {
  const production = 'https://genius-support-os.vercel.app';
  const preview = 'https://genius-support-qsi9of0cf-edebueno-confis-projects.vercel.app';
  assert.equal(isAllowedCorsOrigin(production), true);
  assert.equal(isAllowedCorsOrigin(preview), true);
  assert.equal(isAllowedCorsOrigin('https://malicious.example'), false);
  assert.equal(resolveCorsOrigin('https://malicious.example'), null);
});

test('localhost só é permitido quando explicitamente habilitado', () => {
  assert.equal(isAllowedCorsOrigin('http://127.0.0.1:4173'), false);
  assert.equal(isAllowedCorsOrigin('http://127.0.0.1:4173', { allowLocal: true }), true);
});
