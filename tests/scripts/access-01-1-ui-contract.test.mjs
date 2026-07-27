import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('../../apps/web/src/features/access/InternalControlPlanePage.tsx', import.meta.url), 'utf8');

test('control plane usa quatro tabs operacionais e separa clientes da lista interna', () => {
  assert.match(page, /Usuários internos/);
  assert.match(page, /Convites/);
  assert.match(page, /Áreas e funções/);
  assert.match(page, /Perfis e permissões/);
  assert.match(page, /Somente identidades com contexto interno aparecem aqui/);
});

test('control plane não renderiza token bruto nem usa DML direto', () => {
  assert.doesNotMatch(page, /tokenHash.*render|rawToken|token_hash.*value/);
  assert.match(page, /createAdminInternalInvitation/);
  assert.match(page, /setAdminInternalUserStatus/);
  assert.match(page, /upsertAdminInternalOverride/);
});
