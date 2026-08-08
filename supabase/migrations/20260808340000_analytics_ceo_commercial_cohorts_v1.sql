-- Alinha a seção Comercial da Visão Geral às coortes declaradas nos KPIs.
-- Posição do pipeline é atual; ganhos, perdas, receita, conversão e ciclo
-- são apurados por data de fechamento dentro do período selecionado.

do $$
declare
  v_definition text;
begin
  v_definition := pg_get_functiondef('public.rpc_analytics_ceo_snapshot_legacy(date,date)'::regprocedure);

  if position('where (p_from is null or d.hs_created_at >= p_from::timestamptz) and (p_to is null or d.hs_created_at < (p_to + 1)::timestamptz)' in v_definition) = 0
    or position('), support_cfg as (' in v_definition) = 0
    or position('''total_deals'', (select count(*) from commercial), ''open_deals''' in v_definition) = 0
    or position('''won_deals'', (select count(*) from commercial where is_won)' in v_definition) = 0 then
    raise exception 'Contrato inesperado de rpc_analytics_ceo_snapshot_legacy';
  end if;

  v_definition := replace(
    v_definition,
    '  where (p_from is null or d.hs_created_at >= p_from::timestamptz) and (p_to is null or d.hs_created_at < (p_to + 1)::timestamptz)',
    ''
  );

  v_definition := replace(
    v_definition,
    '), support_cfg as (',
    '),' || chr(10)
    || 'commercial_created as (' || chr(10)
    || '  select * from commercial' || chr(10)
    || '  where (p_from is null or hs_created_at >= p_from::timestamptz)' || chr(10)
    || '    and (p_to is null or hs_created_at < (p_to + 1)::timestamptz)' || chr(10)
    || '),' || chr(10)
    || 'commercial_closed as (' || chr(10)
    || '  select * from commercial' || chr(10)
    || '  where is_closed' || chr(10)
    || '    and hs_closed_at is not null' || chr(10)
    || '    and (p_from is null or hs_closed_at >= p_from::timestamptz)' || chr(10)
    || '    and (p_to is null or hs_closed_at < (p_to + 1)::timestamptz)' || chr(10)
    || '),' || chr(10)
    || 'support_cfg as ('
  );

  v_definition := replace(
    v_definition,
    '''total_deals'', (select count(*) from commercial), ''open_deals''',
    '''total_deals'', (select count(*) from commercial_created), ''open_deals'''
  );
  v_definition := replace(v_definition, '''won_deals'', (select count(*) from commercial where is_won)', '''won_deals'', (select count(*) from commercial_closed where is_won)');
  v_definition := replace(v_definition, '''lost_deals'', (select count(*) from commercial where is_closed and not is_won)', '''lost_deals'', (select count(*) from commercial_closed where not is_won)');
  v_definition := replace(v_definition, '''won_revenue'', (select coalesce(sum(amount_home), 0) from commercial where is_won)', '''won_revenue'', (select coalesce(sum(amount_home), 0) from commercial_closed where is_won)');
  v_definition := replace(
    v_definition,
    '''conversion_rate'', (select case when count(*) filter (where is_closed) > 0 then round(count(*) filter (where is_won)::numeric / count(*) filter (where is_closed)::numeric, 4) else 0 end from commercial),',
    '''conversion_rate'', (select case when count(*) > 0 then round(count(*) filter (where is_won)::numeric / count(*)::numeric, 4) else 0 end from commercial_closed),'
  );
  v_definition := replace(
    v_definition,
    '''avg_ticket'', (select case when count(*) filter (where is_won) > 0 then round(coalesce(sum(amount_home) filter (where is_won), 0) / count(*) filter (where is_won), 2) else 0 end from commercial),',
    '''avg_ticket'', (select case when count(*) filter (where is_won) > 0 then round(coalesce(sum(amount_home) filter (where is_won), 0) / count(*) filter (where is_won), 2) else 0 end from commercial_closed),'
  );
  v_definition := replace(v_definition, 'from commercial where is_won and hs_closed_at is not null and hs_created_at is not null)', 'from commercial_closed where is_won and hs_created_at is not null)');

  execute v_definition;
end;
$$;

comment on function public.rpc_analytics_ceo_snapshot_legacy(date, date) is
  'Snapshot executivo com coortes explícitas: posição atual, criados e fechados no período.';
