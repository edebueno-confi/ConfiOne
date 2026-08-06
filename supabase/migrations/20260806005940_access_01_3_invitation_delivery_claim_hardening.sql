-- ACCESS-01.3: o PostgREST local e remoto podem expor o role dentro de
-- request.jwt.claims, em vez do setting legado request.jwt.claim.role.
create or replace function public.rpc_internal_invitation_delivery_update(
  p_invite_id uuid,
  p_success boolean,
  p_error text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.internal_invites;
  v_role text := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  );
begin
  if v_role <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;

  update public.internal_invites
  set delivery_attempts = delivery_attempts + 1,
      last_delivery_at = timezone('utc', now()),
      last_delivery_error = case when p_success then null else left(coalesce(p_error, 'delivery failed'), 500) end,
      status = case when p_success then 'sent'::public.internal_invitation_status else 'failed'::public.internal_invitation_status end,
      sent_at = case when p_success then coalesce(sent_at, timezone('utc', now())) else sent_at end,
      updated_at = timezone('utc', now())
  where id = p_invite_id
    and status in ('pending', 'sent')
  returning * into v_row;

  if v_row.id is null then
    raise exception 'invite not found or no longer deliverable';
  end if;

  return jsonb_build_object(
    'invite_id', v_row.id,
    'status', v_row.status,
    'delivery_attempts', v_row.delivery_attempts
  );
end;
$$;

revoke all on function public.rpc_internal_invitation_delivery_update(uuid, boolean, text) from public, anon, authenticated, service_role;
grant execute on function public.rpc_internal_invitation_delivery_update(uuid, boolean, text) to service_role;
