import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePsqlCsvResult } from '../../scripts/lib/parse-psql-csv.mjs';

test('interpreta a saída CSV real do psql sem perder tipos e campos quoted', () => {
  const result = parsePsqlCsvResult(
    'id,name,active,score,note\n1,"Cliente, A",true,4.5,"linha 1\nlinha 2"\n2,"Aspas ""internas""",false,\\N,\\N\n',
  );

  assert.deepEqual(result.rows, [
    {
      id: 1,
      name: 'Cliente, A',
      active: true,
      score: 4.5,
      note: 'linha 1\nlinha 2',
    },
    {
      id: 2,
      name: 'Aspas "internas"',
      active: false,
      score: null,
      note: null,
    },
  ]);
});

test('trata resultado vazio do psql como conjunto vazio', () => {
  assert.deepEqual(parsePsqlCsvResult(''), { rows: [] });
});
