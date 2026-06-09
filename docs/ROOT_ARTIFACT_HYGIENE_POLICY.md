# ROOT_ARTIFACT_HYGIENE_POLICY.md

## Objetivo

Definir uma política operacional simples para artefatos locais, evidências de QA, dumps, outputs temporários e quarentena em `C:\Projetos\Genius-Support-OS`, sem misturar material transitório com a estrutura canônica do repositório.

Esta política nasce ancorada em duas fontes já aprovadas:

- `docs/reports/REPOSITORY_SANITIZATION_REPORT.md`
- `docs/DOCUMENTATION_GOVERNANCE_RUNBOOK.md`

A auditoria estrutural confirmou que a raiz voltou a acumular artefatos soltos após rodadas de QA e exploração visual. O runbook documental exige transformar esse drift em regra operacional explícita, não em observação informal.

## Achado que motivou a política

Snapshot operacional da raiz durante esta task:

- 113 screenshots/PNGs soltos na raiz (`~32.67 MB`)
- 25 dumps temporários soltos em `json/md/cjs`
- 14 logs/dumps locais adicionais (`~1.25 MB`)
- famílias dominantes:
  - `build-journal-*`
  - `support-ticket-*`
  - `help-genius-*`
  - `product-docs-*`
  - `internal-actions-*`
- diretórios temporários locais ativos na raiz:
  - `.playwright-mcp/`
  - `.tmp/`
  - múltiplos `.tmp-*` de execução/QA

Conclusão operacional: a raiz está funcionando como área de despejo para evidências e saídas temporárias, o que conflita com `REPOSITORY_STRUCTURE.md` e piora revisão, auditoria e higiene de Git.

## Regra-mãe

```text
raiz do repositório é reservada para entradas canônicas de operação e código; artefato transitório não nasce nem permanece na raiz
```

## O que pode existir na raiz

A raiz deve conter apenas:

- arquivos canônicos de entrada do repositório
  - `README.md`
  - `package.json`
  - `package-lock.json`
  - `.gitignore`
  - `.env.example`
  - `PRODUCT.md`
  - `DESIGN.md`
- diretórios canônicos já definidos em `REPOSITORY_STRUCTURE.md`
  - `apps/`
  - `docs/`
  - `packages/`
  - `scripts/`
  - `supabase/`
  - `tests/`
  - `raw_knowledge/`
  - `.github/`
  - `.skills/`
- diretórios locais explicitamente temporários e ignorados
  - `.tmp/`
  - `.playwright-mcp/`
  - outros `/.tmp-*` quando realmente necessários

Qualquer `png`, `jpg`, `webp`, `json`, `md`, `log`, `out`, `err`, `html` ou dump operacional fora dessas exceções deve ser tratado como desvio.

## Destino por categoria

| Categoria | Exemplos observados | Destino correto | Regra de versionamento |
|---|---|---|---|
| Relatório operacional versionado | auditorias, backlog estruturado, review pack, plano de estabilização | `docs/reports/` | versionar quando sustentar continuidade real |
| Blueprint/asset visual aprovado | screenshots finais que documentam blueprint aceito | `docs/design/blueprint/<area>/` | versionar só o conjunto final aprovado |
| Evidência transitória de QA visual | screenshots de passagem, before/after, viewport checks | `.tmp/qa/<surface>/<run-id>/` | não versionar por padrão |
| Métricas/dumps de execução local | `*-metrics.json`, `*-debug.json`, snapshots markdown, fixtures temporárias | `.tmp/runs/<surface>/<run-id>/` | não versionar por padrão |
| Logs locais | `*.log`, `*.out`, `*.err` | `.tmp/logs/<tool-or-surface>/` | nunca versionar |
| Cache de automação/browser | `.playwright-mcp/`, relatórios brutos de tooling | diretório ignorado próprio da ferramenta ou `.tmp/browser/<tool>/` | nunca versionar |
| Quarentena de artefato ambíguo | pacote que ainda não se sabe se vira doc oficial, evidência ou lixo | `.tmp/quarantine/<yyyy-mm-dd>-<slug>/` | não versionar até decisão explícita |

## Convenções de naming

### Evidência transitória

Usar:

```text
<surface>--<scenario>--<viewport>--<state>.<ext>
```

Exemplos:

- `support-ticket--drawer-evidence--1440w--after-fix.png`
- `help-home--anonymous-search--mobile--baseline.md`
- `support-queue--qa-pass--local.json`

Evitar:

- `final-final-v2.png`
- `debug2.json`
- `current.png`
- `snapshot-seq.md`

### Diretórios de run

Usar:

```text
.tmp/<bucket>/<surface>/<yyyy-mm-dd>--<short-run-name>/
```

Exemplos:

- `.tmp/qa/support-ticket/2026-05-20--drawer-width-pass/`
- `.tmp/runs/help-center/2026-05-20--mobile-baseline/`
- `.tmp/logs/web/2026-05-20--vite-local/`

## Regras de retenção

### 1. Evidência transitória de QA

- manter apenas durante a task ativa, revisão imediata ou handoff curto;
- após fechamento da task, remover ou consolidar em até 7 dias;
- se a evidência for necessária para rastreabilidade, promover um pacote enxuto para `docs/reports/` ou `docs/design/blueprint/`, não a pasta inteira de tentativa.

### 2. Review packs e artefatos de decisão

- podem ser versionados em `docs/reports/` quando servirem de insumo real para revisão humana;
- devem conter só o mínimo necessário para a decisão;
- retenção: até a decisão ser absorvida por doc canônico, checkpoint ou implementação validada.

### 3. Logs e dumps locais

- retenção curta, local e ignorada;
- remover ao fim do diagnóstico ou no máximo em 7 dias;
- se um erro precisar virar histórico, registrar o resumo no relatório ou ledger, não o log bruto.

### 4. Quarentena

- usar quando o destino ainda não estiver claro;
- cada pasta de quarentena deve ter um `README.md` curto com origem, motivo e decisão pendente;
- retenção máxima recomendada: 14 dias antes de triagem explícita.

## Guardrails obrigatórios

### Guardrail 1 — raiz limpa por padrão

Nenhum worker deve deixar na raiz artefatos de QA, screenshots, dumps de browser ou logs como saída padrão.

### Guardrail 2 — versionar só o que tem função operacional durável

Se o artefato não ajuda alguém a continuar o projeto na semana seguinte, ele não deve ir para `docs/` nem para Git.

### Guardrail 3 — evidência final é curada, não a sequência inteira de tentativas

Ao promover evidência, guardar apenas:

- versão final aprovada; ou
- conjunto mínimo de before/after indispensável.

Nunca promover séries completas de `v2`, `pass2`, `final-check`, `debug`, `current`, salvo quando a própria análise comparativa for o deliverable.

### Guardrail 4 — sanitização antes de retenção

Logs, screenshots e dumps não devem preservar tokens, URLs sensíveis, dados pessoais ou payloads brutos além do estritamente necessário.

### Guardrail 5 — relatório aponta para evidência; não substitui classificação

Se um relatório citar evidência externa, ele deve apontar para um destino estável (`docs/reports/...` ou `docs/design/...`) ou afirmar explicitamente que a evidência é transitória em `.tmp/...`.

### Guardrail 6 — ferramentas automáticas devem apontar para `.tmp/`

Scripts, Playwright, capturas manuais e dumps auxiliares devem configurar saída padrão em subpastas de `.tmp/` sempre que houver controle do caminho.

## Checklist operacional por task

Antes de fechar qualquer lote com QA, blueprint ou exploração visual, verificar:

- houve geração de screenshot, dump, markdown de snapshot ou log local?
- o arquivo nasceu fora da raiz?
- o que precisa sobreviver virou doc/reporte/asset curado?
- o que é só temporário ficou em `.tmp/`?
- existe algum artefato ambíguo que precisa de quarentena explícita?
- o handoff cita apenas artefatos que têm destino correto?

## Backlog recomendado de saneamento

Esta task não move nem apaga artefatos. O saneamento fica como backlog explícito:

1. varrer e classificar a raiz atual por família (`build-journal`, `support-ticket`, `help-genius`, `product-docs`, `internal-actions`);
2. promover apenas artefatos finais aprovados para `docs/design/blueprint/<area>/` ou `docs/reports/`;
3. mover dumps temporários restantes para `.tmp/runs/...` ou `.tmp/quarantine/...`;
4. remover logs residuais da raiz após triagem e sanitização;
5. revisar scripts/QA para forçar saída padrão em `.tmp/`;
6. adicionar verificação automatizada de higiene da raiz em checklist/CI local, se o volume voltar a crescer.

## Relação com a governança documental

Esta política complementa o runbook documental da seguinte forma:

- `PROJECT_STATE.md` registra a existência da política e o risco estrutural atual;
- `DOCUMENTATION_LEDGER.md` guarda a trilha desta decisão operacional;
- `docs/README.md` indexa a política para uso recorrente;
- tasks futuras de saneamento devem nascer como cards explícitos no Kanban, não como comentário solto.

## Critério de pronto

A política estará operando corretamente quando:

- a raiz voltar a conter apenas entradas canônicas e diretórios temporários ignorados;
- evidências transitórias nascerem em `.tmp/` por padrão;
- evidências duráveis forem curadas para `docs/reports/` ou `docs/design/`;
- quarentena for usada para ambiguidade real, com triagem curta;
- novos lotes deixarem menos artefatos soltos do que deixam hoje.
