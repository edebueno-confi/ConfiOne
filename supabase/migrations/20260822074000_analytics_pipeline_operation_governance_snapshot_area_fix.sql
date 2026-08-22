-- O snapshot cs publicado e o read model de Suporte. Customer Success possui
-- wrapper de KPIs proprio e nao deve ser confundido com esse snapshot.
do $$
declare
  v_definition text;
  v_old constant text := 'nullif(btrim(p_group_company), ''''), ''customer_success''';
  v_new constant text := 'nullif(btrim(p_group_company), ''''), ''support''';
begin
  v_definition := pg_get_functiondef('public.rpc_analytics_cs_snapshot_by_operation(date,date,text,text,text[],text)'::regprocedure);
  if position(v_old in v_definition) > 0 then
    execute replace(v_definition, v_old, v_new);
  end if;
end;
$$;
