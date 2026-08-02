#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(process.cwd());
const sourceExtensions = new Set(['.cjs', '.css', '.js', '.jsx', '.mjs', '.sql', '.ts', '.tsx']);
const ignoredDirectories = new Set(['.git', '.next', '.turbo', 'coverage', 'dist', 'node_modules', 'output', 'tmp']);
const fileFlag = process.argv.indexOf('--files');
const requestedFiles = fileFlag >= 0 ? process.argv.slice(fileFlag + 1) : [];
const requested = process.argv[2] && process.argv[2] !== '--files' ? path.resolve(root, process.argv[2]) : root;
const scope = requested.startsWith(root) ? requested : root;
const selfPath = path.join(root, '.agents', 'skills', 'genius-code-quality');

const rules = [
  { id: 'unsafe-double-cast', category: 'tipos', regex: /as\s+unknown\s+as\s+/g, severity: 'médio', confidence: 'alta', message: 'cast duplo exige justificativa e validação do contrato' },
  { id: 'ts-ignore', category: 'tipos', regex: /@ts-(?:ignore|expect-error)/g, severity: 'médio', confidence: 'média', message: 'supressão TypeScript exige justificativa próxima' },
  { id: 'explicit-any', category: 'tipos', regex: /(?::\s*any\b|\bas\s+any\b|Array\s*<\s*any\s*>)/g, severity: 'baixo', confidence: 'média', message: 'uso de any é candidato; revisar se o contrato realmente exige flexibilidade' },
  { id: 'dangerous-html', category: 'segurança/frontend', regex: /dangerouslySetInnerHTML/g, severity: 'alto', confidence: 'média', message: 'HTML precisa de origem e sanitização comprovadas' },
  { id: 'direct-table-access', category: 'arquitetura', regex: /\.from\s*\(\s*['"](?!vw_)[^'"]+['"]\s*\)/g, severity: 'médio', confidence: 'baixa', message: 'acesso direto a tabela exige revisão contra view/RPC e escopo autorizado' },
  { id: 'silent-catch', category: 'async/erros', regex: /catch\s*\([^)]*\)\s*\{\s*\}/g, severity: 'alto', confidence: 'média', message: 'catch vazio pode ocultar falha operacional' },
  { id: 'security-definer', category: 'banco/segurança', regex: /security\s+definer/gi, severity: 'alto', confidence: 'média', message: 'SECURITY DEFINER exige search_path vazio, grants mínimos e autorização' },
  { id: 'wildcard-select', category: 'banco/contratos', regex: /\bselect\s+\*/gi, severity: 'baixo', confidence: 'baixa', message: 'select * em contrato persistente pode criar drift de retorno' },
  { id: 'todo-fixme', category: 'manutenção', regex: /\b(?:TODO|FIXME)\b/g, severity: 'informativo', confidence: 'alta', message: 'pendência textual exige contexto e prioridade, não é defeito automático' }
];

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.agents') continue;
    const fullPath = path.join(directory, entry.name);
    if (fullPath === selfPath || fullPath.startsWith(`${selfPath}${path.sep}`)) continue;
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) files.push(...walk(fullPath));
      continue;
    }
    if (!sourceExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    if (/(^|[\\/])\.env(?:\.|$)|(?:token|secret|credential|cookie)/i.test(fullPath)) continue;
    files.push(fullPath);
  }
  return files;
}

function filesFromArguments() {
  if (!requestedFiles.length) return walk(scope);
  return requestedFiles.map((file) => path.resolve(root, file)).filter((file) => {
    const relative = path.relative(root, file);
    return !relative.startsWith('..') && fs.existsSync(file) && sourceExtensions.has(path.extname(file).toLowerCase()) && !file.startsWith(selfPath);
  });
}

function lineOf(text, offset) {
  return text.slice(0, offset).split('\n').length;
}

const files = filesFromArguments();
const findings = [];
for (const file of files) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const rule of rules) {
    rule.regex.lastIndex = 0;
    let match;
    let firstMatch;
    let firstIndex = -1;
    let matchCount = 0;
    while ((match = rule.regex.exec(content)) !== null) {
      firstMatch ??= match[0];
      firstIndex = firstIndex < 0 ? match.index : firstIndex;
      matchCount += 1;
    }
    if (!matchCount) continue;
    findings.push({
      id: rule.id,
      category: rule.category,
      severity: rule.severity,
      confidence: rule.confidence,
      file: relative,
      line: lineOf(content, firstIndex),
      evidence: firstMatch.slice(0, 80),
      occurrences: matchCount,
      impact: rule.message,
      recommendation: 'revisar contrato, consumidor e contexto; confirmar antes de tratar como erro',
      blocksMergeOrRelease: false,
      possibleFalsePositive: rule.confidence !== 'alta'
    });
  }
}

const output = {
  scope: path.relative(root, scope).replaceAll('\\', '/') || '.',
  filesScanned: files.length,
  findings,
  truncated: false
};
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
