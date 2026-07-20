import { requireSupabaseBrowserClient } from '../../app/supabase-browser';

export interface ConversationType {
  id: string;
  key: string;
  label: string;
  description: string | null;
  defaultAreaKey: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface NewConversationType {
  label: string;
  defaultAreaKey: string;
  sortOrder: number;
}

function toKey(label: string): string {
  let key = label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);

  if (!/^[a-z]/.test(key)) {
    key = `t_${key}`.slice(0, 48);
  }

  if (key.length < 2) {
    key = 'tipo';
  }

  return key;
}

export async function listConversationTypes(): Promise<ConversationType[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('conversation_types')
    .select('id, key, label, description, default_area_key, sort_order, is_active')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    key: String(row.key),
    label: String(row.label),
    description: (row.description as string | null) ?? null,
    defaultAreaKey: (row.default_area_key as string | null) ?? null,
    sortOrder: Number(row.sort_order ?? 0),
    isActive: row.is_active !== false,
  }));
}

export async function createConversationType(input: NewConversationType): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_admin_create_conversation_type', {
    p_key: toKey(input.label),
    p_label: input.label.trim(),
    p_description: null,
    p_default_area_key: input.defaultAreaKey.trim() || null,
    p_sort_order: input.sortOrder,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function archiveConversationType(id: string): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_admin_archive_conversation_type', { p_id: id });

  if (error) {
    throw new Error(error.message);
  }
}


export interface PriorityLevel {
  id: string;
  key: string;
  label: string;
  weight: number;
  colorToken: string | null;
  sortOrder: number;
  isActive: boolean;
}

export async function listPriorityLevels(): Promise<PriorityLevel[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('priority_levels')
    .select('id, key, label, weight, color_token, sort_order, is_active')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    key: String(row.key),
    label: String(row.label),
    weight: Number(row.weight ?? 0),
    colorToken: (row.color_token as string | null) ?? null,
    sortOrder: Number(row.sort_order ?? 0),
    isActive: row.is_active !== false,
  }));
}


export interface NewPriorityLevel {
  label: string;
  weight: number;
  colorToken: string | null;
  sortOrder: number;
}

export async function createPriorityLevel(input: NewPriorityLevel): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_admin_create_priority_level', {
    p_key: toKey(input.label),
    p_label: input.label.trim(),
    p_weight: input.weight,
    p_color_token: input.colorToken,
    p_sort_order: input.sortOrder,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function archivePriorityLevel(id: string): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_admin_archive_priority_level', { p_id: id });

  if (error) {
    throw new Error(error.message);
  }
}


export interface QuickReply {
  id: string;
  title: string;
  body: string;
  sortOrder: number;
  isActive: boolean;
}

export async function listQuickReplies(): Promise<QuickReply[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('quick_replies')
    .select('id, title, body, sort_order, is_active')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    title: String(row.title),
    body: String(row.body),
    sortOrder: Number(row.sort_order ?? 0),
    isActive: row.is_active !== false,
  }));
}

export async function createQuickReply(input: { title: string; body: string; sortOrder: number }): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_admin_create_quick_reply', {
    p_title: input.title,
    p_body: input.body,
    p_sort_order: input.sortOrder,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function archiveQuickReply(id: string): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_admin_archive_quick_reply', { p_id: id });

  if (error) {
    throw new Error(error.message);
  }
}


export interface CustomerSegment {
  id: string;
  key: string;
  label: string;
  description: string | null;
  colorToken: string | null;
  sortOrder: number;
  isActive: boolean;
}

export async function listCustomerSegments(): Promise<CustomerSegment[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('customer_segments')
    .select('id, key, label, description, color_token, sort_order, is_active')
    .order('sort_order', { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    key: String(row.key),
    label: String(row.label),
    description: (row.description as string | null) ?? null,
    colorToken: (row.color_token as string | null) ?? null,
    sortOrder: Number(row.sort_order ?? 0),
    isActive: row.is_active !== false,
  }));
}

export async function createCustomerSegment(input: { label: string; colorToken: string; sortOrder: number }): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_admin_create_customer_segment', {
    p_key: toKey(input.label),
    p_label: input.label.trim(),
    p_description: null,
    p_color_token: input.colorToken || null,
    p_sort_order: input.sortOrder,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function archiveCustomerSegment(id: string): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_admin_archive_customer_segment', { p_id: id });
  if (error) {
    throw new Error(error.message);
  }
}


export interface Brand {
  id: string;
  key: string;
  label: string;
  helpCenterSlug: string | null;
  sortOrder: number;
  isActive: boolean;
}

export async function listBrands(): Promise<Brand[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('brands')
    .select('id, key, label, help_center_slug, sort_order, is_active')
    .order('sort_order', { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    key: String(row.key),
    label: String(row.label),
    helpCenterSlug: (row.help_center_slug as string | null) ?? null,
    sortOrder: Number(row.sort_order ?? 0),
    isActive: row.is_active !== false,
  }));
}

export async function createBrand(input: { label: string; helpCenterSlug: string; sortOrder: number }): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_admin_create_brand', {
    p_key: toKey(input.label),
    p_label: input.label.trim(),
    p_help_center_slug: input.helpCenterSlug.trim() || null,
    p_sort_order: input.sortOrder,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function archiveBrand(id: string): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_admin_archive_brand', { p_id: id });
  if (error) {
    throw new Error(error.message);
  }
}


export interface TicketCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  sortOrder: number;
}

export async function listTicketCategories(): Promise<TicketCategory[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('ticket_categories')
    .select('id, slug, name, description, status, sort_order')
    .order('sort_order', { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: (row.description as string | null) ?? null,
    status: String(row.status ?? 'active'),
    sortOrder: Number(row.sort_order ?? 0),
  }));
}

export interface ManagedIntegration {
  id: string;
  integrationKey: string;
  label: string;
  provider: 'hubspot' | 'omie' | 'google_sheets' | 'spreadsheet_upload' | 'github';
  mode: 'api' | 'manual' | 'hybrid';
  isEnabled: boolean;
  config: Record<string, unknown>;
  hasCredentials: boolean;
  credentialUpdatedAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'partial' | 'error' | 'never';
  lastErrorMessage: string | null;
  updatedAt: string;
}

function mapManagedIntegration(row: Record<string, unknown>): ManagedIntegration {
  return {
    id: String(row.id),
    integrationKey: String(row.integration_key),
    label: String(row.label),
    provider: row.provider as ManagedIntegration['provider'],
    mode: row.mode as ManagedIntegration['mode'],
    isEnabled: row.is_enabled === true,
    config: (row.config as Record<string, unknown> | null) ?? {},
    hasCredentials: row.has_credentials === true,
    credentialUpdatedAt: (row.credential_updated_at as string | null) ?? null,
    lastRunAt: (row.last_run_at as string | null) ?? null,
    lastRunStatus: (row.last_run_status as ManagedIntegration['lastRunStatus']) ?? 'never',
    lastErrorMessage: (row.last_error_message as string | null) ?? null,
    updatedAt: String(row.updated_at),
  };
}

export async function listManagedIntegrations(): Promise<ManagedIntegration[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_admin_managed_integrations')
    .select('*')
    .order('label', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapManagedIntegration(row as Record<string, unknown>));
}

export async function saveManagedIntegration(input: {
  integrationKey: string;
  label: string;
  provider: ManagedIntegration['provider'];
  mode: ManagedIntegration['mode'];
  isEnabled: boolean;
  config: Record<string, unknown>;
  secret?: string;
}): Promise<ManagedIntegration> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_admin_upsert_managed_integration', {
    p_integration_key: input.integrationKey,
    p_label: input.label,
    p_provider: input.provider,
    p_mode: input.mode,
    p_is_enabled: input.isEnabled,
    p_config: input.config,
    p_secret: input.secret?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return mapManagedIntegration(data as Record<string, unknown>);
}
