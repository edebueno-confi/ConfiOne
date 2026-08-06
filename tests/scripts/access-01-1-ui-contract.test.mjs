import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('../../apps/web/src/features/access/InternalControlPlanePage.tsx', import.meta.url), 'utf8');

test('control plane usa quatro tabs operacionais e separa clientes da lista interna', () => {
  assert.match(page, /Usuários/);
  assert.match(page, /Convites/);
  assert.match(page, /Estrutura/);
  assert.match(page, /Perfis/);
  assert.match(page, /Somente identidades com contexto interno aparecem aqui/);
});

test('control plane não renderiza token bruto nem usa DML direto', () => {
  assert.doesNotMatch(page, /tokenHash.*render|rawToken|token_hash.*value/);
  assert.match(page, /createAdminInternalUser/);
  assert.match(page, /setAdminInternalUserStatus/);
  assert.match(page, /upsertAdminInternalOverride/);
});

test('liberação de acesso é criação direta de usuário, não convite', () => {
  // Decisão de produto registrada no handoff de 2026-08-05: o convite deixou de
  // ser caminho de liberação. A tela não pode voltar a preparar convite nem
  // chamar a Edge Function de convite.
  assert.doesNotMatch(page, /createAdminInternalInvitation/);
  assert.doesNotMatch(page, /internal-access-invite/);
  assert.doesNotMatch(page, /Convidar usuário|Preparar convite/);
  assert.match(page, /Criar usuário/);
});

test('a navegação da tela fica fora do container de rolagem', () => {
  // Regressão do defeito de 2026-08-06: com cabeçalho, indicadores e abas dentro
  // do mesmo container que rola, a faixa de abas era esmagada até sumir.
  assert.match(page, /gso-ui-shell-chrome/);
  assert.match(page, /gso-ui-shell-body/);
  assert.doesNotMatch(page, /gso-access-hd/);
});

test('nenhuma senha ou segredo é tratado no cliente', () => {
  // A credencial nasce e é inicializada somente no servidor: a tela não coleta,
  // não exibe e não guarda senha, token ou service role.
  assert.doesNotMatch(page, /type="password"/);
  assert.doesNotMatch(page, /temporaryPassword|senhaTemporaria|service_role|serviceRole/);
});
