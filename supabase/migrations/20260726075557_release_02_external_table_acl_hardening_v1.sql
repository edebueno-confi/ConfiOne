-- RELEASE-02.6 follow-up: remove grants herdados pela role PUBLIC.
-- A aplicação usa read models/RPCs; tabelas internas não são superfície PostgREST.

revoke all on table public.brand_settings from public, anon;
revoke all on table public.business_calendar_holidays from public, anon;
revoke all on table public.business_calendar_weekly_hours from public, anon;
revoke all on table public.business_calendars from public, anon;
revoke all on table public.customer_portal_user_preferences from public, anon;
revoke all on table public.customer_ticket_update_acknowledgements from public, anon;
revoke all on table public.engineering_ticket_links from public, anon;
revoke all on table public.engineering_work_item_updates from public, anon;
revoke all on table public.engineering_work_items from public, anon;
revoke all on table public.internal_action_evidence_links from public, anon;
revoke all on table public.internal_action_target_areas from public, anon;
revoke all on table public.internal_action_updates from public, anon;
revoke all on table public.internal_actions from public, anon;
revoke all on table public.internal_area_memberships from public, anon;
revoke all on table public.internal_screen_area_defaults from public, anon;
revoke all on table public.internal_screen_dependencies from public, anon;
revoke all on table public.knowledge_article_editorial_drafts from public, anon;
revoke all on table public.knowledge_article_entitlements from public, anon;
revoke all on table public.knowledge_article_review_advisories from public, anon;
revoke all on table public.knowledge_article_revisions from public, anon;
revoke all on table public.knowledge_article_sources from public, anon;
revoke all on table public.knowledge_articles from public, anon;
revoke all on table public.knowledge_categories from public, anon;
revoke all on table public.knowledge_space_domains from public, anon;
revoke all on table public.knowledge_spaces from public, anon;
revoke all on table public.organization_memberships from public, anon;
revoke all on table public.organizations from public, anon;
revoke all on table public.profiles from public, anon;
revoke all on table public.tenant_contacts from public, anon;
revoke all on table public.tenant_memberships from public, anon;
revoke all on table public.tenants from public, anon;
revoke all on table public.ticket_assignments from public, anon;
revoke all on table public.ticket_attachments from public, anon;
revoke all on table public.ticket_categories from public, anon;
revoke all on table public.ticket_events from public, anon;
revoke all on table public.ticket_knowledge_links from public, anon;
revoke all on table public.ticket_message_deliveries from public, anon;
revoke all on table public.ticket_messages from public, anon;
revoke all on table public.ticket_operational_reasons from public, anon;
revoke all on table public.ticket_sla_policies from public, anon;
revoke all on table public.tickets from public, anon;
revoke all on table public.user_global_roles from public, anon;

revoke all on table public.vw_admin_communication_delivery_summary from public, anon;
revoke all on table public.vw_customer_portal_ticket_delivery_state from public, anon;
revoke all on table public.vw_customer_segment_assignments from public, anon;
revoke all on table public.vw_support_ticket_delivery_capabilities from public, anon;
revoke all on table public.vw_support_ticket_message_deliveries from public, anon;

grant select on table public.vw_admin_communication_delivery_summary to authenticated;
grant select on table public.vw_customer_portal_ticket_delivery_state to authenticated;
grant select on table public.vw_customer_segment_assignments to authenticated;
grant select on table public.vw_support_ticket_delivery_capabilities to authenticated;
grant select on table public.vw_support_ticket_message_deliveries to authenticated;
