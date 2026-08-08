-- CUSTOMER-DEBT — correção: o assunto do atendimento não existe no read model
--
-- A versão anterior selecionava `t.subject`, que não existe em
-- `hubspot_tickets`: a ingestão nunca pediu essa propriedade ao HubSpot. A
-- função quebrava na primeira chamada.
--
-- A correção é remover o campo, não preenchê-lo. Publicar "Sem assunto" para
-- todos daria a impressão de que existe contexto onde não existe; a lista
-- identifica por número e pipeline, e quem for tratar abre o atendimento na
-- origem.
--
-- Fica registrado como pendência: ingerir o assunto tornaria esta lista
-- utilizável sem sair do painel.
--
-- Acrescenta também `tickets_in_worked_queue`, porque a distinção importa para
-- priorizar: um atendimento esquecido dentro da fila que o time trabalha é mais
-- grave do que um esquecido numa caixa de entrada que ninguém abre.

create or replace function public.rpc_analytics_support_customer_debt()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_limiar integer := app_private.queue_stagnation_days();
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  with parados as (
    select t.ticket_id, t.hs_created_at, t.last_activity_at, t.owner_id,
      coalesce(nullif(c.label, ''), nullif(c.hubspot_pipeline_label, ''), c.hubspot_pipeline_id) as pipeline_label,
      c.queue_role, v.company_id,
      round((extract(epoch from (now() - t.last_activity_at)) / 86400)::numeric, 0) as days_silent
    from public.hubspot_tickets t
    join public.analytics_source_config c
      on c.object_type = 'ticket' and c.hubspot_pipeline_id = t.pipeline_id
     and c.is_active and not coalesce(c.is_archived, false)
    join public.hubspot_pipeline_stages s
      on s.object_type = 'ticket' and s.pipeline_id = t.pipeline_id
     and s.stage_id = t.pipeline_stage and s.metadata ->> 'ticketState' = 'OPEN'
    join public.vw_analytics_ticket_company v on v.ticket_id = t.ticket_id
    where t.last_activity_at is not null
      and t.last_activity_at < now() - make_interval(days => v_limiar)
      and v.company_id is not null
  ),
  por_empresa as (
    select p.company_id,
      coalesce(nullif(co.name, ''), 'Empresa sem nome') as company_name,
      count(*)::integer as tickets,
      max(p.days_silent)::integer as oldest_days_silent,
      round(avg(p.days_silent)::numeric, 0)::integer as avg_days_silent,
      count(*) filter (where p.queue_role = 'trabalhada')::integer as tickets_in_worked_queue,
      coalesce(jsonb_agg(jsonb_build_object(
        'ticket_id', p.ticket_id,
        'pipeline_label', p.pipeline_label,
        'days_silent', p.days_silent,
        'created_at', p.hs_created_at,
        'owner_name', coalesce(ow.full_name, 'Sem responsável')
      ) order by p.days_silent desc), '[]'::jsonb) as tickets_detail
    from parados p
    left join public.hubspot_companies co on co.company_id = p.company_id
    left join public.hubspot_owners ow on ow.owner_id = p.owner_id
    group by 1, 2
  )
  select jsonb_build_object(
    'threshold_days', v_limiar,
    'total_tickets', coalesce((select sum(tickets) from por_empresa), 0),
    'total_companies', coalesce((select count(*) from por_empresa), 0),
    'companies', coalesce((
      select jsonb_agg(row_to_json(x) order by x.tickets desc, x.oldest_days_silent desc)
      from por_empresa x
    ), '[]'::jsonb)
  ) into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

comment on function public.rpc_analytics_support_customer_debt() is
  'Atendimentos sem resposta alem do limiar que pertencem a uma empresa do CRM, agrupados por empresa. O assunto nao e publicado porque nao esta no read model.';

revoke all on function public.rpc_analytics_support_customer_debt() from public, anon;
grant execute on function public.rpc_analytics_support_customer_debt() to authenticated, service_role;
