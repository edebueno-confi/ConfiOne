-- Corrige a seed dos perfis quando a carga inicial foi executada antes
-- do catalogo de telas estar disponivel. A operacao e idempotente.

update public.internal_access_profiles
set
  name = case
    when name like 'CS%Gestor' then U&'CS \00B7 Gestor'
    when name like 'CS%Operador' then U&'CS \00B7 Operador'
    when name like 'Financeiro%Gestor' then U&'Financeiro \00B7 Gestor'
    when name like 'Produto%Operador' then U&'Produto \00B7 Operador'
    when name like 'QA%Dashboard%' then U&'QA \00B7 Dashboard e conhecimento'
    else name
  end
where is_system
  and (
    name like 'CS%Gestor'
    or name like 'CS%Operador'
    or name like 'Financeiro%Gestor'
    or name like 'Produto%Operador'
    or name like 'QA%Dashboard%'
  );

insert into public.internal_access_profile_screen_grants (access_profile_id, screen_key)
select profile.id, screen.screen_key
from public.internal_access_profiles as profile
join public.internal_screen_catalog as screen on screen.is_active
where
  (profile.name = U&'CS \00B7 Gestor' and screen.screen_key in ('home', 'analytics', 'cs_portfolio', 'customers_b2b'))
  or (profile.name = U&'CS \00B7 Operador' and screen.screen_key in ('home', 'support_inbox', 'support_queue', 'support_tickets', 'customers_b2b', 'internal_actions'))
  or (profile.name = U&'Financeiro \00B7 Gestor' and screen.screen_key in ('home', 'analytics'))
  or (profile.name = U&'Produto \00B7 Operador' and screen.screen_key in ('home', 'internal_actions', 'product'))
  or (profile.name = U&'QA \00B7 Dashboard e conhecimento' and screen.screen_key in ('home', 'analytics', 'knowledge', 'product_docs'))
on conflict (access_profile_id, screen_key) do nothing;

comment on table public.internal_access_profile_screen_grants is
  'Telas concedidas por perfil nomeado; a seed de perfis e reparavel e idempotente.';
