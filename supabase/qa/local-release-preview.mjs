/**
 * Pré-visualização de release apenas para QA local.
 *
 * Por que existe: `rpc_internal_actor_workspace_context` só devolve tela com
 * `release_enabled = true` em `public.internal_screen_catalog`. Isso deixa as
 * superfícies fora do primeiro release sem nenhum caminho de QA local, o que
 * bloqueia verificação de refactor e de regressão nessas telas.
 *
 * O que este script NÃO faz: não altera migration, não muda o manifesto de
 * release do produto e não roda contra banco remoto. Ele liga o flag apenas no
 * banco local, guarda o estado anterior e sabe restaurar.
 *
 * Uso:
 *   node supabase/qa/local-release-preview.mjs --enable
 *   node supabase/qa/local-release-preview.mjs --status
 *   node supabase/qa/local-release-preview.mjs --disable
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import {
  assertLocalSupabaseEnvironment,
  loadQaEnv,
  readLocalSupabaseStatus,
} from '../../scripts/local-qa/assert-local-supabase.mjs';
import { runSql } from '../../scripts/local-qa/sql.mjs';

const BACKUP_PATH = join(
  process.cwd(),
  'output',
  'local-qa',
  'release-preview-backup.json',
);

function assertLocal() {
  const qa = loadQaEnv();
  const status = readLocalSupabaseStatus({ ...process.env, ...qa });
  assertLocalSupabaseEnvironment({ ...process.env, ...qa }, { status });
}

function readCatalog() {
  const result = runSql(`
    select screen_key, release_enabled
    from public.internal_screen_catalog
    order by screen_key;
  `);
  return result.rows ?? [];
}

function saveBackup(rows) {
  if (existsSync(BACKUP_PATH)) {
    return JSON.parse(readFileSync(BACKUP_PATH, 'utf8'));
  }
  mkdirSync(dirname(BACKUP_PATH), { recursive: true });
  const payload = {
    scope: 'local-only',
    catalog: rows.map((row) => ({
      screen_key: row.screen_key,
      release_enabled: row.release_enabled,
    })),
  };
  writeFileSync(BACKUP_PATH, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

function printCatalog(rows, title) {
  console.log(title);
  for (const row of rows) {
    console.log(
      '  ',
      String(row.screen_key).padEnd(24),
      'release_enabled=' + row.release_enabled,
    );
  }
}

function parseScreens() {
  const args = process.argv.slice(2);
  const inline = args.find((arg) => arg.startsWith('--screens='));
  const flagIndex = args.indexOf('--screens');
  const raw = inline
    ? inline.slice('--screens='.length)
    : flagIndex >= 0
      ? (args[flagIndex + 1] ?? '')
      : '';

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function enablePreview(screens) {
  const before = readCatalog();
  const known = new Set(before.map((row) => String(row.screen_key)));
  const unknown = screens.filter((screen) => !known.has(screen));

  if (unknown.length > 0) {
    throw new Error(
      'LOCAL_RELEASE_PREVIEW_SCREEN_DESCONHECIDA: ' + unknown.join(', '),
    );
  }

  const backup = saveBackup(before);
  const list = screens
    .map((screen) => `'${screen.replaceAll("'", "''")}'`)
    .join(', ');
  runSql(`
    update public.internal_screen_catalog
    set release_enabled = true
    where screen_key in (${list})
      and release_enabled is distinct from true;
  `);
  const after = readCatalog();
  printCatalog(after, 'PRE-VISUALIZACAO LIGADA (somente banco local):');
  console.log(
    '\nEstado original preservado em output/local-qa/release-preview-backup.json ' +
      '(' + backup.catalog.length + ' telas). Use --disable para restaurar.',
  );
}

function disablePreview() {
  if (!existsSync(BACKUP_PATH)) {
    throw new Error(
      'LOCAL_RELEASE_PREVIEW_SEM_BACKUP: nao ha estado original registrado; ' +
        'restaure manualmente ou reidrate o banco local.',
    );
  }
  const backup = JSON.parse(readFileSync(BACKUP_PATH, 'utf8'));
  const disabled = backup.catalog
    .filter((row) => row.release_enabled !== true)
    .map((row) => `'${String(row.screen_key).replaceAll("'", "''")}'`);

  if (disabled.length > 0) {
    runSql(`
      update public.internal_screen_catalog
      set release_enabled = false
      where screen_key in (${disabled.join(', ')});
    `);
  }

  printCatalog(readCatalog(), 'PRE-VISUALIZACAO DESLIGADA (estado original restaurado):');
}

function main() {
  const mode = process.argv.includes('--disable')
    ? 'disable'
    : process.argv.includes('--status')
      ? 'status'
      : 'enable';

  assertLocal();

  if (mode === 'status') {
    printCatalog(readCatalog(), 'CATALOGO ATUAL (banco local):');
    console.log(
      '\nBackup de estado original: ' +
        (existsSync(BACKUP_PATH) ? 'presente' : 'ausente'),
    );
    return;
  }

  if (mode === 'disable') {
    disablePreview();
    return;
  }

  const screens = parseScreens();

  if (screens.length === 0) {
    throw new Error(
      'LOCAL_RELEASE_PREVIEW_SEM_SCREENS: informe as telas explicitamente, ' +
        'por exemplo `npm run supabase:qa:local-release-preview -- --screens=tenants`. ' +
        'Ligar o catalogo inteiro de uma vez muda a superficie navegavel e ja fez o ' +
        'smoke autenticado falhar com 401 em vw_admin_auth_context.',
    );
  }

  enablePreview(screens);
}

main();
