import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const DEFAULT_ALLOWED_ROOT_FILES = new Set([
  '.env.example',
  '.env.local',
  '.env.local.qa',
  '.env.local.qa.example',
  '.gitattributes',
  '.gitignore',
  'AGENTS.md',
  'CLAUDE.md',
  'COMO-TESTAR.md',
  'CRIAR-USUARIOS-DE-TESTE.bat',
  'DESIGN.md',
  'DIAGNOSTICO-E-PLANO-DE-SIMPLIFICACAO.md',
  'INICIAR-GENIUS.bat',
  'LEIA-PRIMEIRO.md',
  'package-lock.json',
  'package.json',
  'PRODUCT.md',
  'README.md',
  'RECONSTRUCAO-DO-PRODUTO.md',
  'vercel.json',
  '.git',
]);

export const DEFAULT_ALLOWED_ROOT_DIRECTORIES = new Set([
  '.agents',
  '.codex',
  '.superdesign',
  '.git',
  '.github',
  '.playwright-cli',
  '.skills',
  '.superdesign',
  '.tmp',
  '.vercel',
  'apps',
  'docs',
  'node_modules',
  'output',
  'packages',
  'raw_knowledge',
  'Recreação do mascote Genius-handoff',
  'scripts',
  'supabase',
  'tests',
]);

function toSet(values) {
  return new Set(values ?? []);
}

export async function scanRootArtifacts(rootDir, options = {}) {
  const entries = (await readdir(rootDir, { withFileTypes: true }))
    .map((entry) => ({
      name: entry.name,
      kind: entry.isDirectory() ? 'directory' : 'file',
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  const allowedFiles = new Set([
    ...DEFAULT_ALLOWED_ROOT_FILES,
    ...toSet(options.allowedFiles),
  ]);
  const allowedDirectories = new Set([
    ...DEFAULT_ALLOWED_ROOT_DIRECTORIES,
    ...toSet(options.allowedDirectories),
  ]);

  const violations = entries
    .filter(({ name, kind }) =>
      kind === 'file' ? !allowedFiles.has(name) : !allowedDirectories.has(name),
    )
    .map(({ name, kind }) => ({
      name,
      kind,
      reason:
        kind === 'file'
          ? 'arquivo de raiz sem classificação na allowlist'
          : 'diretório de raiz sem classificação na allowlist',
    }));

  return {
    rootDir,
    entriesBefore: entries.map(({ name }) => name),
    entriesAfter: entries.map(({ name }) => name),
    violations,
  };
}

export function formatRootArtifactReport(result) {
  const header = 'Higiene da raiz: ' + result.rootDir;
  if (result.violations.length === 0) {
    return header + '\nOK: nenhuma entrada fora da allowlist.';
  }

  const lines = result.violations.map(
    ({ name, kind, reason }) => '- [' + kind + '] ' + name + ': ' + reason,
  );
  return [
    header,
    'VIOLAÇÕES: ' + result.violations.length,
    ...lines,
    '',
    'Nenhum arquivo foi alterado. Faça a triagem antes de mover ou remover qualquer entrada.',
  ].join('\n');
}

async function main() {
  const result = await scanRootArtifacts(process.cwd());
  console.log(formatRootArtifactReport(result));
  process.exitCode = result.violations.length > 0 ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
