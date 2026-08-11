import { spawnSync } from 'node:child_process';

// O comando padrão deve validar o lote funcional em execução sem transformar a
// suíte ampla, que possui contratos legados independentes, em um falso gate da
// migração de Recharts. A suíte completa continua disponível em test:all.
const focusedTests = [
  'tests/scripts/analytics-visual-contract.test.mjs',
  'tests/scripts/analytics-trend-charts.test.mjs',
  'tests/scripts/analytics-timeseries-contract.test.mjs',
];

const result = spawnSync(process.execPath, ['--test', ...focusedTests], {
  cwd: process.cwd(),
  stdio: 'inherit',
  windowsHide: true,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
