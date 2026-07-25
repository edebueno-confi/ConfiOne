import fs from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = process.env.GSO_BASE_URL ?? 'http://127.0.0.1:4173';
const adminEmail = process.env.GSO_SMOKE_ADMIN_EMAIL ?? 'ede.oliveira@confi.com.vc';
const auth = fs.readFileSync('docs/LOCAL_QA_AUTH.md', 'utf8');
const password = auth.match(new RegExp(`${adminEmail.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}[\\s\\S]*?senha:\\s*([^\\r\\n]+)`))?.[1]?.trim().replace(/^`|`$/g, '');
if (!password) throw new Error('QA password unavailable');

const baseSnapshot = {
  commercial: { total_deals: 19, open_deals: 13, won_deals: 1, lost_deals: 5, open_pipeline_value: 64741, won_revenue: 22800, conversion_rate: 0.1667, avg_ticket: 22800, avg_sales_cycle_days: 0, unassigned_deals: 0 },
  support: { total_tickets: 0, created_tickets: 0, open_tickets: 0, closed_tickets: 0, closed_rate: 0, high_priority_open: 0, first_response_sla_tracked: 0, close_sla_tracked: 0, source_filled: 0, by_pipeline: [] },
  finance: { titles: 0, net_amount: 0, balance: 0, overdue_titles: 0, overdue_balance: 0, matched_titles: 0, unmatched_titles: 0 },
  financial_alerts: [],
  data_quality: { finance_source_at: null, hubspot_source_at: new Date().toISOString() },
};
const history = { current_from: '2026-07-01', current_to: '2026-07-25', previous_from: '2026-06-06', previous_to: '2026-06-30', current: baseSnapshot, previous: { ...baseSnapshot, commercial: { ...baseSnapshot.commercial, won_deals: 0, won_revenue: 0, lost_deals: 2 } } };

const variants = {
  fresh: { ...baseSnapshot, status: 'fresh', last_successful_sync_at: new Date().toISOString() },
  stale: { ...baseSnapshot, status: 'stale', last_successful_sync_at: '2026-07-20T10:00:00.000Z', stale_after_minutes: 60, reason: 'A última atualização ultrapassou o prazo esperado.' },
  partial: { ...baseSnapshot, status: 'partial', partial: true, expected_count: 100, last_successful_sync_at: new Date().toISOString(), reason: 'Parte das fontes respondeu.' },
  empty: { ...baseSnapshot, status: 'empty', last_successful_sync_at: new Date().toISOString(), reason: 'Nenhum registro no período selecionado.' },
  'zero-real': { ...baseSnapshot, status: 'fresh', last_successful_sync_at: new Date().toISOString() },
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
await page.locator('input[type=email]').fill(adminEmail);
await page.locator('input[type=password]').fill(password);
await Promise.all([page.waitForURL((url) => !String(url).includes('/login'), { timeout: 20000 }).catch(() => {}), page.getByRole('button', { name: /Entrar|Validando/i }).click()]);
await page.waitForLoadState('networkidle').catch(() => {});

for (const [name, snapshot] of Object.entries(variants)) {
  await page.route('**/rest/v1/rpc/rpc_analytics_ceo_snapshot', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snapshot) }));
  await page.route('**/rest/v1/rpc/rpc_analytics_ceo_history', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...history, current: snapshot }) }));
  await page.goto(`${baseUrl}/admin/analytics`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Desempenho no período', { exact: true }).waitFor({ timeout: 30000 }).catch(() => {});
  await page.screenshot({ path: `output/playwright/dashboard-02-3-1-state-${name}.png`, fullPage: true });
  await page.unroute('**/rest/v1/rpc/rpc_analytics_ceo_snapshot');
  await page.unroute('**/rest/v1/rpc/rpc_analytics_ceo_history');
}

await page.route('**/rest/v1/rpc/rpc_analytics_ceo_snapshot', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'fixture error' }) }));
await page.route('**/rest/v1/rpc/rpc_analytics_ceo_history', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'fixture error' }) }));
await page.goto(`${baseUrl}/admin/analytics`, { waitUntil: 'domcontentloaded' });
await page.getByText('Tentar novamente', { exact: true }).waitFor({ timeout: 30000 }).catch(() => {});
await page.screenshot({ path: 'output/playwright/dashboard-02-3-1-state-error.png', fullPage: true });
await browser.close();
console.log('state screenshots captured');
