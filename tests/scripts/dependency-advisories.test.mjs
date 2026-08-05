import test from 'node:test';
import assert from 'node:assert/strict';

import {
  classifyAdvisories,
  formatAdvisoryReport,
} from '../../scripts/ci/check-dependency-advisories.mjs';

test('aprova relatório sem vulnerabilidade alta ou crítica', () => {
  const result = classifyAdvisories({
    vulnerabilities: {
      alguma: { severity: 'moderate', range: '<1.0.0', via: [] },
    },
    metadata: {
      vulnerabilities: { info: 0, low: 1, moderate: 1, high: 0, critical: 0, total: 2 },
    },
  });

  assert.equal(result.available, true);
  assert.deepEqual(result.blocking, []);
  assert.match(formatAdvisoryReport(result), /OK: nenhuma vulnerabilidade alta ou crítica/);
});

test('bloqueia vulnerabilidade alta em dependência de produção', () => {
  const result = classifyAdvisories({
    vulnerabilities: {
      'react-router': {
        severity: 'high',
        range: '>=7.12.0 <8.3.0',
        isDirect: false,
        via: [{ url: 'https://github.com/advisories/GHSA-qwww-vcr4-c8h2' }],
      },
    },
    metadata: {
      vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 0, total: 1 },
    },
  });

  assert.equal(result.blocking.length, 1);
  assert.equal(result.blocking[0].name, 'react-router');
  assert.equal(result.blocking[0].severity, 'high');
  assert.deepEqual(result.blocking[0].advisories, [
    'https://github.com/advisories/GHSA-qwww-vcr4-c8h2',
  ]);
  assert.match(formatAdvisoryReport(result), /BLOQUEIOS: 1/);
});

test('marca indisponibilidade em vez de aprovar quando não há relatório', () => {
  const result = classifyAdvisories(null);

  assert.equal(result.available, false);
  const report = formatAdvisoryReport(result);
  assert.match(report, /INDISPONÍVEL/);
  assert.match(report, /Não trate este resultado como aprovação/);
});
