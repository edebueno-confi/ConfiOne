import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('apps/web/src/features/analytics/analytics-export.ts');

test('relatorio gerencial nao monta a janela de impressao com document.write', () => {
  const source = fs.readFileSync(sourcePath, 'utf8');

  assert.doesNotMatch(
    source,
    /document\.write\s*\(/,
    'a exportacao deve navegar para um documento isolado sem usar document.write',
  );
});
