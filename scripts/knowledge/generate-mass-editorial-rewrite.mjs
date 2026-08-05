import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DB_CONTAINER = 'supabase_db_genius-support-os';
const MIGRATION_PATH = join(
  process.cwd(),
  'supabase',
  'migrations',
  '20260724180000_knowledge_mass_editorial_rewrite.sql',
);

function sqlLiteral(value) {
  return `'${String(value ?? '').replaceAll("'", "''")}'`;
}

function runPsql(sql) {
  const result = spawnSync(
    'docker',
    ['exec', '-i', DB_CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc', sql],
    { encoding: null, input: Buffer.from(sql, 'utf8') },
  );

  if (result.status !== 0) {
    process.stderr.write(result.stderr?.toString('utf8') ?? 'Falha no psql.\n');
    process.exit(result.status ?? 1);
  }

  return result.stdout?.toString('utf8') ?? '';
}

function repairMojibake(value) {
  let output = String(value ?? '');
  for (let pass = 0; pass < 3; pass += 1) {
    if (!/[ÃÂâ€™â€œâ€\u0093ï¿½]/.test(output)) {
      break;
    }

    const repaired = Buffer.from(output, 'latin1').toString('utf8');
    if (repaired.includes('�') || repaired === output) {
      break;
    }
    output = repaired;
  }
  return output
    .replaceAll('�', '')
    .replaceAll('Â ', ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeKey(value) {
  return repairMojibake(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
    .toLowerCase();
}

function sentenceCaseHeading(value) {
  const source = repairMojibake(value).trim();
  if (!source || source.length < 3) return source;
  if (source === source.toUpperCase() && /[A-ZÁÉÍÓÚÃÕÇ]/.test(source)) {
    const lower = source.toLocaleLowerCase('pt-BR');
    return lower.charAt(0).toLocaleUpperCase('pt-BR') + lower.slice(1);
  }
  return source;
}

function normalizeTitle(title) {
  let value = repairMojibake(title)
    .replace(/durantge/gi, 'durante')
    .replace(/automatico/gi, 'automático')
    .replace(/Vale-Compras\(Retenção\)/gi, 'Vale-Compras (retenção)')
    .replace(/\s+\?/g, '?')
    .trim();

  if (value === value.toUpperCase() && /[A-ZÁÉÍÓÚÃÕÇ]/.test(value)) {
    value = sentenceCaseHeading(value);
  }
  return value;
}

function isImageOrBlock(line) {
  return /^!\[[^\]]*\]\([^)]*\)|^:::|^```/.test(line.trim());
}

function manualBodyRewrite(title) {
  if (normalizeKey(title) !== 'configurando parametrizacao geral') return null;
  return `Use a parametrização geral para definir regras que afetam o funcionamento das solicitações, da logística reversa e do portal do cliente.

### Funcionalidades principais

![Visão geral das funcionalidades da parametrização geral|size=large](knowledge-asset:42251df6-7eb6-47dd-bfb2-74d3ec45ea82)

- **Gerar ticket reverso automaticamente:** gera o código de postagem assim que o cliente conclui a solicitação, sem exigir uma análise prévia.
- **Solicitar envio de fotos dos produtos:** permite que o cliente envie até três imagens ao abrir a solicitação.
- **Habilitar transportadora de melhor custo:** sugere a transportadora mais econômica para a logística reversa.
- **Habilitar custo estimado da logística reversa:** mostra ao cliente uma estimativa do custo da logística reversa.
- **Habilitar modo B2B:** adapta o fluxo para operações entre empresas.
- **Calcular automaticamente o número de autorizações necessárias:** define a quantidade de autorizações exigidas para concluir a reversa.
- **Concluir o processo após sanar a pendência financeira:** conclui a reversa quando a pendência financeira é resolvida.
- **Habilitar estorno por item:** permite realizar estornos individuais para os itens da solicitação.

### Regras operacionais

#### Operações permitidas

![Configuração das operações permitidas|size=large](knowledge-asset:a34e3bf4-e5fb-4d7a-9797-9e00b712560e)

Escolha se a operação aceitará **troca**, **devolução** ou **ambas**.

#### Fique com o item

![Configuração da regra Fique com o item|size=large](knowledge-asset:7584774d-2eef-4e40-9ed2-0f844d6da7c0)

Configure quando o cliente poderá ficar com o produto sem passar pela logística reversa. As regras disponíveis consideram:

- tipo de solicitação;
- percentual do custo da logística reversa;
- quantidade mensal por cliente.

#### Sellers permitidos

![Seleção de sellers permitidos|size=large](knowledge-asset:12886628-ea50-45a5-ab91-dc592cd00641)

Defina quais sellers podem criar solicitações pela plataforma Genius Returns.

#### Produtos em exceção

![Cadastro de produtos e categorias em exceção|size=large](knowledge-asset:a13aca45-2481-4bd4-8f64-9b3f086fa7e3)

Bloqueie produtos ou categorias que não devem permitir reversas:

- para bloquear produtos, informe o ID de cada SKU e pressione **Enter** ou **Tab**;
- para bloquear categorias, informe o ID de cada categoria e pressione **Enter** ou **Tab**.

#### Segunda solicitação para o mesmo pedido ou SKU

![Regra para segunda solicitação|size=large](knowledge-asset:fcc0c4c1-1811-481b-8f59-240e8423d5e1)

Defina se o cliente poderá abrir uma segunda solicitação para o mesmo pedido ou item (SKU).

#### Segurança

![Opções de segurança da parametrização|size=large](knowledge-asset:04427c82-6646-4a7e-9a63-24daa0d80cff)

Revise as opções disponíveis nessa seção de acordo com a política de segurança da sua operação.

#### Informar o SKU da troca por texto

![Informação do SKU de troca por texto|size=large](knowledge-asset:53bea01d-ba6d-4166-a946-c70884321f76)

Permita que o cliente informe ou cole o link do SKU desejado, em vez de selecionar o item de troca na tela.

#### Variação do produto

![Configuração de variação do produto|size=large](knowledge-asset:18be680b-00c4-4ba1-a90b-dae3dac54792)

Configure como as variações de tamanho dos produtos serão tratadas no processo de reversa.

Revise as configurações antes de publicar o fluxo e valide uma solicitação de teste para confirmar o comportamento esperado.`;
}

function normalizeBody(title, body) {
  const normalizedTitle = normalizeTitle(title);
  const titleKey = normalizeKey(normalizedTitle);
  const manual = manualBodyRewrite(normalizedTitle);
  if (manual) return manual;
  const lines = repairMojibake(body)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line, index, all) => line || all[index - 1]);

  while (lines.length && !lines[0]) lines.shift();
  while (lines.length && !lines.at(-1)) lines.pop();

  if (lines.length && /^#{1,6}\s*/.test(lines[0])) {
    const first = lines[0].replace(/^#{1,6}\s*/, '');
    if (normalizeKey(first) === titleKey) lines.shift();
  } else if (lines.length && normalizeKey(lines[0]) === titleKey) {
    lines.shift();
  }

  while (lines.length && lines[0] && normalizeKey(lines[0]) === titleKey) {
    lines.shift();
  }

  const output = [];
  let previous = '';
  let insideCallout = false;
  let sawMeaningfulContent = false;

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const line = raw.trim();
    if (!line) {
      if (output.at(-1) !== '') output.push('');
      continue;
    }

    if (insideCallout) {
      if (line === ':::') {
        output.push(line);
        insideCallout = false;
      } else {
        output.push(line);
      }
      previous = line;
      sawMeaningfulContent = true;
      continue;
    }

    if (/^dica\s*:/i.test(line)) {
      if (output.at(-1) !== '') output.push('');
      output.push(':::callout info');
      output.push(`Dica: ${line.replace(/^dica\s*:\s*/i, '')}`);
      output.push(':::');
      output.push('');
      previous = line;
      sawMeaningfulContent = true;
      continue;
    }

    if (line === ':::callout info' || line === ':::callout warning' || line === ':::callout success' || line === ':::') {
      output.push(line);
      insideCallout = line !== ':::';
      previous = line;
      continue;
    }

    if (/^#{1,6}\s+/.test(line)) {
      const heading = sentenceCaseHeading(
        line.replace(/^#{1,6}\s+/, '').replace(/^\d+[.)]\s+/, ''),
      );
      if (normalizeKey(heading) !== titleKey && normalizeKey(heading) !== normalizeKey(previous)) {
        if (output.at(-1) !== '') output.push('');
        output.push(`### ${heading}`);
        output.push('');
      }
      previous = heading;
      sawMeaningfulContent = true;
      continue;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      const content = line.replace(/^\d+[.)]\s+/, '');
      const looksLikeStep = /^(acesse|abra|clique|selecione|procure|informe|escolha|defina|confirme|localize|insira|ative|desative|preencha|navegue|revise)\b/i.test(content);
      const looksLikeHeading = !looksLikeStep && content.length < 110;
      if (looksLikeHeading) {
        if (output.at(-1) !== '') output.push('');
        output.push(`### ${sentenceCaseHeading(content.replace(/:$/, ''))}`);
        output.push('');
      } else {
        output.push(`${line.match(/^\d+/)[0]}. ${content}`);
      }
      previous = content;
      sawMeaningfulContent = true;
      continue;
    }

    if (/^(passo a passo|como fazer|instruções?|orientações?|configurações?|considerações importantes|atenção|observação|funcionalidades?|gatilhos disponíveis|escolha entre|escolha o tipo)/i.test(line) && line.length < 110) {
      if (output.at(-1) !== '') output.push('');
      output.push(`### ${sentenceCaseHeading(line.replace(/:$/, ''))}`);
      output.push('');
      previous = line;
      sawMeaningfulContent = true;
      continue;
    }

    if (/^(\*|[-•])\s+/.test(line)) {
      output.push(line.replace(/^•\s+/, '- '));
      previous = line;
      sawMeaningfulContent = true;
      continue;
    }

    if (isImageOrBlock(line)) {
      if (output.at(-1) !== '') output.push('');
      output.push(line);
      output.push('');
      previous = line;
      sawMeaningfulContent = true;
      continue;
    }

    const isLabel = /:$/.test(line) && line.length < 100;
    const next = lines[index + 1]?.trim() ?? '';
    if (isLabel && next && !isImageOrBlock(next)) {
      if (output.at(-1) !== '') output.push('');
      output.push(`### ${sentenceCaseHeading(line.replace(/:$/, ''))}`);
      output.push('');
    } else {
      output.push(line);
    }
    previous = line;
    sawMeaningfulContent = true;
  }

  while (output[0] === '') output.shift();
  while (output.at(-1) === '') output.pop();

  if (!sawMeaningfulContent) return '';
  return output.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function deriveSummary(title, summary, body) {
  const cleanedTitle = normalizeTitle(title);
  const source = repairMojibake(summary).trim();
  const bodyLead = repairMojibake(body)
    .replace(/^#{1,6}\s*/gm, '')
    .split(/\n{2,}/)
    .map((part) => part.replace(/^[*-]\s+/gm, '').trim())
    .find((part) => part && normalizeKey(part) !== normalizeKey(cleanedTitle));
  const candidate = source && normalizeKey(source) !== normalizeKey(cleanedTitle)
    ? source.split(/\n+/).find((line) => line.trim() && normalizeKey(line) !== normalizeKey(cleanedTitle))
    : bodyLead;
  return String(candidate || `Veja como usar ${cleanedTitle.toLocaleLowerCase('pt-BR')}.`)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 320);
}

function fetchRows() {
  const query = `select coalesce(json_agg(row_to_json(rows)), '[]'::json) from (select ka.id::text, ka.title, ka.summary, ka.body_md, ka.source_path, coalesce((select json_agg(json_build_object('id', kaa.id::text, 'source_path', kaa.source_path)) from public.knowledge_article_assets kaa where kaa.article_id = ka.id), '[]'::json) as assets, case when related.slug is null then null else json_build_object('slug', related.slug, 'title', related.title, 'summary', related.summary) end as related from public.knowledge_articles ka left join lateral (select candidate.slug, candidate.title, candidate.summary from public.knowledge_articles candidate where candidate.knowledge_space_id = ka.knowledge_space_id and candidate.category_id = ka.category_id and candidate.id <> ka.id and candidate.status = 'published' and candidate.visibility = 'public' order by candidate.title limit 1) related on true where ka.knowledge_space_id = (select id from public.knowledge_spaces where slug='genius') and ka.source_path like 'raw_knowledge/octadesk_export/latest/articles/%' order by ka.title) rows;`;
  return JSON.parse(runPsql(query).trim() || '[]');
}

function editorialAssetSource(sourcePath) {
  const normalized = String(sourcePath ?? '').replaceAll('\\', '/');
  const marker = normalized.split('/assets/')[1];
  return marker ? `knowledge-asset-source:${marker}` : null;
}

function materializeAssetReferences(body, assets) {
  const assetSources = new Map(
    (assets ?? [])
      .map((asset) => [String(asset.id), editorialAssetSource(asset.source_path)])
      .filter(([, marker]) => marker),
  );

  return String(body ?? '').replace(
    /knowledge-asset:([0-9a-f-]{36})/gi,
    (full, assetId) => assetSources.get(assetId) ?? full,
  );
}

function materializeEditorialSources(rewritten) {
  for (const row of rewritten) {
    if (!row.source_path) continue;
    const articleDir = join(process.cwd(), row.source_path);
    mkdirSync(articleDir, { recursive: true });
    writeFileSync(join(articleDir, 'content.editorial.md'), `${row.body_md.trim()}\n`, 'utf8');
    writeFileSync(
      join(articleDir, 'editorial.json'),
      `${JSON.stringify({ title: row.title, summary: row.summary, body_md: row.body_md }, null, 2)}\n`,
      'utf8',
    );
  }
}

function appendRelatedCard(body, related) {
  if (!related?.slug) return body;
  const withoutExistingCard = String(body)
    .replace(/\n\n::related\s+[^\n]+\n[\s\S]*?\n::\s*$/i, '')
    .trim();
  const summary = String(related.summary ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !/^[-*\d.]+\s/.test(line))
    .slice(0, 1)
    .join(' ')
    .replace(/\s+/g, ' ')
    .slice(0, 240)
    .trim() || 'Continue a consulta em um artigo relacionado.';
  return `${withoutExistingCard}\n\n::related ${related.slug}\n${String(related.title ?? '').trim()}\n${summary}\n::`;
}

function buildMigration(rows) {
  const chunks = [
    '-- Normalização editorial em massa da Central pública.',
    '-- Conteúdo derivado do estado local publicado; sem criação de dados ou assets.',
    'begin;',
  ];

  for (const row of rows) {
    const title = normalizeTitle(row.title);
    const body = normalizeBody(title, row.body_md);
    const summary = deriveSummary(title, row.summary, body);
    const materializedBody = appendRelatedCard(materializeAssetReferences(body, row.assets), row.related);
    chunks.push(`update public.knowledge_articles set title=${sqlLiteral(title)}, summary=${sqlLiteral(summary)}, body_md=${sqlLiteral(materializedBody)}, updated_at=timezone('utc', now()) where id=${sqlLiteral(row.id)}::uuid;`);
  }

  chunks.push('commit;', '');
  return chunks.join('\n');
}

const rows = fetchRows();
const rewritten = rows.map((row) => ({
  ...row,
  title: normalizeTitle(row.title),
  summary: deriveSummary(row.title, row.summary, normalizeBody(row.title, row.body_md)),
  body_md: appendRelatedCard(materializeAssetReferences(normalizeBody(row.title, row.body_md), row.assets), row.related),
}));

mkdirSync(join(process.cwd(), 'supabase', 'migrations'), { recursive: true });
writeFileSync(MIGRATION_PATH, buildMigration(rows), 'utf8');
materializeEditorialSources(rewritten);

const changed = rewritten.filter((row, index) => {
  const original = rows[index];
  return row.title !== original.title || row.summary !== original.summary || row.body_md !== original.body_md;
});
const callouts = rewritten.filter((row) => row.body_md.includes(':::callout info')).length;
const headings = rewritten.reduce((total, row) => total + (row.body_md.match(/^### /gm) ?? []).length, 0);
const lists = rewritten.reduce((total, row) => total + (row.body_md.match(/^(?:\d+\.|-) /gm) ?? []).length, 0);

console.log(JSON.stringify({
  migration: MIGRATION_PATH.replace(`${process.cwd()}\\`, '').replaceAll('\\', '/'),
  total: rows.length,
  changed: changed.length,
  callouts,
  headings,
  listItems: lists,
  mode: process.argv.includes('--apply-local') ? 'apply-local-requested' : 'migration-only',
}, null, 2));

if (process.argv.includes('--apply-local')) {
  const migration = buildMigration(rows);
  const result = spawnSync(
    'docker',
    ['exec', '-i', DB_CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres'],
    { encoding: null, input: Buffer.from(migration, 'utf8') },
  );
  process.stdout.write(result.stdout?.toString('utf8') ?? '');
  process.stderr.write(result.stderr?.toString('utf8') ?? '');
  process.exitCode = result.status ?? 1;
}
