// Confere que o servidor de desenvolvimento monta a aplicação.
//
// Existe porque o dev server pode responder 200 com o HTML correto e ainda
// assim entregar tela em branco: basta um erro no preâmbulo de Fast Refresh
// para nenhum módulo React executar. Checar o código de status não detecta isso.

import { chromium } from 'playwright';

const baseUrl = process.env.GSO_DEV_URL ?? 'http://127.0.0.1:4173';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const erros = [];
page.on('pageerror', (e) => erros.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });

await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);

const montou = await page.locator('#root *').count() > 0;
const temFormulario = await page.locator('input[type="email"]').count() > 0;

console.log(`aplicação montou: ${montou}`);
console.log(`formulário de acesso presente: ${temFormulario}`);
console.log(`erros: ${erros.length === 0 ? 'nenhum' : erros.slice(0, 5).join(' | ')}`);

await browser.close();
process.exit(montou && temFormulario ? 0 : 1);
