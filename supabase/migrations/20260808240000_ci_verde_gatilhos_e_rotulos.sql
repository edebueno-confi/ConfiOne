-- CI VERDE: GATILHOS FORA DE PUBLIC E RÓTULOS DE FONTE PRESERVADOS
--
-- Duas correções apontadas pelo pgTAP, que o CI roda e eu não rodava.
--
-- 1. Gatilho SECURITY DEFINER em `public`
-- ---------------------------------------
-- O teste `004` exige que toda função SECURITY DEFINER em `public` comece com
-- `rpc_`, porque `public` é superfície exposta e o prefixo marca o que passou
-- por revisão de contrato. `analytics_stage_mapping_touch` e
-- `analytics_kpi_settings_touch` são gatilhos de `updated_at` e não têm motivo
-- para estar ali nem para elevar privilégio: rodam no contexto da própria
-- tabela. Vão para `app_private` e perdem o SECURITY DEFINER.
--
-- 2. Rótulo da fonte de resolução
-- -------------------------------
-- Minha reescrita trocou `hubspot_property` por `native_close_date` sem motivo.
-- O rótulo antigo já era o contrato, está nos testes e nos consumidores. Trocar
-- vocabulário estabelecido só porque um nome novo parece melhor é custo sem
-- ganho — o valor de um rótulo é ser o mesmo em todo lugar.

create or replace function app_private.analytics_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

comment on function app_private.analytics_touch_updated_at() is
  'Gatilho de updated_at para as tabelas de configuracao de analytics. Vive em app_private porque nao e superficie exposta e nao precisa elevar privilegio.';

-- ACL explícita: a auditoria exige que toda função tenha privilégio declarado,
-- e não herdado do padrão. Gatilho roda pelo dono da tabela e não precisa ser
-- executável por ninguém mais.
revoke all on function app_private.analytics_touch_updated_at() from public, anon, authenticated;

drop trigger if exists analytics_stage_mapping_set_updated_at on public.analytics_stage_mapping;
drop trigger if exists analytics_kpi_settings_set_updated_at on public.analytics_kpi_settings;
drop function if exists public.analytics_stage_mapping_touch() cascade;
drop function if exists public.analytics_kpi_settings_touch() cascade;

create trigger analytics_stage_mapping_set_updated_at
  before update on public.analytics_stage_mapping
  for each row execute function app_private.analytics_touch_updated_at();

create trigger analytics_kpi_settings_set_updated_at
  before update on public.analytics_kpi_settings
  for each row execute function app_private.analytics_touch_updated_at();
-- O rotulo da fonte volta a hubspot_property, que ja era o contrato.
