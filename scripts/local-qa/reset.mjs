import { spawnSync } from 'node:child_process';
import { assertLocalSupabaseEnvironment, loadQaEnv, runLocalCommand } from './assert-local-supabase.mjs';

const qa = loadQaEnv();
assertLocalSupabaseEnvironment({ ...process.env, ...qa });

if (process.env.ALLOW_LOCAL_DB_RESET !== 'true') {
  throw new Error('LOCAL_DB_RESET_BLOCKED: este comando destrói o banco local. Use ALLOW_LOCAL_DB_RESET=true somente em uma operação deliberada.');
}

try {
  runLocalCommand(['start'], { timeout: 180000, stdio: ['ignore', 'pipe', 'pipe'] });
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const childOptions = { cwd: process.cwd(), env: { ...process.env, ...qa }, encoding: 'utf8', windowsHide: true, timeout: 900000, shell: process.platform === 'win32' };
  const result = spawnSync(npm, ['run', 'supabase:db:reset'], childOptions);
  if (result.status !== 0) throw new Error([result.stderr, result.stdout].filter(Boolean).join('\n'));
  const hydrate = spawnSync(npm, ['run', 'local:qa:hydrate'], childOptions);
  if (hydrate.status !== 0) throw new Error([hydrate.stderr, hydrate.stdout].filter(Boolean).join('\n'));
  const verify = spawnSync(npm, ['run', 'local:qa:verify'], childOptions);
  if (verify.status !== 0) throw new Error([verify.stderr, verify.stdout].filter(Boolean).join('\n'));
  console.log('LOCAL_QA_RESET_OK');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
