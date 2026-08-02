#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(process.cwd());
const skill = path.join(root, '.agents', 'skills', 'genius-code-quality');
const required = [
  'SKILL.md',
  'references/quality-rules.md',
  'references/severity-model.md',
  'references/project-architecture.md',
  'references/report-template.md',
  'assets/code-quality-report-template.md',
  'scripts/run-quality-gate.mjs',
  'scripts/check-project-patterns.mjs'
];
const errors = [];
for (const relative of required) {
  if (!fs.existsSync(path.join(skill, relative))) errors.push(`ausente: ${relative}`);
}
const skillText = fs.existsSync(path.join(skill, 'SKILL.md')) ? fs.readFileSync(path.join(skill, 'SKILL.md'), 'utf8') : '';
if (!/^---\nname:\s*genius-code-quality\ndescription:\s*Use when/m.test(skillText)) errors.push('frontmatter inválido ou descrição sem gatilho Use when...');
for (const forbidden of ['git reset', 'git clean', 'git stash', 'supabase db reset', 'git checkout --']) {
  if (!skillText.includes(forbidden)) errors.push(`SKILL.md deve documentar proibição: ${forbidden}`);
}
for (const mode of ['fast', 'changed', 'module', 'full']) {
  if (!skillText.includes(`$genius-code-quality ${mode}`)) errors.push(`modo não documentado: ${mode}`);
}
const result = { valid: errors.length === 0, required, errors };
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = errors.length ? 1 : 0;
