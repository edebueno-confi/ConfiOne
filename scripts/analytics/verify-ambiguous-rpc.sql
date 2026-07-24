with claims as (
  select
    set_config('request.jwt.claim.sub', 'bd8574c9-3350-43a4-8b7e-889cb9faa537', true),
    set_config('request.jwt.claim.role', 'authenticated', true)
), payload as (
  select public.rpc_analytics_ceo_ambiguous_overdue(current_date) as value
  from claims
)
select
  jsonb_array_length(value->'titles') as ambiguous_titles,
  value->>'count' as reported_count
from payload;
