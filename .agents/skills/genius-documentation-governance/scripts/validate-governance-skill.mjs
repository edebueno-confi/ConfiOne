#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(process.cwd());
const skill = path.join(root, '.agents', 'skills', 'genius-documentation-governance');
const required = [
  'SKILL.md',
  'agents/openai.yaml',
  'references/source-precedence.md',
  'references/documentation-taxonomy.md',
  'references/drift-rules.md',
  'references/reconciliation-rules.md',
  'references/domain-map.md',
  'references/severity-model.md',
  'references/scheduled-runbook.md',
  'references/report-template.md',
  'assets/documentation-audit-template.md',
  'assets/documentation-registry-schema.json',
  'scripts/run-documentation-audit.mjs'
];
const errors = [];
for (const relative of required) if (!fs.existsSync(path.join(skill, relative))) errors.push(`ausente: ${relative}`);
const skillText = fs.existsSync(path.join(skill, 'SKILL.md')) ? fs.readFileSync(path.join(skill, 'SKILL.md'), 'utf8') : '';
if (!/^---\nname:\s*genius-documentation-governance\ndescription:\s*Audit/m.test(skillText)) errors.push('frontmatter inválido');
for (const mode of ['fast', 'changed', 'domain', 'full', 'apply', 'scheduled']) if (!skillText.includes(`$genius-documentation-governance ${mode}`)) errors.push(`modo ausente: ${mode}`);
for (const forbidden of ['.env', 'service role', 'git diff --check']) if (!skillText.includes(forbidden)) errors.push(`limite ausente: ${forbidden}`);
try {
  JSON.parse(fs.readFileSync(path.join(skill, 'agents', 'openai.yaml'), 'utf8').replace(/^interface:/m, ''));
} catch {
  // openai.yaml is YAML, so JSON parsing is intentionally not required here.
}
try {
  JSON.parse(fs.readFileSync(path.join(skill, 'assets', 'documentation-registry-schema.json'), 'utf8'));
} catch {
  errors.push('registry schema não é JSON válido');
}
const result = { valid: errors.length === 0, required, errors };
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = errors.length ? 1 : 0;
