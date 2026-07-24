import { requireSupabaseBrowserClient } from '../../app/supabase-browser';

export interface CustomerAccount {
  tenantId: string;
  slug: string;
  displayName: string;
  legalName: string | null;
  status: string;
  activeContacts: number;
  totalTickets: number;
  openTickets: number;
  statusCounts: Record<string, number>;
  createdAt: string;
}

const COLUMNS =
  'tenant_id, tenant_slug, tenant_display_name, tenant_legal_name, tenant_status, tenant_created_at, active_contacts_count, total_ticket_count, open_ticket_count, ticket_status_counts';

function toCounts(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const out: Record<string, number> = {};
  for (const [key, count] of Object.entries(value as Record<string, unknown>)) {
    out[key] = Number(count ?? 0);
  }
  return out;
}

export async function listCustomers(): Promise<CustomerAccount[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_support_customer_360')
    .select(COLUMNS)
    .order('tenant_display_name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map(
    (row: Record<string, unknown>): CustomerAccount => ({
      tenantId: String(row.tenant_id),
      slug: String(row.tenant_slug),
      displayName: String(row.tenant_display_name ?? row.tenant_slug),
      legalName: (row.tenant_legal_name as string | null) ?? null,
      status: String(row.tenant_status ?? 'unknown'),
      activeContacts: Number(row.active_contacts_count ?? 0),
      totalTickets: Number(row.total_ticket_count ?? 0),
      openTickets: Number(row.open_ticket_count ?? 0),
      statusCounts: toCounts(row.ticket_status_counts),
      createdAt: String(row.tenant_created_at ?? ''),
    }),
  );
}


export interface SegmentOption {
  id: string;
  label: string;
  colorToken: string | null;
}

export interface SegmentAssignment {
  segmentKey: string;
  segmentLabel: string;
  colorToken: string | null;
}

export async function listSegmentOptions(): Promise<SegmentOption[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('customer_segments')
    .select('id, label, color_token, is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    label: String(row.label),
    colorToken: (row.color_token as string | null) ?? null,
  }));
}

export async function getSegmentAssignments(): Promise<Record<string, SegmentAssignment>> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_customer_segment_assignments')
    .select('tenant_id, segment_id, segment_key, segment_label, segment_color_token');
  if (error) {
    throw new Error(error.message);
  }
  const out: Record<string, SegmentAssignment> = {};
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    out[String(row.tenant_id)] = {
      segmentKey: String(row.segment_key),
      segmentLabel: String(row.segment_label),
      colorToken: (row.segment_color_token as string | null) ?? null,
    };
  }
  return out;
}

export async function setCustomerSegment(tenantId: string, segmentId: string): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_admin_set_customer_segment', {
    p_tenant_id: tenantId,
    p_segment_id: segmentId,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function clearCustomerSegment(tenantId: string): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_admin_clear_customer_segment', { p_tenant_id: tenantId });
  if (error) {
    throw new Error(error.message);
  }
}
