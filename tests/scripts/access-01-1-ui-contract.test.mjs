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

test('nenhum segredo de plataforma é tratado no cliente', () => {
  // Decisão de produto de 2026-08-06: não há envio de e-mail, então o servidor
  // gera a senha e a devolve UMA vez para o administrador repassar. O que
  // continua proibido é o cliente coletar senha, montar credencial ou tocar em
  // chave de serviço.
  assert.doesNotMatch(page, /type="password"/);
  assert.doesNotMatch(page, /service_role|serviceRole|SERVICE_ROLE/);
  // A senha só pode chegar como leitura do resultado da operação: a tela não
  // pode gerar valor de credencial por conta própria.
  assert.doesNotMatch(page, /Math\.random|crypto\.getRandomValues/);
});

test('a senha temporária é de exibição única e não é persistida', () => {
  assert.match(page, /Senha temporária — exibição única/);
  assert.match(page, /Copiar senha/);
  // Nada de localStorage, sessionStorage, URL ou log com o valor.
  assert.doesNotMatch(page, /localStorage[\s\S]{0,80}[Pp]assword/);
  assert.doesNotMatch(page, /sessionStorage/);
  assert.doesNotMatch(page, /console\.(log|info|warn|error)[\s\S]{0,80}[Pp]assword/);
});

test('o caminho ativo não usa mais e-mail para definir senha', () => {
  // Sem servidor de e-mail: `resetPasswordForEmail` e a ação `password-setup`
  // saíram do fluxo oferecido pela interface.
  assert.doesNotMatch(page, /resetPasswordForEmail/);
  assert.doesNotMatch(page, /password-setup/);
  assert.doesNotMatch(page, /sendAdminInternalUserPasswordSetup/);
  assert.doesNotMatch(page, /Enviar definição de senha/);
  assert.match(page, /Redefinir senha/);
  assert.match(page, /resetAdminInternalUserPassword/);
});

test('detalhe do usuário vira drawer sobreposto no baseline sem reduzir a tabela', () => {
  assert.match(page, /gso-ui-access-drawer/, 'o detalhe precisa de uma superfície própria de drawer');
  assert.match(page, /aria-modal=\{detailOpen\}/, 'o drawer precisa comunicar quando está modal');
  assert.match(page, /onClick=\{closeDetail\}/, 'o detalhe precisa poder ser fechado sem alterar dados');
  assert.match(page, /event\.key === 'Escape'/, 'o drawer precisa fechar no Escape');
});
