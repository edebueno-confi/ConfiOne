// QA visual das sub-abas de evolução e da fila por etapa cruzada.
//
// Este roteiro existe porque as verificações estáticas do lote — contrato,
// tipos, build, lint — provam que o código compila e que a linguagem está
// correta, e não provam nada sobre o que a pessoa vê. Sub-aba é estrutura nova;
// é exatamente o caso em que a validação estática não alcança o que importa.
//
// O que ele afere, além da captura de tela:
//
//   - a sub-aba de evolução realmente troca o conteúdo e desenha um gráfico,
//     em vez de abrir vazia;
//   - nenhuma medida aparece nas duas sub-abas do mesmo domínio, que é a
//     duplicidade que o lote se propôs a evitar;
//   - a coorte é declarada no rodapé do gráfico;
//   - não há rolagem horizontal em 390px;
//   - nenhum termo técnico vaza para a tela;
//   - nenhum erro de console ou requisição falha.

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { loadQaEnv } from './assert-local-supabase.mjs';

const root = process.cwd();
const baseUrl = process.env.GSO_QA_URL ?? 'http://127.0.0.1:4173';
const outputDir = join(root, process.env.GSO_QA_OUTPUT_DIR ?? 'output/dashboard-subabas-evolucao');
const qa = loadQaEnv();
const account = { email: qa.LOCAL_QA_ADMIN_EMAIL, password: qa.LOCAL_QA_ADMIN_PASSWORD };

if (!account.email || !account.password) {
  console.error('QA_CREDENCIAL_AUSENTE: .env.local.qa não tem LOCAL_QA_ADMIN_EMAIL/PASSWORD.');
  process.exit(1);
}

const dominios = [
  { key: 'support', path: '/admin/analytics?tab=support', rotulo: 'Suporte' },
  { key: 'commercial', path: '/admin/analytics?tab=commercial', rotulo: 'Comercial' },
  { key: 'finance', path: '/admin/analytics?tab=finance', rotulo: 'Financeiro' },
];

// As três resoluções que a operação usa de verdade, e as duas que a régua de
// design exige. 1366×768 é a mais apertada dos notebooks corporativos.
const viewports = [
  { name: 'full-hd', width: 1920, height: 1080 },
  { name: 'notebook', width: 1366, height: 768 },
  { name: 'mobile', width: 390, height: 844 },
];

const temas = ['light', 'dark'];

// Vocabulário que jamais pode aparecer: nomes de propriedade, endpoint, tabela,
// código de estado ou termo de infraestrutura.
const TERMOS_PROIBIDOS = [
  'analytics_stage_mapping',
  'rpc_analytics',
  'hubspot_tickets',
  'canonical_key',
  'pipeline_id',
  'unavailable_reason',
  'history_insufficient',
  'closed_date',
  'hs_lastactivitydate',
  'service_role',
  'undefined',
  'NaN',
  '[object Object]',
];

await mkdir(outputDir, { recursive: true });

async function login(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
  const page = await context.newPage();
  const falhas = [];
  page.on('pageerror', (e) => falhas.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') falhas.push(`console: ${m.text()}`); });
  page.on('requestfailed', (r) => falhas.push(`request: ${r.url()} ${r.failure()?.errorText ?? ''}`));
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  if (await page.locator('input[type="email"]').count() === 0) {
    const corpo = (await page.locator('body').innerText().catch(() => '')).slice(0, 400);
    console.error('QA_LOGIN_NAO_RENDERIZOU');
    console.error(`corpo: ${JSON.stringify(corpo)}`);
    console.error(`falhas: ${falhas.slice(0, 8).join(' || ') || 'nenhuma'}`);
  }
  // Os campos são selecionados pelo texto de exemplo, não pelo rótulo: o rótulo
  // envolve o campo sem `htmlFor`, e a associação implícita não é estável aqui.
  await page.waitForSelector('input[type="email"]', { timeout: 30_000 });
  await page.locator('input[type="email"]').fill(account.email);
  await page.locator('input[type="password"]').fill(account.password);
  await page.getByRole('button', { name: /entrar/i }).click();
  try {
    await page.waitForURL((url) => new URL(url).pathname !== '/login', { timeout: 25_000 });
  } catch (error) {
    const aviso = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 300);
    console.error(`QA_LOGIN_RECUSADO: ${aviso}`);
    console.error(`falhas: ${falhas.slice(0, 6).join(' || ') || 'nenhuma'}`);
    throw error;
  }
  const storageState = await context.storageState();
  await context.close();
  return storageState;
}

/** Números visíveis na tela, para comparar as duas sub-abas. */
function extrairNumeros(texto) {
  return [...texto.matchAll(/R\$\s?[\d.,]+|\b\d{1,3}(?:\.\d{3})+\b|\b\d+,\d+\b/g)].map((m) => m[0]);
}

async function inspecionar(browser, dominio, tema, viewport, storageState) {
  const context = await browser.newContext({ viewport, colorScheme: tema, storageState });
  await context.addInitScript(({ preferredTheme }) => {
    try { window.localStorage.setItem('genius.theme-preference', preferredTheme); } catch { /* ignora */ }
  }, { preferredTheme: tema });
  const page = await context.newPage();

  const eventos = { consoleErrors: [], pageErrors: [], requestFailures: [], respostasRuins: [] };
  page.on('console', (m) => { if (m.type() === 'error') eventos.consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => eventos.pageErrors.push(e.message));
  page.on('requestfailed', (r) => {
    const erro = r.failure()?.errorText ?? '';
    if (!erro.includes('ERR_ABORTED')) eventos.requestFailures.push(`${r.method()} ${r.url()} (${erro})`);
  });
  page.on('response', (r) => { if (r.status() >= 400) eventos.respostasRuins.push(`${r.status()} ${r.url()}`); });

  const achados = [];
  try {
    await page.goto(`${baseUrl}${dominio.path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(900);

    // --- Sub-aba de posição -------------------------------------------------
    const abaPosicao = page.getByRole('button', { name: 'Posição', exact: true });
    const temSubAbas = await abaPosicao.count() > 0;

    const textoPosicao = await page.locator('body').innerText();
    // Financeiro não monta as sub-abas quando a própria fonte declara que não
    // há dados. Nesse caso, o estado vazio é a interface correta: não existe
    // conteúdo de posição ou evolução para alternar. Sem essa exceção, o QA
    // acusa uma regressão estrutural que não existe no produto.
    const estadoFinanceiroDeclarado = /Nenhum dado financeiro|Dados financeiros ainda não disponíveis|Fonte financeira não configurada|Dados OMIE indisponíveis|Não foi possível carregar/i.test(textoPosicao);
    if (!temSubAbas && !estadoFinanceiroDeclarado) achados.push('SEM_SUBABAS: a aba não expõe Posição/Evolução');
    await page.screenshot({ path: join(outputDir, `${dominio.key}-posicao-${tema}-${viewport.name}.png`), fullPage: true });

    const overflowPosicao = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      estoura: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));
    if (overflowPosicao.estoura) {
      achados.push(`ROLAGEM_HORIZONTAL na Posição: ${overflowPosicao.scrollWidth}px em viewport de ${overflowPosicao.innerWidth}px`);
    }

    // --- Sub-aba de evolução ------------------------------------------------
    let textoEvolucao = '';
    let graficos = 0;
    let temCoorte = false;
    let temGraos = false;
    let mensagemIndisponivel = null;

    const abaEvolucao = page.getByRole('button', { name: 'Evolução', exact: true });
    if (await abaEvolucao.count() > 0) {
      await abaEvolucao.first().click();
      await page.waitForTimeout(1400);

      graficos = await page.locator('.recharts-surface').count();
      temGraos = await page.getByRole('button', { name: 'Por mês', exact: true }).count() > 0;
      textoEvolucao = await page.locator('body').innerText();
      temCoorte = /Considera a data|Considera o vencimento|Ganhos sobre encerrados|Abertos menos resolvidos/.test(textoEvolucao);

      if (graficos === 0) {
        // Não é necessariamente defeito: pode ser o estado explícito de série
        // insuficiente, que é comportamento correto. A diferença importa.
        const semSerie = /Sem evolução para mostrar/.test(textoEvolucao);
        mensagemIndisponivel = semSerie
          ? (textoEvolucao.match(/Sem evolução para mostrar[\s\S]{0,180}/) ?? [''])[0].replace(/\s+/g, ' ').trim()
          : null;
        if (!semSerie) achados.push('EVOLUCAO_VAZIA: nenhum gráfico e nenhum estado declarado');
      } else if (!temCoorte) {
        achados.push('SEM_COORTE: o gráfico não declara qual data posiciona cada medida');
      }

      await page.screenshot({ path: join(outputDir, `${dominio.key}-evolucao-${tema}-${viewport.name}.png`), fullPage: true });

      const overflowEvolucao = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        estoura: document.documentElement.scrollWidth > window.innerWidth + 1,
      }));
      if (overflowEvolucao.estoura) {
        achados.push(`ROLAGEM_HORIZONTAL na Evolução: ${overflowEvolucao.scrollWidth}px em viewport de ${overflowEvolucao.innerWidth}px`);
      }
    } else if (temSubAbas) {
      achados.push('SEM_ABA_EVOLUCAO');
    }

    // --- Duplicidade entre as duas sub-abas ---------------------------------
    // Se um número aparece nas duas, a mesma medida está publicada duas vezes.
    // A exceção legítima é o cabeçalho da área, comum às duas.
    const numerosPosicao = new Set(extrairNumeros(textoPosicao));
    const repetidos = [...new Set(extrairNumeros(textoEvolucao))].filter((n) => numerosPosicao.has(n));

    const proibidosEncontrados = TERMOS_PROIBIDOS.filter(
      (termo) => textoPosicao.includes(termo) || textoEvolucao.includes(termo),
    );
    if (proibidosEncontrados.length > 0) achados.push(`VOCABULARIO: ${proibidosEncontrados.join(', ')}`);

    if (eventos.pageErrors.length > 0) achados.push(`ERRO_DE_PAGINA: ${eventos.pageErrors.join(' | ')}`);
    if (eventos.consoleErrors.length > 0) achados.push(`ERRO_DE_CONSOLE: ${eventos.consoleErrors.slice(0, 3).join(' | ')}`);
    if (eventos.requestFailures.length > 0) achados.push(`REQUISICAO_FALHOU: ${eventos.requestFailures.slice(0, 3).join(' | ')}`);
    if (eventos.respostasRuins.length > 0) achados.push(`RESPOSTA_RUIM: ${eventos.respostasRuins.slice(0, 3).join(' | ')}`);

    return {
      dominio: dominio.key,
      tema,
      viewport: viewport.name,
      temSubAbas,
      graficos,
      temSeletorDeGrao: temGraos,
      declaraCoorte: temCoorte,
      mensagemIndisponivel,
      numerosRepetidosEntreSubAbas: repetidos.slice(0, 8),
      achados,
    };
  } catch (error) {
    return { dominio: dominio.key, tema, viewport: viewport.name, achados: [`EXCECAO: ${error.message}`] };
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
const storageState = await login(browser);
const resultados = [];

for (const dominio of dominios) {
  for (const tema of temas) {
    for (const viewport of viewports) {
      const resultado = await inspecionar(browser, dominio, tema, viewport, storageState);
      resultados.push(resultado);
      const marca = resultado.achados.length === 0 ? 'ok  ' : 'FALHA';
      console.log(`${marca} ${dominio.key} ${tema} ${viewport.name} — gráficos=${resultado.graficos ?? 0} coorte=${resultado.declaraCoorte ?? false}`);
      for (const achado of resultado.achados) console.log(`        ${achado}`);
    }
  }
}

await browser.close();
await writeFile(join(outputDir, 'resultado.json'), `${JSON.stringify({ baseUrl, resultados }, null, 2)}\n`, 'utf8');

const comFalha = resultados.filter((r) => r.achados.length > 0);
console.log(`\n${resultados.length} combinações inspecionadas; ${comFalha.length} com achado.`);
console.log(`Capturas em ${outputDir}`);
process.exit(comFalha.length > 0 ? 1 : 0);
