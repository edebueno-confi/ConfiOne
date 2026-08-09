import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const start = await readFile(new URL('../../supabase/functions/hubspot-orchestrator-start/index.ts', import.meta.url), 'utf8');
const dispatcher = await readFile(new URL('../../supabase/functions/hubspot-orchestrator-dispatcher/index.ts', import.meta.url), 'utf8');

test('start manual despacha com a identidade já autorizada, sem depender do segredo do scheduler', () => {
  assert.match(start, /EdgeRuntime\.waitUntil/);
  assert.match(start, /hubspot-orchestrator-dispatcher/);
  assert.match(start, /Authorization: req\.headers\.get\('authorization'\)/);
  assert.match(dispatcher, /const requester\s*=\s*await authorizeCsRunner\(req,\s*client\);/);
  assert.match(dispatcher, /authorization\s*=\s*requester === 'scheduler' \? null : req\.headers\.get\('authorization'\)/);
  assert.match(dispatcher, /\{ Authorization: authorization \}/);
});
