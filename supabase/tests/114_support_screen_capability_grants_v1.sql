select plan(10);

select ok(
  exists (
    select 1
    from public.internal_capabilities
    where capability_key = 'screen.support.view'
      and is_active
  ),
  'capacidade de abertura do suporte permanece ativa'
);

select ok(
  exists (
    select 1
    from public.internal_role_capability_grants
    where role = 'platform_admin'::public.platform_role
      and capability_key = 'screen.support.view'
  ),
  'platform_admin possui capacidade de suporte'
);

select ok(
  exists (
    select 1
    from public.internal_role_capability_grants
    where role = 'support_manager'::public.platform_role
      and capability_key = 'screen.support.view'
  ),
  'support_manager possui capacidade de suporte'
);

select ok(
  exists (
    select 1
    from public.internal_role_capability_grants
    where role = 'support_agent'::public.platform_role
      and capability_key = 'screen.support.view'
  ),
  'support_agent possui capacidade de suporte'
);

select ok(
  exists (
    select 1
    from public.internal_role_screen_grants
    where role = 'platform_admin'::public.platform_role
      and screen_key = 'support_queue'
  ),
  'platform_admin possui grant da fila'
);

select ok(
  exists (
    select 1
    from public.internal_role_screen_grants
    where role = 'support_manager'::public.platform_role
      and screen_key = 'support_queue'
  ),
  'support_manager possui grant da fila'
);

select ok(
  exists (
    select 1
    from public.internal_role_screen_grants
    where role = 'support_agent'::public.platform_role
      and screen_key = 'support_queue'
  ),
  'support_agent possui grant da fila'
);

select ok(
  exists (
    select 1
    from public.internal_role_screen_grants
    where role = 'support_manager'::public.platform_role
      and screen_key = 'support_tickets'
  ),
  'support_manager possui grant de tickets'
);

select ok(
  exists (
    select 1
    from public.internal_role_screen_grants
    where role = 'support_agent'::public.platform_role
      and screen_key = 'support_tickets'
  ),
  'support_agent possui grant de tickets'
);

select ok(
  not exists (
    select 1
    from public.internal_role_capability_grants
    where role = 'dashboard_viewer'::public.platform_role
      and capability_key = 'screen.support.view'
  ),
  'dashboard_viewer permanece sem capacidade de suporte'
);

select * from finish();
