import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeQueryResult } from '../../scripts/local-qa/sql.mjs';

// Regression coverage for the contract break between the Supabase CLI JSON
// output and every `runSql` consumer. CLI 2.105.0 prints a bare array, while
// the consumers read `.rows`; the helper must normalize both shapes and must
// never degrade an unexpected payload into a silent empty result.

test('normalizes a bare array from the current Supabase CLI', () => {
  assert.deepEqual(normalizeQueryResult('[{"count": 5}]'), { rows: [{ count: 5 }] });
});

test('preserves an object that already exposes rows', () => {
  assert.deepEqual(normalizeQueryResult('{"rows": [{"count": 5}]}'), { rows: [{ count: 5 }] });
});

test('normalizes an empty array to an empty row set', () => {
  assert.deepEqual(normalizeQueryResult('[]'), { rows: [] });
});

test('treats blank stdout as a valid empty result', () => {
  assert.deepEqual(normalizeQueryResult(''), { rows: [] });
  assert.deepEqual(normalizeQueryResult('   \n'), { rows: [] });
  assert.deepEqual(normalizeQueryResult(undefined), { rows: [] });
});

test('treats psql command tags as row-less responses', () => {
  assert.deepEqual(normalizeQueryResult('INSERT 0 1'), { rows: [] });
  assert.deepEqual(normalizeQueryResult('UPDATE 3'), { rows: [] });
  assert.deepEqual(normalizeQueryResult('COMMIT'), { rows: [] });
});

test('unwraps the last statement when the CLI nests rows in an array', () => {
  const output = '[{"rows": [{"a": 1}]}, {"rows": [{"b": 2}]}]';
  assert.deepEqual(normalizeQueryResult(output), { rows: [{ b: 2 }] });
});

test('fails explicitly on invalid JSON instead of returning undefined', () => {
  assert.throws(
    () => normalizeQueryResult('ERROR:  relation "public.missing" does not exist'),
    (error) => {
      assert.match(error.message, /LOCAL_QA_SQL_OUTPUT_UNPARSEABLE/);
      assert.match(error.message, /relation "public.missing" does not exist/);
      return true;
    },
  );
});

test('fails explicitly on a JSON object without rows', () => {
  assert.throws(
    () => normalizeQueryResult('{"unexpected": true}'),
    /LOCAL_QA_SQL_OUTPUT_UNEXPECTED/,
  );
});

test('fails explicitly on a JSON scalar', () => {
  assert.throws(() => normalizeQueryResult('42'), /LOCAL_QA_SQL_OUTPUT_UNEXPECTED/);
  assert.throws(() => normalizeQueryResult('null'), /LOCAL_QA_SQL_OUTPUT_UNEXPECTED/);
});

test('reports the source so a failure identifies the failing call site', () => {
  assert.throws(
    () => normalizeQueryResult('not json', { source: 'fixture X' }),
    /fixture X/,
  );
});
