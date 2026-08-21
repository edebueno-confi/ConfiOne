import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveSupabaseCliCommand } from './lib/supabase-cli-command.mjs';

export const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PGTAP_ROOT = resolve(REPOSITORY_ROOT, 'supabase', 'tests');

function isInside(parent, candidate) {
  const pathFromParent = relative(parent, candidate);
  return pathFromParent && !pathFromParent.startsWith(`..${sep}`) && pathFromParent !== '..';
}

export function resolvePgTapPaths(argumentsList, root = REPOSITORY_ROOT) {
  if (!argumentsList.length) {
    throw new Error('Uso: npm run supabase:test:file -- supabase/tests/<arquivo>.sql');
  }

  const testRoot = resolve(root, 'supabase', 'tests');
  return argumentsList.map((argument) => {
    const candidate = resolve(root, argument);
    if (!isInside(testRoot, candidate)) {
      throw new Error(`PGTAP_FILE_BLOCKED: o arquivo deve estar dentro de supabase/tests/: ${argument}`);
    }
    if (!candidate.toLowerCase().endsWith('.sql') || !existsSync(candidate) || !statSync(candidate).isFile()) {
      throw new Error(`PGTAP_FILE_INVALID: arquivo SQL inexistente ou inválido: ${argument}`);
    }
    return relative(root, candidate);
  });
}

export function buildPgTapCommand(paths, root = REPOSITORY_ROOT) {
  return resolveSupabaseCliCommand(['test', 'db', '--local', ...paths], { cwd: root });
}

export function runPgTapFile(argumentsList, root = REPOSITORY_ROOT) {
  const paths = resolvePgTapPaths(argumentsList, root);
  const { command, args } = buildPgTapCommand(paths, root);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    windowsHide: true,
  });

  if (result.error) throw result.error;
  return result.status ?? 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = runPgTapFile(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
