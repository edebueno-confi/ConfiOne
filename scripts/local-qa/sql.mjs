import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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
  const statements = [];
  let start = 0;
  let quote = false;
  let dollarTag = null;
  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    if (dollarTag) {
      if (sql.startsWith(dollarTag, index)) { index += dollarTag.length - 1; dollarTag = null; }
      continue;
    }
    if (quote) {
      if (char === "'" && sql[index + 1] === "'") { index += 1; continue; }
      if (char === "'") quote = false;
      continue;
    }
    if (char === "'") { quote = true; continue; }
    if (char === '$') {
      const match = sql.slice(index).match(/^\$[A-Za-z_0-9]*\$/);
      if (match) { dollarTag = match[0]; index += dollarTag.length - 1; }
      continue;
    }
    if (char === ';') {
      const statement = sql.slice(start, index).trim();
      if (statement && !/^(begin|commit|rollback)$/i.test(statement)) statements.push(statement);
      start = index + 1;
    }
  }
  const tail = sql.slice(start).trim();
  if (tail && !/^(begin|commit|rollback)$/i.test(tail)) statements.push(tail);
  let result = { rows: [] };
  for (const [index, statement] of statements.entries()) {
    try { result = runSql(statement); }
    catch (error) { throw new Error(`LOCAL_QA_SQL_FAILED statement=${index + 1}: ${statement.slice(0, 180)}\n${error.message}`); }
  }
  return result;
}
