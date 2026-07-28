-- ACCESS-01.4: estabiliza os read models autenticados do control plane.
--
-- O PostgreSQL 17 local encerrava o backend quando o PostgREST aplicava sua
-- consulta paginada sobre as views com security_barrier e predicados de
-- capability. A autorização permanece actor-bound na função privada; as
-- views públicas ficam apenas como adaptadores de compatibilidade.

create or replace function app_private.admin_access_profile_capabilities()
returns table (
  access_profile_id uuid,
  capability_key text
)
language sql
stable
security definer
set search_path = ''
as $function$
  select grant_row.access_profile_id, grant_row.capability_key
  from public.internal_access_profile_capability_grants as grant_row
  where app_private.has_internal_capability('access.view');
$function$;

create or replace function app_private.admin_access_overrides()
returns table (
  override_id uuid,
  user_id uuid,
  full_name text,
  email extensions.citext,
  capability_key text,
  capability_name text,
  domain text,
  effect public.internal_capability_effect,
  justification text,
  valid_until timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  granted_by_name text
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    override_row.id,
    override_row.user_id,
    subject.full_name,
    subject.email,
    override_row.capability_key,
    capability.display_name,
    capability.domain,
    override_row.effect,
    override_row.justification,
    override_row.valid_until,
    override_row.created_at,
    override_row.updated_at,
    grantor.full_name
  from public.internal_user_capability_overrides as override_row
  join public.profiles as subject on subject.id = override_row.user_id
  join public.internal_capabilities as capability on capability.capability_key = override_row.capability_key
  left join public.profiles as grantor on grantor.id = override_row.granted_by_user_id
  where app_private.has_internal_capability('access.permissions.manage');
$function$;

revoke all on function app_private.admin_access_profile_capabilities() from public, anon, authenticated;
revoke all on function app_private.admin_access_overrides() from public, anon, authenticated;

create or replace function public.rpc_admin_list_internal_access_profile_capabilities()
returns table (
  access_profile_id uuid,
  capability_key text
)
language sql
stable
security definer
set search_path = ''
as $function$
  select * from app_private.admin_access_profile_capabilities();
$function$;

create or replace function public.rpc_admin_list_internal_access_overrides()
returns table (
  override_id uuid,
  user_id uuid,
  full_name text,
  email extensions.citext,
  capability_key text,
  capability_name text,
  domain text,
  effect public.internal_capability_effect,
  justification text,
  valid_until timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  granted_by_name text
)
language sql
stable
security definer
set search_path = ''
as $function$
  select * from app_private.admin_access_overrides();
$function$;

revoke all on function public.rpc_admin_list_internal_access_profile_capabilities() from public, anon;
revoke all on function public.rpc_admin_list_internal_access_overrides() from public, anon;
grant execute on function public.rpc_admin_list_internal_access_profile_capabilities() to authenticated, service_role;
grant execute on function public.rpc_admin_list_internal_access_overrides() to authenticated, service_role;

alter view public.vw_admin_access_profile_capabilities reset (security_barrier);
create or replace view public.vw_admin_access_profile_capabilities as
  select * from app_private.admin_access_profile_capabilities();

alter view public.vw_admin_access_overrides reset (security_barrier);
create or replace view public.vw_admin_access_overrides as
  select * from app_private.admin_access_overrides();

notify pgrst, 'reload schema';

-- PostgREST ainda pode construir um plano instável para funções que retornam
-- SETOF/table quando elas consultam o contexto autenticado. A entrada pública
-- final retorna um único jsonb, sem expor um recordset para paginação interna.
create or replace function public.rpc_admin_list_internal_access_profile_capabilities_v2()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(
    jsonb_agg(jsonb_build_object('access_profile_id', grant_row.access_profile_id, 'capability_key', grant_row.capability_key) order by grant_row.access_profile_id, grant_row.capability_key),
    '[]'::jsonb
  )
  from public.internal_access_profile_capability_grants as grant_row
  where app_private.has_internal_capability('access.view');
$function$;

create or replace function public.rpc_admin_list_internal_access_overrides_v2()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(
    jsonb_agg(to_jsonb(rows) order by rows.updated_at desc),
    '[]'::jsonb
  )
  from (
    select
      override_row.id as override_id,
      override_row.user_id,
      subject.full_name,
      subject.email,
      override_row.capability_key,
      capability.display_name as capability_name,
      capability.domain,
      override_row.effect,
      override_row.justification,
      override_row.valid_until,
      override_row.created_at,
      override_row.updated_at,
      grantor.full_name as granted_by_name
    from public.internal_user_capability_overrides as override_row
    join public.profiles as subject on subject.id = override_row.user_id
    join public.internal_capabilities as capability on capability.capability_key = override_row.capability_key
    left join public.profiles as grantor on grantor.id = override_row.granted_by_user_id
    where app_private.has_internal_capability('access.permissions.manage')
  ) as rows;
$function$;

revoke all on function public.rpc_admin_list_internal_access_profile_capabilities() from authenticated, service_role;
revoke all on function public.rpc_admin_list_internal_access_overrides() from authenticated, service_role;
revoke all on function public.rpc_admin_list_internal_access_profile_capabilities_v2() from public, anon;
revoke all on function public.rpc_admin_list_internal_access_overrides_v2() from public, anon;
grant execute on function public.rpc_admin_list_internal_access_profile_capabilities_v2() to authenticated, service_role;
grant execute on function public.rpc_admin_list_internal_access_overrides_v2() to authenticated, service_role;

-- Compatibilidade de catálogo sem acesso direto: o frontend usa os RPCs v2.
-- O predicado de capability não fica no plano de uma view consultável pelo
-- PostgREST, e authenticated não recebe SELECT direto nessas relações.
revoke all on public.vw_admin_access_profile_capabilities, public.vw_admin_access_overrides from public, anon, authenticated, service_role;
alter view public.vw_admin_access_profile_capabilities reset (security_barrier);
create or replace view public.vw_admin_access_profile_capabilities as
  select access_profile_id, capability_key from public.internal_access_profile_capability_grants;
alter view public.vw_admin_access_overrides reset (security_barrier);
create or replace view public.vw_admin_access_overrides as
  select
    override_row.id as override_id,
    override_row.user_id,
    subject.full_name,
    subject.email,
    override_row.capability_key,
    capability.display_name as capability_name,
    capability.domain,
    override_row.effect,
    override_row.justification,
    override_row.valid_until,
    override_row.created_at,
    override_row.updated_at,
    grantor.full_name as granted_by_name
  from public.internal_user_capability_overrides as override_row
  join public.profiles as subject on subject.id = override_row.user_id
  join public.internal_capabilities as capability on capability.capability_key = override_row.capability_key
  left join public.profiles as grantor on grantor.id = override_row.granted_by_user_id;

notify pgrst, 'reload schema';
