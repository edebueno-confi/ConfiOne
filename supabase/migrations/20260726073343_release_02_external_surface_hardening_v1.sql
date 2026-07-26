-- RELEASE-02.6: hardening direcionado da superfície externa.
-- Forward-only, allowlist-based. Não converte views SECURITY DEFINER em massa.

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end
$$;

revoke all on function public.rpc_admin_archive_brand(uuid) from public, anon;
revoke all on function public.rpc_admin_archive_conversation_type(uuid) from public, anon;
revoke all on function public.rpc_admin_archive_customer_segment(uuid) from public, anon;
revoke all on function public.rpc_admin_archive_priority_level(uuid) from public, anon;
revoke all on function public.rpc_admin_archive_quick_reply(uuid) from public, anon;
revoke all on function public.rpc_admin_clear_customer_segment(uuid) from public, anon;
revoke all on function public.rpc_admin_create_brand(text, text, text, integer) from public, anon;
revoke all on function public.rpc_admin_create_conversation_type(text, text, text, text, integer) from public, anon;
revoke all on function public.rpc_admin_create_customer_segment(text, text, text, text, integer) from public, anon;
revoke all on function public.rpc_admin_create_priority_level(text, text, integer, text, integer) from public, anon;
revoke all on function public.rpc_admin_create_quick_reply(text, text, integer) from public, anon;
revoke all on function public.rpc_admin_set_customer_segment(uuid, uuid) from public, anon;
revoke all on function public.rpc_admin_update_conversation_type(uuid, text, text, text, integer, boolean) from public, anon;
revoke all on function public.rpc_admin_update_priority_level(uuid, text, integer, text, integer, boolean) from public, anon;
revoke all on function public.rpc_support_get_ticket_timeline(uuid, integer, timestamptz, uuid) from public, anon;
revoke all on function public.rpc_support_set_ticket_conversation_type(uuid, text) from public, anon;

grant execute on function public.rpc_admin_archive_brand(uuid) to authenticated;
grant execute on function public.rpc_admin_archive_conversation_type(uuid) to authenticated;
grant execute on function public.rpc_admin_archive_customer_segment(uuid) to authenticated;
grant execute on function public.rpc_admin_archive_priority_level(uuid) to authenticated;
grant execute on function public.rpc_admin_archive_quick_reply(uuid) to authenticated;
grant execute on function public.rpc_admin_clear_customer_segment(uuid) to authenticated;
grant execute on function public.rpc_admin_create_brand(text, text, text, integer) to authenticated;
grant execute on function public.rpc_admin_create_conversation_type(text, text, text, text, integer) to authenticated;
grant execute on function public.rpc_admin_create_customer_segment(text, text, text, text, integer) to authenticated;
grant execute on function public.rpc_admin_create_priority_level(text, text, integer, text, integer) to authenticated;
grant execute on function public.rpc_admin_create_quick_reply(text, text, integer) to authenticated;
grant execute on function public.rpc_admin_set_customer_segment(uuid, uuid) to authenticated;
grant execute on function public.rpc_admin_update_conversation_type(uuid, text, text, text, integer, boolean) to authenticated;
grant execute on function public.rpc_admin_update_priority_level(uuid, text, integer, text, integer, boolean) to authenticated;
grant execute on function public.rpc_support_get_ticket_timeline(uuid, integer, timestamptz, uuid) to authenticated;
grant execute on function public.rpc_support_set_ticket_conversation_type(uuid, text) to authenticated;

revoke all on table public.analytics_finance_receivables_staging from anon;
revoke all on table public.analytics_spreadsheet_rows from anon;
revoke all on table public.cs_customer_portfolio_assignment_history from anon;
revoke all on table public.ticket_attachment_download_grants from anon;
revoke all on table public.ticket_attachment_upload_intents from anon;

-- Preserva os read models autenticados de delivery exigidos pelo contrato existente.
grant select on public.vw_support_ticket_message_deliveries to authenticated;
grant select on public.vw_support_ticket_delivery_capabilities to authenticated;
grant select on public.vw_customer_portal_ticket_delivery_state to authenticated;
grant select on public.vw_admin_communication_delivery_summary to authenticated;

comment on schema public is
  'RELEASE-02.6: superfícies externas são allowlist-based; consulte supabase/security/external_surface_contract.json.';
