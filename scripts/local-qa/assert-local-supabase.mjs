import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolveSupabaseCliCommand } from '../lib/supabase-cli-command.mjs';

export function loadQaEnv(path = '.env.local.qa') {
  const values = {};
  try {
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) values[match[1]] = match[2].replace(/^"|"$/g, '');
    }
  } catch {
    return values;
  }
  return values;
}

export function assertLocalSupabaseEnvironment(env = process.env, options = {}) {
  const apiUrl = env.SUPABASE_URL ?? env.API_URL ?? '';
  const projectRef = env.SUPABASE_PROJECT_REF ?? env.PROJECT_REF ?? '';
  if (apiUrl && !/^https?:\/\/(127\.0\.0\.1|localhost):\d+(?:\/|$)/.test(apiUrl)) {
    throw new Error('LOCAL_QA_BLOCKED: SUPABASE_URL/API_URL não aponta para localhost.');
  }
  if (projectRef && projectRef !== 'genius-support-os') {
    throw new Error('LOCAL_QA_BLOCKED: project ref remoto detectado.');
  }
  if (options.status) {
    const statusApi = options.status.API_URL ?? '';
    const statusDb = options.status.DB_URL ?? '';
    if (!/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(statusApi) || !/@(127\.0\.0\.1|localhost):54322\//.test(statusDb)) {
      throw new Error('LOCAL_QA_BLOCKED: Supabase CLI não está conectado ao banco local esperado.');
    }
  }
  return true;
}

export function readLocalSupabaseStatus(env = process.env) {
  const resolved = resolveSupabaseCliCommand(['status', '-o', 'env']);
  const result = spawnSync(resolved.command, resolved.args, { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error('Supabase local não está iniciado.');
  const status = {};
  for (const line of result.stdout.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
    if (match) status[match[1]] = match[2];
  }
  assertLocalSupabaseEnvironment(env, { status });
  return status;
}

export function runLocalCommand(args, options = {}) {
  const resolved = resolveSupabaseCliCommand(args);
  const result = spawnSync(resolved.command, resolved.args, {
    cwd: process.cwd(), encoding: 'utf8', windowsHide: true, ...options,
  });
  if (result.status !== 0) throw new Error([result.stderr, result.stdout].filter(Boolean).join('\n'));
  return result.stdout?.trim() ?? '';
}
