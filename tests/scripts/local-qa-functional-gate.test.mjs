import test from 'node:test';
import assert from 'node:assert/strict';
import { runSql, runSqlBatch, sqlEscape } from '../../scripts/local-qa/sql.mjs';
import { readLocalSupabaseStatus } from '../../scripts/local-qa/assert-local-supabase.mjs';

const localSupabaseAvailable = (() => {
  try {
    readLocalSupabaseStatus();
    return true;
  } catch {
    return false;
  }
})();

test('sqlEscape neutraliza apóstrofo e preserva Unicode sem executar SQL', () => {
  assert.equal(sqlEscape("O'Connor — QA"), "O''Connor — QA");
  assert.equal(sqlEscape("x'); drop table public.tenants; --"), "x''); drop table public.tenants; --");
});

test('runSqlBatch mantém BEGIN/COMMIT na mesma sessão e faz rollback da falha', { skip: !localSupabaseAvailable }, () => {
  const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  assert.throws(() => runSqlBatch(`begin; insert into public.tenants (id, slug, legal_name, display_name, status, data_region) values ('${id}', 'qa-rollback', 'QA Rollback', 'QA Rollback', 'active', 'sa-east-1'); select 1/0; commit;`), /LOCAL_QA_SQL_TRANSACTION_FAILED/);
  const result = runSql(`select count(*)::int as count from public.tenants where id = '${id}';`);
  assert.equal(result.rows?.[0]?.count ?? 0, 0);
});
