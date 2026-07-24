-- Keep trigger-only helpers private and make their ACL explicit.
-- These functions are never called by the API directly; their only consumers
-- are the triggers defined by the internal screen-access migrations.

revoke all on function app_private.ensure_internal_membership_screen_dependencies()
  from public, anon, authenticated, service_role;

revoke all on function app_private.ensure_internal_profile_screen_dependencies()
  from public, anon, authenticated, service_role;

revoke all on function app_private.touch_internal_screen_access_updated_at()
  from public, anon, authenticated, service_role;
