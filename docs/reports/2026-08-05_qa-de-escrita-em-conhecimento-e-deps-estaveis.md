# QA de escrita em Conhecimento e dependências estáveis

Data: 2026-08-05
Checkout canônico: `C:\Projetos\GSO-old`
Branch: `codex/react-router-v8-migration-20260804`

## Resultado

| Indicador | Antes | Depois |
| --- | --- | --- |
| `npm run lint` | 0 erros, 183 avisos | 0 erros, **181** avisos |
| Cenários profundos no smoke | 1, somente leitura | **2, incluindo escrita real** |

## Lote 1: escrita real em Conhecimento no harness

Autorizado explicitamente pelo usuário. O smoke passou a executar, na sequência do
cenário do editor:

1. lê o valor atual do campo `Título do artigo *`;
2. grava o marcador sanitizado ` [QA SMOKE]`;
3. clica em `Salvar rascunho`;
4. recarrega a página e falha com `LOCAL_QA_KNOWLEDGE_WRITE_NOT_PERSISTED` se o
   valor não persistiu;
5. restaura o título original, salva de novo e recarrega;
6. falha com `LOCAL_QA_KNOWLEDGE_WRITE_NOT_RESTORED` se o marcador continuar lá.

Execução real: `{"scenario":"knowledge-write","persisted":true,"restored":true}`.

O cenário limpa o que escreveu, então não deixa dado sujo na fixture. O marcador é
neutro e não vaza termo interno para conteúdo customer-facing.

Isso fecha a lacuna de cobertura de escrita em Conhecimento pelo lado do editor de
artigo. Não cobre ainda os handlers de escrita da listagem, categoria e revisão
editorial, que são o caminho de `refreshSelectedSpace` e `refreshArticleDetail`;
por isso os dois avisos de `rules-of-hooks` de `KnowledgePage.tsx` seguem
congelados, mantendo o critério declarado em
`docs/FRONTEND_DATA_LOADING_PATTERNS.md`.

## Lote 2: dependências estáveis em telas publicadas

Os 27 avisos de `exhaustive-deps` foram medidos: 9 estão em telas publicadas.
Corrigi os dois onde a causa é a mesma e o risco é nulo, criando referência
estável em vez de desmembrar objeto em dependências primitivas.

| Arquivo | Correção |
| --- | --- |
| `features/analytics/AnalyticsCsPage.tsx` | `period` passou a ser `useMemo` sobre `sharedPeriod`; o Effect de filtros depende de `[period]` em vez de `[period.from, period.to]` |
| `features/settings/SettingsPage.tsx` | `settingsPermissions` passou a ser `useMemo` sobre o contexto de auth; `visibleGroups` depende de `[settingsPermissions]` e a assinatura duplicada `settingsScreenKeys` saiu |

Nenhum `eslint-disable` foi usado. As duas telas são cobertas pelo smoke,
`/admin/analytics` e `/admin/settings`, então a mudança tem verificação
autenticada real.

Os 7 avisos restantes em telas publicadas ficam para lote próprio, porque exigem
decisão caso a caso:

- `features/access/InternalControlPlanePage.tsx:152` falta `load`
- `features/access/InternalControlPlanePage.tsx:267` falta `grantedKeys`
- `features/analytics/AnalyticsCeoPage.tsx:80` falta `period`
- `features/analytics/AnalyticsCeoPage.tsx:106` falta `sourceStatus`
- `features/analytics/AnalyticsCommercialPage.tsx:50` falta `period`
- `features/analytics/AnalyticsFinancePage.tsx:89` falta `period`
- `features/knowledge/KnowledgePage.tsx:1246` faltam campos de `selectedAdvisory`

Os três de `period` seguem o mesmo padrão já validado aqui e são o próximo passo
natural. `load`, `grantedKeys` e `sourceStatus` pedem leitura de fluxo, porque
incluir a dependência pode provocar refetch em cadeia.

## Validações executadas

| Comando | Resultado |
| --- | --- |
| `npm run lint` | 0 erros, 181 avisos |
| `npm run web:typecheck` | pass |
| `npm run web:build` | pass |
| `npm run local:qa:secret-scan` | 1984 arquivos, 0 correspondências |
| `npm run local:qa:smoke` | 10 personas, 3 rotas internas, 2 cenários profundos, 7 sondadas |

## Limitações

- A escrita coberta é a do editor de artigo. Categoria, revisão editorial e os
  handlers de recarga da listagem continuam sem cobertura.
- O cenário depende do rótulo `Título do artigo *` e do botão `Salvar rascunho`.
  Se a copy mudar, o smoke falha de forma explícita, o que é o comportamento
  desejado.
- Nenhum backend, contrato, RPC, view ou permissão foi alterado.
- O banco local terminou o lote com a fixture restaurada.
- Nenhum segredo, token, JWT, cookie ou service role key foi lido ou exposto.

## Próximo lote recomendado

1. Replicar o padrão de `period` memoizado em `AnalyticsCeoPage`,
   `AnalyticsCommercialPage` e `AnalyticsFinancePage`.
2. Tratar `load`, `grantedKeys` e `sourceStatus` com leitura de fluxo.
3. Estender o cenário de escrita para categoria e revisão editorial, o que
   destrava os dois avisos de hooks de `KnowledgePage.tsx`.
