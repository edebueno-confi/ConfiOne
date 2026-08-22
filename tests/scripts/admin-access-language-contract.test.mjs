import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(
  new URL('../../apps/web/src/features/access/AccessPage.tsx', import.meta.url),
  'utf8',
);

test('AccessPage usa linguagem de produto sem expor códigos de autorização', () => {
  assert.match(page, /Organize usuários, funções, clientes e convites/);
  assert.match(page, /Acesso aos indicadores/);
  assert.match(page, /Acesso deste cliente/);
  assert.doesNotMatch(page, /Perfil global/);
  assert.doesNotMatch(page, /Perfil global/);
  assert.doesNotMatch(page, /Referência manual/);
  assert.doesNotMatch(page, /Acesso ao Dashboard Gerencial/);
});

test('AccessPage mantém flags reais como autoridade para alterar acesso', () => {
  assert.match(page, /selectedMembership\.can_update_role/);
  assert.match(page, /selectedMembership\.can_update_status/);
  assert.match(page, /can_update_role/);
  assert.match(page, /can_update_status/);
});
