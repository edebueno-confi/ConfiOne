# Auditoria do domínio Financeiro V1

Status: fundação documental concluída em 2026-08-21. Este documento descreve
contratos e evidências locais; não valida credencial, volume ou execução remota
do OMIE e não autoriza ingestão, alteração de cálculo ou publicação nova.

## 1. Resumo executivo

O ConfiOne possui uma superfície financeira local para Contas a Receber. O
read model `analytics_finance_receivables`, a RPC
`rpc_analytics_finance_snapshot(date,date,text,text,text)` e o status da fonte
OMIE estão versionados. O contrato corrente publica somente linhas atuais da
API OMIE (`source_key = 'omie_receivables_api'` e `is_current = true`). Dados
históricos de planilha permanecem preservados para auditoria/migração, mas não
são fallback publicado pelo Dashboard.

A implementação distingue posição atual de recorte temporal apenas
parcialmente. `open_balance`, vencido, aging e projeção usam o livro atual e
`current_date`. Já o recorte `p_from`/`p_to` filtra `coalesce(due_date,
issued_date)`, e a soma chamada `received_amount` é calculada sobre esse mesmo
recorte. O campo `last_received_date` existe no read model, mas não participa
desse filtro. Portanto, “Recebido no período” não deve ser interpretado como
“pagamentos cujo `paid_at` ocorreu no período” sem uma decisão contratual.

O domínio tem estados explícitos de ausência e frescor, mas os agregados SQL
usam `coalesce(..., 0)` em alguns campos. O estado do snapshot precisa ser
preservado na interface para que ausência de fonte, recorte vazio e valor zero
real não sejam confundidos.

## 2. Escopo e classificação

| Classificação | Uso neste documento |
|---|---|
| `AVAILABLE_NOW` | Existe contrato local versionado e leitura autorizada, sem afirmar que há dados atuais no ambiente. |
| `REQUIRES_SCOPE` | Depende de credencial/permissão da integração OMIE ou do gate de acesso ao Analytics. |
| `REQUIRES_NEW_INGESTION` | Exige nova captura/read model para histórico ou dimensão que não é publicada pelo contrato atual. |
| `API_LIMITATION` | Só deve ser usada quando a API oficial comprovadamente não fornece a capacidade. Não há evidência local suficiente para classificar os KPIs centrais assim. |
| `PENDING_LOCAL_CONTRACT_VALIDATION` | Pendência de semântica ou teste local. Não é uma permissão de API. |

`AVAILABLE_NOW` descreve capacidade do código local, não disponibilidade do
portal OMIE. Nenhuma chamada externa foi executada neste lote.

## 3. Fontes canônicas e proveniência

| Camada | Evidência | Papel | Classificação |
|---|---|---|---|
| OMIE Contas a Receber | `supabase/functions/_shared/omie.ts`, `buildOmieReceivablesRequest` | Endpoint POST do método `ListarContasReceber`, com `pagina`, `registros_por_pagina` e `apenas_importado_api` | `REQUIRES_SCOPE` para credencial válida; capacidade de leitura local `AVAILABLE_NOW` |
| OMIE Movimentos Financeiros | [Exemplo oficial de query no Excel](https://ajuda.omie.com.br/pt-BR/articles/6595981-exemplos-de-query-no-excel), seção `Listar Movimentos Financeiros` | Endpoint `POST https://app.omie.com.br/api/v1/financas/mf/`, chamada `ListarMovimentos`, com `nPagina` e `nRegPorPagina`; a resposta exemplificada separa `movimentos[].detalhes` e `movimentos[].resumo` | `REQUIRES_NEW_INGESTION` para read model ConfiOne; `REQUIRES_SCOPE` para credencial/portal; `PENDING_LOCAL_CONTRACT_VALIDATION` para a semântica temporal |
| API OMIE normalizada | `supabase/functions/_shared/omie.ts`, normalização de títulos | Produz `source_key = 'omie_receivables_api'`, identidade estável, datas, status, valores e `sync_run_id` | `AVAILABLE_NOW` no código; dados atuais dependem de execução autorizada |
| Read model atual | `public.analytics_finance_receivables` | Livro publicado de títulos atuais, com `is_current`, valores, datas, status, payload redigido e proveniência | `AVAILABLE_NOW` |
| Execução de sync | `public.analytics_finance_sync_runs` | Status `processing`, `completed`, `partial` ou `failed`, contagens, início/fim e erro sanitizado | `AVAILABLE_NOW` |
| Planilha exportada do OMIE | `analytics_spreadsheet_*` e histórico de `source_key` de planilha | Evidência histórica preservada; não alimenta o Dashboard corrente | `REQUIRES_NEW_INGESTION` para qualquer histórico publicado |
| HubSpot | `hubspot_companies` e `rpc_analytics_finance_reconciliation_v1` | Reconcilia identidade de cliente por CNPJ e decisão manual confirmada; não é fonte do valor financeiro | `AVAILABLE_NOW` para reconciliação local; cobertura pode ser parcial |

O endpoint e o método acima são observados no código local. Plano, contrato
comercial do portal, scopes efetivos, limite contratado e volume remoto não
foram verificados.

## 4. Inventário de campos e datas

| Indicador/campo | Fonte e regra real | Data considerada | Estado |
|---|---|---|---|
| Títulos | `count(*)` das linhas filtradas do livro OMIE atual | `coalesce(due_date, issued_date)` no recorte | `AVAILABLE_NOW`, com ressalva de semântica temporal |
| Valor líquido | Soma de `net_amount` das linhas filtradas | `coalesce(due_date, issued_date)` | `AVAILABLE_NOW` |
| Recebido | Soma de `received_amount` das linhas filtradas | Não usa `last_received_date`; o filtro é por vencimento/emissão | `PENDING_LOCAL_CONTRACT_VALIDATION` para o significado “no período” |
| Saldo aberto | Soma de `balance` do livro atual com `balance > 0` | Fotografia de `current_date`; não é histórico por `p_to` | `AVAILABLE_NOW` |
| Títulos abertos | Contagem de `balance > 0` | Fotografia atual | `AVAILABLE_NOW` |
| Vencido | `aging_bucket = 'atrasado'` e `balance` positivo | `current_date - due_date` | `AVAILABLE_NOW`, sem `as_of` selecionável |
| Aging | Faixas `1-30`, `31-60`, `61-90`, `90+` sobre `current_date - due_date` | `due_date`; linhas sem vencimento não formam faixa confiável | `AVAILABLE_NOW` |
| A vencer 30/60/90 | Soma de saldo aberto com `due_date` até `current_date + N` | Data corrente do banco | `AVAILABLE_NOW`, mas não relativo a `p_to` |
| Mensal | Agrupa `balance` por mês de `coalesce(due_date, issued_date)` | Vencimento, ou emissão quando ausente | `AVAILABLE_NOW` |
| Projeção | Agrupa saldo aberto por `due_date >= current_date` | Data corrente do banco | `AVAILABLE_NOW` |
| Status | `status_original` vindo do título OMIE | Sem transformação para período | `AVAILABLE_NOW` |
| Categoria | `raw_payload->>'codigo_categoria'` | Livro atual | `AVAILABLE_NOW` quando o campo existe; ausência fica “Sem categoria” |
| Data de recebimento | `last_received_date`, normalizada de `dDtPagamento`/`data_pagamento` | Campo de origem, mas não usado no filtro atual | `AVAILABLE_NOW` como dado; `PENDING_LOCAL_CONTRACT_VALIDATION` para KPI temporal |
| Movimento financeiro | API oficial `ListarMovimentos`, quando habilitada no portal | `detalhes.dDtPagamento`, com `resumo.nValPago`, `resumo.nValAberto` e `resumo.nValLiquido`; `nCodTitulo` pode apoiar reconciliação | `REQUIRES_NEW_INGESTION`; não existe read model local auditado para movimentos |
| Identidade | `source_record_id`, código OMIE, nome/CNPJ e `identity_version = 'omie-v3'` | Proveniência do título | `AVAILABLE_NOW` |

## 5. Contrato de período e posição

### Recorte selecionado

Na implementação corrente, `p_from` e `p_to` são aplicados a:

```sql
coalesce(b.due_date, b.issued_date)
```

Esse recorte é adequado para títulos por vencimento/emissão, mas não equivale
a uma coorte de pagamentos. Para responder “quanto foi recebido entre X e Y”,
o contrato precisa decidir se a data é `last_received_date`, outra data oficial
do OMIE ou uma regra de competência. Sem essa decisão, não se deve apresentar
o valor como fluxo de caixa realizado do período.

### Fonte oficial de movimentos

A documentação oficial do OMIE exemplifica a chamada `ListarMovimentos` no
endpoint `https://app.omie.com.br/api/v1/financas/mf/`, com paginação por
`nPagina` e `nRegPorPagina`. O exemplo também mostra os campos
`detalhes.dDtPagamento`, `resumo.nValPago`, `resumo.nValAberto` e
`resumo.nValLiquido`, além de identificadores como `nCodTitulo`. Essa é uma
fonte oficial candidata para o fluxo de recebimentos, mas não é um contrato
executável do ConfiOne neste lote.

O código local atual implementa apenas `ListarContasReceber`; não há chamada,
staging, read model, reconciliação ou `sync_run` publicado para
`ListarMovimentos`. Portanto, a capacidade de consultar movimentos está
classificada como `REQUIRES_NEW_INGESTION`, não como `API_LIMITATION`. A
credencial, o acesso do aplicativo ao método, o limite de registros por página,
rate limit, retenção histórica e cobertura real do portal ainda exigem
verificação read-only autorizada. Até essa verificação, a classificação também
mantém `REQUIRES_SCOPE` para o acesso e `PENDING_LOCAL_CONTRACT_VALIDATION`
para decidir se `dDtPagamento` é a data oficial do KPI.

### Posição atual

`open_balance`, `overdue_balance`, `avg_days_overdue`, `due_30`, `due_60`,
`due_90`, aging e projeção são derivados do livro atual e de `current_date`.
`p_to` não congela a posição em uma data histórica. A expressão “hoje” deve
ser entendida como a data do banco no momento da consulta, sem timezone de
usuário publicado para esses campos `date`.

### MRR e metas

MRR atual, metas, forecast e posição de recebíveis são contratos diferentes.
O Financeiro não deve usar `mrr_total`, `won_amount` ou metas comerciais como
substitutos de valor recebido, saldo a receber ou aging. O documento de metas
financeiras permanece [ANALYTICS_MRR_GOALS_FOUNDATION_V1.md](./ANALYTICS_MRR_GOALS_FOUNDATION_V1.md).

## 6. Estados de fonte e ausência

| Estado | Significado operacional | Publicação |
|---|---|---|
| `not_configured` | Integração não habilitada com credencial referenciada | Não publicar métricas |
| `syncing` | Última execução ainda está processando | Não publicar novo snapshot |
| `error` | Última execução falhou | Não publicar como dado atual; preservar diagnóstico sanitizado |
| `empty` | Não há linha atual válida da API | Não tratar como saldo zero |
| `stale` | Snapshot válido ultrapassou 24h ou houve execução parcial | Pode publicar com aviso de frescor |
| `fresh` | Snapshot atual válido dentro do limite | Publicar com `last_successful_sync_at` e `sync_run_id` |

No recorte sem linhas, alguns agregados podem retornar zero por construção SQL.
O estado `empty`, o motivo e a fonte `none` são a distinção normativa. A UI
deve manter essa distinção e não inferir “zero títulos” como “saldo zero” sem
um snapshot válido.

## 7. Tenant, acesso e segurança

- As RPCs financeiras usam `SECURITY DEFINER`, `search_path` vazio e o gate
  `app_private.can_read_analytics()`.
- O gate local vigente verifica o papel global `platform_admin`. Não encontrei
  `tenant_id` no esquema publicado de `analytics_finance_receivables`, nem um
  filtro tenant-aware nas RPCs financeiras auditadas.
- A especificação `docs/specs/analytics-finance-omie-v1.md` afirma tenant/RLS e
  cobertura de pgTAP para esse isolamento, mas essa afirmação não foi
  confirmada pelo contrato executável auditado. Neste ciclo, ela fica
  classificada como intenção/aspiração documental não reconciliada, não como
  capacidade disponível.
- Portanto, isolamento por tenant não deve ser declarado como capacidade deste
  read model. Antes de expor Financeiro a outros tenants, é necessário um lote
  próprio de decisão de autorização, modelagem, RLS e testes cross-tenant.
- `raw_payload` é redigido na normalização para não persistir app keys, secrets,
  tokens ou PII sensível sem proteção. Este documento não reproduz credenciais.
- Reconciliação HubSpot por CNPJ ou decisão manual confirmada não transforma
  uma identidade ausente em cliente conhecido; estados `identity_missing`,
  `identity_incomplete` e `no_hubspot_company` permanecem distintos.

## 8. Paginação, frescor e limites observados no código

O cliente local usa POST para o endpoint de Contas a Receber, página de 500
registros, paginação serial, até 100 páginas, timeout mínimo de 15 segundos,
até três retries e retry para 429/5xx. Resposta vazia antes da última página e
divergência entre `total_de_registros` e registros recebidos invalidam a carga.
O código registra endpoint lógico, página, tentativa, status, duração e código
sanitizado de erro. Esses são guardrails locais, não prova do rate limit ou do
SLA contratado pelo portal OMIE.

## 9. Contradições e riscos documentais

1. Relatórios de julho descrevem planilha como fonte efetiva enquanto a
   migration `20260802004655` e o contrato `docs/specs/analytics-finance-omie-v1.md`
   definem OMIE API-only para publicação. Os relatórios antigos permanecem
   históricos; este documento adota o contrato mais recente.
2. A UI chama um KPI de “Recebido no período”, mas o RPC não filtra por
   `last_received_date`. Isso é uma lacuna semântica local, não uma limitação
   comprovada da API.
3. A API oficial também oferece `ListarMovimentos` com data de pagamento e
   valores de movimento, porém não há read model local dessa fonte. O próximo
   lote deve validar acesso, paginação, rate limit, retenção e reconciliação
   antes de publicar recebido como fluxo de caixa. Isso não deve ser tratado
   como `API_LIMITATION`.
4. A UI exibe posição atual e previsão junto a um período selecionável, mas
   aging/projeção usam `current_date`. A interface deve explicar essa diferença
   antes de expor metodologia ao usuário.
5. A especificação histórica/canônica afirma tenant/RLS, enquanto a
   implementação auditada só aplica o gate global de Analytics. Não há
   evidência suficiente para afirmar isolamento financeiro por tenant.

## 10. Próximos lotes recomendados

1. **Contrato temporal financeiro:** decidir e testar a data de pagamento,
   competência, vencimento e emissão; renomear ou corrigir “Recebido no
   período” somente após evidência do payload real.
2. **Movimentos e histórico:** executar descoberta read-only autorizada no
   portal OMIE e, depois, definir ingestão, read model/versionamento,
   `sync_run`, frescor, reconciliação por `nCodTitulo` e cobertura histórica
   para `ListarMovimentos`; não usar a planilha histórica como fallback.
3. **Histórico:** definir read model/versionamento para snapshots históricos e
   `as_of`, sem usar a planilha histórica como fallback silencioso.
4. **Autorização:** decidir tenant, papel, RLS, auditoria e cobertura
   cross-tenant antes de ampliar o gate global de Analytics.
5. **Interface de metodologia:** expor fonte, campo de data, período,
   timezone, filtros, fórmula, cobertura, ausência e limitações na UI somente
   em task própria, depois de o contrato temporal ser aprovado.

## 11. Evidências locais

- `docs/specs/analytics-finance-omie-v1.md`
- `docs/reports/ANALYTICS_FINANCE_READMODEL_2026-07-18.md`
- `supabase/functions/_shared/omie.ts`
- `https://ajuda.omie.com.br/pt-BR/articles/6595981-exemplos-de-query-no-excel`
- `supabase/migrations/20260718060000_analytics_finance_receivables_v1.sql`
- `supabase/migrations/20260719211000_analytics_finance_omie_api_sync_v1.sql`
- `supabase/migrations/20260802004655_analytics_finance_omie_only_contract_v1.sql`
- `supabase/migrations/20260809093201_analytics_finance_manual_reconciliation_v1.sql`
- `supabase/tests/088_analytics_finance_omie_only_contract.sql`
- `apps/web/src/features/analytics/AnalyticsFinancePage.tsx`
- `apps/web/src/features/analytics/analytics-api.ts`

## Veredito da auditoria

`consistente com ressalvas`: existe contrato local e a fonte publicada está
explicitamente OMIE-only, porém a semântica temporal de “recebido no período”,
o histórico `as_of`, a ingestão de movimentos e o isolamento tenant-aware ainda
exigem decisões e lotes próprios. A fonte oficial de movimentos foi registrada,
mas não há read model local e nenhuma capacidade foi marcada `API_LIMITATION`.
