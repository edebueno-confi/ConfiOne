// Criacao direta de usuario interno pelo painel administrativo.
//
// Este e o caminho oficial de liberacao de acesso interno. Ele NAO usa
// `internal_invites` nem a funcao `internal-access-invite`: a conta de Auth e
// criada no servidor e o acesso e materializado pelos contratos reais que ja
// existem (`rpc_admin_update_internal_access_assignment`), sob o JWT do
// administrador, para que capacidade, tenant, RLS e auditoria de linha
// continuem valendo exatamente como nas demais operacoes do control plane.
//
// Seguranca: nenhuma senha e gerada, transportada, persistida ou registrada em
// log. A conta nasce sem credencial e a definicao de senha usa o fluxo oficial
// de recuperacao do Auth, disparado somente pelo servidor.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {
  createServiceClient,
  createUserClient,
  getAuthorizationHeader,
  jsonResponse,
  optionsResponse,
  requireActor,
} from '../_shared/ticket-evidence.ts';

type RequestBody = {
  action?: 'create' | 'password-setup';
  email?: string;
  fullName?: string;
  areaKey?: string;
  functionId?: string | null;
  accessProfileId?: string | null;
  userId?: string;
};

function appUrl(req: Request) {
  return Deno.env.get('PUBLIC_APP_URL') ?? new URL(req.url).origin;
}

function normalizedEmail(value: string | undefined) {
  return (value ?? '').trim().toLowerCase();
}

// Pre-autorizacao barata sob o JWT do administrador. `vw_admin_access_areas`
// exige a capacidade `access.view`, entao quem nao administra acessos nao
// chega a criar nada. A prova de `access.users.manage` acontece no proprio
// comando de atribuicao, e a saga abaixo compensa a conta orfa se ela falhar.
async function requireVisibleActiveArea(
  userClient: ReturnType<typeof createUserClient>,
  areaKey: string,
) {
  const { data, error } = await userClient.rpc('rpc_admin_list_internal_areas');
  if (error) return false;
  return (data ?? []).some(
    (area: { area_key?: unknown; is_active?: unknown }) =>
      String(area.area_key ?? '') === areaKey && area.is_active === true,
  );
}

// Compensacao segura: so remove a conta que ESTA requisicao criou e apenas
// quando ela ficou sem nenhum contexto interno e nenhum vinculo de area.
async function compensateOrphanAuthUser(
  serviceClient: ReturnType<typeof createServiceClient>,
  userId: string,
) {
  const [{ count: contexts }, { count: memberships }] = await Promise.all([
    serviceClient.from('user_actor_contexts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    serviceClient.from('internal_area_memberships').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);
  if ((contexts ?? 0) === 0 && (memberships ?? 0) === 0) {
    await serviceClient.auth.admin.deleteUser(userId);
    return true;
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req);
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });

  try {
    const body = await req.json().catch(() => ({})) as RequestBody;
    const action = body.action ?? 'create';
    const authHeader = getAuthorizationHeader(req);
    const actor = await requireActor(req);
    const userClient = createUserClient(authHeader);
    const serviceClient = createServiceClient();

    if (action === 'password-setup') {
      if (!body.userId) return jsonResponse({ error: 'userId is required' }, { status: 400 });
      // A leitura passa pelo JWT do administrador: quem nao tem `access.view`
      // recebe erro aqui e nunca dispara o fluxo de credencial.
      const { data: target, error: readError } = await userClient.rpc('rpc_admin_get_internal_access_user', {
        p_user_id: body.userId,
      });
      if (readError || !target) return jsonResponse({ error: 'Usuário interno não encontrado ou fora do seu escopo.' }, { status: 403 });
      const targetEmail = normalizedEmail(String((target as { email?: unknown }).email ?? ''));
      if (!targetEmail) return jsonResponse({ error: 'Usuário sem e-mail cadastrado.' }, { status: 409 });
      const { error: recoveryError } = await serviceClient.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${appUrl(req)}/login`,
      });
      if (recoveryError) return jsonResponse({ error: 'Não foi possível iniciar a definição de senha.' }, { status: 502 });
      return jsonResponse({ userId: body.userId, credentialStatus: 'password_setup_sent' });
    }

    const email = normalizedEmail(body.email);
    const fullName = (body.fullName ?? '').trim();
    const areaKey = (body.areaKey ?? '').trim();
    if (!email || !email.includes('@') || !fullName || !areaKey) {
      return jsonResponse({ error: 'fullName, email e areaKey são obrigatórios.' }, { status: 400 });
    }
    if (!(await requireVisibleActiveArea(userClient, areaKey))) {
      return jsonResponse({ error: 'Área inválida ou fora do seu escopo administrativo.' }, { status: 403 });
    }

    // Idempotencia por e-mail: `profiles` espelha `auth.users` pelo gatilho
    // `on_auth_user_created_or_updated`, entao ele e a fonte de verdade para
    // saber se a identidade ja existe sem varrer a API de Auth.
    const { data: existingProfile, error: profileError } = await serviceClient
      .from('profiles')
      .select('id,full_name,is_active')
      .eq('email', email)
      .maybeSingle();
    if (profileError) return jsonResponse({ error: 'Não foi possível verificar identidades existentes.' }, { status: 502 });

    let userId = existingProfile?.id ? String(existingProfile.id) : '';
    let createdNow = false;

    if (!userId) {
      // Conta criada SEM senha: a credencial nasce inexistente e so pode ser
      // definida pelo fluxo oficial de recuperacao, no proprio servidor.
      const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (createError || !created?.user?.id) {
        return jsonResponse({ error: 'Não foi possível criar a conta de autenticação para este e-mail.' }, { status: 409 });
      }
      userId = String(created.user.id);
      createdNow = true;
    } else if (!String(existingProfile?.full_name ?? '').trim()) {
      await serviceClient.from('profiles').update({ full_name: fullName }).eq('id', userId);
    }

    const { data: provisioned, error: assignError } = await userClient.rpc('rpc_admin_update_internal_access_assignment', {
      p_user_id: userId,
      p_area_key: areaKey,
      p_function_id: body.functionId || null,
      p_access_profile_id: body.accessProfileId || null,
    });

    if (assignError) {
      const compensated = createdNow ? await compensateOrphanAuthUser(serviceClient, userId) : false;
      console.error('internal-access-user-create assignment failed', assignError.message, { compensated });
      return jsonResponse(
        { error: 'Não foi possível provisionar o acesso interno deste usuário.', compensated },
        { status: 400 },
      );
    }

    return jsonResponse({
      userId,
      created: createdNow,
      alreadyExisted: !createdNow,
      credentialStatus: 'pending_password_setup',
      actorId: actor.userId,
      user: provisioned,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? 'User provisioning failed.');
    console.error('internal-access-user-create failed', message);
    return jsonResponse({ error: message }, { status: 500 });
  }
});
