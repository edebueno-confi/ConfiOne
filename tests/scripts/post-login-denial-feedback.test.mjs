import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  buildPostLoginNavigation,
} from '../../apps/web/src/features/auth/post-login-navigation.ts';

const loginSource = fs.readFileSync('apps/web/src/features/login/LoginPage.tsx', 'utf8');

test('builds the correct navigation for denial, success and missing destination', () => {
  assert.deepEqual(
    buildPostLoginNavigation('/inicio', 'missing-authorized-workspace'),
    {
      destination: '/inicio',
      state: {
        fromAccessDenied: true,
        reason: 'missing-authorized-workspace',
      },
    },
  );
  assert.deepEqual(
    buildPostLoginNavigation('/inicio', null),
    { destination: '/inicio', state: undefined },
  );
  assert.deepEqual(
    buildPostLoginNavigation(null, 'inactive-profile'),
    { destination: '/access-denied', state: { reason: 'inactive-profile' } },
  );
});

test('LoginPage forwards denialReason on fallback and keeps the denied destination branch', () => {
  assert.match(loginSource, /reason: resolution\.denialReason/);
  assert.match(loginSource, /buildPostLoginNavigation\(/);
  assert.match(loginSource, /phase === 'denied'/);
  assert.match(loginSource, /buildPostLoginNavigation\(null, redirectResolver\.reason\)/);
});
