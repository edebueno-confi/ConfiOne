import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const scriptPath = join(process.cwd(), 'scripts', 'ci', 'check-commit-trailers.mjs');

function git(cwd, args, options = {}) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

function createRepo() {
  const cwd = mkdtempSync(join(tmpdir(), 'commit-trailer-policy-'));
  git(cwd, ['init', '-q']);
  git(cwd, ['config', 'user.name', 'QA Fixture']);
  git(cwd, ['config', 'user.email', 'qa-fixture@example.test']);
  writeFileSync(join(cwd, 'fixture.txt'), 'base\n');
  git(cwd, ['add', 'fixture.txt']);
  git(cwd, ['commit', '-qm', 'base']);
  mkdirSync(join(cwd, '.github'), { recursive: true });
  writeFileSync(join(cwd, '.github', 'commit-trailer-policy.json'), JSON.stringify({
    allowedCoAuthors: [],
    blockedEmails: ['our.first.fluke@gmail.com'],
    blockedUsernames: ['ourfirstfluke'],
  }));
  return cwd;
}

function commit(cwd, message, content) {
  writeFileSync(join(cwd, 'fixture.txt'), `${content}\n`);
  git(cwd, ['add', 'fixture.txt']);
  git(cwd, ['commit', '-q', '-m', message]);
  return git(cwd, ['rev-parse', 'HEAD']);
}

function run(cwd, args, env = {}) {
  try {
    return {
      status: 0,
      stdout: execFileSync(process.execPath, [scriptPath, ...args], {
        cwd,
        encoding: 'utf8',
        env: { ...process.env, ...env },
        stdio: ['pipe', 'pipe', 'pipe'],
      }),
    };
  } catch (error) {
    return {
      status: error.status,
      stdout: error.stdout?.toString() ?? '',
      stderr: error.stderr?.toString() ?? '',
    };
  }
}

test('aceita commit sem trailer e ignora commit histórico na base', () => {
  const cwd = createRepo();
  try {
    const base = git(cwd, ['rev-parse', 'HEAD']);
    const head = commit(cwd, 'commit normal', 'normal');
    const result = run(cwd, ['--base', base, '--head', head]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Commits analisados: 1/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('bloqueia coautor não allowlisted, e-mail bloqueado e variações de caixa', () => {
  const cwd = createRepo();
  try {
    const base = git(cwd, ['rev-parse', 'HEAD']);
    const head = commit(cwd, 'commit\n\nCo-aUtHoReD-bY: First Fluke <OUR.FIRST.FLUkE@gmail.com>', 'blocked');
    const result = run(cwd, ['--base', base, '--head', head]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, new RegExp(head.slice(0, 12)));
    assert.match(result.stdout, /coautor não autorizado|e-mail bloqueado/i);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('bloqueia múltiplos trailers e trailer malformado sem imprimir credenciais', () => {
  const cwd = createRepo();
  try {
    const base = git(cwd, ['rev-parse', 'HEAD']);
    const head = commit(cwd, 'commit\n\nCo-Authored-By: Ada Lovelace <ada@example.test>\nCo-Authored-By: First Fluke', 'multiple');
    const result = run(cwd, ['--base', base, '--head', head]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Ada Lovelace/);
    assert.match(result.stdout, /malformado|não autorizado/i);
    assert.doesNotMatch(result.stdout, /gho_|pat-|Bearer /i);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('analisa merge commit e mensagem multiline somente após o merge-base', () => {
  const cwd = createRepo();
  try {
    const base = git(cwd, ['rev-parse', 'HEAD']);
    writeFileSync(join(cwd, 'main.txt'), 'main\n');
    git(cwd, ['add', 'main.txt']);
    git(cwd, ['commit', '-qm', 'linha principal']);
    const main = git(cwd, ['rev-parse', 'HEAD']);
    git(cwd, ['switch', '-qc', 'feature', base]);
    writeFileSync(join(cwd, 'feature.txt'), 'feature\n');
    git(cwd, ['add', 'feature.txt']);
    git(cwd, ['commit', '-q', '-m', 'feature\n\nDetalhe multiline\n\nCo-Authored-By: Ada <ada@example.test>']);
    git(cwd, ['switch', '-q', 'master']);
    git(cwd, ['merge', '--no-ff', '-qm', 'merge feature', 'feature']);
    const head = git(cwd, ['rev-parse', 'HEAD']);
    const result = run(cwd, ['--base', base, '--head', head]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Commits analisados: 3/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('falha com base inválida e usa fallback origin/main somente quando disponível', () => {
  const cwd = createRepo();
  try {
    const result = run(cwd, ['--base', 'nao-existe', '--head', 'HEAD']);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /base|válid/i);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('aceita coautor explicitamente allowlisted por configuração', () => {
  const cwd = createRepo();
  try {
    writeFileSync(join(cwd, '.github-commit-trailer-policy.json'), JSON.stringify({
      allowedCoAuthors: [{ name: 'Ada Lovelace', email: 'ada@example.test' }],
      blockedEmails: [],
      blockedUsernames: [],
    }));
    const base = git(cwd, ['rev-parse', 'HEAD']);
    const head = commit(cwd, 'commit\n\nCo-Authored-By: Ada Lovelace <ada@example.test>', 'allowed');
    const result = run(cwd, ['--base', base, '--head', head, '--policy', '.github-commit-trailer-policy.json']);
    assert.equal(result.status, 0, result.stderr);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
