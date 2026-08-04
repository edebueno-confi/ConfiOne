import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const BLOCKING_SEVERITIES = ['critical', 'high'];

/**
 * Classifica a saída de `npm audit --omit=dev --json`.
 * Não faz rede: recebe o relatório já lido para permitir teste determinístico.
 */
export function classifyAdvisories(report) {
  if (!report || typeof report !== 'object') {
    return { available: false, reason: 'relatório de auditoria ausente ou ilegível' };
  }

  const counts = report.metadata?.vulnerabilities ?? {};
  const vulnerabilities = report.vulnerabilities ?? {};
  const blocking = [];

  for (const [name, entry] of Object.entries(vulnerabilities)) {
    if (!BLOCKING_SEVERITIES.includes(entry?.severity)) {
      continue;
    }
    const advisories = new Set();
    for (const via of entry.via ?? []) {
      if (via && typeof via === 'object' && via.url) {
        advisories.add(via.url);
      }
    }
    blocking.push({
      name,
      severity: entry.severity,
      range: entry.range ?? 'indisponível',
      direct: Boolean(entry.isDirect),
      advisories: [...advisories],
    });
  }

  blocking.sort((left, right) => left.name.localeCompare(right.name));

  return {
    available: true,
    counts: {
      critical: counts.critical ?? 0,
      high: counts.high ?? 0,
      moderate: counts.moderate ?? 0,
      low: counts.low ?? 0,
      info: counts.info ?? 0,
      total: counts.total ?? 0,
    },
    blocking,
  };
}

export function formatAdvisoryReport(result) {
  const header = 'Auditoria de dependências de produção';

  if (!result.available) {
    return [
      header,
      'INDISPONÍVEL: ' + result.reason,
      'A verificação não foi executada. Não trate este resultado como aprovação.',
    ].join('\n');
  }

  const { counts, blocking } = result;
  const resume =
    'Contagem: ' +
    ['critical', 'high', 'moderate', 'low', 'info']
      .map((severity) => severity + '=' + counts[severity])
      .join(', ');

  if (blocking.length === 0) {
    return [header, resume, 'OK: nenhuma vulnerabilidade alta ou crítica em dependência de produção.'].join('\n');
  }

  const lines = blocking.map(
    (item) =>
      '- [' +
      item.severity +
      '] ' +
      item.name +
      ' ' +
      item.range +
      (item.direct ? ' (dependência direta)' : '') +
      (item.advisories.length ? ' | ' + item.advisories.join(' ') : ''),
  );

  return [
    header,
    resume,
    'BLOQUEIOS: ' + blocking.length,
    ...lines,
    '',
    'Corrija a versão ou registre a decisão em relatório antes de seguir. Não use `npm audit fix --force` sem validar breaking changes.',
  ].join('\n');
}

export function readAuditReport() {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const execution = spawnSync(npm, ['audit', '--omit=dev', '--json'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 120000,
    shell: process.platform === 'win32',
  });

  const stdout = execution.stdout ?? '';

  try {
    return { report: JSON.parse(stdout.replace(/^﻿/, '')) };
  } catch {
    return {
      report: null,
      reason:
        'npm audit não retornou JSON válido; registro local ou registry indisponível',
    };
  }
}

async function main() {
  const { report, reason } = readAuditReport();
  const result = report
    ? classifyAdvisories(report)
    : { available: false, reason: reason ?? 'saída de auditoria não interpretável' };

  console.log(formatAdvisoryReport(result));
  process.exitCode = result.available && result.blocking.length > 0 ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
