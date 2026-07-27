import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {
  createServiceClient,
  createUserClient,
  getAuthorizationHeader,
  jsonResponse,
  optionsResponse,
  requireActor,
} from '../_shared/ticket-evidence.ts';

type InviteBody = {
  action?: 'create' | 'resend' | 'revoke' | 'accept';
  inviteId?: string;
  email?: string;
  fullName?: string;
  areaKey?: string;
  functionId?: string | null;
  accessProfileId?: string | null;
  expiresAt?: string;
};

const attempts = new Map<string, number[]>();

function rateLimitKey(req: Request, email: string) {
  return `${req.headers.get('x-forwarded-for') ?? 'unknown'}:${email.toLowerCase()}`;
}

function allowedAttempt(req: Request, email: string) {
  const now = Date.now();
  const key = rateLimitKey(req, email);
  const recent = (attempts.get(key) ?? []).filter((value) => now - value < 10 * 60_000);
  if (recent.length >= 3) return false;
  recent.push(now);
  attempts.set(key, recent);
  return true;
}

function appUrl(req: Request) {
  return Deno.env.get('PUBLIC_APP_URL') ?? new URL(req.url).origin;
}

async function sha256(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function deliverInvite(serviceClient: ReturnType<typeof createServiceClient>, invite: { id: string; email: string }, req: Request) {
  const redirectTo = `${appUrl(req)}/login?invite_id=${encodeURIComponent(invite.id)}`;
  const { data: authData, error } = await serviceClient.auth.admin.inviteUserByEmail(invite.email, {
    redirectTo,
    data: { internal_invite_id: invite.id },
  });
  if (!error && authData.user?.id) {
    await serviceClient.from('internal_invites').update({ auth_user_id: authData.user.id }).eq('id', invite.id);
  }
  const { error: deliveryError } = await serviceClient.rpc('rpc_internal_invitation_delivery_update', {
    p_invite_id: invite.id,
    p_success: !error,
    p_error: error ? 'auth invite delivery failed' : null,
  });
  if (deliveryError && !error) throw deliveryError;
  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req);
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });

  try {
    const body = await req.json().catch(() => ({})) as InviteBody;
    const action = body.action ?? 'create';
    const authHeader = getAuthorizationHeader(req);
    const actor = await requireActor(req);
    const userClient = createUserClient(authHeader);
    const serviceClient = createServiceClient();

    if (action === 'accept') {
      if (!body.inviteId) return jsonResponse({ error: 'inviteId is required' }, { status: 400 });
      const { data, error } = await userClient.rpc('rpc_accept_internal_invitation_by_id', { p_invite_id: body.inviteId });
      if (error) {
        const { data: invite } = await serviceClient.from('internal_invites').select('auth_user_id').eq('id', body.inviteId).maybeSingle();
        if (invite?.auth_user_id === actor.userId) {
          const [{ count: contexts }, { count: memberships }] = await Promise.all([
            serviceClient.from('user_actor_contexts').select('id', { count: 'exact', head: true }).eq('user_id', actor.userId),
            serviceClient.from('internal_area_memberships').select('id', { count: 'exact', head: true }).eq('user_id', actor.userId),
          ]);
          if ((contexts ?? 0) === 0 && (memberships ?? 0) === 0) {
            await serviceClient.auth.admin.deleteUser(actor.userId);
          }
        }
        return jsonResponse({ error: 'Invite acceptance failed.' }, { status: 400 });
      }
      return jsonResponse(data);
    }

    if (action === 'revoke') {
      if (!body.inviteId) return jsonResponse({ error: 'inviteId is required' }, { status: 400 });
      const { data, error } = await userClient.rpc('rpc_admin_revoke_internal_invitation', { p_invite_id: body.inviteId });
      if (error) return jsonResponse({ error: 'Invite revocation failed.' }, { status: 400 });
      return jsonResponse({ inviteId: data?.id ?? body.inviteId, status: 'revoked' });
    }

    let invite: { id: string; email: string } | null = null;
    if (action === 'resend') {
      if (!body.inviteId) return jsonResponse({ error: 'inviteId is required' }, { status: 400 });
      const { data, error } = await userClient.from('vw_admin_access_invites').select('invite_id,email,status,expires_at').eq('invite_id', body.inviteId).maybeSingle();
      if (error || !data || !['pending', 'sent'].includes(String(data.status)) || new Date(String(data.expires_at)).getTime() <= Date.now()) {
        return jsonResponse({ error: 'Invite is not deliverable.' }, { status: 400 });
      }
      invite = { id: String(data.invite_id), email: String(data.email) };
    } else {
      const email = body.email?.trim().toLowerCase();
      if (!email || !email.includes('@') || !body.fullName?.trim() || !body.areaKey || !body.expiresAt) {
        return jsonResponse({ error: 'email, fullName, areaKey and expiresAt are required' }, { status: 400 });
      }
      if (!allowedAttempt(req, email)) return jsonResponse({ error: 'Too many invite attempts. Try again later.' }, { status: 429 });
      const tokenHash = await sha256(`${crypto.randomUUID()}-${crypto.randomUUID()}`);
      const { data, error } = await userClient.rpc('rpc_admin_create_internal_invitation_v2', {
        p_email: email,
        p_full_name: body.fullName.trim(),
        p_area_key: body.areaKey,
        p_function_id: body.functionId ?? null,
        p_access_profile_id: body.accessProfileId ?? null,
        p_token_hash: tokenHash,
        p_expires_at: body.expiresAt,
      });
      if (error || !data?.invite_id) return jsonResponse({ error: 'Invite creation failed.' }, { status: 400 });
      invite = { id: String(data.invite_id), email };
    }

    await deliverInvite(serviceClient, invite, req);
    return jsonResponse({ inviteId: invite.id, status: 'sent', actorId: actor.userId });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Invite operation failed.' }, { status: 500 });
  }
});
