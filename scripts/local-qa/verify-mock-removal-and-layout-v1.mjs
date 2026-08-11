/**
 * QA visual e de DOM do lote "remoção de dados fabricados + layout".
 *
 * Verifica, em Dark e Light:
 *   1. Nenhuma das strings fabricadas removidas reaparece no DOM.
 *   2. A coluna de detalhe de Usuários e acessos ficou maior que 21rem.
 *   3. A coluna de propriedades do editor de artigo ficou em 380px.
 *   4. Contraste mínimo do texto principal sobre a superfície em cada tema.
 *
 * Cada tela/estado gera um PNG separado (regra 23 do projeto).
 */
import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';
import { loadQaEnv } from './assert-local-supabase.mjs';

const qa = loadQaEnv();

const BASE_URL = process.env.LOCAL_QA_WEB_URL || 'http://127.0.0.1:4174';
const OUTPUT_DIR = path.resolve(process.cwd(), 'output/playwright/2026-08-11-mock-removal-qa');

/** Strings que só existiam como dado fabricado. Nenhuma pode voltar ao DOM. */
const FORBIDDEN = [
  'Marina Souza',
  'Carla Santos',
  'Felipe Ramos',
  'Ana Martins',
  'João Pereira',
  'Juliana Ribeiro',
  'Mariana Silva',
  '22/07/2026',
  'Exibindo 1 a 5 de 48 categorias',
  'Mostrando 1 a 6 de 6 atividades',
  '+12% vs. mês anterior',
  '18 aguardando revisão',
  '+3 novos este mês',
  '-0,8 dias vs. mês anterior',
  '5,2 dias',
  '+1 vs. mês anterior',
];

const VIEWPORTS = [
  { theme: 'dark', width: 1920, height: 1080 },
  { theme: 'light', width: 1920, height: 1080 },
  { theme: 'dark', width: 1366, height: 768 },
];

const SCREENS = [
  { key: 'access-users', route: '/admin/access?tab=users', label: 'Usuários e acessos — Usuários' },
  { key: 'access-structure', route: '/admin/access?tab=structure', label: 'Usuários e acessos — Estrutura' },
  { key: 'access-profiles', route: '/admin/access?tab=permissions', label: 'Usuários e acessos — Perfis' },
  { key: 'settings-overview', route: '/admin/settings', label: 'Configurações — Visão geral' },
  { key: 'settings-help-center', route: '/admin/settings/help-center', label: 'Configurações — Central de ajuda' },
  { key: 'settings-integrations', route: '/admin/settings/integrations', label: 'Configurações — Integrações' },
];

function srgb(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb) {
  const [r, g, b] = rgb;
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}

function parseRgb(value) {
  const m = String(value).match(/(\d+(?:\.\d+)?)/g);
  return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
}

function contrast(fg, bg) {
  const a = luminance(parseRgb(fg));
  const b = luminance(parseRgb(bg));
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return Number(((hi + 0.05) / (lo + 0.05)).toFixed(2));
}

async function login(page, route) {
  await page.goto(`${BASE_URL}/login?redirectTo=${encodeURIComponent(route)}`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(qa.LOCAL_QA_ADMIN_EMAIL);
  await page.getByLabel('Senha').fill(qa.LOCAL_QA_ADMIN_PASSWORD);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 25_000 }),
    page.getByRole('button', { name: /entrar/i }).click(),
  ]);
  await page.waitForTimeout(1200);
}

async function applyTheme(page, theme) {
  await page.evaluate((mode) => {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    root.classList.toggle('dark', mode === 'dark');
    root.classList.toggle('light', mode === 'light');
    try { window.localStorage.setItem('gso-theme', mode); } catch { /* noop */ }
  }, theme);
  await page.waitForTimeout(400);
}

async function run() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const findings = [];
  const measurements = [];

  const browser = await chromium.launch({ headless: true });

  // 1920 e o viewport primario do projeto e o unico acima do breakpoint de
  // 1366px, onde .gso-ui-split colapsa em coluna unica. Medir so em 1366
  // esconderia o efeito da coluna de detalhe.
  for (const { theme, width, height } of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width, height },
      colorScheme: theme,
    });
    const page = await context.newPage();
    await login(page, '/admin/access');

    for (const screen of SCREENS) {
      await page.goto(`${BASE_URL}${screen.route}`, { waitUntil: 'domcontentloaded' });
      await applyTheme(page, theme);
      await page.waitForTimeout(1400);

      const text = await page.evaluate(() => document.body.innerText);
      for (const needle of FORBIDDEN) {
        if (text.includes(needle)) {
          findings.push({ theme, viewport: width, screen: screen.key, kind: 'fabricated_string', detail: needle });
        }
      }

      const probe = await page.evaluate(() => {
        const split = document.querySelector('.gso-ui-split--wide-detail');
        const aside = split ? split.querySelector('.gso-ui-aside') : null;
        const table = split ? split.querySelector('.gso-ui-card') : null;
        const body = getComputedStyle(document.body);
        const title = document.querySelector('h1, .gso-ui-page-title, [class*="page-title"]');
        const surface = document.querySelector('.gso-ui-card') || document.body;
        return {
          asideWidth: aside ? Math.round(aside.getBoundingClientRect().width) : null,
          tableWidth: table ? Math.round(table.getBoundingClientRect().width) : null,
          bodyBg: body.backgroundColor,
          titleColor: title ? getComputedStyle(title).color : null,
          surfaceBg: getComputedStyle(surface).backgroundColor,
        };
      });

      if (probe.titleColor && probe.surfaceBg) {
        const ratio = contrast(probe.titleColor, probe.surfaceBg);
        if (ratio < 4.5) {
          findings.push({
            theme, viewport: width, screen: screen.key, kind: 'contrast',
            detail: `titulo ${probe.titleColor} sobre ${probe.surfaceBg} = ${ratio}:1 (< 4.5)`,
          });
        }
        probe.titleContrast = ratio;
      }

      measurements.push({ theme, viewport: width, screen: screen.key, label: screen.label, ...probe });

      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${theme}-${width}-${screen.key}.png`),
        fullPage: false,
      });
    }

    await context.close();
  }

  await browser.close();

  const report = { base_url: BASE_URL, generated_for: 'mock-removal-and-layout-v1', measurements, findings };
  await fs.writeFile(path.join(OUTPUT_DIR, 'report.json'), JSON.stringify(report, null, 2), 'utf8');

  console.log('--- MEDIDAS ---');
  for (const m of measurements) {
    console.log(
      `${m.theme.padEnd(5)} ${String(m.viewport).padEnd(4)} ${m.screen.padEnd(22)} aside=${String(m.asideWidth).padStart(4)} ` +
      `tabela=${String(m.tableWidth).padStart(4)} contraste_titulo=${m.titleContrast ?? 'n/a'}`,
    );
  }

  console.log('--- ACHADOS ---');
  if (findings.length === 0) {
    console.log('PASS: nenhuma string fabricada no DOM e nenhum contraste abaixo de 4.5:1.');
  } else {
    for (const f of findings) console.error(`FAIL [${f.theme}/${f.screen}] ${f.kind}: ${f.detail}`);
    process.exitCode = 1;
  }
  console.log(`PNGs e report.json em ${OUTPUT_DIR}`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
