# Fluxo seguro de unificacao de empresas HubSpot - 2026-07-19

## O que foi criado

- Edge Function `hubspot-company-merge`, restrita a `platform_admin`.
- RPC read-only de ambiguidades permanece responsavel por listar os candidatos.
- Tabela `analytics_hubspot_merge_runs` para auditoria de solicitante, empresa
  mestre, empresa incorporada, status, resposta sanitizada e erro.
- Interface da Visao Executiva com selecao de mestre, selecao do registro a
  incorporar, links para o HubSpot e confirmacao textual `UNIFICAR`.

## API externa

O fluxo chama o endpoint oficial de merge de empresas do HubSpot:

`POST /crm/objects/2026-03/companies/merge`

com `primaryObjectId` e `objectIdToMerge`. A credencial permanece server-side
na integracao gerenciada; nunca e enviada ao navegador.

## Barreiras de seguranca

- Somente `platform_admin` pode chamar a Edge Function.
- Os dois IDs precisam ser diferentes, numericos e existir no cache local.
- A UI exige confirmacao textual antes de enviar a chamada.
- Cada tentativa e registrada como `running`, `succeeded` ou `failed`.
- O sistema nao escolhe automaticamente a empresa mestre.
- O sistema nao executa merge em lote.
- Apos sucesso, a sincronizacao HubSpot e recomendada para atualizar o cache.

## Limites

O merge e uma escrita externa e pode gerar um novo ID de empresa no HubSpot.
Nao existe rollback automatico implementado; por isso o fluxo nao e disparado
automaticamente e exige decisao do administrador para cada par.

## Validacao

## Cache lifecycle apos merge

Causa observada: apos a unificacao de Gloss, o HubSpot retornou o novo ID
`56708181165`, mas o cache local ainda mantinha os IDs anteriores
`34831137105` e `8448705591`. Como a reconciliacao lia todo o cache, Gloss
aparecia tres vezes no dashboard.

Correcao aplicada:

- As duas linhas obsoletas foram removidas somente do cache local; a auditoria
  permanece preservada.
- O sincronizador agora rejeita snapshot vazio, grava todos os registros
  recebidos e remove, somente apos a carga bem-sucedida, IDs ausentes do
  snapshot atual.
- O indice `hubspot_companies_synced_at_idx` foi criado para suportar a
  limpeza do snapshot.

Validacao especifica:

- Antes: 10.163 linhas no cache, 10.161 no ultimo snapshot e 3 registros Gloss.
- Depois: 10.161 linhas no cache e somente o novo ID `56708181165` para Gloss.

- Migration aplicada localmente.
- Tabela de auditoria e RPC verificadas no banco local.
- `npm run web:typecheck`: aprovado.
- `npm run web:build`: aprovado.
- `npx supabase db lint`: aprovado com warnings preexistentes de `v_actor`.
- `git diff --check`: aprovado.
- O usuário validou o fluxo no ambiente e confirmou que a unificação foi executada com sucesso.
- Após cada merge, executar a sincronização HubSpot para atualizar o cache local e refletir o novo ID resultante.
