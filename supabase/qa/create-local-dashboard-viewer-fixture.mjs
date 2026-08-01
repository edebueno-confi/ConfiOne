import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { resolveSupabaseCliCommand } from '../../scripts/lib/supabase-cli-command.mjs';
import { normalizeQueryResult } from '../../scripts/local-qa/sql.mjs';

const email = 'qa.local.dashboard-viewer@genius.local';
const password = process.env.DASHBOARD_VIEWER_QA_PASSWORD ?? `Local-QA-${randomBytes(24).toString('base64url')}`;
const fullName = 'QA Dashboard Viewer';
const credentialsPath = resolve(process.env.GSO_QA_CREDENTIALS_PATH ?? '.tmp/dashboard-viewer-credentials.json');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function run(args) {
  const resolved = resolveSupabaseCliCommand(args);
  const result = spawnSync(resolved.command, resolved.args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
  if (result.status !== 0) fail([result.stderr, result.stdout].filter(Boolean).join('\n'));
  return result.stdout.trim();
}

function runStatus() {
  const resolved = resolveSupabaseCliCommand(['status', '-o', 'env']);
  const result = spawnSync(resolved.command, resolved.args, {
    cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: process.env,
  });
  if (!result.stdout?.trim()) fail([result.stderr, result.stdout].filter(Boolean).join('\n'));
  return result.stdout.trim();
}

function sqlEscape(value) {
  return value.replaceAll("'", "''");
}

function query(sql) {
  const tempName = `.tmp-dashboard-viewer-${Date.now()}.sql`;
  writeFileSync(tempName, `${sql.trim()}\n`, 'utf8');
  try {
    // Delegates shape normalization to the shared helper instead of parsing
    // the CLI payload locally, keeping a single source of truth for the
    // `{ rows: [...] }` contract this fixture already relies on.
    return normalizeQueryResult(
      run(['db', 'query', '--local', '--file', tempName, '--output', 'json']),
      { source: 'supabase db query --local (dashboard-viewer fixture)' },
    );
  } finally {
    rmSync(tempName, { force: true });
  }
}

const env = runStatus();
const values = Object.fromEntries(env.split(/\r?\n/).flatMap((line) => {
  const match = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
  return match ? [[match[1], match[2]]] : [];
}));
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(values.API_URL ?? '') || !values.SERVICE_ROLE_KEY) {
  fail('Fixture bloqueada: execute apenas com Supabase local e SERVICE_ROLE_KEY local.');
}

const existing = query(`select id::text as id from auth.users where lower(email) = lower('${sqlEscape(email)}') limit 1;`).rows?.[0];
const payload = JSON.stringify({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName, name: fullName, locale: 'pt-BR', timezone: 'America/Sao_Paulo' },
});
const response = await fetch(`${values.API_URL}/auth/v1/admin/users${existing?.id ? `/${existing.id}` : ''}`, {
  method: existing?.id ? 'PUT' : 'POST',
  headers: { apikey: values.SERVICE_ROLE_KEY, Authorization: `Bearer ${values.SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
  body: payload,
});
if (!response.ok) fail(`Falha ao provisionar usuário QA local: ${response.status} ${await response.text()}`);
const user = await response.json();
query(`
  insert into public.user_global_roles (user_id, role)
  values ('${sqlEscape(user.id)}'::uuid, 'dashboard_viewer'::public.platform_role)
  on conflict (user_id, role) do update set updated_at = now()
  returning user_id::text;
`);
const verification = query(`
  select p.id::text as user_id, p.email::text as email, p.is_active,
    exists(select 1 from public.user_global_roles r where r.user_id = p.id and r.role = 'dashboard_viewer'::public.platform_role) as has_dashboard_viewer
  from public.profiles p where p.id = '${sqlEscape(user.id)}'::uuid;
`);
if (!verification.rows?.[0]?.has_dashboard_viewer) fail('Usuário criado, mas o papel dashboard_viewer não foi aplicado.');
mkdirSync(dirname(credentialsPath), { recursive: true });
writeFileSync(credentialsPath, JSON.stringify({ email, password, role: 'dashboard_viewer', userId: user.id }, null, 2), 'utf8');
console.log(JSON.stringify({ environment: 'local', email, userId: user.id, role: 'dashboard_viewer', scope: ['Dashboard gerencial'], credentialsPath, verified: verification.rows[0] }, null, 2));
