-- Contrato paginado da fila oficial de suporte.
-- A view continua sendo a fonte de autorizacao e de campos. Este RPC apenas
-- aplica recortes e pagina no banco, evitando limitar a fila aos 50 primeiros
-- registros no frontend.

create or replace function public.rpc_support_ticket_queue_page(
  p_status text default 'all',
  p_priority text default 'all',
  p_severity text default 'all',
  p_tenant_id text default null,
  p_assigned_to_user_id text default 'all',
  p_category_id text default 'all',
  p_scope text default 'open',
  p_inbox_filter text default 'all',
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with base as materialized (
  select q.*
  from public.vw_support_tickets_queue as q
  where (lower(coalesce(p_status, 'all')) = 'all' or q.status::text = lower(trim(p_status)))
    and (lower(coalesce(p_priority, 'all')) = 'all' or q.priority::text = lower(trim(p_priority)))
    and (lower(coalesce(p_severity, 'all')) = 'all' or q.severity::text = lower(trim(p_severity)))
    and (nullif(trim(coalesce(p_tenant_id, '')), '') is null or q.tenant_id::text = trim(p_tenant_id))
    and (
      lower(coalesce(p_assigned_to_user_id, 'all')) = 'all'
      or (lower(trim(p_assigned_to_user_id)) = 'unassigned' and q.assigned_to_user_id is null)
      or q.assigned_to_user_id::text = trim(p_assigned_to_user_id)
    )
    and (lower(coalesce(p_category_id, 'all')) = 'all' or q.category_id::text = trim(p_category_id))
    and (
      lower(coalesce(p_search, '')) = ''
      or lower(concat_ws(' ', q.id::text, q.title, q.tenant_slug, q.tenant_display_name,
        q.tenant_legal_name, q.category_name, q.assigned_to_full_name, q.sla_status_label))
        like '%' || lower(trim(p_search)) || '%'
    )
), scope_counts as (
  select
    count(*) filter (where status::text not in ('resolved', 'closed', 'cancelled'))::integer as open_count,
    count(*) filter (where status::text in ('resolved', 'closed', 'cancelled'))::integer as closed_count
  from base
), filter_counts as (
  select jsonb_build_object(
    'all', count(*) filter (where status::text not in ('resolved', 'closed', 'cancelled')),
    'in_progress', count(*) filter (where status::text = 'in_progress'),
    'awaiting', count(*) filter (where is_waiting_customer or is_waiting_support or is_waiting_engineering),
    'urgent', count(*) filter (where priority::text = 'urgent' or severity::text = 'critical' or sla_status::text in ('at_risk', 'breached')),
    'operations', count(*) filter (where lower(concat_ws(' ', category_slug, category_name)) like '%opera%' or lower(concat_ws(' ', category_slug, category_name)) like '%suporte%'),
    'engineering', count(*) filter (where is_waiting_engineering),
    'waiting_customer', count(*) filter (where is_waiting_customer),
    'waiting_engineering', count(*) filter (where is_waiting_engineering),
    'unassigned', count(*) filter (where assigned_to_user_id is null),
    'high_attention', count(*) filter (where priority::text = 'urgent' or severity::text = 'critical' or sla_status::text in ('at_risk', 'breached')),
    'all_closed', count(*) filter (where status::text in ('resolved', 'closed', 'cancelled')),
    'resolved', count(*) filter (where status::text = 'resolved'),
    'closed', count(*) filter (where status::text = 'closed'),
    'cancelled', count(*) filter (where status::text = 'cancelled')
  ) as value
  from base
), scoped as materialized (
  select b.*
  from base as b
  where (
    lower(coalesce(p_scope, 'open')) = 'all'
    or (lower(p_scope) = 'open' and b.status::text not in ('resolved', 'closed', 'cancelled'))
    or (lower(p_scope) = 'closed' and b.status::text in ('resolved', 'closed', 'cancelled'))
  )
  and (
    lower(coalesce(p_inbox_filter, 'all')) in ('all', 'all_closed')
    or (lower(p_inbox_filter) = 'in_progress' and b.status::text = 'in_progress')
    or (lower(p_inbox_filter) = 'awaiting' and (b.is_waiting_customer or b.is_waiting_support or b.is_waiting_engineering))
    or (lower(p_inbox_filter) = 'urgent' and (b.priority::text = 'urgent' or b.severity::text = 'critical' or b.sla_status::text in ('at_risk', 'breached')))
    or (lower(p_inbox_filter) = 'operations' and (lower(concat_ws(' ', b.category_slug, b.category_name)) like '%opera%' or lower(concat_ws(' ', b.category_slug, b.category_name)) like '%suporte%'))
    or (lower(p_inbox_filter) = 'engineering' and b.is_waiting_engineering)
    or (lower(p_inbox_filter) in ('resolved', 'closed', 'cancelled') and b.status::text = lower(p_inbox_filter))
  )
), page as (
  select *
  from scoped
  order by updated_at desc nulls last, created_at desc nulls last, id desc
  limit greatest(1, least(coalesce(p_limit, 50), 50))
  offset greatest(coalesce(p_offset, 0), 0)
), total as (
  select count(*)::integer as value from scoped
)
select jsonb_build_object(
  'items', coalesce((select jsonb_agg(to_jsonb(page) order by updated_at desc nulls last, created_at desc nulls last, id desc) from page), '[]'::jsonb),
  'total_count', (select value from total),
  'scope_counts', jsonb_build_object('open', (select open_count from scope_counts), 'closed', (select closed_count from scope_counts)),
  'filter_counts', (select value from filter_counts)
);
$$;

revoke all on function public.rpc_support_ticket_queue_page(text, text, text, text, text, text, text, text, text, integer, integer)
  from public, anon;
grant execute on function public.rpc_support_ticket_queue_page(text, text, text, text, text, text, text, text, text, integer, integer)
  to authenticated, service_role;

comment on function public.rpc_support_ticket_queue_page(text, text, text, text, text, text, text, text, text, integer, integer) is
  'Fila de suporte autorizada, filtrada e paginada no banco. O limite por pagina e 50; total e contadores sao calculados no mesmo contrato.';
