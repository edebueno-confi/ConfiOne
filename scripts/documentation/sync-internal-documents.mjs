import process from 'node:process';
import { createClient } from '@supabase/supabase-js';
import {
  formatBytes,
  printDocument,
  validateInternalDocuments,
} from './validate-internal-documents.mjs';

const applyMode = process.argv.includes('--apply');
const allowedArgs = new Set(['--apply']);
const unknownArgs = process.argv.slice(2).filter((arg) => !allowedArgs.has(arg));

if (unknownArgs.length > 0) {
  console.error(`[internal-docs] Argumentos não suportados: ${unknownArgs.join(', ')}`);
  process.exit(1);
}

function validationStatusFor(result) {
  if (result.errors.length > 0) {
    return 'blocked';
  }

  if (result.warnings.length > 0) {
    return 'warning';
  }

  return 'valid';
}

function documentStatusFor(result) {
  if (result.errors.length > 0 || result.status === 'blocked') {
    return 'blocked';
  }

  return result.status;
}

function warningsJson(result) {
  return result.warnings.map((warning) => {
    const match = warning.match(/^(.+?) \((\d+)\)$/);
    return {
      id: match?.[1] ?? warning,
      count: match ? Number(match[2]) : 1,
      severity: 'warning',
    };
  });
}

function requireApplyEnvironment() {
  if (process.env.INTERNAL_DOCS_SYNC_APPLY !== '1') {
    console.error('[internal-docs] --apply exige INTERNAL_DOCS_SYNC_APPLY=1.');
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error('[internal-docs] --apply exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente server-side.');
    process.exit(1);
  }

  return { url, serviceRoleKey };
}

function createAdminClient() {
  const { url, serviceRoleKey } = requireApplyEnvironment();
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function fetchExistingDocuments(supabase, slugs) {
  if (slugs.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('internal_documents')
    .select('id, slug, source_path, current_version_id, current_version:internal_document_versions!internal_documents_current_version_fk(source_hash, version_number)')
    .in('slug', slugs);

  if (error) {
    throw new Error(`Falha ao ler documentos existentes: ${error.message}`);
  }

  return new Map((data ?? []).map((document) => [document.slug, document]));
}

async function applyDocument(supabase, result, existingDocument) {
  const status = documentStatusFor(result);
  const validationStatus = validationStatusFor(result);
  const now = new Date().toISOString();

  const documentPayload = {
    slug: result.slug,
    source_path: result.source_path,
    title: result.title,
    category: result.category,
    status,
    sensitivity: result.sensitivity,
    owner: result.owner,
    surfaces: result.surfaces,
    allow_inline_reader: result.allow_inline_reader,
    description: result.description,
    archived_at: status === 'archived' ? now : null,
  };

  const { data: documentRow, error: documentError } = await supabase
    .from('internal_documents')
    .upsert(documentPayload, { onConflict: 'slug' })
    .select('id, slug, source_path, current_version_id')
    .single();

  if (documentError) {
    throw new Error(`Falha ao aplicar catálogo ${result.slug}: ${documentError.message}`);
  }

  const currentHash = existingDocument?.current_version?.source_hash;
  if (currentHash === result.hash) {
    return { slug: result.slug, action: 'ignored', reason: 'hash sem mudança' };
  }

  if (validationStatus === 'blocked') {
    return { slug: result.slug, action: 'blocked', reason: result.errors.join('; ') };
  }

  const { data: latestVersions, error: versionReadError } = await supabase
    .from('internal_document_versions')
    .select('version_number')
    .eq('document_id', documentRow.id)
    .order('version_number', { ascending: false })
    .limit(1);

  if (versionReadError) {
    throw new Error(`Falha ao calcular versão ${result.slug}: ${versionReadError.message}`);
  }

  const latestVersionNumber = latestVersions?.[0]?.version_number ?? 0;
  const versionPayload = {
    document_id: documentRow.id,
    source_hash: result.hash,
    body_md_sanitized: result.body_md_sanitized,
    original_size_bytes: result.bytes,
    sanitized_size_bytes: result.sanitized_bytes,
    version_number: latestVersionNumber + 1,
    validation_status: validationStatus,
    validation_warnings: warningsJson(result),
    published_at: status === 'published' ? now : null,
    synced_by_user_id: null,
  };

  const { data: versionRow, error: versionError } = await supabase
    .from('internal_document_versions')
    .insert(versionPayload)
    .select('id, version_number')
    .single();

  if (versionError) {
    throw new Error(`Falha ao criar versão ${result.slug}: ${versionError.message}`);
  }

  const { error: currentVersionError } = await supabase
    .from('internal_documents')
    .update({ current_version_id: versionRow.id })
    .eq('id', documentRow.id);

  if (currentVersionError) {
    throw new Error(`Falha ao promover versão atual ${result.slug}: ${currentVersionError.message}`);
  }

  return {
    slug: result.slug,
    action: existingDocument ? 'updated' : 'created',
    version: versionRow.version_number,
  };
}

function printSyncPlan(results, existingDocuments = new Map()) {
  console.log(`Internal Documents Sync ${applyMode ? 'Apply' : 'Dry Run'}`);
  console.log('=================================');
  console.log(`Documentos: ${results.length}`);

  for (const result of results) {
    const existing = existingDocuments.get(result.slug);
    const currentHash = existing?.current_version?.source_hash;
    const status = validationStatusFor(result);
    const action = result.errors.length > 0
      ? 'blocked'
      : currentHash === result.hash
        ? 'ignored'
        : existing
          ? 'update'
          : 'create';

    printDocument(result);
    console.log(`  sync_status: ${status}`);
    console.log(`  sanitized_size: ${formatBytes(result.sanitized_bytes)}`);
    console.log(`  action: ${action}`);
  }
}

async function main() {
  const summary = validateInternalDocuments();
  const { results, blocked } = summary;

  if (!applyMode) {
    printSyncPlan(results);
    console.log('\nDry-run concluído: nenhum arquivo foi alterado e nada foi gravado no banco.');
    if (blocked.length > 0) {
      process.exit(1);
    }
    return;
  }

  if (blocked.length > 0) {
    printSyncPlan(results);
    console.error('\nApply bloqueado: existem documentos com achados críticos.');
    process.exit(1);
  }

  const supabase = createAdminClient();
  const existingDocuments = await fetchExistingDocuments(supabase, results.map((result) => result.slug));
  printSyncPlan(results, existingDocuments);

  const outcomes = [];
  for (const result of results) {
    outcomes.push(await applyDocument(supabase, result, existingDocuments.get(result.slug)));
  }

  console.log('\nResultado apply');
  console.log('---------------');
  for (const outcome of outcomes) {
    const version = outcome.version ? ` v${outcome.version}` : '';
    const reason = outcome.reason ? ` (${outcome.reason})` : '';
    console.log(`- ${outcome.slug}: ${outcome.action}${version}${reason}`);
  }
}

main().catch((error) => {
  console.error(`\n[internal-docs] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
