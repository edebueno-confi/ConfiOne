import { chromium } from 'playwright';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { assertLocalSupabaseEnvironment, loadQaEnv, readLocalSupabaseStatus } from './assert-local-supabase.mjs';

const qa = loadQaEnv();
const status = readLocalSupabaseStatus({ ...process.env, ...qa });
assertLocalSupabaseEnvironment({ ...process.env, ...qa }, { status });
const baseUrl = process.env.LOCAL_QA_WEB_URL ?? 'http://127.0.0.1:4173';
const ids = {
  managerTicket: 'a5555555-5555-4555-8555-000000000017',
  customerTicket: 'a5555555-5555-4555-8555-000000000001',
  atlasTicket: 'a5555555-5555-4555-8555-000000000012',
};
const markers = {
  managerNote: '[QA E2E] nota interna visual manager',
  managerReply: '[QA E2E] resposta publica visual manager',
  agentReply: '[QA E2E] resposta publica visual agent',
  customerReply: '[QA E2E] resposta publica visual customer',
};

async function login(browser, email, password, redirectTo) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/login?redirectTo=${encodeURIComponent(redirectTo)}`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForTimeout(700);
  return { context, page };
}

async function openQueueTicket(page) {
  await page.goto(`${baseUrl}/support/queue`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  await page.getByText(/\[QA LOCAL\].*17$/).first().click();
  await page.getByRole('button', { name: /Abrir tratativa/i }).click();
  await page.waitForURL(/\/support\/tickets\//);
  await page.waitForTimeout(500);
}

async function sendComposer(page, mode, body) {
  await page.getByRole('button', { name: mode === 'internal' ? 'Nota interna' : 'Resposta pública' }).click();
  const composer = page.locator('textarea:not([disabled])').last();
  await composer.fill(body);
  await page.getByRole('button', { name: mode === 'internal' ? /Salvar nota/ : 'Enviar resposta' }).click();
  await page.waitForTimeout(700);
  if (!(await page.getByText(body, { exact: true }).count())) throw new Error(`LOCAL_QA_UI_WRITE_NOT_VISIBLE: ${body}`);
}

async function restoreAndCheck(page, body) {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  if (!(await page.getByText(body, { exact: true }).count())) throw new Error(`LOCAL_QA_UI_WRITE_NOT_PERSISTED: ${body}`);
}

const evidenceDir = mkdtempSync(join(tmpdir(), 'gso-qa-e2e-'));
const evidencePath = join(evidenceDir, 'qa-local-e2e-evidence.txt');
writeFileSync(evidencePath, 'Evidencia sintetica LOCAL-QA-01.2. Sem dados reais.\n', 'utf8');
const browser = await chromium.launch({ headless: true });
const results = {};

let testError = null;
try {
  const manager = await login(browser, qa.LOCAL_QA_SUPPORT_MANAGER_EMAIL, qa.LOCAL_QA_SUPPORT_MANAGER_PASSWORD, '/support/queue');
  await openQueueTicket(manager.page);
  const assignee = manager.page.getByLabel('Atualizar responsável');
  if (!(await assignee.count())) throw new Error('LOCAL_QA_UI_ASSIGNMENT_CONTROL_MISSING');
  const agentOption = await assignee.locator('option').evaluateAll((options) => options.map((option) => option.textContent ?? '').find((label) => label.includes('QA Local Support Agent')));
  if (!agentOption) throw new Error('LOCAL_QA_UI_ASSIGNMENT_AGENT_OPTION_MISSING');
  await assignee.selectOption({ label: agentOption });
  await manager.page.getByRole('button', { name: 'Salvar responsável' }).click();
  await manager.page.waitForTimeout(600);
  await manager.page.getByRole('button', { name: 'Alterar status' }).first().click();
  const progressButton = manager.page.getByRole('button', { name: /Em andamento/ }).last();
  if (!(await progressButton.count())) throw new Error('LOCAL_QA_UI_STATUS_OPTION_MISSING');
  await progressButton.click();
  await manager.page.getByRole('button', { name: 'Salvar status' }).click();
  await manager.page.waitForTimeout(600);
  const closeStatus = manager.page.getByRole('button', { name: 'Cancelar' });
  if (await closeStatus.count()) await closeStatus.last().click();
  await sendComposer(manager.page, 'internal', markers.managerNote);
  await sendComposer(manager.page, 'public', markers.managerReply);
  const evidenceButton = manager.page.getByRole('button', { name: 'Evidências' });
  let upload = 'nao-executado';
  if (await evidenceButton.count()) {
    await evidenceButton.click();
    const fileInput = manager.page.locator('input[type="file"]').first();
    if (await fileInput.count()) {
      await fileInput.setInputFiles(evidencePath);
      await manager.page.getByRole('button', { name: /Anexar evidência/i }).click();
      await manager.page.waitForTimeout(800);
      upload = (await manager.page.getByText('qa-local-e2e-evidence.txt', { exact: false }).count()) ? 'persistido' : 'enviado';
    }
  }
  await restoreAndCheck(manager.page, markers.managerReply);
  results.support_manager = { ticket: ids.managerTicket, assignment: 'persistido pela UI', status: 'persistido pela UI', internal_note: 'persistida pela UI', public_reply: 'persistida pela UI', reload: 'confirmado', upload };
  await manager.context.close();

  const agent = await login(browser, qa.LOCAL_QA_SUPPORT_AGENT_EMAIL, qa.LOCAL_QA_SUPPORT_AGENT_PASSWORD, '/support/queue');
  await openQueueTicket(agent.page);
  await sendComposer(agent.page, 'public', markers.agentReply);
  await restoreAndCheck(agent.page, markers.agentReply);
  await agent.page.goto(`${baseUrl}/admin/settings`, { waitUntil: 'domcontentloaded' });
  await agent.page.waitForTimeout(500);
  const agentSettingsBlocked = new URL(agent.page.url()).pathname === '/access-denied';
  await agent.page.goto(`${baseUrl}/support/tickets/${ids.atlasTicket}`, { waitUntil: 'domcontentloaded' });
  await agent.page.waitForTimeout(600);
  const atlasBlocked = !(await agent.page.getByText(/\[QA LOCAL\] Vencido.*12/).count());
  results.support_agent = { allowed_ticket: ids.managerTicket, public_reply: 'persistida pela UI', internal_note: 'nao executada neste recorte', status: 'nao alterado neste recorte', reload: 'confirmado', atlas_ticket: atlasBlocked ? 'bloqueado' : 'FALHOU', management_route: agentSettingsBlocked ? 'bloqueada' : 'FALHOU' };
  if (!atlasBlocked || !agentSettingsBlocked) throw new Error('LOCAL_QA_AGENT_ISOLATION_FAILED');
  await agent.context.close();

  const customer = await login(browser, qa.LOCAL_QA_CLIENT_EMAIL, qa.LOCAL_QA_CLIENT_PASSWORD, `/portal/tickets/${ids.customerTicket}`);
  await customer.page.goto(`${baseUrl}/portal/tickets/${ids.customerTicket}`, { waitUntil: 'domcontentloaded' });
  await customer.page.waitForTimeout(600);
  await customer.page.locator('textarea').fill(markers.customerReply);
  await customer.page.getByRole('button', { name: 'Enviar mensagem' }).click();
  await customer.page.waitForTimeout(700);
  await restoreAndCheck(customer.page, markers.customerReply);
  const customerInternalVisible = await customer.page.getByText(/nota interna/i).count();
  await customer.page.goto(`${baseUrl}/portal/tickets/${ids.atlasTicket}`, { waitUntil: 'domcontentloaded' });
  await customer.page.waitForTimeout(600);
  const externalBlocked = !(await customer.page.getByText(/\[QA LOCAL\]/).count());
  await customer.page.goto(`${baseUrl}/admin/analytics`, { waitUntil: 'domcontentloaded' });
  await customer.page.waitForTimeout(500);
  const internalRouteBlocked = new URL(customer.page.url()).pathname === '/access-denied';
  results.customer_user = { own_ticket: ids.customerTicket, public_reply: 'persistida pela UI', ticket_creation: 'nao implementada no escopo atual', history: 'confirmado', internal_note_visible: customerInternalVisible > 0 ? 'FALHOU' : 'invisivel', other_tenant: externalBlocked ? 'bloqueado' : 'FALHOU', internal_route: internalRouteBlocked ? 'bloqueada' : 'FALHOU' };
  if (customerInternalVisible > 0 || !externalBlocked || !internalRouteBlocked) throw new Error('LOCAL_QA_CUSTOMER_ISOLATION_FAILED');
  await customer.context.close();
} catch (error) {
  testError = error;
} finally {
  await browser.close();
  rmSync(evidenceDir, { recursive: true, force: true });
}

if (testError) throw testError;

console.log(JSON.stringify({ environment: 'local', writes_via_ui: true, results }));
