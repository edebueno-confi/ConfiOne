import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const router = await readFile(new URL('../../apps/web/src/app/router.tsx', import.meta.url), 'utf8');
const settings = await readFile(new URL('../../apps/web/src/features/settings/SettingsPage.tsx', import.meta.url), 'utf8');
const integrations = await readFile(new URL('../../apps/web/src/features/settings/SettingsIntegrationsPanel.tsx', import.meta.url), 'utf8');
const sources = await readFile(new URL('../../apps/web/src/features/settings/DashboardSourcesSettingsPage.tsx', import.meta.url), 'utf8');
const history = await readFile(new URL('../../apps/web/src/features/settings/SyncHistorySettingsPage.tsx', import.meta.url), 'utf8');
const migration = await readFile(new URL('../../supabase/migrations/20260802110000_settings_sources_catalog_v2.sql', import.meta.url), 'utf8');
const worker = await readFile(new URL('../../supabase/functions/hubspot-orchestrator-worker/index.ts', import.meta.url), 'utf8');

test('rotas canônicas e redirects legados existem', () => {
  for (const path of ['settings/integrations', 'settings/dashboard-sources', 'settings/sync-history']) assert.match(router, new RegExp(`path: '${path}'`));
  assert.match(router, /SettingsLegacyRedirect/);
  assert.match(settings, /SETTINGS_ROUTES/);
});

test('integrações não misturam fontes, histórico ou modo técnico', () => {
  assert.match(integrations, /provider === 'hubspot' \|\| item\.provider === 'omie'/);
  assert.match(integrations, /Salvar alterações/);
  assert.match(integrations, /Atualizar credencial/);
  assert.doesNotMatch(integrations, /Modo|Dashboard e Analytics|Diagnóstico|Histórico|contas_a_receber|Vault/);
});

test('Fontes do Dashboard concentra agenda, ações reais e catálogo', () => {
  assert.match(sources, /Atualização automática do Dashboard/);
  assert.match(sources, /Atualizar painel completo/);
  assert.match(sources, /Atualizar HubSpot/);
  assert.match(sources, /Atualizar OMIE/);
  assert.match(sources, /A classificar/);
  assert.doesNotMatch(sources, /Diagnóstico|platform_admin|server-side|cron secret|Dashboard e Analytics/);
});

test('Histórico agrupa ciclos e publica campos operacionais', () => {
  for (const field of ['correlationId', 'startedAt', 'finishedAt', 'durationMs', 'processedCount', 'errorMessage', 'triggerKind']) assert.match(history, new RegExp(field));
  assert.doesNotMatch(history, /payload|stack trace|secret/i);
});

test('catálogo descobre, ativa e arquiva pipelines sem apagar histórico', () => {
  assert.match(migration, /rpc_service_reconcile_hubspot_pipeline_catalog/);
  assert.match(migration, /is_active = case when v_existing.classification_source = 'pending' then true/);
  assert.match(migration, /is_archived = true/);
  assert.match(migration, /not exists/);
  assert.match(worker, /rpc_service_reconcile_hubspot_pipeline_catalog/);
});

test('áreas e classificação segura são contratos explícitos', () => {
  for (const area of ['commercial', 'customer_success', 'support', 'chat', 'a_classificar']) assert.match(migration, new RegExp(area));
  assert.match(migration, /domain_key = any\(v_domains\)/);
  assert.match(migration, /unclassified/);
});
