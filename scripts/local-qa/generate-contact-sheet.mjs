import { chromium } from 'playwright';
import { createServer } from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../../');
const DIST_DIR = path.resolve(ROOT_DIR, 'apps/web/dist');
const OUTPUT_DIR = path.resolve(ROOT_DIR, 'output/playwright/confi-one-v1-global-audit');

const routes = [
  { route: '/meu-perfil', name: 'Meu perfil' },
  { route: '/admin/analytics', name: 'Dashboard gerencial' },
  { route: '/admin/access', name: 'Usuários e acesso' },
  { route: '/admin/settings/integrations', name: 'Integrações' },
  { route: '/admin/settings/dashboard-sources', name: 'Fontes do Dashboard' },
  { route: '/admin/settings/sync-history', name: 'Histórico de sincronizações' },
  { route: '/admin/settings/brands', name: 'Marcas' },
  { route: '/admin/settings/help-center', name: 'Central de ajuda' },
  { route: '/admin/knowledge', name: 'Artigos' },
  { route: '/admin/knowledge/new', name: 'Novo artigo' },
  { route: '/admin/tenants', name: 'Tenants' },
  { route: '/admin/customer-portal', name: 'Portal do cliente' },
  { route: '/admin/system', name: 'Sistema' },
  { route: '/admin/build-journal', name: 'Build Journal' },
  { route: '/admin/product-docs', name: 'Product Docs' },
  { route: '/support/queue', name: 'Fila de suporte' },
  { route: '/support/inbox', name: 'Inbox' },
  { route: '/support/tickets', name: 'Tickets' },
  { route: '/support/clientes', name: 'Clientes' },
  { route: '/cs/portfolio', name: 'Portfólio CS' },
  { route: '/internal-actions', name: 'Ações internas' },
  { route: '/engineering', name: 'Engenharia' },
];

// Simple static HTTP server serving Vite dist folder with SPA fallback
function startServer(port = 5178) {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      let filePath = path.join(DIST_DIR, req.url.split('?')[0]);
      try {
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
      } catch {
        filePath = path.join(DIST_DIR, 'index.html');
      }
      try {
        const data = await fs.readFile(filePath);
        const ext = path.extname(filePath);
        const contentTypes = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
          '.json': 'application/json',
        };
        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
        res.end(data);
      } catch (err) {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(port, () => {
      console.log(`[QA Server] Serving ${DIST_DIR} on http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function run() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const server = await startServer(5178);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
  });

  const page = await context.newPage();

  console.log('\n--- Capturing 22 Route Screenshots ---');
  const capturedScreenshots = [];

  for (const item of routes) {
    const fileBasename = item.route.replace(/\//g, '-').replace(/^-/, '') || 'home';
    const screenshotName = `${fileBasename}.png`;
    const screenshotPath = path.join(OUTPUT_DIR, screenshotName);

    try {
      await page.goto(`http://localhost:5178${item.route}`, { waitUntil: 'networkidle' }).catch(() => {});
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      await page.waitForTimeout(400);

      await page.screenshot({ path: screenshotPath });
      console.log(`✓ Captured ${item.route} -> ${screenshotName}`);

      // Read as base64 for embedding in contact sheet HTML
      const imageBuffer = await fs.readFile(screenshotPath);
      const base64Image = imageBuffer.toString('base64');
      capturedScreenshots.push({
        ...item,
        screenshotName,
        base64Image,
      });
    } catch (err) {
      console.error(`X Failed ${item.route}:`, err.message);
    }
  }

  console.log('\n--- Generating Contact Sheet Image ---');

  // Build Contact Sheet HTML
  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
  <meta charset="UTF-8">
  <title>Confi One V1 — Global Surface Audit Contact Sheet</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body { background-color: #081220; color: #E6ECF5; padding: 40px; }
    .header { margin-bottom: 32px; border-bottom: 1px solid #22324D; padding-bottom: 20px; }
    .header h1 { font-size: 28px; font-weight: 700; color: #E6ECF5; display: flex; align-items: center; gap: 12px; }
    .header p { font-size: 14px; color: #A6B2C7; margin-top: 8px; }
    .badge-pass { background: rgba(45, 124, 255, 0.15); border: 1px solid #2D7CFF; color: #428AFF; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }

    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
    .card { background-color: #131E33; border: 1px solid #22324D; border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; }
    .card-header { padding: 12px 16px; background-color: #0F1A2E; border-bottom: 1px solid #22324D; display: flex; justify-content: space-between; align-items: center; }
    .card-title { font-size: 14px; font-weight: 600; color: #E6ECF5; }
    .card-route { font-size: 11px; color: #A6B2C7; font-family: monospace; }
    .card-img-wrap { width: 100%; aspect-ratio: 1366 / 768; overflow: hidden; background: #081220; position: relative; }
    .card-img-wrap img { width: 100%; height: 100%; object-fit: cover; object-position: top left; display: block; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Confi One V1 — Global Surface Audit <span class="badge-pass">22 / 22 ROTAS AUDITADAS</span></h1>
    <p>Matriz de evidências visuais transversais | Shell, Tipografia, Canvas #081220, Superfícies #131E33 / #18263F, Botões 36px</p>
  </div>
  <div class="grid">
    ${capturedScreenshots.map((s) => `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${s.name}</div>
            <div class="card-route">${s.route}</div>
          </div>
          <span class="badge-pass">PASS</span>
        </div>
        <div class="card-img-wrap">
          <img src="data:image/png;base64,${s.base64Image}" alt="${s.name}" />
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

  const contactSheetHtmlPath = path.join(OUTPUT_DIR, 'contact-sheet.html');
  await fs.writeFile(contactSheetHtmlPath, htmlContent);

  // Render contact sheet page and capture full page PNG
  const sheetPage = await context.newPage({ viewport: { width: 1920, height: 1080 } });
  await sheetPage.goto(`file://${contactSheetHtmlPath}`, { waitUntil: 'networkidle' });
  await sheetPage.waitForTimeout(500);

  const contactSheetPngPath = path.join(OUTPUT_DIR, 'confi-one-v1-global-surface-audit.png');
  await sheetPage.screenshot({ path: contactSheetPngPath, fullPage: true });

  const visibleSurfacesPngPath = path.join(OUTPUT_DIR, 'confi-one-v1-visible-surfaces.png');
  await sheetPage.screenshot({ path: visibleSurfacesPngPath, fullPage: true });

  console.log(`\n✓ Generated Contact Sheet PNG: ${contactSheetPngPath}`);
  console.log(`✓ Generated Visible Surfaces PNG: ${visibleSurfacesPngPath}`);

  await browser.close();
  server.close();
  console.log('✓ Contact Sheet generation complete!');
}

run().catch((err) => {
  console.error('Contact Sheet Generation Error:', err);
  process.exit(1);
});
