# QA autenticado destravado, auditoria no gate e lote 3 de lint

Data: 2026-08-04
Checkout canônico: `C:\Projetos\GSO-old`
Branch: `codex/react-router-v8-migration-20260804`
Lotes anteriores do dia: advisory react-router, migração para react-router 8,
higiene da raiz e lotes 1 e 2 da dívida de lint.

## Resultado

| Indicador | Antes | Depois |
| --- | --- | --- |
| QA autenticado real | indisponível em 4 relatórios | **10 cenários aprovados** |
| Auditoria de dependência em gate | nenhuma | `security:audit:prod` em `fast`, `staged` e `full` |
| `npm run lint` | 0 erros, 216 avisos | 0 erros, **196** avisos |

Acumulado do dia: 256 avisos para 196, `npm audit --omit=dev` de 2 altas para 0 e
higiene da raiz de 1 violação para OK.

## Lote 1: QA autenticado local destravado

A limitação que eu vinha declarando, ausência de credencial autorizada, estava
resolvida no próprio repositório. O harness oficial já existia e funciona.

### Como funciona

- `.env.local.qa` guarda as senhas locais de QA e não é versionado.
- `npm run local:qa:smoke:auth` autentica 5 papéis direto no Auth do Supabase
  local. Resultado: `admin`, `dashboard_viewer`, `support_manager`,
  `support_agent` e `customer_user` autenticados.
- `npm run local:qa:smoke` sobe o Vite, autentica cada papel com Playwright em
  desktop e mobile, valida rota esperada, ausência de overflow horizontal,
  bloqueio de rota administrativa e console limpo, e grava capturas em
  `output/local-qa/`.

Nenhuma senha foi lida, digitada manualmente ou registrada. O harness lê as
variáveis do arquivo ignorado e as usa dentro do próprio processo.

### Evidência obtida

10 cenários, 5 papéis em 2 viewports, todos com `consoleErrors: 0`,
`pageErrors: 0`, `requestFailures: 0` e `unexpectedResponses: 0`:

| Papel | Rota final | Observação |
| --- | --- | --- |
| `platform_admin` | `/admin/analytics` | Dashboard Gerencial renderiza com dados reais |
| `dashboard_viewer` | `/admin/analytics` | escopo de leitura confirmado, sem ações administrativas |
| `support_manager` | `/access-denied` | manifesto de release não publica a superfície |
| `support_agent` | `/access-denied` | idem |
| `customer_user` | `/access-denied` | rota interna bloqueada |

Isso fecha, com evidência autenticada, a lacuna de QA da migração para
`react-router@8`: o roteamento novo foi exercitado em telas privadas, com gates
de acesso funcionando.

### Requisito operacional descoberto

O harness precisa da porta 4173 livre, porque sobe o próprio servidor. O
procedimento seguro é: derrubar a instância 4173, rodar o smoke, subir a
instância de novo. A instância 4174 pode continuar de pé.

`NODE_ENV` precisa estar em `development`. Com `NODE_ENV=production` o Vite sobe
sem o preâmbulo do React Refresh, a tela fica branca e o login do harness falha
sem relação com credencial.

## Lote 2: auditoria de dependência no quality gate

O advisory GHSA-qwww-vcr4-c8h2 passou meses invisível porque nenhum gate rodava
auditoria. Agora roda.

Arquivos:

- `scripts/ci/check-dependency-advisories.mjs`: executa
  `npm audit --omit=dev --json`, classifica o resultado e falha somente com
  vulnerabilidade `high` ou `critical` em dependência de produção. Se o registry
  estiver indisponível, imprime `INDISPONÍVEL` e diz explicitamente para não
  tratar como aprovação, em vez de passar em falso.
- `tests/scripts/dependency-advisories.test.mjs`: 3 casos, aprovação, bloqueio e
  indisponibilidade. A classificação é função pura, então o teste não usa rede.
- `package.json`: script `security:audit:prod`.
- `run-quality-gate.mjs`: o gate passa a executar `security:audit:prod` nos modos
  `fast`, `staged` e `full`, ao lado do secret scan. O hook de pre-commit usa
  `staged`, então dependência vulnerável passa a aparecer no commit.

Saída atual: `critical=0, high=0, moderate=0, low=0, info=0` e OK.

## Lote 3: helpers de apresentação órfãos removidos

Removidos 21 símbolos de apresentação sem nenhum consumidor, em 5 arquivos. Todos
eram label, tom ou formatador sobrando de tela reescrita. Nenhum componente,
handler, estado ou prop foi tocado.

| Arquivo | Símbolos removidos |
| --- | --- |
| `features/knowledge/KnowledgePage.tsx` | `toneForSpaceStatus`, `toneForReviewStatus`, `toneForAdvisoryClassification`, `displayAdvisoryClassification`, `displayArticleStatus`, `displayVisibility`, `humanizeRiskFlag`, `articleContributorNameFromDetail`, `formatOptionalDate`, `noticeTone`, `estimateReadingTime` |
| `features/admin/CustomerPortalAdminPage.tsx` | `roleHelper`, `entitlementStatusLabel`, `scopeLabel`, `membershipStatusLabel` |
| `features/knowledge/KnowledgeArticleEditorPage.tsx` | `formatFileSize`, `visibilityLabel`, `calloutLabel` |
| `features/access/AccessPage.tsx` | `situationLabel`, `toneForSituation` |
| `features/navigation/minimal-navigation.ts` | `hasAnyRole` |

Ficaram deliberadamente de fora, por exigirem decisão de produto:
`buildArticleForm` e `buildArticleFormFromEditorialDraft` (construtores de
formulário de artigo), `LegacyRichTextArticleEditor`, os handlers de anexo do
editor, `CustomerListItem`, `PermissionsPanel`, `TenantFilterCard`,
`UserTableRow`, `ActionBlock` e os filtros meio ligados de Conhecimento.

## Validações executadas

| Comando | Resultado |
| --- | --- |
| `npm run local:qa:smoke:auth` | 5 papéis autenticados |
| `npm run local:qa:smoke` | 10 cenários, 0 erro de console, 0 falha de request |
| `npm run security:audit:prod` | OK, 0 alta ou crítica |
| `node --test tests/scripts/dependency-advisories.test.mjs` | 3/3 pass |
| `npm run lint` | 0 erros, 196 avisos |
| `npm run web:typecheck` | pass |
| `npm run web:build` | pass |
| `npm run local:qa:secret-scan` | 1974 arquivos, 0 correspondências |
| `npm run quality:changed` | aprovado, 0 findings |

## Limitações

- O harness cobre Dashboard, gates de acesso e Portal por rota. Conhecimento,
  Access e Portal Admin, alterados no lote 3, não têm cenário próprio no smoke.
  A cobertura desses arquivos é typecheck, build e a garantia estrutural de que
  as funções removidas não tinham nenhum consumidor.
- `npm run local:qa:writes` não foi executado neste lote: ele escreve mensagens
  de QA no banco local e cobre Suporte e Portal, que não foram alterados aqui.
- Nenhum segredo, token, JWT, cookie ou service role key foi lido, digitado ou
  registrado. Nenhuma conta foi criada manualmente por interface.
- Banco local preservado. Sem push, merge, reset, clean, rebase ou cherry-pick.

## Próximo lote recomendado

1. Estender o harness de smoke com cenários autenticados para Conhecimento,
   Access e Portal Admin, fechando a última lacuna de cobertura visual.
2. Decidir produto sobre os filtros meio ligados de `KnowledgePage.tsx` e sobre a
   superfície legada do editor de conhecimento.
3. Com o harness estendido, atacar `react-hooks/rules-of-hooks` (46) e
   `exhaustive-deps` (27), que agora têm caminho de verificação real.
