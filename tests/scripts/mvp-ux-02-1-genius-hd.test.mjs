import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync(
  "apps/web/src/features/analytics/AnalyticsCeoPage.tsx",
  "utf8",
);
const css = fs.readFileSync("apps/web/src/index.css", "utf8");
const shell = fs.readFileSync(
  "apps/web/src/features/analytics/AnalyticsShell.tsx",
  "utf8",
);

test("Canvas HD mantém as camadas gerenciais e os seis domínios", () => {
  for (const layer of [
    "gso-hd-pulse",
    "gso-hd-context",
    "gso-hd-ribbon",
    "gso-hd-current-strip",
    "gso-hd-domain-matrix",
    "gso-hd-integrity",
    "gso-hd-exceptions",
    "gso-hd-pipelines",
  ])
    assert.match(page, new RegExp(layer));
  for (const domain of [
    "Comercial",
    "Customer Success",
    "Suporte",
    "Financeiro",
    "Produto",
    "Desenvolvimento",
  ])
    assert.match(page, new RegExp(domain));
  assert.match(page, /GeniusMascot/);
  assert.match(page, /Fonte ainda não conectada/);
});

test("Canvas HD não fabrica indicadores e separa posição atual do recorte", () => {
  assert.match(page, /Posição atual, não afetada pelo período selecionado/);
  assert.match(page, /Não há registros no período selecionado/);
  assert.match(page, /Indisponível/);
  assert.doesNotMatch(page, /142\.800|1\.240|68%|R\$\s*142/);
});

test("responsividade, foco e reduced motion estão cobertos por tokens locais", () => {
  assert.match(css, /@media \(max-width: 1100px\)/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /gso-hd-canvas select:focus-visible/);
  assert.match(shell, /overflow-y-auto/);
});

test("dashboard viewer recebe os domínios executivos sem ações administrativas", () => {
  assert.match(shell, /const visibleDomains = DOMAINS/);
  assert.match(page, /isDashboardViewer/);
  assert.doesNotMatch(page, /Detalhamento restrito ao perfil/);
});
