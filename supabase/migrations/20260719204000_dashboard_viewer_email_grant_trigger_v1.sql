-- Concessao automatica do papel restrito quando o auth user existir.

create table if not exists app_private.dashboard_viewer_email_grants (
  email text primary key,
  created_at timestamptz not null default timezone('utc', now())
);

revoke all on app_private.dashboard_viewer_email_grants from public, anon, authenticated;

create or replace function app_private.apply_dashboard_viewer_email_grant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_active and exists (
    select 1 from app_private.dashboard_viewer_email_grants g
    where lower(g.email) = lower(new.email::text)
  ) then
    insert into public.user_global_roles (user_id, role)
    values (new.id, 'dashboard_viewer'::public.platform_role)
    on conflict (user_id, role) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_dashboard_viewer_email_grant on public.profiles;
create trigger profiles_dashboard_viewer_email_grant
after insert or update of email, is_active on public.profiles
for each row execute function app_private.apply_dashboard_viewer_email_grant();

insert into app_private.dashboard_viewer_email_grants (email)
values ('mauricio.baum@confi.com.vc')
on conflict (email) do nothing;

insert into public.user_global_roles (user_id, role)
select p.id, 'dashboard_viewer'::public.platform_role
from public.profiles p
where lower(p.email::text) = 'mauricio.baum@confi.com.vc'
on conflict (user_id, role) do nothing;
