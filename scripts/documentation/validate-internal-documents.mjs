import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const whitelistPath = resolve(repoRoot, 'docs/internal-documents.whitelist.json');
const allowedStatuses = new Set(['draft', 'published', 'archived', 'blocked']);
const allowedSensitivities = new Set(['internal', 'restricted', 'public_internal', 'blocked']);
const allowedSurfaces = new Set(['product-docs', 'build-journal']);

const sensitivePatterns = [
  {
    id: 'jwt',
    severity: 'blocked',
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  },
  {
    id: 'authorization-header',
    severity: 'blocked',
    pattern: /\bauthorization\s*[:=]\s*(bearer|basic)\s+[A-Za-z0-9._~+/=-]{12,}/gi,
  },
  {
    id: 'refresh-token-assignment',
    severity: 'blocked',
    pattern: /\b(refresh[_-]?token)\b\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{16,}/gi,
  },
  {
    id: 'supabase-db-url-assignment',
    severity: 'blocked',
    pattern: /\bSUPABASE_DB_URL\b\s*[:=]\s*["']?[^"'\s]+/g,
  },
  {
    id: 'signed-url',
    severity: 'blocked',
    pattern: /\bhttps?:\/\/[^\s)]+(?:X-Amz-Signature|X-Amz-Credential|token=|signature=|signed)[^\s)]*/gi,
  },
  {
    id: 'cookie-header',
    severity: 'blocked',
    pattern: /\bcookie\s*:\s*[^`\n]{12,}/gi,
  },
  {
    id: 'secret-assignment',
    severity: 'blocked',
    pattern: /\b[A-Z0-9_]*(SECRET|TOKEN|PRIVATE_KEY|API_KEY|SERVICE_ROLE)[A-Z0-9_]*\b\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{12,}/g,
  },
  {
    id: 'service-role-mention',
    severity: 'warning',
    pattern: /\bservice[_-]?role\b/gi,
  },
  {
    id: 'token-mention',
    severity: 'warning',
    pattern: /\b(token|tokens|jwt|refresh token|secret|secrets)\b/gi,
  },
  {
    id: 'payload-block',
    severity: 'warning',
    pattern: /```(?:json|http)?\s*[\s\S]{0,2000}?(payload|headers|authorization|cookie|access_token|refresh_token)[\s\S]{0,2000}?```/gi,
  },
  {
    id: 'raw-json-payload',
    severity: 'warning',
    pattern: /\{[\s\S]{0,1200}("(access_token|refresh_token|authorization|cookie|password|secret|token)"\s*:)[\s\S]{0,1200}\}/gi,
  },
];

function fail(message) {
  console.error(`\n[internal-docs] ${message}`);
  process.exit(1);
}

function parseWhitelist() {
  if (!existsSync(whitelistPath)) {
    fail(`Whitelist não encontrada: ${relative(repoRoot, whitelistPath)}`);
  }

  try {
    const raw = readFileSync(whitelistPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      fail('Whitelist precisa ser um array JSON.');
    }
    return parsed;
  } catch (error) {
    fail(`Whitelist inválida: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function isInsideRepo(path) {
  const relativePath = relative(repoRoot, path);
  return Boolean(relativePath) && !relativePath.startsWith('..') && !isAbsolute(relativePath);
}

function validateEntryShape(entry, index) {
  const errors = [];
  const required = [
    'slug',
    'source_path',
    'title',
    'category',
    'status',
    'sensitivity',
    'owner',
    'surfaces',
    'allow_inline_reader',
    'description',
  ];

  for (const field of required) {
    if (!(field in entry)) {
      errors.push(`campo obrigatório ausente: ${field}`);
    }
  }

  for (const field of ['slug', 'source_path', 'title', 'category', 'status', 'sensitivity', 'owner', 'description']) {
    if (field in entry && (typeof entry[field] !== 'string' || entry[field].trim().length === 0)) {
      errors.push(`campo ${field} deve ser string não vazia`);
    }
  }

  if ('slug' in entry && typeof entry.slug === 'string' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug)) {
    errors.push('slug deve usar kebab-case ASCII');
  }

  if ('status' in entry && !allowedStatuses.has(entry.status)) {
    errors.push(`status inválido: ${entry.status}`);
  }

  if ('sensitivity' in entry && !allowedSensitivities.has(entry.sensitivity)) {
    errors.push(`sensitivity inválida: ${entry.sensitivity}`);
  }

  if (!Array.isArray(entry.surfaces) || entry.surfaces.length === 0) {
    errors.push('surfaces deve ser array não vazio');
  } else {
    for (const surface of entry.surfaces) {
      if (!allowedSurfaces.has(surface)) {
        errors.push(`surface inválida: ${surface}`);
      }
    }
  }

  if (typeof entry.allow_inline_reader !== 'boolean') {
    errors.push('allow_inline_reader deve ser boolean');
  }

  if (entry.source_path && (isAbsolute(entry.source_path) || entry.source_path.includes('..') || entry.source_path.includes('\\'))) {
    errors.push('source_path deve ser relativo, sem .. e com /');
  }

  return errors.map((error) => `entrada #${index + 1}: ${error}`);
}

function findSensitiveMatches(content) {
  const findings = [];

  for (const check of sensitivePatterns) {
    const matches = [...content.matchAll(check.pattern)];
    if (matches.length === 0) {
      continue;
    }

    findings.push({
      id: check.id,
      severity: check.severity,
      count: matches.length,
    });
  }

  return findings;
}

function validateDocument(entry) {
  const sourcePath = entry.source_path;
  const absolutePath = resolve(repoRoot, sourcePath);
  const errors = [];
  const warnings = [];

  if (!isInsideRepo(absolutePath)) {
    errors.push('source_path resolve fora do repositório');
    return { ...entry, errors, warnings, hash: null, bytes: null };
  }

  if (!existsSync(absolutePath)) {
    errors.push('arquivo não encontrado');
    return { ...entry, errors, warnings, hash: null, bytes: null };
  }

  const stats = lstatSync(absolutePath);
  if (stats.isSymbolicLink()) {
    errors.push('source_path não pode ser symlink');
    return { ...entry, errors, warnings, hash: null, bytes: null };
  }

  const realPath = realpathSync(absolutePath);
  if (!isInsideRepo(realPath)) {
    errors.push('realpath resolve fora do repositório');
    return { ...entry, errors, warnings, hash: null, bytes: null };
  }

  if (extname(sourcePath).toLowerCase() !== '.md') {
    errors.push('arquivo precisa ter extensão .md');
  }

  const content = readFileSync(absolutePath, 'utf8');
  const hash = createHash('sha256').update(content).digest('hex');
  const bytes = Buffer.byteLength(content, 'utf8');
  const findings = findSensitiveMatches(content);

  for (const finding of findings) {
    const message = `${finding.id} (${finding.count})`;
    if (finding.severity === 'blocked') {
      errors.push(message);
    } else {
      warnings.push(message);
    }
  }

  return { ...entry, errors, warnings, hash, bytes };
}

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) {
    return '-';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

function printDocument(result) {
  const state = result.errors.length > 0 ? 'BLOQUEADO' : result.warnings.length > 0 ? 'ALERTA' : 'VALIDO';
  console.log(`\n[${state}] ${result.slug}`);
  console.log(`  source: ${result.source_path}`);
  console.log(`  title: ${result.title}`);
  console.log(`  category: ${result.category}`);
  console.log(`  sensitivity: ${result.sensitivity}`);
  console.log(`  surfaces: ${result.surfaces.join(', ')}`);
  console.log(`  size: ${formatBytes(result.bytes)}`);
  console.log(`  sha256: ${result.hash ?? '-'}`);

  if (result.warnings.length > 0) {
    console.log(`  alerts: ${result.warnings.join('; ')}`);
  }

  if (result.errors.length > 0) {
    console.log(`  blocked: ${result.errors.join('; ')}`);
  }
}

const whitelist = parseWhitelist();
const shapeErrors = [];
const slugs = new Map();
const sourcePaths = new Map();

whitelist.forEach((entry, index) => {
  shapeErrors.push(...validateEntryShape(entry, index));

  if (typeof entry.slug === 'string') {
    const previous = slugs.get(entry.slug);
    if (previous !== undefined) {
      shapeErrors.push(`slug duplicado: ${entry.slug} nas entradas #${previous + 1} e #${index + 1}`);
    }
    slugs.set(entry.slug, index);
  }

  if (typeof entry.source_path === 'string') {
    const normalizedSourcePath = entry.source_path.split(sep).join('/');
    const previous = sourcePaths.get(normalizedSourcePath);
    if (previous !== undefined) {
      shapeErrors.push(`source_path duplicado: ${entry.source_path} nas entradas #${previous + 1} e #${index + 1}`);
    }
    sourcePaths.set(normalizedSourcePath, index);
  }
});

if (shapeErrors.length > 0) {
  console.error('\n[internal-docs] Whitelist inválida:');
  for (const error of shapeErrors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

const results = whitelist.map(validateDocument);
const valid = results.filter((result) => result.errors.length === 0 && result.warnings.length === 0);
const alerted = results.filter((result) => result.errors.length === 0 && result.warnings.length > 0);
const blocked = results.filter((result) => result.errors.length > 0);

console.log('Internal Documents Whitelist Dry Run');
console.log('====================================');
console.log(`Whitelist: ${relative(repoRoot, whitelistPath)}`);
console.log(`Documentos: ${results.length}`);
console.log(`Válidos: ${valid.length}`);
console.log(`Com alerta: ${alerted.length}`);
console.log(`Bloqueados: ${blocked.length}`);

for (const result of results) {
  printDocument(result);
}

console.log('\nResumo');
console.log('------');
console.log(`Documentos válidos: ${valid.map((result) => result.slug).join(', ') || '-'}`);
console.log(`Documentos com alerta: ${alerted.map((result) => result.slug).join(', ') || '-'}`);
console.log(`Documentos bloqueados: ${blocked.map((result) => result.slug).join(', ') || '-'}`);

if (blocked.length > 0) {
  console.error('\nDry-run falhou: existem documentos bloqueados. Nenhum arquivo foi alterado.');
  process.exit(1);
}

console.log('\nDry-run concluído: nenhum arquivo foi alterado e nada foi gravado no banco.');
