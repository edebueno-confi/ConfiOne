// Troca da propria senha pelo usuario autenticado.
//
// Existe porque a decisao de produto de 2026-08-06 removeu o envio de e-mail:
// sem o fluxo de recuperacao por e-mail do Auth, a unica forma segura de a
// pessoa trocar a propria senha e provando que sabe a senha atual. A prova
// acontece no servidor, com reautenticacao real contra o Auth, e nao com um
// sinal do navegador.
//
// Este e tambem o unico caminho que limpa `app_metadata.must_change_password`.
// O marcador vive em `app_metadata` justamente porque o proprio usuario nao
// consegue escrever nesse objeto pelo cliente: so o service_role escreve. Se
// ele vivesse em `user_metadata`, qualquer sessao poderia se auto-liberar da
// troca obrigatoria com uma chamada `updateUser`.
//
// Nenhuma senha e persistida, registrada em log ou devolvida na resposta.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {
  createServiceClient,
  jsonResponse,
  optionsResponse,
  requireActor,
} from '../_shared/ticket-evidence.ts';

type RequestBody = {
  currentPassword?: string;
  newPassword?: string;
};

const MIN_PASSWORD_LENGTH = 12;

/**
 * Regra minima de forca, aplicada no servidor. O cliente repete a mesma regra
 * para dar retorno imediato, mas quem decide e este arquivo.
 */
function passwordPolicyViolation(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A nova senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (!/[a-z]/.test(password)) return 'A nova senha precisa ter pelo menos uma letra minúscula.';
  if (!/[A-Z]/.test(password)) return 'A nova senha precisa ter pelo menos uma letra maiúscula.';
  if (!/[0-9]/.test(password)) return 'A nova senha precisa ter pelo menos um número.';
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req);
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });

  try {
    const actor = await requireActor(req);
    const body = await req.json().catch(() => ({})) as RequestBody;
    const currentPassword = String(body.currentPassword ?? '');
    const newPassword = String(body.newPassword ?? '');

    if (!currentPassword || !newPassword) {
      return jsonResponse({ error: 'Informe a senha atual e a nova senha.' }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return jsonResponse({ error: 'A nova senha precisa ser diferente da senha atual.' }, { status: 400 });
    }
    const violation = passwordPolicyViolation(newPassword);
    if (violation) return jsonResponse({ error: violation }, { status: 400 });

    const adminClient = createServiceClient();

    // O e-mail vem do Auth pelo id do JWT, nunca do corpo da requisicao: assim
    // ninguem consegue reautenticar contra a identidade de outra pessoa.
    const { data: target, error: readError } = await adminClient.auth.admin.getUserById(actor.userId);
    const email = String(target?.user?.email ?? '').trim().toLowerCase();
    if (readError || !email) {
      return jsonResponse({ error: 'Não foi possível validar sua identidade.' }, { status: 403 });
    }

    // Cliente separado apenas para a reautenticacao, para nao contaminar o
    // estado de sessao do cliente que executa as operacoes administrativas.
    const verifyClient = createServiceClient();
    const { error: reauthError } = await verifyClient.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (reauthError) {
      return jsonResponse({ error: 'A senha atual está incorreta.' }, { status: 401 });
    }
    await verifyClient.auth.signOut().catch(() => undefined);

    const { error: updateError } = await adminClient.auth.admin.updateUserById(actor.userId, {
      password: newPassword,
      app_metadata: { must_change_password: false },
    });
    if (updateError) {
      return jsonResponse({ error: 'Não foi possível atualizar a senha agora.' }, { status: 502 });
    }

    return jsonResponse({ userId: actor.userId, passwordChanged: true, mustChangePassword: false });
  } catch (error) {
    // Mesma regra da criacao de usuario: o texto original da excecao pode
    // carregar o corpo da requisicao, e o corpo carrega senhas.
    const kind = error instanceof Error ? error.name : 'UnknownError';
    console.error('account-self-password failed', kind);
    return jsonResponse({ error: 'Não foi possível concluir a troca de senha.' }, { status: 500 });
  }
});
