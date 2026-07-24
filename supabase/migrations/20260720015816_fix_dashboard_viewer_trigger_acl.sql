-- Hardening: trigger functions must have an explicit ACL and must not be
-- executable by public roles.

revoke all on function app_private.apply_dashboard_viewer_email_grant() from public, anon, authenticated;
grant execute on function app_private.apply_dashboard_viewer_email_grant() to service_role;
