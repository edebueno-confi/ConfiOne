import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { createServiceClient, getAuthorizationHeader, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { createCompany, searchCompaniesByCnpj } from '../_shared/hubspot.ts';

interface CreateItem { name?: unknown; cnpj?: unknown; tradeName?: unknown; force?: unknown }
interface CreateRequest { dryRun?: unknown; confirmation?: unknown; items?: unknown }

function text(value: unknown) { return value === null || value === undefined ? '' : String(value).trim(); }
function digitsOnly(value: string) { return value.replace(/[^0-9]/g, ''); }
function nameCore(value: string) { return value.toUpperCase().replace(/(\s+(LTDA|EIRELI|ME|EPP|S\/?A|S\.?A\.?)\b.*)$/, '').trim(); }

async function authorize(req: Request, client: SupabaseClient): Promise<string | null> {
  const token = getAuthorizationHeader(req).replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  const userId = String(data.claims.sub);
  const { data: roleRow, error: roleError } = await client
    .from('user_global_roles').select('user_id').eq('user_id', userId).eq('role', 'platform_admin').maybeSingle();
  return roleError || !roleRow ? null : userId;
}

async function resolveHubSpotToken(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.rpc('rpc_service_get_managed_integration_secret', { p_integration_key: 'hubspot' });
  if (!error && typeof data === 'string' && data.trim()) return data.trim();
  const fallback = Deno.env.get('HUBSPOT_PRIVATE_APP_TOKEN')?.trim();
  if (fallback) return fallback;
  throw new Error(error?.message ?? 'Credencial gerenciada do HubSpot indisponível.');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });

  const client = createServiceClient();
  const actorId = await authorize(req, client);
  if (!actorId) return jsonResponse({ error: 'Acesso negado. Requer platform_admin.' }, { status: 403 });

  let body: CreateRequest;
  try { body = await req.json() as CreateRequest; } catch { return jsonResponse({ error: 'JSON inválido.' }, { status: 400 }); }

  const dryRun = body.dryRun !== false; // padrão seguro: dry-run
  const confirmation = text(body.confirmation);
  const rawItems = Array.isArray(body.items) ? body.items as CreateItem[] : [];
  if (rawItems.length === 0) return jsonResponse({ error: 'Informe ao menos uma empresa em items.' }, { status: 422 });
  if (rawItems.length > 50) return jsonResponse({ error: 'Limite de 50 empresas por execução.' }, { status: 422 });
  if (!dryRun && confirmation !== 'CRIAR') {
    return jsonResponse({ error: 'Confirmação inválida. Envie confirmation="CRIAR" e dryRun=false para criar de fato.' }, { status: 422 });
  }

  let token: string | null = null;
  if (!dryRun) {
    try { token = await resolveHubSpotToken(client); }
    catch (error) { return jsonResponse({ error: error instanceof Error ? error.message : 'Token HubSpot indisponível.' }, { status: 409 }); }
  }

  const results: Array<Record<string, unknown>> = [];
  for (const item of rawItems) {
    const name = text(item.name);
    const cnpj = text(item.cnpj);
    const tradeName = text(item.tradeName);
    const force = item.force === true;
    if (!name) { results.push({ name, cnpj, action: 'skipped_invalid', reason: 'Nome obrigatório.' }); continue; }

    const digits = digitsOnly(cnpj);
    // Dedupe por CNPJ no cache local (tax_id normalizado em digitos).
    let cacheHit: { company_id: string; name: string | null } | null = null;
    if (digits) {
      const { data } = await client.from('hubspot_companies').select('company_id,name').eq('tax_id', digits).limit(1).maybeSingle();
      if (data) cacheHit = data as { company_id: string; name: string | null };
    }
    // Pista por nome (razao social e nome fantasia).
    const cores = [nameCore(name), nameCore(tradeName)].filter((c) => c.length >= 4);
    let nameMatchCount = 0;
    if (cores.length > 0) {
      const orFilter = cores.map((c) => `name.ilike.%${c.replace(/[,%]/g, ' ')}%`).join(',');
      const { count } = await client.from('hubspot_companies').select('company_id', { count: 'exact', head: true }).or(orFilter);
      nameMatchCount = count ?? 0;
    }

    let action: string;
    if (cacheHit) action = 'skipped_cnpj_exists';
    else if (nameMatchCount > 0 && !force) action = 'skipped_name_conflict';
    else action = 'create';

    if (dryRun) {
      results.push({ name, cnpj, action: action === 'create' ? 'would_create' : action, nameMatchCount, existingCompanyId: cacheHit?.company_id ?? null, existingName: cacheHit?.name ?? null });
      continue;
    }

    // Execução real (confirmada).
    if (action !== 'create') {
      await client.from('analytics_hubspot_company_create_runs').insert({ requested_by_user_id: actorId, source_client_name: name, source_tax_id: cnpj || null, action, hubspot_company_id: cacheHit?.company_id ?? null, name_match_count: nameMatchCount, finished_at: new Date().toISOString() });
      results.push({ name, cnpj, action, existingCompanyId: cacheHit?.company_id ?? null, nameMatchCount });
      continue;
    }
    try {
      // Guarda final ao vivo: se o CNPJ ja existir no HubSpot, nao duplica.
      const live = digits ? await searchCompaniesByCnpj(cnpj, token!) : [];
      if (live.length > 0) {
        const existingId = String((live[0] as { id?: unknown }).id ?? '');
        await client.from('analytics_hubspot_company_create_runs').insert({ requested_by_user_id: actorId, source_client_name: name, source_tax_id: cnpj || null, action: 'skipped_cnpj_exists', hubspot_company_id: existingId || null, name_match_count: nameMatchCount, finished_at: new Date().toISOString() });
        results.push({ name, cnpj, action: 'skipped_cnpj_exists', existingCompanyId: existingId, source: 'live' });
        continue;
      }
      const created = await createCompany({ name, cnpj }, token!);
      const newId = String((created as { id?: unknown }).id ?? '');
      await client.from('analytics_hubspot_company_create_runs').insert({ requested_by_user_id: actorId, source_client_name: name, source_tax_id: cnpj || null, action: 'created', hubspot_company_id: newId || null, name_match_count: nameMatchCount, finished_at: new Date().toISOString() });
      results.push({ name, cnpj, action: 'created', companyId: newId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao criar empresa.';
      await client.from('analytics_hubspot_company_create_runs').insert({ requested_by_user_id: actorId, source_client_name: name, source_tax_id: cnpj || null, action: 'failed', name_match_count: nameMatchCount, error_message: message.slice(0, 1000), finished_at: new Date().toISOString() });
      results.push({ name, cnpj, action: 'failed', error: message.slice(0, 300) });
    }
  }

  const summary = {
    created: results.filter((r) => r.action === 'created').length,
    wouldCreate: results.filter((r) => r.action === 'would_create').length,
    skippedCnpj: results.filter((r) => r.action === 'skipped_cnpj_exists').length,
    skippedNameConflict: results.filter((r) => r.action === 'skipped_name_conflict').length,
    failed: results.filter((r) => r.action === 'failed').length,
  };
  return jsonResponse({ ok: true, dryRun, syncRecommended: !dryRun && summary.created > 0, summary, results });
});
