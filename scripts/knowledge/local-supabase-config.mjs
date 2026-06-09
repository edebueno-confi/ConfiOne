import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function required(value, name) {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    throw new Error(`${name} is required for local Supabase access.`);
  }
  return normalized;
}

export function resolveLocalSupabaseConfig({ url, anonKey, email, password }) {
  const normalizedUrl = required(url, 'Supabase URL');
  const parsedUrl = new URL(normalizedUrl);
  const isLoopback =
    parsedUrl.protocol === 'http:' &&
    (parsedUrl.hostname === '127.0.0.1' || parsedUrl.hostname === 'localhost');

  if (!isLoopback) {
    throw new Error('Only local Supabase loopback URLs are allowed.');
  }

  return {
    url: parsedUrl.origin,
    anonKey: required(anonKey, 'Supabase anon key'),
    email: required(email, 'Knowledge admin email'),
    password: required(password, 'Knowledge admin password'),
  };
}

function localSupabaseCommand(args) {
  if (process.platform === 'win32') {
    const binary = join(process.cwd(), 'node_modules', 'supabase', 'bin', 'supabase.exe');
    if (existsSync(binary)) {
      return { command: binary, args };
    }
  }

  return { command: 'npx', args: ['supabase', ...args] };
}

function readSupabaseStatusEnv() {
  const { command, args } = localSupabaseCommand(['status', '-o', 'env']);
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    windowsHide: true,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      result.stderr?.trim() || 'Unable to read local Supabase status.',
    );
  }

  const values = new Map();
  for (const line of result.stdout.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
    if (match) {
      values.set(match[1], match[2]);
    }
  }
  return values;
}

export function readLocalSupabaseConfig(env = process.env) {
  const status = readSupabaseStatusEnv();

  return resolveLocalSupabaseConfig({
    url: env.SUPABASE_API_URL ?? env.VITE_SUPABASE_URL ?? status.get('API_URL'),
    anonKey:
      env.SUPABASE_ANON_KEY ??
      env.VITE_SUPABASE_ANON_KEY ??
      status.get('ANON_KEY'),
    email: env.KNOWLEDGE_ADMIN_EMAIL,
    password: env.KNOWLEDGE_ADMIN_PASSWORD,
  });
}
