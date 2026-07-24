-- RELEASE-01.1: dashboard_viewer is an analytics-only role.
-- Forward-only correction for environments that already applied the earlier
-- content-settings migration. Editorial access remains restricted to the
-- platform-admin and knowledge-manager roles.

create or replace function app_private.can_manage_knowledge_base()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.has_any_global_role(
    array[
      'platform_admin',
      'knowledge_manager'
    ]::public.platform_role[]
  );
$$;

comment on function app_private.can_manage_knowledge_base() is
  'Gate editorial da Knowledge Base restrito aos perfis editoriais autorizados; dashboard_viewer permanece restrito ao Dashboard Gerencial.';

revoke all on function app_private.can_manage_knowledge_base()
from public, anon, authenticated, service_role;

grant execute on function app_private.can_manage_knowledge_base()
to authenticated, service_role;

-- The actor-guard migration keeps uploads tied to the actor's asset row, but
-- it must not bypass the editorial gate. Reassert that gate after all legacy
-- policy replacements so dashboard_viewer cannot write to Storage indirectly.
drop policy if exists knowledge_public_assets_admin_insert on storage.objects;
create policy knowledge_public_assets_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'knowledge-public-assets'
  and app_private.can_manage_knowledge_base()
  and exists (
    select 1
    from public.knowledge_article_assets as asset
    where asset.storage_object_path = name
      and asset.updated_by_user_id = auth.uid()
      and app_private.can_read_knowledge_article_asset(
        asset.article_id,
        asset.visibility,
        asset.review_status,
        asset.is_blocked
      )
  )
);
