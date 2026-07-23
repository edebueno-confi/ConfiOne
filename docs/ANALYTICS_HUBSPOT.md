# Analytics / Dashboard Gerencial (integração HubSpot)

Módulo de dashboards gerenciais multi-fonte. **Comercial (Aftersale)** usa Deals,
**CS/Suporte** usa Tickets e **Financeiro** usa o read model do OMIE com fallback
de planilha. A arquitetura é por adapter de domínio: adicionar uma nova área
(Produto, Migração, Onboarding, Jurídico, Clientes) é registrar um novo item,
não reescrever a tela.

## Estado atual — 2026-07-23

### Comercial multi-pipeline

O portal HubSpot `20108050` foi auditado em modo somente leitura. A atividade
observada está concentrada em `Piloto Aftersale` (1.150 negócios), `Pipe de
Vendas` (865) e `Renovação Contratual` (1). O Dashboard não deve assumir que o
primeiro pipeline configurado representa todo o Comercial.

O `hubspot-sync` consulta `/crm/v3/pipelines/deals` e
`/crm/v3/pipelines/tickets`, preserva os pipelines não arquivados no catálogo
local e insere novos candidatos como inativos. O administrador escolhe o
recorte em Configuração; o nome oficial do HubSpot é somente leitura e o alias
interno é opcional.

A aba Comercial usa `rpc_analytics_commercial_snapshot` com uma lista de
exclusões temporárias aplicada no Postgres. A resposta também possui
`by_pipeline`, permitindo conferir volume por pipeline sem duplicar o funil.

Relatório da auditoria: `docs/reports/COMMERCIAL_PIPELINE_AUDIT_2026-07-23.md`.

### Hardening forense — lote Codex

- As RPCs administrativas de configuração exigem `platform_admin`; a leitura
  de Analytics continua separada da escrita administrativa.
- O read model financeiro reconcilia por `sync_run_id`, inclui empresas que
  zeraram e mascara PII/segredos em `raw_payload`.
- Writes externos de empresas e propriedades possuem ledger de execução e
  itens; o property-sync usa batch e a criação falha fechada quando a guarda
  CNPJ ao vivo não consegue consultar o HubSpot.
- Duplicidades dentro da mesma requisição são ignoradas; CNPJ raiz é somente
  sinal de possível grupo/filial e não bloqueia a criação nem força merge.
- O portal HubSpot usado nos links da UI vem de `VITE_HUBSPOT_PORTAL_ID`.

- **Comercial e CS/Suporte:** continuam lendo o snapshot local alimentado pelo
  HubSpot, com sincronização global (`scope: all`) e escopos por domínio apenas
  para diagnóstico/execução faseada.
- **Financeiro:** usa o read model API-first do OMIE, com a planilha como
  fallback controlado. O sync dedicado validado localmente processou 3.433/3.433
  títulos.
- **Agendamento:** OMIE financeiro e HubSpot global possuem configurações
  independentes na tela de Configuração e no backend. O HubSpot fica desligado
  por padrão para evitar consumo involuntário da API.
- **Orquestração:** `analytics-scheduled-run` coordena as agendas protegidas;
  após atualizar o runtime Edge local, ele deve ser validado novamente porque o
  inventário congelado usado no último teste ainda não carregava essa função.
- **Estado de entrega:** a implementação local foi fechada no commit `5cb4eea`.
  Publicação remota, scheduler protegido e deploy continuam gates externos e
  não foram executados.

## Limites de API e estratégia de atualização

- Empresas e tickets usam a fronteira incremental disponível; Deals permanecem
  em carga completa por exigência do contrato atual do dashboard.
- Atualizações de empresas do HubSpot usam lotes de até 100 registros, reduzindo
  chamadas repetidas e o tempo de worker.
- O fluxo combinado não repete o enriquecimento do índice de clientes OMIE;
  títulos e clientes são lidos uma vez por execução financeira.
- Há guarda de sobreposição para impedir duas execuções financeiras simultâneas.
- Falhas de uma fase são registradas com etapa e mensagem, sem fabricar
  números parciais como se fossem sucesso.

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
| `OMIE_APP_KEY` / `OMIE_APP_SECRET` | segredo gerenciado da integração OMIE | Credenciais server-side para `ListarContasReceber` e `ListarClientesResumido` |
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
npm run supabase:functions:serve

# produção
supabase secrets set HUBSPOT_PRIVATE_APP_TOKEN="pat-xxxx"
supabase functions deploy hubspot-sync
```

Em um checkout local que já possui o container criado pelo Supabase CLI, o
runtime precisa estar em execução antes do teste. Se o gateway responder 503
inclusive a `OPTIONS`, verifique `docker ps -a` e reative o container local;
este checkout usa política `unless-stopped` para que ele não permaneça parado
após uma reinicialização do Docker.

### 3. Sincronizar

- **Pela UI:** `/admin/analytics` → botão "Sincronizar HubSpot" (requer
  platform_admin). A ação dispara uma sincronização global, agregando empresas,
  comercial e CS; os escopos individuais continuam disponíveis para diagnóstico
  e execução faseada quando necessário. O endpoint ainda aceita a chamada
  legada sem `scope`.

- **Por HTTP (cron/manual):**

Para cargas grandes, chamar sequencialmente `{"scope":"companies"}`,
`{"scope":"commercial"}` e `{"scope":"cs"}`. O parâmetro `full:true` força
uma carga completa no escopo solicitado; sem ele, empresas e tickets usam a
janela incremental disponível.

```bash
curl -X POST "$SUPABASE_URL/functions/v1/hubspot-sync" \
  -H "x-analytics-sync-secret: $ANALYTICS_SYNC_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"scope":"companies"}'
curl -X POST "$SUPABASE_URL/functions/v1/hubspot-sync" \
  -H "x-analytics-sync-secret: $ANALYTICS_SYNC_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"scope":"commercial"}'
curl -X POST "$SUPABASE_URL/functions/v1/hubspot-sync" \
  -H "x-analytics-sync-secret: $ANALYTICS_SYNC_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"scope":"cs"}'
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
