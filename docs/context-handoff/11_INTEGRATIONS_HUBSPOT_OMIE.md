# Integrations — HubSpot and OMIE

## HubSpot

### Objetivo

Sincronizar empresas, negócios, tickets, owners, pipelines e dados de CS/comercial para o dashboard e para evolução futura da operação interna.

### Evidência técnica

Edge Functions:

- `hubspot-sync`
- `hubspot-cs-migration`
- `hubspot-property-setup`
- `hubspot-company-create`
- `hubspot-company-merge`

Migrations recentes tratam catálogo de pipelines, escopo comercial, CS migration, reconciliação, aliases e qualidade.

### Status real

Parcialmente implementado e validado localmente em ciclos anteriores. Não assumir produção pronta sem verificar runtime, secrets, scheduler e logs remotos.

## OMIE

### Objetivo

Consumir títulos financeiros, atualizar cockpit financeiro e enriquecer HubSpot com dados financeiros quando autorizado.

### Evidência técnica

Edge Functions:

- `omie-sync`
- `hubspot-omie-property-sync`
- `analytics-scheduled-run`

Migrations recentes tratam finance receivables, concorrência, PostgREST schema cache e schedules separados.

### Status real

API OMIE foi configurada e sincronização local reportou 3.433 títulos em ciclos anteriores. Scheduler remoto e execução automática dependem de secrets e deploy autorizados.

## Riscos comuns

- Timeouts em sync longo.
- Consumo repetido de API.
- Cache local divergente.
- Schema cache PostgREST após migrations.
- Escritas externas sem governança.

## Direção

Separar configuração de schedule HubSpot global e OMIE financeiro. Expor estado, logs e frequência. Não rodar cron remoto sem aprovação.
