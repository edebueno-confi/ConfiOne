import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

function listSlugs() {
  const result = spawnSync(
    'docker',
    [
      'exec',
      '-i',
      'supabase_db_genius-support-os',
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-Atc',
      "select slug from public.knowledge_articles where status='published' and visibility='public' order by slug;",
    ],
    { encoding: 'utf8' },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || 'Não foi possível listar os artigos públicos.');
  }

  return result.stdout.split(/\r?\n/).map((slug) => slug.trim()).filter(Boolean);
}

const slugs = listSlugs();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const failures = [];

mkdirSync('output/playwright', { recursive: true });

for (const slug of slugs) {
  const errors = [];
  page.removeAllListeners('console');
  page.removeAllListeners('pageerror');
  page.removeAllListeners('requestfailed');
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => errors.push(request.url()));

  const response = await page.goto(`http://127.0.0.1:4175/help/genius/articles/${slug}`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  const state = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    text: document.body.innerText,
  }));

  if (!response || response.status() >= 400 || errors.length || state.overflow !== 0 || !state.text.includes('Genius Returns')) {
    failures.push({ slug, status: response?.status(), errors, overflow: state.overflow });
  }
}

await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://127.0.0.1:4175/help/genius/articles/como-configurar-o-calculo-do-estorno', {
  waitUntil: 'networkidle',
  timeout: 30000,
});
const mobileOverflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);

await browser.close();
console.log(JSON.stringify({ total: slugs.length, failures, mobileOverflow }, null, 2));
process.exitCode = failures.length || mobileOverflow !== 0 ? 1 : 0;
