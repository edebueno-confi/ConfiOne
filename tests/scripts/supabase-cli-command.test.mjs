import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveSupabaseCliCommand } from '../../scripts/lib/supabase-cli-command.mjs';

test('uses the installed Supabase JavaScript wrapper', () => {
  const result = resolveSupabaseCliCommand(['status', '-o', 'env']);

  assert.equal(result.command, process.execPath);
  assert.match(result.args[0], /node_modules[\\/]supabase[\\/]dist[\\/]supabase\.js$/);
  assert.deepEqual(result.args.slice(1), ['status', '-o', 'env']);
});
