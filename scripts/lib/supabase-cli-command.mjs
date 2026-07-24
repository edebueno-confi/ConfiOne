import { existsSync } from 'node:fs';
import { join } from 'node:path';

function quoteForCmd(value) {
  const text = String(value);
  if (!/[\s"&|<>^]/.test(text)) {
    return text;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

export function resolveSupabaseCliCommand(
  args,
  {
    cwd = process.cwd(),
    platform = process.platform,
    nodePath = process.execPath,
    comSpec = process.env.ComSpec ?? 'cmd.exe',
  } = {},
) {
  const wrapper = join(cwd, 'node_modules', 'supabase', 'dist', 'supabase.js');
  if (existsSync(wrapper)) {
    return {
      command: nodePath,
      args: [wrapper, ...args],
    };
  }

  const legacyBinary = join(
    cwd,
    'node_modules',
    'supabase',
    'bin',
    platform === 'win32' ? 'supabase.exe' : 'supabase',
  );
  if (existsSync(legacyBinary)) {
    return {
      command: legacyBinary,
      args,
    };
  }

  if (platform === 'win32') {
    const invocation = ['npx', 'supabase', ...args].map(quoteForCmd).join(' ');
    return {
      command: comSpec,
      args: ['/d', '/s', '/c', invocation],
    };
  }

  return {
    command: 'npx',
    args: ['supabase', ...args],
  };
}
