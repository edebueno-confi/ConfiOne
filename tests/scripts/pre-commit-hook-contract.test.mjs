import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const hook = readFileSync(new URL('../../.githooks/pre-commit', import.meta.url), 'utf8');

function runGit(cwd, args, env = {}) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    windowsHide: true,
  });
  assert.equal(result.error, undefined, result.error?.message);
  return result;
}

function commit(cwd, message, env = {}) {
  return runGit(cwd, ['commit', '--allow-empty', '-m', message], env);
}

function qualityRuns(cwd) {
  const logPath = join(cwd, '.quality-log');
  return existsSync(logPath) ? readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean).length : 0;
}

test('pre-commit valida mudanças suportadas sem bypass e preserva falha real', () => {
  assert.match(hook, /--diff-filter=ACMR/);
  assert.doesNotMatch(hook, /--no-verify/);

  const cwd = mkdtempSync(join(tmpdir(), 'gso-pre-commit-'));
  try {
    const hookDir = join(cwd, '.githooks');
    const probe = `import { appendFileSync } from 'node:fs';
appendFileSync('.quality-log', 'run\\n');
if (process.env.GSO_HOOK_QUALITY_FAIL === '1') process.exit(9);\n`;
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ private: true, scripts: { 'quality:staged': 'node quality-probe.mjs' } }));
    writeFileSync(join(cwd, 'quality-probe.mjs'), probe);
    writeFileSync(join(cwd, 'tracked.txt'), 'initial\n');
    writeFileSync(join(cwd, '.gitignore'), '.quality-log\n');
    mkdirHook(hookDir, cwd);

    assert.equal(runGit(cwd, ['init', '--quiet']).status, 0);
    assert.equal(runGit(cwd, ['config', 'user.name', 'GSO Hook Test']).status, 0);
    assert.equal(runGit(cwd, ['config', 'user.email', 'gso-hook-test@example.invalid']).status, 0);
    assert.equal(runGit(cwd, ['config', 'core.hooksPath', '.githooks']).status, 0);
    assert.equal(runGit(cwd, ['add', '.']).status, 0);
    assert.equal(commit(cwd, 'initial').status, 0);
    assert.equal(qualityRuns(cwd), 1);
    writeFileSync(join(cwd, '.quality-log'), '');

    writeFileSync(join(cwd, 'tracked.txt'), 'changed\n');
    assert.equal(runGit(cwd, ['add', 'tracked.txt']).status, 0);
    assert.equal(commit(cwd, 'modified').status, 0);
    assert.equal(qualityRuns(cwd), 1);

    writeFileSync(join(cwd, 'new.md'), '# new\n');
    writeFileSync(join(cwd, 'SKILL.md'), '# skill\n');
    assert.equal(runGit(cwd, ['add', 'new.md', 'SKILL.md']).status, 0);
    assert.equal(commit(cwd, 'new markdown and skill').status, 0);
    assert.equal(qualityRuns(cwd), 2);

    rmSync(join(cwd, 'tracked.txt'));
    assert.equal(runGit(cwd, ['add', '-u']).status, 0);
    assert.equal(commit(cwd, 'deleted file').status, 0);
    assert.equal(qualityRuns(cwd), 2);

    writeFileSync(join(cwd, 'remove-me.txt'), 'remove me\n');
    assert.equal(runGit(cwd, ['add', 'remove-me.txt']).status, 0);
    assert.equal(commit(cwd, 'directory fixture').status, 0);
    rmSync(join(cwd, 'remove-me.txt'));
    assert.equal(runGit(cwd, ['add', '-u']).status, 0);
    assert.equal(commit(cwd, 'removed directory contents').status, 0);
    assert.equal(qualityRuns(cwd), 3);

    assert.equal(runGit(cwd, ['mv', 'new.md', 'renamed.md']).status, 0);
    assert.equal(commit(cwd, 'renamed file').status, 0);
    assert.equal(qualityRuns(cwd), 4);

    assert.equal(commit(cwd, 'no staged files').status, 0);
    assert.equal(qualityRuns(cwd), 4);

    writeFileSync(join(cwd, 'failure.txt'), 'failure\n');
    assert.equal(runGit(cwd, ['add', 'failure.txt']).status, 0);
    const failed = commit(cwd, 'quality failure', { GSO_HOOK_QUALITY_FAIL: '1' });
    assert.notEqual(failed.status, 0);
    assert.equal(qualityRuns(cwd), 5);
    assert.equal(commit(cwd, 'quality recovered').status, 0);
    assert.equal(qualityRuns(cwd), 6);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

function mkdirHook(hookDir, cwd) {
  mkdirSync(hookDir, { recursive: true });
  writeFileSync(join(hookDir, 'pre-commit'), hook);
  chmodSync(join(hookDir, 'pre-commit'), 0o755);
}
