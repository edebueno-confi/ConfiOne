import { chromium } from 'playwright';
import { assertLocalSupabaseEnvironment, loadQaEnv, readLocalSupabaseStatus } from './assert-local-supabase.mjs';

const qa = loadQaEnv();
const status = readLocalSupabaseStatus({ ...process.env, ...qa });
assertLocalSupabaseEnvironment({ ...process.env, ...qa }, { status });
const baseUrl = process.env.LOCAL_QA_WEB_URL ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const unexpected = [];
const failedRequests = [];
const consoleErrors = [];
page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? 'failed'}`));
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('response', (response) => {
  if ([401, 403, 404, 409, 422, 500, 502].includes(response.status())) {
    unexpected.push(`${response.status()} ${new URL(response.url()).pathname}`);
  }
});

try {
  await page.goto(`${baseUrl}/login?redirectTo=${encodeURIComponent('/admin/tenants')}`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(qa.LOCAL_QA_ADMIN_EMAIL);
  await page.getByLabel('Senha').fill(qa.LOCAL_QA_ADMIN_PASSWORD);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL('**/admin/tenants', { timeout: 20_000 });
  await page.getByRole('heading', { name: 'Central de Clientes', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Operações', exact: true }).click();
  await page.getByText('Clientes no diretório', { exact: true }).waitFor({ timeout: 20_000 });
  const body = await page.locator('body').innerText();
  if (!body.includes('267')) throw new Error('A Central não exibiu a contagem esperada do diretório local.');
  if (unexpected.length > 0) throw new Error(`Respostas inesperadas: ${unexpected.join(', ')}`);
  console.log(JSON.stringify({ route: '/admin/tenants', directoryCount: 267, authenticated: true, unexpectedResponses: 0 }));
} catch (error) {
  const body = await page.locator('body').innerText().catch(() => '');
  console.error(JSON.stringify({ path: new URL(page.url()).pathname, title: await page.title().catch(() => ''), body: body.slice(0, 1600), unexpectedResponses: unexpected, failedRequests, consoleErrors: consoleErrors.slice(0, 10) }));
  throw error;
} finally {
  await browser.close();
}
