import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { repairMojibake } from './legacy-normalization.mjs';

const root = join(process.cwd(), 'raw_knowledge', 'octadesk_export', 'latest', 'articles');
const apply = process.argv.includes('--apply-local');
const writeMigration = process.argv.includes('--write-migration');
const requestedSlug = process.argv.find((argument) => argument.startsWith('--slug='))?.slice('--slug='.length) ?? null;
const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20260724160000_knowledge_editorial_copy_recovery.sql');
const targets = new Set([
  'como-atualizar-os-dados-de-integracao-do-e-commerce',
  'como-automatizar-o-pagamento-de-estorno-e-vale-compra',
  'como-cadastrar-motivos-para-troca-ou-devolucao',
  'como-configurar-o-blocklist',
  'configurando-parametrizacao-geral',
  'regra-para-segunda-solicitacao',
  'variacao-do-produto',
]);
const selectedTargets = requestedSlug ? new Set([requestedSlug]) : targets;
if (requestedSlug && !targets.has(requestedSlug)) {
  throw new Error(`Slug fora da lista de recuperação aprovada: ${requestedSlug}`);
}

function walk(directory) {
  const result = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walk(path));
    else if (entry.name === 'article.json') result.push(path);
  }
  return result;
}

function cleanBody(title, plainText) {
  const lines = repairMojibake(plainText)
    .replace(/Consulte a FAQ\s*\(inserir link da FAQ\)[^.]*\.\s*/gi, '\n')
    .replace(/Se precisar de mais informações ou ajuda, consulte a FAQ ou entre em contato com o nosso suporte!\s*/gi, '\n')
    .replace(/\r\n/g, '\n')
    .trim()
    .split('\n')
    .map((line) => line.trim());
  const normalizeKey = (value) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const titleKey = normalizeKey(title);
  while (lines[0] && normalizeKey(lines[0]) === titleKey) lines.shift();
  if (lines[0] && normalizeKey(lines[0]).startsWith(titleKey.slice(0, 20))) {
    lines[0] = lines[0].slice(title.length).trim();
    if (!lines[0]) lines.shift();
  }
  return lines
    .map((line) => {
      if (/^\d+\.\s+passo a passo\b/i.test(line)) return line.replace(/^\d+\.\s+/, '');
      if (/^[A-ZÁÉÍÓÚÃÕÇ0-9][A-ZÁÉÍÓÚÃÕÇ0-9\s:?!-]{10,}$/.test(line)) {
        return line.toLocaleLowerCase('pt-BR').replace(/^./u, (character) => character.toLocaleUpperCase('pt-BR'));
      }
      return line;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function sql(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

const rows = walk(root)
  .map((path) => JSON.parse(readFileSync(path, 'utf8')))
  .filter((article) => selectedTargets.has(article.url));

if (rows.length === 0) throw new Error('Nenhum dos artigos alvo foi encontrado na exportação local.');

const statements = rows.map((article) => {
  const body = cleanBody(article.title, article.plainText || '');
  const summary = body.split(/\n{2,}/)[0].slice(0, 320).trim();
  const slug = article.url;
  const articlePredicate = `id = (select ka.id from public.knowledge_articles ka join public.knowledge_spaces ks on ks.id = ka.knowledge_space_id where ks.slug = 'genius' and ka.slug = ${sql(slug)} limit 1)`;
  const articleIdPredicate = `article_id = (select ka.id from public.knowledge_articles ka join public.knowledge_spaces ks on ks.id = ka.knowledge_space_id where ks.slug = 'genius' and ka.slug = ${sql(slug)} limit 1)`;
  return `update public.knowledge_articles\nset title = ${sql(article.title)},\n    summary = ${sql(summary)},\n    body_md = ${sql(body)},\n    current_revision_number = current_revision_number + 1,\n    updated_at = timezone('utc', now())\nwhere ${articlePredicate};\n\nupdate public.knowledge_article_editorial_drafts\nset title = ${sql(article.title)},\n    summary = ${sql(summary)},\n    body_md = ${sql(body)},\n    updated_at = timezone('utc', now())\nwhere ${articleIdPredicate};`;
});

const sqlText = `begin;\n${statements.join('\n\n')}\ncommit;\n`;

if (writeMigration) {
  writeFileSync(
    migrationPath,
    `-- Recuperação auditável de ${rows.length} artigos a partir da exportação Octadesk local.\n-- Nenhum conteúdo novo foi inventado; títulos, resumos e corpos vieram de article.json.\n\n${sqlText}`,
    'utf8',
  );
  console.log(`Migration gerada: ${relative(process.cwd(), migrationPath)}`);
}

if (apply) {
  const result = spawnSync('docker', [
    'exec', '-i', 'supabase_db_genius-support-os', 'psql', '-U', 'postgres', '-d', 'postgres',
  ], { input: sqlText, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || 'Falha ao aplicar a correção local.');
  console.log('Correção local aplicada com transação única.');
} else if (!writeMigration) {
  console.log(sqlText);
}
