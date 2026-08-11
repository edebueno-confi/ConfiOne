# Dashboard por domínios e integrações — inventário e entrega local

Data: 2026-08-11
Branch: `codex/dashboard-domains-integrations`
Base funcional: `ebf65ec`
Commit desta entrega: `8a368dd`

## Resultado

O Dashboard Gerencial foi consolidado como uma superfície de leitura executiva,
diagnóstico operacional e governança de cobertura. Os dados continuam vindo de
read models e RPCs existentes; o frontend não consulta HubSpot ou OMIE
diretamente e não cria métricas para fontes que ainda não possuem contrato.

## Mapa de fontes e contratos

| Domínio | Fonte publicada | Contrato/read model observado | Estado usado na UI |
|---|---|---|---|
| Comercial | HubSpot Deals | `vw_analytics_commercial_kpis`, `vw_analytics_commercial_funnel`, `vw_analytics_commercial_by_owner`, `vw_analytics_commercial_monthly` e os RPCs V2 consumidos pelo adapter | Funil, pipeline, responsáveis, conversão, ciclo e tendências, respeitando a coorte retornada pelo backend |
| Customer Success | HubSpot Companies + vínculo financeiro OMIE | `rpc_analytics_customer_success_kpis_v2`, `vw_analytics_customer_base`, `vw_analytics_customer_financial_link` | Carteira, MRR e sinais separados; health score, churn histórico e NRR permanecem indisponíveis quando o contrato não os publica |
| Suporte | HubSpot Tickets | `rpc_analytics_cs_snapshot` e `vw_analytics_cs_*` | Status, fila, prioridade/origem, responsáveis, tempos e tendências publicados pelo snapshot |
| Financeiro | OMIE Contas a Receber | `rpc_analytics_finance_snapshot`, `rpc_analytics_finance_unmatched_clients`, `rpc_analytics_finance_source_status` e `source_key = 'omie_receivables_api'` | Recebíveis, aging, projeção, inadimplência e conciliação; planilha não é fallback |
| Governança | Supabase + fila de reconciliação | `rpc_analytics_company_reconciliation_queue`, `rpc_admin_decide_company_reconciliation`, `rpc_admin_revoke_company_reconciliation` | Revisão humana, evidência, confirmação, rejeição, revogação e auditoria |

## Lacunas confirmadas

### Atividades comerciais

Não existe no checkout um read model server-side publicado para reuniões,
tarefas, ligações ou e-mails. Também não foi validado neste lote o endpoint,
paginação, associação ou escopo de leitura necessário para ingestão dessas
atividades. A UI as classifica como indisponíveis e não exibe contadores
fabricados.

### Conversations/Chat

Não há tabela/read model local de inbox, thread ou mensagem. `source_type` de
ticket permanece apenas uma propriedade do ticket e não é usado como prova de
que o produto Conversations/Chat está conectado. Uma futura integração exige
escopo HubSpot confirmado, ingestão server-side idempotente, associação explícita
com tickets e testes de isolamento antes de entrar no Analytics.

### OMIE além de recebíveis

Não há contrato validado neste checkout para contas a pagar, centros de custo,
projetos, contratos ou recorrência financeira. Esses indicadores não foram
estimados a partir de recebíveis.

### Customer Success

Os sinais atuais não formam um health score composto. Churn histórico, NRR,
GRR, onboarding e cadência só podem ser publicados após read model com
denominador, período, frescor, versão e evidência próprios.

## Match HubSpot ↔ OMIE

A fila permanece em Governança de dados. O contrato atual usa CNPJ normalizado e
aliases de razão social/nome fantasia para gerar candidatas ordenadas por score.
O score e o motivo são evidência de triagem, não decisão automática. O painel
mostra os registros dos dois lados, preserva a origem e exige justificativa
humana antes de confirmar, descartar ou revogar.

Domínio de e-mail, e-mail de contato, telefone, endereço e cidade ainda não são
campos do contrato vigente da fila; portanto não foram usados como sinais
silenciosos. Nenhuma escrita foi feita no HubSpot ou no OMIE.

## Mudanças entregues

- visão executiva com tendências reais de Comercial, Suporte e Financeiro;
- painel de cobertura que separa publicado, parcial e indisponível;
- link direto para `Fontes do Dashboard`/Governança;
- copy de Suporte sem afirmar conexão com Chat;
- tradução dos motivos técnicos de cobertura e reconciliação;
- compatibilidade dos tooltips com Recharts 3.10.1;
- runner determinístico para o gate `test:focused`;
- teste de contrato para as lacunas e a hierarquia do Dashboard.

## Segurança e permissões

Não houve alteração de secret, token, escopo externo, RLS, migration ou banco
remoto. As leituras usam sessão autenticada e contratos com tenant/RLS. As
decisões de reconciliação continuam restritas a `platform_admin` pelos RPCs
existentes e registradas no ledger de auditoria.

## Validação local

- `npm ci`: passou; o npm reportou duas vulnerabilidades altas no audit amplo,
  fora do escopo deste lote.
- `npm run contracts:typecheck`: passou.
- `npm run web:typecheck`: passou.
- `npm run web:build`: passou.
- `npm run test:focused`: 253/253 testes passaram.
- `npm run lint`: passou com 0 erros e 195 warnings existentes.
- `npm run security:audit:prod`: passou sem vulnerabilidades críticas ou altas.
- `npm run local:qa:secret-scan`: passou sem correspondências.
- quality gate changed/staged: aprovado, 0 findings.
- `git diff --check`: passou.
- `npm run test:all`: 498 passaram e 29 falharam em contratos legados/fora do
  gate focado; a suíte completa continua não verde.

QA visual autenticado em Preview não foi executado porque não houve push ou
deploy. A publicação deve ser seguida de smoke test nos viewports 390px, 768px,
1024px e desktop.

## Estado de publicação

O commit está local na branch dedicada. Não houve push, PR, sync externo,
Preview Vercel ou deploy de produção.
