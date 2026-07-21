-- Deduplicacao robusta de empresas para o cruzamento financeiro x HubSpot.
-- Motivo: nomes divergentes (razao social x nome comercial) e CNPJ de filial
-- diferente faziam a busca simples nao encontrar empresas ja existentes,
-- gerando duplicatas. Agora combinamos CNPJ (exato e raiz de 8 digitos),
-- similaridade trigram e continencia de nome normalizado.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

create or replace function app_private.normalize_company_name(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(btrim(regexp_replace(
    regexp_replace(
      regexp_replace(upper(extensions.unaccent(coalesce(p, ''))), '[^A-Z0-9]+', ' ', 'g'),
      '\y(LTDA|EIRELI|EPP|ME|CIA)\y', ' ', 'g'),
    '\s+', ' ', 'g')), '');
$$;

-- A normalização é um helper interno usado pelas RPCs de matching. Não deve
-- ser executável por clientes; a ACL explícita também evita depender de
-- privilégios padrão do schema durante auditorias de segurança.
revoke all on function app_private.normalize_company_name(text)
from public, anon, authenticated;
grant execute on function app_private.normalize_company_name(text)
to service_role;

-- Candidatos de empresa no HubSpot para um cliente OMIE (razao social + nome
-- fantasia + CNPJ). Retorna motivo e score para decisao humana. Read-only.
create or replace function public.rpc_analytics_company_candidates(
  p_tax_id text default null,
  p_name text default null,
  p_trade_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
  d text;
  nm text;
  nt text;
begin
  if not (app_private.can_read_analytics() or auth.uid() is null) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  d := regexp_replace(coalesce(p_tax_id, ''), '[^0-9]', '', 'g');
  nm := coalesce(app_private.normalize_company_name(p_name), '');
  nt := coalesce(app_private.normalize_company_name(p_trade_name), '');

  select coalesce(jsonb_agg(jsonb_build_object(
    'company_id', company_id, 'name', name, 'tax_id', tax_id, 'reason', reason, 'score', round(score::numeric, 3)
  ) order by score desc), '[]'::jsonb)
  into result
  from (
    select s.company_id, s.name, s.tax_id, r.reason, r.score
    from (
      select c.company_id, c.name, c.tax_id,
        regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') hd,
        coalesce(app_private.normalize_company_name(c.name), '') cn
      from public.hubspot_companies c
    ) s
    cross join lateral (
      select
        case
          when d <> '' and s.hd = d then 'cnpj_exato'
          when d <> '' and length(d) >= 8 and s.hd <> '' and left(s.hd, 8) = left(d, 8) then 'cnpj_raiz'
          when length(s.cn) >= 4 and ((nm <> '' and ((' ' || nm || ' ') like ('% ' || s.cn || ' %') or (' ' || s.cn || ' ') like ('% ' || nm || ' %'))) or (nt <> '' and ((' ' || nt || ' ') like ('% ' || s.cn || ' %') or (' ' || s.cn || ' ') like ('% ' || nt || ' %')))) then 'nome_contido'
          when greatest(extensions.similarity(s.cn, nm), case when nt <> '' then extensions.similarity(s.cn, nt) else 0 end) >= 0.4 then 'nome_similar'
          else null
        end reason,
        case
          when d <> '' and s.hd = d then 1.0
          when d <> '' and length(d) >= 8 and s.hd <> '' and left(s.hd, 8) = left(d, 8) then 0.9
          when length(s.cn) >= 4 and ((nm <> '' and ((' ' || nm || ' ') like ('% ' || s.cn || ' %') or (' ' || s.cn || ' ') like ('% ' || nm || ' %'))) or (nt <> '' and ((' ' || nt || ' ') like ('% ' || s.cn || ' %') or (' ' || s.cn || ' ') like ('% ' || nt || ' %')))) then 0.8
          else greatest(extensions.similarity(s.cn, nm), case when nt <> '' then extensions.similarity(s.cn, nt) else 0 end)
        end score
    ) r
    where r.reason is not null
    order by r.score desc
    limit 10
  ) q;

  return result;
end;
$$;

comment on function public.rpc_analytics_company_candidates(text, text, text) is
  'Candidatos de empresa no HubSpot para um cliente OMIE: CNPJ exato/raiz, continencia de nome normalizado e similaridade trigram. Somente leitura.';

revoke all on function public.rpc_analytics_company_candidates(text, text, text) from public, anon;
grant execute on function public.rpc_analytics_company_candidates(text, text, text) to authenticated, service_role;
