-- Detalhamento auditável da coorte de ganhos do período.
--
-- O funil histórico filtra negócios pela criação, enquanto os KPIs de ganho
-- usam o fechamento. Publicar a coorte fechada no mesmo read model evita que
-- a tela apresente zero em responsáveis quando houve ganhos de negócios
-- criados antes do recorte selecionado.

do $$
declare
  v_definition text;
begin
  v_definition := pg_get_functiondef('public.rpc_analytics_commercial_kpis_v2(date,date,text,text)'::regprocedure);

  if position('d.deal_id,' || chr(10) || '      d.owner_id,' in v_definition) = 0
    or position('  ),' || chr(10) || '  funnel as (' in v_definition) = 0
    or position('    ''by_owner'', bo.payload,' || chr(10) || '    ''funnel'', fn.payload' in v_definition) = 0
    or position('  cross join by_owner bo' || chr(10) || '  cross join funnel fn;' in v_definition) = 0 then
    raise exception 'Contrato inesperado de rpc_analytics_commercial_kpis_v2';
  end if;

  v_definition := replace(
    v_definition,
    'd.deal_id,' || chr(10) || '      d.owner_id,',
    'd.deal_id,' || chr(10) || '      d.deal_name,' || chr(10) || '      d.owner_id,'
  );

  v_definition := replace(
    v_definition,
    '  ),' || chr(10) || '  funnel as (',
    '  ),' || chr(10)
    || '  closed_wins as (' || chr(10)
    || '    select coalesce(jsonb_agg(jsonb_build_object(' || chr(10)
    || '      ''deal_id'', sc.deal_id,' || chr(10)
    || '      ''deal_name'', sc.deal_name,' || chr(10)
    || '      ''owner_id'', coalesce(nullif(btrim(sc.owner_id), ''''), ''_unassigned''),' || chr(10)
    || '      ''owner_name'', coalesce(nullif(btrim(ow.full_name), ''''), nullif(btrim(ow.email), ''''), ''Sem responsável''),' || chr(10)
    || '      ''closed_on'', sc.hs_closed_at::date,' || chr(10)
    || '      ''amount_home'', round(coalesce(sc.amount_home, 0)::numeric, 2)' || chr(10)
    || '    ) order by sc.hs_closed_at desc, sc.deal_id), ''[]''::jsonb) as payload' || chr(10)
    || '    from scoped sc' || chr(10)
    || '    left join public.hubspot_owners ow on ow.owner_id = sc.owner_id' || chr(10)
    || '    where coalesce(sc.is_won, false)' || chr(10)
    || '      and sc.hs_closed_at is not null' || chr(10)
    || '      and sc.hs_closed_at::date between p_from and p_to' || chr(10)
    || '  ),' || chr(10)
    || '  funnel as ('
  );

  v_definition := replace(
    v_definition,
    '    ''by_owner'', bo.payload,' || chr(10) || '    ''funnel'', fn.payload',
    '    ''by_owner'', bo.payload,' || chr(10) || '    ''closed_wins'', cw.payload,' || chr(10) || '    ''funnel'', fn.payload'
  );

  v_definition := replace(
    v_definition,
    '  cross join by_owner bo' || chr(10) || '  cross join funnel fn;',
    '  cross join by_owner bo' || chr(10) || '  cross join closed_wins cw' || chr(10) || '  cross join funnel fn;'
  );

  execute v_definition;
end;
$$;

comment on function public.rpc_analytics_commercial_kpis_v2(date, date, text, text) is
  'KPIs comerciais por coortes, com detalhe auditável dos ganhos fechados no período.';
