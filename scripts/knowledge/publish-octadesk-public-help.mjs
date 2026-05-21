import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_REPORT_PATH = join(
  process.cwd(),
  'docs',
  'reports',
  'OCTADESK_PUBLICATION_EXECUTION_REPORT.md',
);

const COMPLETE_PUBLIC_CONFIRMATIONS = {
  title_reviewed: true,
  summary_reviewed: true,
  body_reviewed: true,
  category_reviewed: true,
  visibility_reviewed: true,
  no_sensitive_data_exposed: true,
  ready_for_review: true,
  ready_for_publish: true,
  migration_source_approved: true,
  migrated_from_existing_public_help_center: true,
};

const MIGRATION_REVIEW_NOTE =
  'Publicacao migrada da Central de Ajuda Octadesk existente para a Central Genius.';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    local: false,
    apply: false,
    actorUserId: null,
    spaceSlug: 'genius',
    knowledgeSpaceId: null,
    report: DEFAULT_REPORT_PATH,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--local') {
      args.local = true;
      continue;
    }

    if (value === '--apply') {
      args.apply = true;
      continue;
    }

    if (value === '--actor-user-id') {
      args.actorUserId = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (value === '--space-slug') {
      args.spaceSlug = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (value === '--knowledge-space-id') {
      args.knowledgeSpaceId = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (value === '--report') {
      args.report = argv[index + 1] ?? args.report;
      index += 1;
    }
  }

  if (!args.local) {
    fail('Publicacao Octadesk bloqueada: use --local para limitar ao Supabase local.');
  }

  if (!args.spaceSlug && !args.knowledgeSpaceId) {
    fail('Informe --space-slug ou --knowledge-space-id.');
  }

  if (args.spaceSlug && args.knowledgeSpaceId) {
    fail('Use apenas um destino: --space-slug ou --knowledge-space-id.');
  }

  if (args.apply && !args.actorUserId) {
    fail('Publicacao com --apply exige --actor-user-id.');
  }

  return args;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      SUPABASE_TELEMETRY_DISABLED: '1',
    },
    ...options,
  });

  if (result.error) {
    fail(result.error.message);
  }

  if (result.status !== 0) {
    const detail = [result.stderr?.trim(), result.stdout?.trim()]
      .filter(Boolean)
      .join('\n');
    fail(detail || `Falha ao executar ${command}.`);
  }

  return result.stdout?.trim() ?? '';
}

function localSupabaseBinary(args) {
  if (process.platform === 'win32') {
    const localBinary = join(
      process.cwd(),
      'node_modules',
      'supabase',
      'bin',
      'supabase.exe',
    );

    if (existsSync(localBinary)) {
      return { command: localBinary, args };
    }
  }

  return {
    command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
    args: ['supabase', ...args],
  };
}

function createWorkspaceTempDir(prefix) {
  const tempRoot = join(process.cwd(), '.tmp');
  mkdirSync(tempRoot, { recursive: true });
  return mkdtempSync(join(tempRoot, prefix));
}

function executeSql(sql) {
  const tempDir = createWorkspaceTempDir('genius-octadesk-publish-');
  const sqlFile = join(tempDir, 'query.sql');
  writeFileSync(sqlFile, `${sql}\n`, 'utf8');

  try {
    const { command, args } = localSupabaseBinary([
      'db',
      'query',
      '--local',
      '--output',
      'json',
      '--file',
      sqlFile,
    ]);
    return run(command, args);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function readStatusEnv() {
  const { command, args } = localSupabaseBinary(['status', '-o', 'env']);
  const output = run(command, args);
  const env = new Map();

  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
    if (match) {
      env.set(match[1], match[2]);
    }
  }

  const apiUrl = env.get('API_URL') ?? '';
  const dbUrl = env.get('DB_URL') ?? '';
  if (!apiUrl.startsWith('http://127.0.0.1:') || !dbUrl.includes('@127.0.0.1:')) {
    fail('Publicacao Octadesk bloqueada: ambiente Supabase local nao confirmado.');
  }
}

function parseJsonRows(rawOutput) {
  const parsed = JSON.parse(rawOutput || '{}');
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (Array.isArray(parsed.rows)) {
    return parsed.rows;
  }
  return [];
}

function sqlEscape(value) {
  return String(value ?? '').replace(/'/g, "''");
}

function buildSpaceSqlExpression(args) {
  if (args.knowledgeSpaceId) {
    return `'${sqlEscape(args.knowledgeSpaceId)}'::uuid`;
  }

  return `(
    select ks.id
    from public.knowledge_spaces as ks
    where ks.slug = '${sqlEscape(args.spaceSlug)}'
  )`;
}

function normalizeTextForPublic(value) {
  let output = String(value ?? '');
  const replacements = [
    [/\bOctadesk\b/gi, 'Central de Ajuda'],
    [/\bconsumidor\b/gi, 'cliente'],
    [/\bconsumidores\b/gi, 'clientes'],
    [/\bshopper\b/gi, 'cliente'],
    [/\bfront\b/gi, 'portal do cliente'],
  ];

  const applied = [];
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(output)) {
      output = output.replace(pattern, replacement);
      applied.push(String(pattern));
    }
  }

  output = output
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    value: output,
    applied,
  };
}

function detectCriticalBlocks(row, duplicateHashCounts) {
  const text = [row.title, row.summary, row.body_md, row.source_path]
    .filter(Boolean)
    .join('\n')
    .toLowerCase();
  const reasons = [];

  if (!row.title?.trim() || !row.body_md?.trim() || row.body_md.trim().length < 80) {
    reasons.push('conteudo quebrado ou vazio');
  }

  if ((duplicateHashCounts.get(row.source_hash) ?? 0) > 1) {
    reasons.push('duplicidade exata sem decisao de canonical');
  }

  const criticalPatterns = [
    ['service_role', /\bservice[_-]?role\b/i],
    ['authorization_header', /\bauthorization\s*:/i],
    ['bearer_token', /\bbearer\s+[a-z0-9._-]{12,}/i],
    ['jwt', /\bjwt\b|eyj[a-z0-9_-]{10,}\./i],
    ['token', /\btoken\b/i],
    ['api_key', /\b(api|secret|access)[_-]?(key|token|secret)\b|\bx-api-key\b/i],
    ['senha_explicita', /\bsenha\s*[:=]/i],
    ['endpoint_privado', /\b(endpoint privado|url interna|ambiente interno)\b/i],
    ['payload_sensivel', /\b(payload|header|request|response)\b/i],
    ['instrucao_interna', /\b(somente interno|uso interno|time interno|operacao interna)\b/i],
  ];

  for (const [label, pattern] of criticalPatterns) {
    if (pattern.test(text)) {
      reasons.push(label);
    }
  }

  const title = String(row.title ?? '').toLowerCase();
  const technicalTitlePatterns = [
    ['permissao_tecnica', /\bpermiss[oõ]es?\b/i],
    ['erro_autorizacao', /\bunauthorized|n[aã]o autorizado|autoriza[cç][aã]o\b/i],
    ['integracao_tecnica', /\bintegra[cç][aã]o\b/i],
    ['contrato_correios', /\bcorreios\b/i],
    ['usuario_admin', /\busu[aá]rio\b/i],
  ];

  for (const [label, pattern] of technicalTitlePatterns) {
    if (pattern.test(title)) {
      reasons.push(label);
    }
  }

  return [...new Set(reasons)];
}

function classifyRow(row, duplicateHashCounts) {
  const criticalBlocks = detectCriticalBlocks(row, duplicateHashCounts);
  const normalizedTitle = normalizeTextForPublic(row.title);
  const normalizedSummary = normalizeTextForPublic(row.summary ?? '');
  const normalizedBody = normalizeTextForPublic(row.body_md);
  const cleanupApplied = [
    ...normalizedTitle.applied,
    ...normalizedSummary.applied,
    ...normalizedBody.applied,
  ];

  if (criticalBlocks.includes('duplicidade exata sem decisao de canonical')) {
    return {
      decision: 'duplicate_or_obsolete',
      reason: criticalBlocks.join('; '),
      criticalBlocks,
      cleanupApplied,
      publicTitle: normalizedTitle.value,
      publicSummary: normalizedSummary.value,
      publicBody: normalizedBody.value,
    };
  }

  if (criticalBlocks.length > 0) {
    return {
      decision: 'blocked_critical',
      reason: criticalBlocks.join('; '),
      criticalBlocks,
      cleanupApplied,
      publicTitle: normalizedTitle.value,
      publicSummary: normalizedSummary.value,
      publicBody: normalizedBody.value,
    };
  }

  const needsCleanup =
    cleanupApplied.length > 0 ||
    row.visibility !== 'public' ||
    row.status !== 'review';

  return {
    decision: needsCleanup ? 'publishable_with_minor_cleanup' : 'publishable_now',
    reason: needsCleanup
      ? 'base legada aprovada com normalizacao minima e publicacao via gate'
      : 'base legada aprovada sem bloqueio critico',
    criticalBlocks,
    cleanupApplied,
    publicTitle: normalizedTitle.value,
    publicSummary: normalizedSummary.value,
    publicBody: normalizedBody.value,
  };
}

function fetchOctadeskRows(args) {
  const rows = parseJsonRows(
    executeSql(`
      select
        ka.id::text,
        ka.knowledge_space_id::text,
        ka.category_id::text,
        ka.visibility::text,
        ka.status::text,
        ka.title,
        ka.slug,
        ka.summary,
        ka.body_md,
        ka.source_path,
        ka.source_hash,
        kc.name as category_name,
        kc.slug as category_slug,
        kc.description as category_description,
        kc.parent_category_id::text as parent_category_id,
        kc.visibility::text as category_visibility,
        parent_kc.name as parent_category_name,
        parent_kc.slug as parent_category_slug,
        parent_kc.description as parent_category_description,
        parent_kc.visibility::text as parent_category_visibility,
        advisory.review_status::text,
        advisory.suggested_visibility::text,
        advisory.suggested_classification::text,
        advisory.risk_flags,
        advisory.human_confirmations
      from public.knowledge_articles as ka
      left join public.knowledge_categories as kc
        on kc.id = ka.category_id
      left join public.knowledge_categories as parent_kc
        on parent_kc.id = kc.parent_category_id
      left join public.knowledge_article_review_advisories as advisory
        on advisory.article_id = ka.id
      where ka.knowledge_space_id = ${buildSpaceSqlExpression(args)}
        and ka.source_path like 'raw_knowledge/octadesk_export/%'
      order by ka.title asc;
    `),
  );

  return rows.map((row) => ({
    ...row,
    risk_flags: Array.isArray(row.risk_flags) ? row.risk_flags : [],
  }));
}

function buildPlan(rows) {
  const duplicateHashCounts = new Map();
  for (const row of rows) {
    duplicateHashCounts.set(row.source_hash, (duplicateHashCounts.get(row.source_hash) ?? 0) + 1);
  }

  return rows.map((row) => ({
    ...row,
    publication: classifyRow(row, duplicateHashCounts),
  }));
}

function summarizePlan(plan) {
  const summary = {
    total: plan.length,
    publishable_now: 0,
    publishable_with_minor_cleanup: 0,
    blocked_critical: 0,
    duplicate_or_obsolete: 0,
  };

  for (const row of plan) {
    summary[row.publication.decision] += 1;
  }

  return summary;
}

function publishableRows(plan) {
  return plan.filter((row) =>
    ['publishable_now', 'publishable_with_minor_cleanup'].includes(row.publication.decision),
  );
}

function buildApplySql(plan, args) {
  const rows = publishableRows(plan);
  const blockedRows = plan.filter((row) =>
    ['blocked_critical', 'duplicate_or_obsolete'].includes(row.publication.decision),
  );
  const categories = new Map();
  const parentCategories = new Map();
  for (const row of rows) {
    if (row.parent_category_id) {
      parentCategories.set(row.parent_category_id, row);
    }

    if (row.category_id) {
      categories.set(row.category_id, row);
    }
  }

  const sqlChunks = [
    'do $block$',
    'declare',
    '  v_target_space_id uuid;',
    '  v_category public.knowledge_categories;',
    '  v_article public.knowledge_articles;',
    'begin',
    "  perform set_config('request.jwt.claim.role', 'authenticated', true);",
    `  perform set_config('request.jwt.claim.sub', '${sqlEscape(args.actorUserId)}', true);`,
    `  select ${buildSpaceSqlExpression(args)}`,
    '  into v_target_space_id;',
    '',
    '  if v_target_space_id is null then',
    "    raise exception 'knowledge space target not found';",
    '  end if;',
  ];

  for (const row of rows) {
    sqlChunks.push(`
  insert into public.knowledge_article_review_advisories (
    article_id,
    source_hash,
    suggested_visibility,
    suggested_classification,
    classification_reason,
    duplicate_group_key,
    risk_flags,
    review_status,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    '${sqlEscape(row.id)}'::uuid,
    '${sqlEscape(row.source_hash)}',
    'public'::public.knowledge_visibility,
    'public'::public.knowledge_advisory_classification,
    '${sqlEscape(row.publication.reason)}',
    null,
    '[]'::jsonb,
    'pending'::public.knowledge_article_review_status,
    '${sqlEscape(args.actorUserId)}'::uuid,
    '${sqlEscape(args.actorUserId)}'::uuid
  )
  on conflict (article_id) do update
  set
    source_hash = excluded.source_hash,
    suggested_visibility = excluded.suggested_visibility,
    suggested_classification = excluded.suggested_classification,
    classification_reason = excluded.classification_reason,
    duplicate_group_key = excluded.duplicate_group_key,
    risk_flags = excluded.risk_flags,
    updated_by_user_id = excluded.updated_by_user_id;`);
  }

  for (const row of blockedRows) {
    const riskFlags = JSON.stringify(row.publication.criticalBlocks);

    sqlChunks.push(`
  insert into public.knowledge_article_review_advisories (
    article_id,
    source_hash,
    suggested_visibility,
    suggested_classification,
    classification_reason,
    duplicate_group_key,
    risk_flags,
    review_status,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    '${sqlEscape(row.id)}'::uuid,
    '${sqlEscape(row.source_hash)}',
    'restricted'::public.knowledge_visibility,
    'restricted'::public.knowledge_advisory_classification,
    '${sqlEscape(row.publication.reason)}',
    null,
    '${sqlEscape(riskFlags)}'::jsonb,
    'pending'::public.knowledge_article_review_status,
    '${sqlEscape(args.actorUserId)}'::uuid,
    '${sqlEscape(args.actorUserId)}'::uuid
  )
  on conflict (article_id) do update
  set
    source_hash = excluded.source_hash,
    suggested_visibility = excluded.suggested_visibility,
    suggested_classification = excluded.suggested_classification,
    classification_reason = excluded.classification_reason,
    duplicate_group_key = excluded.duplicate_group_key,
    risk_flags = excluded.risk_flags,
    updated_by_user_id = excluded.updated_by_user_id;`);
  }

  sqlChunks.push("  execute 'set local role authenticated';");

  for (const category of parentCategories.values()) {
    sqlChunks.push(`
  v_category := public.rpc_admin_create_knowledge_category_v2(
    '${sqlEscape(category.parent_category_name)}',
    '${sqlEscape(category.parent_category_slug)}',
    ${category.parent_category_description ? `'${sqlEscape(category.parent_category_description)}'` : "'Categoria publica migrada da Central de Ajuda Octadesk existente.'"},
    'public'::public.knowledge_visibility,
    null,
    v_target_space_id,
    null
  );`);
  }

  for (const category of categories.values()) {
    sqlChunks.push(`
  v_category := public.rpc_admin_create_knowledge_category_v2(
    '${sqlEscape(category.category_name)}',
    '${sqlEscape(category.category_slug)}',
    ${category.category_description ? `'${sqlEscape(category.category_description)}'` : "'Categoria publica migrada da Central de Ajuda Octadesk existente.'"},
    'public'::public.knowledge_visibility,
    ${category.parent_category_id ? `'${sqlEscape(category.parent_category_id)}'::uuid` : 'null'},
    v_target_space_id,
    null
  );`);
  }

  for (const row of rows) {
    const confirmations = JSON.stringify(COMPLETE_PUBLIC_CONFIRMATIONS);

    if (row.status === 'published') {
      sqlChunks.push(`
  perform public.rpc_admin_mark_knowledge_article_reviewed(
    '${sqlEscape(row.id)}'::uuid,
    '${sqlEscape(confirmations)}'::jsonb,
    '${sqlEscape(MIGRATION_REVIEW_NOTE)}'
  );`);
      continue;
    }

    sqlChunks.push(`
  perform public.rpc_admin_update_knowledge_article_draft_v2(
    '${sqlEscape(row.id)}'::uuid,
    v_target_space_id,
    '${sqlEscape(row.publication.publicTitle)}',
    '${sqlEscape(row.slug)}',
    ${row.publication.publicSummary ? `'${sqlEscape(row.publication.publicSummary)}'` : 'null'},
    '${sqlEscape(row.publication.publicBody)}',
    ${row.category_id ? `'${sqlEscape(row.category_id)}'::uuid` : 'null'},
    'public'::public.knowledge_visibility,
    '${sqlEscape(row.source_path)}',
    '${sqlEscape(row.source_hash)}'
  );

  perform public.rpc_admin_mark_knowledge_article_reviewed(
    '${sqlEscape(row.id)}'::uuid,
    '${sqlEscape(confirmations)}'::jsonb,
    '${sqlEscape(MIGRATION_REVIEW_NOTE)}'
  );

  ${row.status === 'draft' ? 'if true then' : 'if false then'}
    perform public.rpc_admin_submit_knowledge_article_for_review_v2(
      '${sqlEscape(row.id)}'::uuid,
      v_target_space_id
    );
  end if;

  v_article := public.rpc_admin_publish_knowledge_article_v2(
    '${sqlEscape(row.id)}'::uuid,
    v_target_space_id
  );
`);
  }

  sqlChunks.push('end;', '$block$;');
  return sqlChunks.join('\n');
}

function writeReport(plan, args, applyResult) {
  const summary = summarizePlan(plan);
  const publishedRows = applyResult?.publishedRows ?? [];
  const blockedRows = plan.filter((row) =>
    ['blocked_critical', 'duplicate_or_obsolete'].includes(row.publication.decision),
  );

  const lines = [
    '# Octadesk Publication Execution Report',
    '',
    'Data: `2026-05-21`',
    '',
    '## Resumo',
    '',
    `- Modo: \`${args.apply ? 'apply' : 'dry-run'}\`.`,
    `- Artigos Octadesk avaliados: \`${summary.total}\`.`,
    `- \`publishable_now\`: \`${summary.publishable_now}\`.`,
    `- \`publishable_with_minor_cleanup\`: \`${summary.publishable_with_minor_cleanup}\`.`,
    `- \`blocked_critical\`: \`${summary.blocked_critical}\`.`,
    `- \`duplicate_or_obsolete\`: \`${summary.duplicate_or_obsolete}\`.`,
    `- Artigos publicados nesta execucao: \`${publishedRows.length}\`.`,
    '',
    'Premissa de produto aplicada: a origem Octadesk foi tratada como Central de Ajuda publica legada aprovada para migracao, salvo bloqueio tecnico critico automatico.',
    '',
    '## Artigos publicados',
    '',
  ];

  if (publishedRows.length === 0) {
    lines.push('- Nenhum artigo publicado nesta execucao.');
  } else {
    for (const row of publishedRows) {
      lines.push(`- \`${row.slug}\` - ${row.title}`);
    }
  }

  lines.push('', '## Bloqueios', '');

  if (blockedRows.length === 0) {
    lines.push('- Nenhum bloqueio critico automatico.');
  } else {
    for (const row of blockedRows) {
      lines.push(
        `- \`${row.slug}\` - ${row.title}: \`${row.publication.decision}\` (${row.publication.reason}).`,
      );
    }
  }

  lines.push(
    '',
    '## Inventario por artigo',
    '',
    '| Titulo | Status inicial | Visibility inicial | Decisao | Motivo | Source path | Source hash |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  );

  for (const row of plan) {
    lines.push(
      [
        row.title,
        row.status,
        row.visibility,
        row.publication.decision,
        row.publication.reason,
        row.source_path,
        row.source_hash,
      ]
        .map((value) => ` ${String(value ?? '').replace(/\|/g, '\\|')} `)
        .join('|')
        .replace(/^/, '|')
        .replace(/$/, '|'),
    );
  }

  lines.push(
    '',
    '## Auditoria',
    '',
    `- Nota aplicada aos advisories dos publicados: "${MIGRATION_REVIEW_NOTE}"`,
    '- Publicacao executada por RPC editorial existente e gate de publicacao.',
    '- Artigos bloqueados permaneceram fora da Central Publica.',
  );

  writeFileSync(args.report, `${lines.join('\n')}\n`, 'utf8');
}

function fetchPublishedOctadeskRows(args) {
  return parseJsonRows(
    executeSql(`
      select
        ka.title,
        ka.slug,
        ka.status::text,
        ka.visibility::text,
        ka.published_at::text
      from public.knowledge_articles as ka
      where ka.knowledge_space_id = ${buildSpaceSqlExpression(args)}
        and ka.source_path like 'raw_knowledge/octadesk_export/%'
        and ka.status = 'published'::public.knowledge_article_status
        and ka.visibility = 'public'::public.knowledge_visibility
      order by ka.title asc;
    `),
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  readStatusEnv();

  const rows = fetchOctadeskRows(args);
  const plan = buildPlan(rows);
  const summary = summarizePlan(plan);

  let applyResult = { publishedRows: [] };
  if (args.apply) {
    const sql = buildApplySql(plan, args);
    executeSql(sql);
    applyResult = {
      publishedRows: fetchPublishedOctadeskRows(args),
    };
  }

  writeReport(plan, args, applyResult);

  console.log(
    JSON.stringify(
      {
        mode: args.apply ? 'apply' : 'dry-run',
        report: args.report,
        ...summary,
        published: applyResult.publishedRows.length,
        blocked: summary.blocked_critical + summary.duplicate_or_obsolete,
      },
      null,
      2,
    ),
  );
}

main();
