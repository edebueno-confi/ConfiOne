# Lote 1 da dívida de lint e fechamento da higiene da raiz

Data: 2026-08-04
Checkout canônico: `C:\Projetos\GSO-old`
Branch: `codex/react-router-v8-migration-20260804`
Escopo: tooling de higiene da raiz e limpeza de lint sem impacto de comportamento.

## Resultado

| Indicador | Antes | Depois |
| --- | --- | --- |
| `npm run repository:check-root` | 1 violação | OK, nenhuma entrada fora da allowlist |
| `npm run lint` | 0 erros, 256 avisos | 0 erros, 240 avisos |
| `no-duplicate-imports` | 13 | 0 |
| Imports mortos removidos | — | 3 |

Nenhuma regra de ESLint foi afrouxada, nenhum `eslint-disable` foi inserido e
nenhuma lógica, contrato, rota, permissão, backend ou dado mudou.

## 1. Higiene da raiz

`eslint.config.js`, criado no lote de configuração do ESLint, era a única entrada
da raiz sem classificação. Pela `docs/ROOT_ARTIFACT_HYGIENE_POLICY.md` ele é
entrada canônica de tooling, não artefato transitório, portanto foi classificado
na allowlist em vez de movido.

- `scripts/ci/check-root-artifacts.mjs`: `eslint.config.js` adicionado a
  `DEFAULT_ALLOWED_ROOT_FILES`.
- `npm run repository:check-root` volta a sair limpo.
- `node --test tests/scripts/root-artifacts-hygiene.test.mjs`: 3 testes, 3 pass.

## 2. Lint: `no-duplicate-imports` zerado

Padrão encontrado: um `import type { ... }` e um `import { ... }` apontando para
o mesmo módulo, muitas vezes com um segundo import do mesmo caminho dezenas de
linhas depois. A correção uniformiza no padrão que o próprio código já usa,
`import { valor, type Tipo } from './modulo'`.

| Arquivo | Módulo consolidado |
| --- | --- |
| `features/analytics/AnalyticsCeoPage.tsx` | `@genius-support-os/contracts` e `./analytics-model` |
| `features/analytics/AnalyticsCommercialPage.tsx` | `./analytics-model` |
| `features/analytics/AnalyticsCsPage.tsx` | `react`, `./analytics-api` e `./analytics-model` |
| `features/analytics/AnalyticsFinancePage.tsx` | `./analytics-model` |
| `features/analytics/AnalyticsPipelineFilter.tsx` | `react` |
| `features/analytics/analytics-export.ts` | `./analytics-model` |
| `features/analytics/charts/AnalyticsCharts.tsx` | `../analytics-model` |
| `features/auth/AuthBootstrap.tsx` | `./auth-context` |
| `features/support/components/SupportTicketComposerSection.tsx` | `react` |
| `features/tenants/TenantsPage.tsx` | `../../contracts/admin-contracts` |

## 3. Lint: imports mortos removidos

Somente especificadores de import que o ESLint aponta como nunca usados:

- `features/support/components/SupportTicketAdvancedContextPanels.tsx`:
  `ReactNode`, `SupportTicketQueueItem` e `EvidenceFileChip`.

Nenhum componente, helper, estado ou handler foi apagado neste lote. Ver a
triagem abaixo para o motivo.

## 4. Triagem do que sobrou: 240 avisos

| Regra | Avisos | Classificação | Como tratar |
| --- | --- | --- | --- |
| `@typescript-eslint/no-unused-vars` | 145 | contém código morto e trabalho em andamento | exige decisão caso a caso: apagar ou religar |
| `react-hooks/rules-of-hooks` | 46 | risco de comportamento | `useEffectEvent` chamado fora de Effect; exige leitura de fluxo e QA autenticado |
| `react-hooks/exhaustive-deps` | 27 | risco de comportamento | dependências incompletas podem estar mascarando bugs ou evitando loops |
| `react-refresh/only-export-components` | 19 | somente DX de dev | separar exports não-componente em arquivos próprios |
| `jsx-a11y/no-autofocus` | 2 | decisão de UX/acessibilidade | avaliar foco inicial por tela |
| `no-unused-vars` (JS) | 1 | baixo | `features/analytics/analytics-cs-control.mjs` |

Concentração dos avisos:

- `features/support/SupportWorkspacePage.tsx`: 72
- `features/knowledge/KnowledgePage.tsx`: 59
- `features/admin/CustomerPortalAdminPage.tsx`: 16
- `features/tenants/TenantsPage.tsx`: 16
- `features/knowledge/KnowledgeArticleEditorPage.tsx`: 9

### Código morto que exige decisão explícita, não limpeza automática

Estes símbolos estão declarados e nunca usados. Apagar cada um é seguro do ponto
de vista de execução, mas alguns representam trabalho em andamento ou superfície
legada que pode ter valor. A decisão é de produto/engenharia:

| Arquivo | Símbolo | Natureza aparente |
| --- | --- | --- |
| `features/knowledge/KnowledgeArticleEditorPage.tsx:2577` | `LegacyRichTextArticleEditor` | editor legado inteiro |
| `features/knowledge/KnowledgeArticleEditorPage.tsx:4256` | `handleRemoveAssetReference` | handler de anexo desconectado da UI |
| `features/knowledge/KnowledgeArticleEditorPage.tsx:4660` | `handleInsertAsset` | handler de anexo desconectado da UI |
| `features/knowledge/KnowledgeArticleEditorPage.tsx:3807` | `publicationChecklistDone` | checklist de publicação não renderizado |
| `features/knowledge/KnowledgeArticleEditorPage.tsx:159,171,303,581,3757` | `formatFileSize`, `visibilityLabel`, `FormFieldLabel`, `calloutLabel`, `saveButtonLabel` | helpers e labels sem consumidor |
| `features/cs/CsPortfolioPage.tsx:138` | `CustomerListItem` | componente de lista sem consumidor |
| `features/support/components/SupportTicketAdvancedContextPanels.tsx:844` | `handoffSubmitting` | prop recebida e não usada; mexer altera contrato do componente |
| `features/analytics/AnalyticsUnavailablePages.tsx:20` | `_props` | parâmetro ignorado por convenção |
| `features/analytics/analytics-api.ts:577` e `analytics-cs-control.mjs:5` | `latestRun` | valor desestruturado e não consumido nos dois arquivos espelhados |
| `features/navigation/minimal-navigation.ts:39` | `hasAnyRole` | helper de permissão sem consumidor |

Observação sobre `_props`: o padrão de ignorar parâmetro por prefixo `_` só
deixaria de gerar aviso com `argsIgnorePattern` na configuração do ESLint. Isso
muda o contrato de lint de todo o monorepo e por isso não foi feito aqui; fica
como decisão para o lote de política de lint.

## 5. Validações executadas

| Comando | Resultado |
| --- | --- |
| `npm run repository:check-root` | OK |
| `node --test tests/scripts/root-artifacts-hygiene.test.mjs` | 3/3 pass |
| `npm run lint` | 0 erros, 240 avisos |
| `npm run web:typecheck` | pass |
| `npm run contracts:typecheck` | pass |
| `npm run web:build` | pass |
| `npm run local:qa:secret-scan` | 1972 arquivos, 0 correspondências |
| `npm run quality:changed` | aprovado, 0 findings |
| `npm audit --omit=dev` | 0 vulnerabilidades |

QA no navegador: `4173/login` e `4174/help/genius` renderizando sem erro de
console. `AuthBootstrap.tsx` está no caminho do login, portanto a consolidação de
import do `auth-context` foi exercitada na prática.

## 6. Limitações

- Analytics, Tenants e o workspace de Suporte são superfícies autenticadas e não
  foram verificadas no navegador por ausência de credencial autorizada. A
  cobertura dessas telas neste lote é typecheck e build, o que é adequado para
  alteração exclusiva de linha de import.
- Nenhum arquivo com avisos de hooks foi tocado.
- Nenhum segredo, token, JWT, cookie ou service role key foi lido ou exposto.
- Banco local preservado; sem push, merge, reset, clean, rebase ou cherry-pick.

## 7. Próximo lote recomendado

1. Decidir a triagem de código morto da tabela acima, arquivo por arquivo.
2. Atacar `SupportWorkspacePage.tsx` e `KnowledgePage.tsx` isoladamente, porque
   concentram 131 dos 240 avisos e misturam `unused-vars` com hooks.
3. Tratar `rules-of-hooks` e `exhaustive-deps` só com QA autenticado disponível.
