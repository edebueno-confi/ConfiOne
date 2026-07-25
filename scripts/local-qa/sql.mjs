import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runLocalCommand } from './assert-local-supabase.mjs';

export function sqlEscape(value) {
  return String(value).replaceAll("'", "''");
}

export function runSql(sql) {
  const directory = mkdtempSync(join(tmpdir(), 'gso-local-qa-'));
  const file = join(directory, 'query.sql');
  writeFileSync(file, `${sql.trim()}\n`, 'utf8');
  try {
    const output = runLocalCommand(['db', 'query', '--local', '--file', file, '--output', 'json']);
    try { return JSON.parse(output); } catch { return { rows: [] }; }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

export function runSqlBatch(sql) {
  const normalized = sql.trim();
  if (!normalized) return { rows: [] };

  // The whole batch is sent through one psql session. BEGIN/COMMIT are
  // deliberately preserved so a mid-fixture error rolls back all business
  // data instead of leaving a partially hydrated local database. Supabase
  // CLI `db query` uses a prepared statement and rejects multiple commands;
  // the local database container is the supported single-session fallback.
  try {
    const container = process.env.LOCAL_QA_DB_CONTAINER ?? 'supabase_db_genius-support-os';
    const result = spawnSync('docker', ['exec', '-i', container, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres', '-q'], {
      input: `${normalized}\n`, encoding: 'utf8', windowsHide: true,
    });
    if (result.status !== 0) throw new Error([result.stderr, result.stdout].filter(Boolean).join('\n'));
    return { rows: [] };
  } catch (error) {
    throw new Error(`LOCAL_QA_SQL_TRANSACTION_FAILED: ${error.message}`);
  }
}
