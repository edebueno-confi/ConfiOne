import { readdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const testsDirectory = path.resolve('tests/scripts');
// Estes arquivos continuam no `test:all`, mas não fazem parte do gate rápido:
// dois dependem de um loader TS ausente no Node puro e os demais pertencem a
// contratos legados de UI/settings que não são o gate do Dashboard atual.
const focusedExclusions = new Set([
  'analytics-commercial-kpi-details.test.mjs',
  'analytics-diagnostic-runtime.test.mjs',
  'analytics-kpi-surfaces.test.mjs',
  'analytics-sync-progress.test.mjs',
  'dashboard-02-foundation-contract.test.mjs',
  'dashboard-ui-04-contract.test.mjs',
]);
const selectedNames = readdirSync(testsDirectory)
  .filter((name) => (
    /^analytics-.*\.test\.mjs$/.test(name)
    || /^dashboard-02-.*\.test\.mjs$/.test(name)
    || /^dashboard-source-sync-feedback\.test\.mjs$/.test(name)
    || /^settings-(sources-v2-contract|sync-history-view)\.test\.mjs$/.test(name)
    || /^(cs-portfolio-model|customer-relationship-model)\.test\.mjs$/.test(name)
  ))
  .filter((name) => !focusedExclusions.has(name))
  .sort();

if (selectedNames.length === 0) {
  console.error('Nenhum teste focado do Dashboard foi encontrado.');
  process.exit(1);
}

console.log(`Executando ${selectedNames.length} arquivos de teste focados do Dashboard.`);
const result = spawnSync(process.execPath, ['--test', ...selectedNames.map((name) => path.join(testsDirectory, name))], {
  stdio: 'inherit',
  windowsHide: true,
});

process.exit(result.status ?? 1);
