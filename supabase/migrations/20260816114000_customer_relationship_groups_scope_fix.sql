-- Customer Relationship Groups V1 scope correction
--
-- Carteira de Customer Success e uma atribuicao operacional de tenant a
-- responsavel CS. Ela nao e um agrupamento de marcas, grupo economico ou
-- guarda-chuva de servico. O enum legado permanece para leitura de eventuais
-- registros antigos, mas novas criacoes ficam bloqueadas.

alter table public.customer_account_groups
  add constraint customer_account_groups_not_cs_portfolio_check
  check (group_type <> 'portfolio'::public.customer_group_type)
  not valid;

create or replace function public.rpc_admin_create_customer_account_group(
  p_slug text,
  p_display_name text,
  p_group_type public.customer_group_type default 'service_umbrella',
  p_description text default null
)
returns public.customer_account_groups
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_group public.customer_account_groups;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_create_customer_account_group denied';
  end if;

  if p_group_type = 'portfolio'::public.customer_group_type then
    raise exception 'customer success portfolios must use CS portfolio assignments';
  end if;

  insert into public.customer_account_groups (
    slug,
    display_name,
    group_type,
    description,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    lower(btrim(p_slug)),
    btrim(p_display_name),
    coalesce(p_group_type, 'service_umbrella'::public.customer_group_type),
    nullif(btrim(p_description), ''),
    v_actor_user_id,
    v_actor_user_id
  )
  returning * into v_group;

  return v_group;
end;
$$;

comment on constraint customer_account_groups_not_cs_portfolio_check
  on public.customer_account_groups is
  'Impede criar carteira de Customer Success como agrupamento de contas ou marcas; carteiras usam cs_customer_portfolio_assignments.';
