import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (relative) => readFile(new URL(relative, import.meta.url), 'utf8');

const accountApi = await read('../../apps/web/src/features/account/account-api.ts');
const profilePage = await read('../../apps/web/src/features/account/MyProfilePage.tsx');
const passwordGate = await read('../../apps/web/src/features/account/PasswordChangeGate.tsx');
const shell = await read('../../apps/web/src/features/navigation/MinimalAppShell.tsx');
const router = await read('../../apps/web/src/app/router.tsx');
const bootstrap = await read('../../apps/web/src/features/auth/AuthBootstrap.tsx');
const adminApi = await read('../../apps/web/src/features/admin/admin-api.ts');
const createFunction = await read('../../supabase/functions/internal-access-user-create/index.ts');
const passwordFunction = await read('../../supabase/functions/account-self-password/index.ts');
const avatarMigration = await read(
  '../../supabase/migrations/20260806120000_profile_avatars_self_service_v1.sql',
);

test('o caminho ativo não contém envio de e-mail para senha', () => {
  // Decisão de produto de 2026-08-06: o servidor de e-mail não é usado.
  for (const [name, source] of [
    ['account-api', accountApi],
    ['MyProfilePage', profilePage],
    ['PasswordChangeGate', passwordGate],
    ['admin-api', adminApi],
    ['internal-access-user-create', createFunction],
    ['account-self-password', passwordFunction],
  ]) {
    assert.doesNotMatch(source, /resetPasswordForEmail/, `${name} ainda dispara e-mail de senha`);
    assert.doesNotMatch(source, /'password-setup'|"password-setup"/, `${name} ainda oferece password-setup`);
  }
});

test('a senha temporária nasce no servidor e nunca é persistida nem logada', () => {
  // Geração: apenas na Edge Function, com aleatoriedade criptográfica.
  assert.match(createFunction, /crypto\.getRandomValues/);
  assert.doesNotMatch(createFunction, /Math\.random/);

  // Nenhuma escrita em tabela, storage ou log carrega o valor.
  assert.doesNotMatch(createFunction, /console\.[a-z]+\([^)]*temporaryPassword/);
  assert.doesNotMatch(createFunction, /insert[\s\S]{0,120}temporaryPassword/i);
  assert.doesNotMatch(createFunction, /from\('[a-z_]+'\)[\s\S]{0,120}temporaryPassword/);

  // O erro cru não volta ao cliente: ele poderia carregar o corpo da requisição.
  assert.doesNotMatch(createFunction, /error:\s*message\s*\}/);

  // Nem o cliente guarda o valor fora do estado da tela.
  assert.doesNotMatch(accountApi, /temporaryPassword/);
});

test('a troca obrigatória usa marcador que o próprio usuário não escreve', () => {
  // `app_metadata` só é gravável pelo service_role; `user_metadata` não serviria.
  assert.match(createFunction, /app_metadata:\s*\{\s*must_change_password:\s*true/);
  assert.match(passwordFunction, /app_metadata:\s*\{\s*must_change_password:\s*false/);
  assert.match(accountApi, /must_change_password/);
  assert.doesNotMatch(accountApi, /user_metadata[\s\S]{0,60}must_change_password/);

  // E é avaliada acima de todas as rotas autenticadas.
  assert.match(bootstrap, /PasswordChangeGate/);
  assert.match(passwordGate, /requiresPasswordChange/);
});

test('a troca da própria senha exige a senha atual e é validada no servidor', () => {
  assert.match(passwordFunction, /signInWithPassword/);
  assert.match(passwordFunction, /currentPassword/);
  assert.match(passwordFunction, /getUserById\(actor\.userId\)/);
  // O e-mail vem do JWT, nunca do corpo: ninguém reautentica como outra pessoa.
  assert.doesNotMatch(passwordFunction, /body\.email/);
  assert.doesNotMatch(passwordFunction, /console\.[a-z]+\([^)]*[Pp]assword\s*[,)]/);
});

test('a edição de perfil é restrita ao próprio usuário pelo banco', () => {
  // A tela só escreve na linha do usuário autenticado...
  assert.match(accountApi, /\.eq\('id', userId\)/);
  assert.doesNotMatch(accountApi, /rpc_admin_/);
  // ...e o caminho do objeto no Storage é derivado do id, nunca do arquivo.
  assert.match(accountApi, /\$\{userId\}\/avatar\./);
  assert.doesNotMatch(accountApi, /file\.name/);

  // A garantia real está na policy: a primeira pasta precisa ser o próprio id.
  assert.match(
    avatarMigration,
    /\(storage\.foldername\(name\)\)\[1\] = app_private\.current_user_id\(\)::text/,
  );
  for (const command of ['insert', 'update', 'delete']) {
    assert.match(
      avatarMigration,
      new RegExp(`for ${command}\\s+to authenticated`),
      `bucket sem policy de ${command} restrita ao dono`,
    );
  }
});

test('a foto tem validação de tipo e tamanho no cliente e no servidor', () => {
  assert.match(accountApi, /AVATAR_MAX_BYTES = 2 \* 1024 \* 1024/);
  assert.match(accountApi, /image\/png', 'image\/jpeg', 'image\/webp/);
  assert.match(accountApi, /validateAvatarFile/);
  // Servidor: limite e mime list no próprio bucket.
  assert.match(avatarMigration, /file_size_limit/);
  assert.match(avatarMigration, /allowed_mime_types/);
  assert.match(avatarMigration, /2097152/);
});

test('o menu do usuário abre o perfil e a rota existe sob a área autenticada', () => {
  assert.match(shell, /Meu perfil/);
  assert.match(shell, /\/meu-perfil/);
  assert.match(router, /path: '\/meu-perfil'/);
  assert.match(router, /MyProfilePage/);
  // A foto precisa chegar à sidebar, ao menu e ao topo.
  assert.match(shell, /avatarUrl/);
});

test('"Meu perfil" edita só o que o contrato de autoedição aceita', () => {
  assert.match(profilePage, /Nome completo/);
  assert.match(profilePage, /updateSelfProfile/);
  assert.match(profilePage, /uploadSelfAvatar/);
  assert.match(profilePage, /removeSelfAvatar/);
  // E-mail, papéis e estrutura aparecem como leitura.
  assert.match(profilePage, /Administrado pela gestão de acessos/);
  // Nada de escrever campo administrado.
  assert.doesNotMatch(accountApi, /update\(\{[^}]*email/);
  assert.doesNotMatch(accountApi, /update\(\{[^}]*is_active/);
});
