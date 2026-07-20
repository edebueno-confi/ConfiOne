# Analytics / Dashboard Gerencial (integração HubSpot)

Módulo de dashboards gerenciais integrado ao HubSpot, com duas seções na v1:
**Comercial (Aftersale)** via Deals e **CS/Suporte** via Tickets. A arquitetura é
por adapter de domínio: adicionar uma nova área (Financeiro, Produto, Migração,
Onboarding, Jurídico, Clientes) é registrar um novo item, não reescrever a tela.

## Arquitetura

```
HubSpot REST API
   │  (Private App Token, server-side)
   ▼
Edge Function  supabase/functions/hubspot-sync   ← fetch + upsert (service role)
   │
   ▼
Tabelas locais  hubspot_deals / hubspot_tickets / hubspot_owners /
                hubspot_pipeline_stages / hubspot_sync_runs / analytics_source_config
   │
   ▼
Views de métrica  vw_analytics_commercial_* / vw_analytics_cs_*   ← agregação (Postgres)
   │
   ▼
Frontend  apps/web/src/features/analytics  →  rota /admin/analytics (platform_admin)
```

Fetch e agregação são desacoplados: a Edge Function só busca e grava; toda regra
de métrica vive nas views SQL. Trocar a fonte não reescreve a lógica de métrica.

## Fontes e IDs (configuração, não hardcode)

Os IDs de pipeline ficam na tabela `analytics_source_config` (uma linha por
domínio + tipo de objeto), semeada por migration e sobrescrevível por ambiente:

| domain_key | object_type | pipeline (seed) | descrição |
|------------|-------------|-----------------|-----------|
| commercial | deal        | `892833861`     | Comercial Aftersale |
| cs         | ticket      | `5034314`       | Suporte |

Outro portal/ambiente: basta atualizar `analytics_source_config` (não há ID fixo
no código).

## Campos usados (confiáveis hoje)

- **Deals:** `pipeline`, `dealstage`, `hubspot_owner_id`, `amount_in_home_currency`
  (valor multi-moeda), `dealtype`, `createdate`, `closedate`.
  Estado (ganho/perdido/aberto) vem dos metadados do estágio (`isClosed`,
  `probability`), resolvidos via API de Pipelines, nunca por parsing de rótulo.
- **Tickets:** `hs_pipeline`, `hs_pipeline_stage`, `source_type`,
  `hs_ticket_priority`, `createdate`, `closedate`, campos de SLA (parciais).

Campos customizados vazios no portal (`mrr_*`, `sdr/closer/bdr owner`, motivo de
perda, `csm_owner`) ficam fora da v1; podem ser incorporados sem redesenho.

## Variáveis de ambiente

Definir como **segredos server-side** (nunca no frontend):

| Variável | Onde | Descrição |
|----------|------|-----------|
| `HUBSPOT_PRIVATE_APP_TOKEN` | segredo da Edge Function | Private App Token do HubSpot |
| `ANALYTICS_SYNC_SECRET` | segredo da Edge Function (opcional) | Habilita disparo agendado (cron) sem JWT, via header `x-analytics-sync-secret` |

Escopos mínimos do Private App: `crm.objects.deals.read`,
`crm.objects.tickets.read`, `crm.objects.owners.read`, `crm.schemas.deals.read`,
`crm.schemas.tickets.read` (confirmar nomes exatos na doc atual do HubSpot).

O frontend continua usando apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

## Como rodar

### 1. Aplicar as migrations

```bash
npm run supabase:db:reset        # ambiente local
# ou aplicar as duas migrations 20260717150000_* e 20260717160000_* no ambiente alvo
```

### 2. Configurar o segredo do HubSpot

```bash
# local: exportar antes de servir as functions
export HUBSPOT_PRIVATE_APP_TOKEN="pat-xxxx"
supabase functions serve hubspot-sync

# produção
supabase secrets set HUBSPOT_PRIVATE_APP_TOKEN="pat-xxxx"
supabase functions deploy hubspot-sync
```

### 3. Sincronizar

- **Pela UI:** `/admin/analytics` → botão "Sincronizar HubSpot" (requer
  platform_admin). Sincroniza owners, estágios, deals e tickets.
- **Por HTTP (cron/manual):**

```bash
curl -X POST "$SUPABASE_URL/functions/v1/hubspot-sync" \
  -H "x-analytics-sync-secret: $ANALYTICS_SYNC_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'                      # {"domain":"commercial"} ou {"domain":"cs"} para escopo parcial
```

O status da última execução aparece no cabeçalho do dashboard
(`hubspot_sync_runs`).

### 4. Consultar

O dashboard consulta as views `vw_analytics_*` via cliente Supabase autenticado.
Nenhuma chamada ao HubSpot acontece no carregamento da tela.

## Métricas da v1

- **Comercial:** total de deals, abertos, ganhos, perdidos, receita ganha
  (`SUM(amount_in_home_currency)` em estágio ganho), taxa de conversão
  `Ganho / (Ganho + Perdido)`, ticket médio, funil por estágio, deals por
  responsável (contagem e receita), tendência mensal de criação/ganho.
- **CS:** total de tickets, abertos vs. encerrados, % encerrados, tickets por
  status, tendência mensal de criação/encerramento.

## Adicionar uma nova área

1. Criar as tabelas/adapter de fonte da área (ou reusar `analytics_source_config`).
2. Criar as views `vw_analytics_<area>_*` com as métricas.
3. Expor a leitura em `apps/web/src/features/analytics/analytics-api.ts`.
4. Criar a página de seção (ex.: `Analytics<Area>Page.tsx`).
5. Registrar em `apps/web/src/features/analytics/analytics-domains.ts`.

A `AnalyticsShell` itera sobre o registry: a nova aba aparece sem alterar a tela.

## Segurança

- Token do HubSpot só na Edge Function (service role grava, bypassa RLS).
- Tabelas com RLS: leitura restrita a `platform_admin`
  (`app_private.can_read_analytics()`); escrita só via service role.
- Views expostas ao PostgREST com gate `can_read_analytics()`; rota
  `/admin/analytics` já protegida pelo `AdminGate` (platform_admin).

## Evolução

- Agendamento: função pronta para `pg_cron` (usar `ANALYTICS_SYNC_SECRET`).
- Deals via Search API com filtro de pipeline (volume ~1.100, abaixo do teto de
  10k). Tickets via List API paginada (volume ~27k) com filtro por pipeline.
