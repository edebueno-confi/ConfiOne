// Captura dedicada do gráfico de fila por etapa cruzada.
//
// A captura de página inteira serve para conferir composição; ela não serve
// para ler um gráfico específico, que fica pequeno demais. Este roteiro recorta
// o cartão e confere o que o cruzamento realmente produziu: quantas etapas
// sobraram, quais foram consolidadas entre pipelines e se alguma permanece sem
// decisão humana.

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { loadQaEnv } from './assert-local-supabase.mjs';

const root = process.cwd();
const baseUrl = process.env.GSO_QA_URL ?? 'http://127.0.0.1:4173';
const outputDir = join(root, 'output/dashboard-fila-por-etapa');
const qa = loadQaEnv();

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, colorScheme: 'light' });
const page = await context.newPage();

await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('input[type="email"]', { timeout: 30_000 });
await page.locator('input[type="email"]').fill(qa.LOCAL_QA_ADMIN_EMAIL);
await page.locator('input[type="password"]').fill(qa.LOCAL_QA_ADMIN_PASSWORD);
await page.getByRole('button', { name: /entrar/i }).click();
await page.waitForURL((url) => new URL(url).pathname !== '/login', { timeout: 30_000 });

await page.goto(`${baseUrl}/admin/analytics?tab=support`, { waitUntil: 'domcontentloaded' });
await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
await page.waitForTimeout(1500);

const cartao = page.locator('section, div').filter({ hasText: 'Fila por etapa' }).last();
await cartao.scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
await cartao.screenshot({ path: join(outputDir, 'fila-por-etapa.png') });

// Rótulos do eixo, na ordem em que o gráfico os desenha.
const etapas = await page.locator('.recharts-yAxis .recharts-cartesian-axis-tick-value tspan').allInnerTexts();
const avisoNode = page.locator('text=/etapas? ainda (não foi|não foram) cruzada|aguardam revisão/');
const aviso = await avisoNode.count() > 0 ? (await avisoNode.first().innerText()).replace(/\s+/g, ' ') : null;

await writeFile(
  join(outputDir, 'resultado.json'),
  `${JSON.stringify({ etapasNoEixo: etapas, aviso }, null, 2)}\n`,
  'utf8',
);

console.log(`etapas desenhadas: ${etapas.length}`);
for (const etapa of etapas) console.log(`  - ${etapa}`);
console.log(`aviso: ${aviso ?? 'nenhum'}`);

await browser.close();
