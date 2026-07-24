# Central de integração OMIE ↔ HubSpot — 2026-07-20

Agente: Claude / Anthropic. Ambiente: Supabase local (dev); escritas atingem a HubSpot de produção (token gerenciado no Vault). Nenhum segredo versionado.

## Objetivo

Transformar o Genius Support OS numa central de integração: além de ler o OMIE
para o dashboard, reconciliar clientes com o HubSpot, cadastrar empresas
ausentes de forma segura e manter dados financeiros atualizados no CRM.

## Componentes entregues

### 1. Deduplicação robusta de empresas
`rpc_analytics_company_candidates(p_tax_id, p_name, p_trade_name)`: combina CNPJ
exato, **raiz de CNPJ (8 dígitos)** para filial/matriz do mesmo grupo,
continência de nome por palavra inteira e similaridade trigram (pg_trgm) sobre
razão social e nome fantasia. Normalização via `app_private.normalize_company_name`
(unaccent + remoção de sufixos). Resolve o caso "Malwee" (nome curto/filial) que
antes gerava duplicata.

### 2. Criação governada de empresas
Edge Function `hubspot-company-create`: dry-run por padrão, escrita só com
`confirmation=CRIAR`, **nunca cria quando há candidato** (usa a dedup acima;
`force` explícito para exceções), CNPJ enviado em dígitos (propriedade numérica),
tudo auditado em `analytics_hubspot_company_create_runs`. Drill-down de leitura
`rpc_analytics_finance_unmatched_clients` lista as empresas do OMIE sem cadastro.

Incidente e correção: no piloto foi criada uma duplicata da "Malwee" (dedup fraca
na época); resolvida por merge governado (`hubspot-company-merge`) e a dedup foi
endurecida (item 1).

### 3. Propriedades OMIE no HubSpot
Edge Function `hubspot-property-setup` (dry-run + `CRIAR`, idempotente) criou o
grupo "OMIE / Financeiro" e as propriedades: `omie_saldo_aberto`,
`omie_saldo_vencido`, `omie_titulos_abertos`, `omie_atraso_medio_dias`,
`omie_situacao_financeira` (em_dia/a_vencer/vencido/critico), `omie_ultima_sincronizacao`.

### 4. Sincronização de saída (fill dos campos OMIE)
`rpc_analytics_finance_company_rollup` agrega por empresa HubSpot (match CNPJ
exato). Edge Function `hubspot-omie-property-sync` (dry-run + `ATUALIZAR`)
atualiza somente os campos `omie_*` (nunca campos da CS). Executado: 196/196
empresas atualizadas, 0 falhas.

### 5. Agendamento configurável + orquestração
`analytics_integration_schedule` guarda cadência editável (off/hourly/daily) via
`rpc_admin_set_integration_schedule`. Edge Function `analytics-integration-run`
(admin ou secret de agendamento) roda OMIE read-only → read model → atualização
das propriedades HubSpot, respeitando a cadência quando chamada por cron. UI em
Dashboard → Configuração (frequência, ativa, salvar, "Rodar agora", último status).
Validado ponta a ponta: 3.433 títulos, 196/196 empresas, 0 falhas.

## Ativação do cron (gated — requer segredo)

O runner automático não é versionado com segredo. Para ativar em produção:

1. Definir o segredo de agendamento no ambiente das Edge Functions:
   `ANALYTICS_SYNC_SECRET` (secret forte).
2. Agendar um heartbeat (ex.: pg_cron a cada hora) chamando a orquestração:
   `POST {SUPABASE_URL}/functions/v1/analytics-integration-run`
   com header `x-analytics-sync-secret: <ANALYTICS_SYNC_SECRET>`.
   A função respeita `analytics_integration_schedule` (só executa se ativa e
   vencida conforme a frequência).
3. Não colocar o segredo em migration, código ou documento versionado.

## Governança e segurança

Todas as escritas externas são platform_admin, com dry-run, dedup e auditoria.
Segredos ficam no Vault. Nenhum push de git foi feito. Escrita atinge HubSpot de
produção: manter os gates (confirmação por ação, dry-run antes de lote).

## Pendências

- Ativar o cron com o secret (produção).
- Considerar reconciliação por raiz de CNPJ (grupo econômico) também na
  atualização de propriedades, hoje restrita a CNPJ exato.
- QA visual autenticado da aba Configuração (novo card de agendamento).
