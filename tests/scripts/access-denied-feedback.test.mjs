import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const accessDeniedPage = await readFile(
  new URL('../../apps/web/src/features/auth/AccessDeniedPage.tsx', import.meta.url),
  'utf8',
);
const homePage = await readFile(
  new URL('../../apps/web/src/features/home/HomePage.tsx', import.meta.url),
  'utf8',
);

test('negação de acesso entrega estado e o /inicio renderiza feedback visível', () => {
  assert.match(accessDeniedPage, /fromAccessDenied:\s*true/);
  assert.match(accessDeniedPage, /reason:/);
  assert.match(homePage, /useLocation/);
  assert.match(homePage, /fromAccessDenied/);
  assert.match(homePage, /describeAccessDeniedNotice/);
  assert.match(homePage, /<MinimalNotice tone="warning">/);
  assert.match(homePage, /Você foi direcionado para o seu espaço/);
});
