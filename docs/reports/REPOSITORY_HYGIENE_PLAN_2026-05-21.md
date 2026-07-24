# Plano de higiene e reorganização do repositório — 2026-05-21

## Objetivo

Organizar artefatos soltos e áreas auxiliares sem quebrar o funcionamento do projeto, preservando runtime, código-fonte e histórico útil.

## Diagnóstico objetivo

### 1. `docs/GPT` estava fora do papel esperado

Achado:
- a pasta devia servir como pacote enxuto para upload no GPT;
- na prática, acumulou:
  - cópias de 25 documentos canônicos;
  - manifesto/índices auxiliares;
  - shadow tree com `.skills/`, `apps/web/src/*`, `design/` e `docs/design/*`;
  - documentos extras fora da seleção oficial.

Risco:
- drift silencioso entre fonte canônica e cópia paralela;
- confusão entre material de contexto, diagnóstico e documentação viva;
- pasta de upload maior e mais ruidosa do que o necessário.

### 2. A raiz ainda recebe artefatos visuais transitórios

Snapshot observado nesta rodada:
- `help-genius-octadesk-article.png`
- `help-genius-octadesk-published.png`

Risco:
- poluição da raiz;
- mistura entre entradas canônicas e evidências transitórias.

### 3. Existem scratch dirs grandes que parecem locais de QA

Famílias observadas:
- `.tmp-edge-ticket-drawers*`
- `.playwright-mcp/`
- `.tmp/`

Leitura operacional:
- essas pastas são coerentes com a política atual de scratch local;
- como podem estar servindo a debugging/QA recente, não devem ser movidas em lote sem uma triagem própria.

## Ações aplicadas nesta rodada

### `docs/GPT`

Aplicado:
- reconstruída como pacote limpo de 25 markdowns;
- pacote atual contém somente os arquivos selecionados pela curadoria oficial;
- o shadow tree anterior foi movido para:
  - `C:\Trabalho\.tmp\quarantine\2026-05-21--docs-gpt-shadow-tree`

Critério:
- manter upload simples;
- preservar histórico sem continuar misturando material auxiliar com pacote de contexto.

### Raiz

Aplicado:
- screenshots soltos foram movidos para:
  - `C:\Trabalho\.tmp\qa\help-center\2026-05-21--octadesk-publish`

Critério:
- a raiz volta a conter apenas entradas canônicas;
- evidência visual transitória fica em bucket temporário apropriado.

## Plano recomendado por fase

### Fase 1 — manter `docs/GPT` enxuto

Regra:
- `docs/GPT` deve continuar com exatamente 25 markdowns planos;
- se a seleção mudar, a cópia deve ser refeita a partir de `docs/`, nunca editada manualmente em paralelo.

### Fase 2 — sanear artefatos da raiz continuamente

Regra:
- qualquer screenshot, dump, log ou saída operacional nova deve nascer em `.tmp/`;
- só promover para `docs/reports/` ou `docs/design/` o que realmente vira evidência durável.

### Fase 3 — triagem dedicada das pastas `.tmp-edge-*`

Executar em lote separado:
1. identificar quais runs ainda servem como evidência útil;
2. consolidar só o mínimo necessário;
3. apagar o restante ou reagrupar em `.tmp/qa/support-ticket/...`.

Motivo:
- hoje elas parecem scratch válido, não lixo comprovado;
- mover agora sem triagem pode quebrar rastreabilidade de debugging recente.

### Fase 4 — automatizar a reconstrução do pacote GPT

Melhoria recomendada:
1. manter a allowlist em um manifesto canônico fora de `docs/GPT`;
2. adicionar script simples de sync/copiar os 25 arquivos;
3. opcionalmente validar contagem exata no workflow local.

## Critério de pronto desta rodada

Considero esta rodada pronta quando:
- `docs/GPT` contém apenas os 25 arquivos esperados;
- a shadow tree antiga foi preservada fora da pasta de upload;
- a raiz não tem mais os screenshots soltos identificados nesta análise;
- nenhuma pasta de código/runtime foi movida sem evidência de segurança.
