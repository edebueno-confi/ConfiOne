import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  createControlPlaneServer,
  parseQueueMarkdown,
  buildActivityTimeline,
  readSnapshot,
  REPOSITORY_ROOT,
} from '../../tools/dev-control/server.mjs';
import {
  createQueueCardModel,
  formatWorktreeStatus,
  groupQueueItems,
  normalizeQueueItems,
  UNRESOLVED_QUEUE_STATE,
} from '../../tools/dev-control/public/queue-state.js';

const readme = await readFile(new URL('../../handoffs/README.md', import.meta.url), 'utf8');

test('fila canônica expõe autorização, dependências e resumo estruturado', () => {
  const queue = parseQueueMarkdown(readme);
  const controlPlane = queue.find((item) => item.task_id === 'DEV-CONTROL-MVP');
  const r11 = queue.find((item) => item.task_id === 'R-11');
  const r14 = queue.find((item) => item.task_id === 'R-14');

  assert.ok(controlPlane);
  assert.equal(controlPlane.project, 'ConfiOne / Engineering');
  assert.equal(controlPlane.priority, 'P0');
  assert.equal(controlPlane.approval, 'APPROVED');
  assert.equal(controlPlane.dependencies, 'R-03');
  assert.ok(controlPlane.origin);
  assert.ok(controlPlane.summary);
  assert.ok(r11);
  assert.equal(r11?.dependencies, 'DEV-CONTROL-MVP');
  assert.equal(r14?.dependencies, 'R-11');
});

test('snapshot do control plane lê o checkout real e os handoffs correntes', async () => {
  const snapshot = await readSnapshot();
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPOSITORY_ROOT, encoding: 'utf8' }).trim();

  assert.equal(snapshot.project.name, 'ConfiOne');
  assert.equal(snapshot.project.head, head);
  assert.equal(typeof snapshot.current.status.task, 'string');
  assert.ok(snapshot.current.status.task.length > 0);
  if (snapshot.current.status.state === 'IDLE') {
    assert.equal(snapshot.current.status.task, 'NONE');
  } else {
    assert.ok(snapshot.queue.some((item) => item.task_id === snapshot.current.status.task));
  }
  assert.ok(['IDLE', 'READY_FOR_IMPLEMENTATION', 'IMPLEMENTING', 'VALIDATING', 'READY_FOR_REVIEW', 'REVIEWING', 'CHANGES_REQUESTED', 'FIXING', 'APPROVED', 'FINALIZING_LOCAL', 'COMPLETED', 'BLOCKED', 'DONE'].includes(snapshot.current.status.state));
  assert.ok(['Codex', 'Claude', 'Ede'].includes(snapshot.current.status.owner));
  assert.ok(snapshot.queue.some((item) => item.task_id === 'R-03' && item.state === 'DONE'));
  const r03 = snapshot.archives.find((item) => item.archive === 'R03-SUPPORT-ERROR-FEEDBACK-2026-08-20');
  assert.ok(r03);
  assert.match(r03.título, /feedback/i);
  assert.equal(r03.state, 'APPROVED');
  const r01 = snapshot.archives.find((item) => item.archive === 'R01-ACCESS-DENIAL-2026-08-20');
  assert.equal(r01?.review.result, 'APPROVED');
  assert.equal(snapshot.current.gates.source, 'handoffs/current/IMPLEMENTATION.md — declarado pelo Codex');
  assert.ok(Array.isArray(snapshot.current.gates.results));
  assert.equal(snapshot.project.gitAvailable, true);
  assert.ok(Array.isArray(snapshot.decisions));
  assert.ok(snapshot.activity.some((event) => event.source === 'Git'));
  assert.ok(snapshot.activity.some((event) => event.source === 'Handoff corrente'));
  const activeCount = snapshot.queue.filter((item) => item.state === 'ACTIVE').length;
  assert.ok(activeCount <= 1);
  if (snapshot.current.status.state !== 'IDLE') assert.equal(activeCount, 1);
});

test('Kanban preserva item com estado ausente em coluna explícita', () => {
  const normalized = normalizeQueueItems([
    { task_id: 'SEM-ESTADO', state: '', approval: 'APPROVED' },
  ], 'OUTRA-TASK', 'Claude');

  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].state, UNRESOLVED_QUEUE_STATE);
  assert.ok(normalized.some((item) => item.state === UNRESOLVED_QUEUE_STATE));
});

test('Kanban mantém BLOCKED e absorve estados futuros sem perder a contagem', () => {
  const columns = [
    ['ACTIVE', 'Codex'],
    ['BLOCKED', 'Bloqueado'],
    ['UNRESOLVED', 'Estado indisponível'],
  ];
  const normalized = normalizeQueueItems([
    { task_id: 'ITEM-ATIVO', state: 'ACTIVE' },
    { task_id: 'ITEM-BLOQUEADO', state: 'BLOCKED' },
    { task_id: 'ITEM-FUTURO', state: 'FUTURE_STATE' },
  ], 'ITEM-ATIVO', 'Codex');
  const grouped = groupQueueItems(normalized, columns);
  const renderedCount = Object.values(grouped).reduce((total, items) => total + items.length, 0);

  assert.equal(grouped.BLOCKED[0].task_id, 'ITEM-BLOQUEADO');
  assert.equal(grouped.UNRESOLVED[0].task_id, 'ITEM-FUTURO');
  assert.equal(renderedCount, normalized.length);
});

test('cards preservam o estado cru, a origem e o worktree indisponível', () => {
  const card = createQueueCardModel({
    task_id: 'ITEM-FUTURO',
    state: 'FUTURE_STATE',
    origin: 'Owner queue 2026-08-20',
  });
  const unavailable = formatWorktreeStatus(false, null);
  const clean = formatWorktreeStatus(true, 0);

  assert.equal(card.state, 'FUTURE_STATE');
  assert.equal(card.origin, 'Owner queue 2026-08-20');
  assert.deepEqual(unavailable, { value: 'Indisponível', helper: 'estado do Git desconhecido' });
  assert.deepEqual(clean, { value: '0', helper: 'limpo' });
});

test('timeline combina commits, handoffs correntes, reviews e arquivos arquivados', () => {
  const timeline = buildActivityTimeline(
    [{ subject: 'commit real', sha: 'abc123', date: '2026-08-18T12:00:00-03:00' }],
    [{
      id: 'ARCHIVED-TASK',
      state: 'APPROVED',
      current_sha: 'def456',
      last_review: '2026-08-19 — APPROVED',
      review: { result: 'APPROVED' },
    }],
    {
      status: {
        task: 'CURRENT-TASK',
        state: 'READY_FOR_REVIEW',
        current_sha: 'UNCOMMITTED_WORKTREE',
        updated_at: '2026-08-20',
        last_review: '2026-08-20 — REQUEST_CHANGES',
      },
      review: { result: 'REQUEST_CHANGES' },
    },
  );

  assert.deepEqual(new Set(timeline.map((event) => event.source)), new Set([
    'Git',
    'Review arquivado',
    'Handoff arquivado',
    'Handoff corrente',
    'Review corrente',
  ]));
  assert.equal(timeline[0].subject, 'CURRENT-TASK: READY_FOR_REVIEW');
  assert.equal(timeline.some((event) => event.subject === 'CURRENT-TASK: REQUEST_CHANGES'), true);
  assert.equal(timeline.some((event) => event.subject === 'ARCHIVED-TASK: APPROVED'), true);
});

test('servidor é read-only e expõe somente snapshot GET', async () => {
  const server = createControlPlaneServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const snapshotResponse = await fetch(`${baseUrl}/api/snapshot`);
    assert.equal(snapshotResponse.status, 200);
    assert.equal(snapshotResponse.headers.get('content-type'), 'application/json; charset=utf-8');

    const writeResponse = await fetch(`${baseUrl}/api/snapshot`, { method: 'POST', body: '{}' });
    assert.equal(writeResponse.status, 405);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('control plane permanece isolado do produto e não contém escrita de arquivo', async () => {
  const [serverSource, pageSource, appSource] = await Promise.all([
    readFile(new URL('../../tools/dev-control/server.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../../tools/dev-control/public/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../../tools/dev-control/public/app.js', import.meta.url), 'utf8'),
  ]);

  assert.doesNotMatch(serverSource, /writeFile|appendFile|rmSync|unlink/);
  assert.doesNotMatch(pageSource, /apps\/web|release-surface|supabase/i);
  assert.doesNotMatch(appSource, /555\/555|data-tone/);
  assert.match(appSource, /UNRESOLVED/);
});
