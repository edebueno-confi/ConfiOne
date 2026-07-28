import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const packageDir = resolve(process.argv[2] ?? 'output/review-packages/mvp-ux-02-2-genius-hd-final-7a801ea');
const failures = [];
const files = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else files.push(relative(packageDir, absolute).replaceAll('\\', '/'));
  }
}

function hash(absolute) {
  return createHash('sha256').update(readFileSync(absolute)).digest('hex');
}

function pngDimensions(absolute) {
  const buffer = readFileSync(absolute);
  assert.deepEqual([...buffer.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

walk(packageDir);
const rel = (path) => join(packageDir, path);
const index = readFileSync(rel('index.html'), 'utf8');
const manifest = JSON.parse(readFileSync(rel('manifest.json'), 'utf8'));
assert.ok(Array.isArray(manifest.files), 'manifest.files deve ser uma lista');

for (const path of files) {
  if (/^[A-Za-z]:[\\/]|^\\\\|https?:\/\//.test(path)) failures.push(`caminho nao relativo: ${path}`);
  const content = readFileSync(rel(path));
  const text = content.toString('utf8');
  if (/sbp_[A-Za-z0-9]+|service_role|SUPABASE_ACCESS_TOKEN|eyJ[A-Za-z0-9_-]{20,}/i.test(text)) failures.push(`possivel segredo: ${path}`);
  if (/\.(json|txt|storage|state)$/i.test(path) && /cookie|localstorage|sessionstorage|storageState/i.test(path)) failures.push(`estado de sessao proibido: ${path}`);
}

for (const target of [...index.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map((match) => match[1])) {
  if (target.startsWith('http') || /^[A-Za-z]:[\\/]/.test(target) || target.startsWith('/')) failures.push(`link absoluto/externo no index: ${target}`);
  else if (!statSync(rel(target), { throwIfNoEntry: false })) failures.push(`link quebrado no index: ${target}`);
}

const pngs = files.filter((path) => extname(path).toLowerCase() === '.png');
const pngHashes = new Map();
for (const path of pngs) {
  const absolute = rel(path);
  const dimensions = pngDimensions(absolute);
  const digest = hash(absolute);
  if (pngHashes.has(digest)) failures.push(`binario PNG duplicado: ${path} e ${pngHashes.get(digest)}`);
  pngHashes.set(digest, path);
  const record = manifest.files.find((item) => item.path === path);
  if (!record) failures.push(`PNG ausente do manifesto: ${path}`);
  else {
    if (record.width !== dimensions.width || record.height !== dimensions.height) failures.push(`dimensao divergente: ${path}`);
    if (record.sha256 !== digest) failures.push(`hash divergente: ${path}`);
    if (!record.viewport || !record.state || !record.profile) failures.push(`metadados incompletos: ${path}`);
  }
}

const validation = {
  package: packageDir.split(/[\\/]/).pop(),
  files: files.length,
  screenshots: pngs.length,
  duplicatePngHashes: pngs.length - pngHashes.size,
  failures,
  valid: failures.length === 0,
  validatedAt: new Date().toISOString(),
};
writeFileSync(rel('reports/validation-report.json'), JSON.stringify(validation, null, 2));
writeFileSync(rel('reports/EVIDENCE_INTEGRITY_REPORT.md'), `# Evidência e integridade do pacote\n\n- Arquivos validados: ${files.length}.\n- Screenshots PNG validadas: ${pngs.length}.\n- Dimensões lidas do binário PNG: sim.\n- Hashes SHA-256 conferidos contra o manifesto: sim.\n- PNGs duplicadas: ${validation.duplicatePngHashes}.\n- Links locais do index conferidos: sim.\n- Caminhos absolutos/externos, segredos, cookies e estados de sessão: ${failures.length ? 'falha encontrada' : 'não encontrados'}.\n- Resultado: **${validation.valid ? 'APROVADO' : 'REPROVADO'}**.\n\n${failures.length ? failures.map((failure) => `- ${failure}`).join('\n') : 'Nenhuma falha de integridade foi encontrada.'}\n`);
const manifestByPath = new Map(manifest.files.map((item) => [item.path, item]));
for (const path of files) {
  if (path === 'manifest.json') continue;
  const item = manifestByPath.get(path) ?? { name: path.split('/').pop(), path, type: 'application/octet-stream', viewport: null, state: 'package', profile: 'reviewer', description: 'Artefato de revisão navegável.', commit: 'unknown', generatedAt: validation.validatedAt.slice(0, 10) };
  item.size = statSync(rel(path)).size;
  item.sha256 = hash(rel(path));
  manifestByPath.set(path, item);
}
manifest.files = [...manifestByPath.values()];
writeFileSync(rel('manifest.json'), JSON.stringify(manifest, null, 2));
if (failures.length) {
  console.error(JSON.stringify(validation, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(validation, null, 2));
