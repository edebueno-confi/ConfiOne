#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import process from 'node:process';

const result = spawnSync(process.platform === 'win32' ? 'git.exe' : 'git', ['config', '--local', 'core.hooksPath', '.githooks'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  windowsHide: true,
});

if (result.status !== 0) {
  process.stderr.write(result.stderr || 'Nao foi possivel configurar core.hooksPath.\n');
  process.exit(result.status ?? 1);
}

process.stdout.write('Hooks Genius Code Quality configurados em .githooks.\n');
process.stdout.write('O pre-commit executara quality:staged automaticamente.\n');
