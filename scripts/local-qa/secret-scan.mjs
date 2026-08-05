import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter((file) => file !== 'scripts/local-qa/secret-scan.mjs');
const suspicious = /(Admin123!|Local-QA-[A-Za-z0-9-]+!|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}|sb_(?:secret|publishable)_[A-Za-z0-9_-]{12,}|Bearer\s+[A-Za-z0-9._-]{20,})/i;
const matches = [];
for (const file of files) {
  if (/^(\.env|output\/|node_modules\/)/i.test(file)) continue;
  if (!existsSync(file)) continue;
  const contents = readFileSync(file, 'utf8');
  if (suspicious.test(contents)) matches.push(file);
}
if (matches.length) throw new Error(`LOCAL_QA_SECRET_SCAN_FAILED: ${matches.join(', ')}`);
console.log(JSON.stringify({ tracked_files_scanned: files.length, matches: 0, secrets: false }));
