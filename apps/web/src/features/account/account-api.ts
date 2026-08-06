import { toAppError } from '../../app/errors';
import { requireSupabaseBrowserClient } from '../../app/supabase-browser';

/**
 * Auto-servico de perfil.
 *
 * A autorizacao NAO mora aqui. `public.profiles` tem RLS
 * (`profiles_update_self_safe_fields_only`) que restringe UPDATE a
 * `id = app_private.current_user_id()`, e o gatilho
 * `app_private.prevent_sensitive_profile_changes()` bloqueia `email`,
 * `is_active`, `id` e carimbos. O bucket `profile-avatars` restringe escrita ao
 * caminho prefixado pelo id do usuario. Este modulo so conversa com esses
 * contratos: se alguem tentar editar outra pessoa, o banco recusa.
 *
 * Assimetria proposital entre leitura e escrita: `20260430172140` revogou
 * `select on public.profiles from authenticated` — leitura de identidade e
 * contrato de read model, nao de tabela. Por isso a escrita vai direto na
 * tabela (que continua com UPDATE concedido e RLS de auto-edicao) e a leitura
 * volta sempre por `vw_admin_auth_context`, que ja e escopado ao proprio
 * usuario e ja expõe exatamente `id`, `full_name`, `email` e `avatar_url`.
 * Nenhum contrato novo foi criado para isso.
 */

export const AVATAR_BUCKET = 'profile-avatars';
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const;

const MIME_EXTENSION: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export interface SelfProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export async function fetchSelfProfile() {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_admin_auth_context')
    .select('id,full_name,email,avatar_url,is_active')
    .maybeSingle();

  if (error) throw toAppError(error, 'Falha ao carregar o seu perfil.');
  return (data ?? null) as SelfProfileRow | null;
}

/**
 * Atualiza apenas os campos que o contrato de auto-edicao aceita. `email`,
 * papel, area, funcao e perfil de acesso nao aparecem aqui de proposito.
 */
export async function updateSelfProfile(userId: string, input: { fullName: string }) {
  const client = requireSupabaseBrowserClient();
  const fullName = input.fullName.trim();
  if (!fullName) throw new Error('Informe o seu nome completo.');

  const { data, error } = await client
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', userId)
    .select('id,full_name,email,avatar_url,is_active')
    .maybeSingle();

  if (error) throw toAppError(error, 'Falha ao salvar o seu perfil.');
  return (data ?? null) as SelfProfileRow | null;
}

/** Validacao de cliente. A mesma regra vale no servidor pelo bucket. */
export function validateAvatarFile(file: File) {
  if (!(AVATAR_ALLOWED_MIME as readonly string[]).includes(file.type)) {
    return 'Envie uma imagem PNG, JPEG ou WebP.';
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return 'A imagem precisa ter no máximo 2 MB.';
  }
  return null;
}

/**
 * Sobe a foto e grava a URL no perfil.
 *
 * O nome do arquivo vem do id do usuario e do tipo declarado, nunca do nome do
 * arquivo escolhido: nada do lado do cliente decide o caminho no bucket. O
 * prefixo tambem e o que a policy do Storage verifica.
 */
export async function uploadSelfAvatar(userId: string, file: File) {
  const violation = validateAvatarFile(file);
  if (violation) throw new Error(violation);

  const client = requireSupabaseBrowserClient();
  const extension = MIME_EXTENSION[file.type];
  const objectPath = `${userId}/avatar.${extension}`;

  const { error: uploadError } = await client.storage
    .from(AVATAR_BUCKET)
    .upload(objectPath, file, { upsert: true, contentType: file.type });
  if (uploadError) throw toAppError(uploadError, 'Falha ao enviar a sua foto.');

  await removeStaleAvatarObjects(userId, objectPath);

  const { data: publicUrl } = client.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath);
  // A URL do objeto e estavel, entao o navegador serviria a foto antiga do
  // cache. O carimbo troca a URL renderizada sem duplicar arquivo no bucket.
  const avatarUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;

  const { data, error } = await client
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)
    .select('id,full_name,email,avatar_url,is_active')
    .maybeSingle();
  if (error) throw toAppError(error, 'Falha ao registrar a sua foto no perfil.');

  return (data ?? null) as SelfProfileRow | null;
}

/** Troca de extensao nao pode deixar a imagem anterior orfa no bucket. */
async function removeStaleAvatarObjects(userId: string, keepPath: string) {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.storage.from(AVATAR_BUCKET).list(userId);
  if (error || !data) return;
  const stale = data
    .map((entry) => `${userId}/${entry.name}`)
    .filter((path) => path !== keepPath);
  if (stale.length) await client.storage.from(AVATAR_BUCKET).remove(stale);
}

/**
 * Remove a foto. O estado sem foto e legitimo: a interface volta ao monograma
 * com as iniciais, que ja e o padrao das outras telas.
 */
export async function removeSelfAvatar(userId: string) {
  const client = requireSupabaseBrowserClient();
  const { data: listed } = await client.storage.from(AVATAR_BUCKET).list(userId);
  if (listed?.length) {
    await client.storage.from(AVATAR_BUCKET).remove(listed.map((entry) => `${userId}/${entry.name}`));
  }

  const { data, error } = await client
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', userId)
    .select('id,full_name,email,avatar_url,is_active')
    .maybeSingle();
  if (error) throw toAppError(error, 'Falha ao remover a sua foto.');

  return (data ?? null) as SelfProfileRow | null;
}

export const SELF_PASSWORD_MIN_LENGTH = 12;

/** Espelho da politica do servidor, apenas para retorno imediato na tela. */
export function selfPasswordPolicyViolation(password: string) {
  if (password.length < SELF_PASSWORD_MIN_LENGTH) {
    return `A nova senha precisa ter pelo menos ${SELF_PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (!/[a-z]/.test(password)) return 'A nova senha precisa ter pelo menos uma letra minúscula.';
  if (!/[A-Z]/.test(password)) return 'A nova senha precisa ter pelo menos uma letra maiúscula.';
  if (!/[0-9]/.test(password)) return 'A nova senha precisa ter pelo menos um número.';
  return null;
}

/**
 * Troca da propria senha. A senha atual e conferida no servidor, com
 * reautenticacao real; o navegador nunca decide se a credencial confere e nunca
 * guarda nem registra o valor digitado.
 */
export async function changeSelfPassword(input: { currentPassword: string; newPassword: string }) {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.functions.invoke('account-self-password', {
    body: { currentPassword: input.currentPassword, newPassword: input.newPassword },
  });
  if (error) throw toAppError(error, 'Falha ao trocar a sua senha.');
  return data as { userId: string; passwordChanged: boolean; mustChangePassword: boolean };
}

/**
 * Marcador durável da troca obrigatoria. Vive em `app_metadata`, que so o
 * service_role escreve, entao a sessao nao consegue se auto-liberar.
 */
export function requiresPasswordChange(appMetadata: Record<string, unknown> | undefined | null) {
  return appMetadata?.must_change_password === true;
}

/**
 * O JWT em memoria ainda carrega o `app_metadata` anterior depois da troca de
 * senha. Renovar a sessao e o que faz a aplicacao enxergar o marcador limpo.
 */
export async function refreshAuthClaims() {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.auth.refreshSession();
  if (error) throw toAppError(error, 'Falha ao renovar a sessão após a troca de senha.');
}
