import { createClient } from '@supabase/supabase-js';
import { assertLocalSupabaseEnvironment, loadQaEnv, readLocalSupabaseStatus } from './assert-local-supabase.mjs';

const qa = loadQaEnv();
const status = readLocalSupabaseStatus({ ...process.env, ...qa });
assertLocalSupabaseEnvironment({ ...process.env, ...qa, SUPABASE_URL: status.API_URL }, { status });

const input = await new Promise((resolve, reject) => {
  let value = '';
  process.stdin.setEncoding('utf8');
  const onData = (chunk) => {
    value += chunk;
    const lineEnd = value.indexOf('\n');
    if (lineEnd >= 0) {
      process.stdin.off('data', onData);
      process.stdin.pause();
      resolve(value.slice(0, lineEnd).replace(/\r$/, ''));
    }
  };
  process.stdin.on('data', onData);
  process.stdin.on('end', () => resolve(value));
  process.stdin.on('error', reject);
});

let payload;
try {
  payload = JSON.parse(input);
} catch {
  throw new Error('Entrada JSON inválida.');
}

const records = Array.isArray(payload) ? payload : payload?.results;
if (!Array.isArray(records)) throw new Error('A entrada deve ser uma lista de empresas do HubSpot.');

const db = createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const authDb = createClient(status.API_URL, status.ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error: authError } = await authDb.auth.signInWithPassword({
  email: qa.LOCAL_QA_ADMIN_EMAIL,
  password: qa.LOCAL_QA_ADMIN_PASSWORD,
});
if (authError) throw new Error(`Autenticação QA administrativa falhou:${authError.code ?? 'unknown'}`);

const normalize = (value) => String(value ?? '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

const clean = (value, max = 240) => String(value ?? '')
  .replace(/[\u0000-\u001f\u007f]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

const slugify = (name, externalId) => {
  const base = normalize(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'cliente';
  const suffix = `hs-${String(externalId).replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 32) || 'record'}`;
  return `${base}-${suffix}`.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
};

const property = (record, key) => record?.properties?.[key] ?? '';
const sourceKey = (externalId) => `hubspot::${String(externalId).trim().toLowerCase()}`;

const adminEmail = String(qa.LOCAL_QA_ADMIN_EMAIL ?? '').trim();
if (!adminEmail) throw new Error('LOCAL_QA_ADMIN_EMAIL ausente em .env.local.qa.');

const { data: actorRows, error: actorError } = await db
  .from('profiles')
  .select('id')
  .eq('email', adminEmail)
  .limit(2);
if (actorError || !actorRows?.[0]?.id) throw new Error('Perfil QA administrador não encontrado no banco local.');
const actorId = actorRows[0].id;

const { data: tenants, error: tenantsError } = await db
  .from('tenants')
  .select('id,slug,legal_name,display_name,status')
  .limit(5000);
if (tenantsError) throw new Error('Não foi possível ler os tenants locais.');

const { data: sources, error: sourcesError } = await db
  .from('customer_account_sources')
  .select('id,tenant_id,source_product,source_version,source_system,source_external_id,status')
  .limit(5000);
if (sourcesError) throw new Error('Não foi possível ler as fontes de clientes locais.');

const tenantByName = new Map();
for (const tenant of tenants ?? []) {
  const key = normalize(tenant.display_name);
  if (!key) continue;
  const list = tenantByName.get(key) ?? [];
  list.push(tenant);
  tenantByName.set(key, list);
}

const sourceByExternalId = new Map();
for (const source of sources ?? []) {
  if (normalize(source.source_system) !== 'hubspot' || !source.source_external_id) continue;
  const key = sourceKey(source.source_external_id);
  const list = sourceByExternalId.get(key) ?? [];
  list.push(source);
  sourceByExternalId.set(key, list);
}

const existingSlugs = new Set((tenants ?? []).map((tenant) => normalize(tenant.slug)));
const stats = {
  input: records.length,
  eligible: 0,
  createdTenants: 0,
  reusedTenants: 0,
  sourcesInserted: 0,
  sourcesUpdated: 0,
  skipped: 0,
  conflicts: 0,
  failures: 0,
  firstFailure: null,
};

for (const record of records) {
  const externalId = clean(record?.id, 240);
  const name = clean(property(record, 'name') || record?.displayName, 180);
  const isClient = normalize(property(record, 'e_cliente_aftersale_')) === 'sim';
  if (!externalId || !name || !isClient) {
    stats.skipped += 1;
    continue;
  }
  stats.eligible += 1;

  const clientStatus = clean(property(record, 'status_do_cliente___aftersale'), 120);
  const contractStatus = clean(property(record, 'status_do_contrato'), 120);
  const notesParts = [
    'HubSpot local import',
    clientStatus ? `client_status=${clientStatus}` : '',
    contractStatus ? `contract_status=${contractStatus}` : '',
  ].filter(Boolean);
  const notes = clean(notesParts.join('; '), 1000);
  const sourceStatus = ['churn', 'bloqueado'].includes(normalize(clientStatus)) ? 'inactive' : 'confirmed';
  const lifecycleStatus = sourceStatus === 'inactive' ? 'suspended' : 'active';
  const key = sourceKey(externalId);

  try {
    const existingForExternalId = sourceByExternalId.get(key) ?? [];
    const exact = existingForExternalId.find((source) =>
      source.source_product === 'after_sale' && source.source_version === 'current');
    const conflicting = existingForExternalId.filter((source) => !exact || source.id !== exact.id);
    if (conflicting.length > 0 && (!exact || conflicting.some((source) => source.tenant_id !== exact.tenant_id))) {
      stats.conflicts += 1;
      continue;
    }

    let tenantId = exact?.tenant_id;
    if (!tenantId) {
      const named = tenantByName.get(normalize(name)) ?? [];
      if (named.length === 1) {
        tenantId = named[0].id;
        stats.reusedTenants += 1;
      } else {
        let slug = slugify(name, externalId);
        let attempt = 0;
        while (existingSlugs.has(slug)) {
          attempt += 1;
          slug = `${slugify(name, externalId)}-${attempt}`;
        }
        const legalName = clean(property(record, 'razao_social') || property(record, 'nome_fantasia___aftersale') || name, 240);
        const { data: created, error: createError } = await db
          .from('tenants')
          .insert({
            slug,
            legal_name: legalName,
            display_name: name,
            status: lifecycleStatus,
            data_region: 'sa-east-1',
            created_by_user_id: actorId,
            updated_by_user_id: actorId,
          })
          .select('id,slug,legal_name,display_name,status')
          .single();
        if (createError || !created) throw new Error(`tenant_insert_failed:${createError?.code ?? 'unknown'}:${createError?.message ?? ''}`);
        tenantId = created.id;
        existingSlugs.add(normalize(created.slug));
        const nameKey = normalize(created.display_name);
        const namedList = tenantByName.get(nameKey) ?? [];
        namedList.push(created);
        tenantByName.set(nameKey, namedList);
        stats.createdTenants += 1;
      }
    }

    const { error: sourceError } = await authDb.rpc('rpc_admin_upsert_customer_source', {
      p_tenant_id: tenantId,
      p_source_product: 'after_sale',
      p_source_version: 'current',
      p_source_system: 'hubspot',
      p_source_external_id: externalId,
      p_status: sourceStatus,
      p_notes: notes,
    });
    if (sourceError) throw new Error(`source_upsert_failed:${sourceError.code ?? 'unknown'}:${sourceError.message ?? ''}`);
    if (exact) {
      stats.sourcesUpdated += 1;
    } else {
      stats.sourcesInserted += 1;
    }
  } catch (error) {
    stats.failures += 1;
    if (!stats.firstFailure) stats.firstFailure = String(error?.message ?? 'unknown').replace(/[\r\n]/g, ' ').slice(0, 240);
  }
}

console.log(JSON.stringify(stats));
