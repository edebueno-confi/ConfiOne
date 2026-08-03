import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const mascot = await readFile(new URL('../../apps/web/src/components/GeniusMascot.tsx', import.meta.url), 'utf8');
const states = await readFile(new URL('../../apps/web/src/components/states.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../../apps/web/src/index.css', import.meta.url), 'utf8');

test('mascote incorpora o braço atualizado do SVG de GeniusGenie no loading', () => {
  assert.match(mascot, /loading: 'magic'/);
  assert.match(mascot, /M224 214c28-12 48-38/);
  assert.match(mascot, /M236 98C232 90 234 80 244 80/);
  assert.doesNotMatch(mascot, /genius-mascot__pose-arm--updated/);
  assert.doesNotMatch(mascot, /assets\/brand\/genius-mascot\.svg/);
});

test('estados do Gênio não usam moldura de card como cenário', () => {
  assert.match(states, /className="w-full p-6 sm:p-7"/);
  assert.match(css, /\.gso-genie-sync-content[\s\S]*border:\s*0;[\s\S]*background:\s*transparent/);
});
