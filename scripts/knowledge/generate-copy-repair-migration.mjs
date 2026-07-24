import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, relative } from 'node:path';

const root = join(process.cwd(), 'raw_knowledge', 'octadesk_export', 'latest', 'articles');
const apply = process.argv.includes('--apply-local');
const writeMigration = process.argv.includes('--write-migration');
const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20260724160000_knowledge_editorial_copy_recovery.sql');
const targets = new Map([
  ['como-atualizar-os-dados-de-integracao-do-e-commerce', '964e5bf7-7de7-4bf4-828e-f199ea40e45a'],
  ['como-automatizar-o-pagamento-de-estorno-e-vale-compra', 'ecdad886-ede5-4182-92a4-ddaf28de30c5'],
  ['como-cadastrar-motivos-para-troca-ou-devolucao', '5b50abcf-c0b0-48d2-ae4e-3c3a996f0e51'],
  ['como-configurar-o-blocklist', '2c5ea31a-7faf-4af9-a3ce-cc8332022e9d'],
  ['configurando-parametrizacao-geral', '7b11f20c-20ab-4550-8e95-570a9bfda612'],
  ['regra-para-segunda-solicitacao', 'f721db79-02d3-4cc6-8324-395e2b45a1b1'],
  ['variacao-do-produto', 'e46709ae-6228-439c-9cd3-408cc2d83ad1'],
]);

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
  const lines = plainText.replace(/\r\n/g, '\n').trim().split('\n').map((line) => line.trim());
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
  .filter((article) => targets.has(article.url));

if (rows.length !== targets.size) throw new Error(`Esperados ${targets.size} artigos, encontrados ${rows.length}.`);

const statements = rows.map((article) => {
  const body = cleanBody(article.title, article.plainText || '');
  const summary = body.split(/\n{2,}/)[0].slice(0, 320).trim();
  const articleId = targets.get(article.url);
  return `update public.knowledge_articles\nset title = ${sql(article.title)},\n    summary = ${sql(summary)},\n    body_md = ${sql(body)},\n    current_revision_number = current_revision_number + 1,\n    updated_at = timezone('utc', now())\nwhere id = '${articleId}'::uuid;\n\nupdate public.knowledge_article_editorial_drafts\nset title = ${sql(article.title)},\n    summary = ${sql(summary)},\n    body_md = ${sql(body)},\n    updated_at = timezone('utc', now())\nwhere article_id = '${articleId}'::uuid;`;
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
