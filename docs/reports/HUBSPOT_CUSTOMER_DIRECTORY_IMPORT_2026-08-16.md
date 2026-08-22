# Importação local do diretório de clientes HubSpot

**Produto:** ConfiOne
**Data:** 2026-08-16
**Escopo:** importação local de empresas HubSpot marcadas como clientes After Sale. Nenhuma escrita foi feita no HubSpot, Omie, produção ou qualquer serviço externo.

## Regra de seleção

Foram consultadas as empresas `COMPANY` do HubSpot com `e_cliente_aftersale_ = Sim`. O total retornado foi **264 registros**, paginado em 100, 100 e 64. O filtro foi reaplicado no importador antes de qualquer escrita local.

## Mapeamento aplicado

- Cada empresa foi vinculada a um `tenant` local.
- A origem foi registrada em `customer_account_sources` como `source_system = hubspot`, `source_product = after_sale` e `source_version = current`.
- `Churn` e `Bloqueado` foram registrados como fonte `inactive`; as demais empresas elegíveis foram registradas como `confirmed`.
- O nome e a razão social disponível foram usados no cadastro canônico. Status de cliente e contrato foram preservados apenas como nota operacional sanitizada da origem.
- Não foram criadas lojas, grupos econômicos, guarda-chuvas de marca, projetos, carteiras ou atribuições de CS.
- Omie não foi consultado nem alterado.

## Resultado local

| Verificação | Resultado |
|---|---:|
| Empresas elegíveis recebidas | 264 |
| Vínculos HubSpot After Sale atuais | 264 |
| Fontes `confirmed` | 247 |
| Fontes `inactive` | 17 |
| IDs externos duplicados | 0 |
| Linhas autenticadas no diretório | 267 |
| Linhas importadas presentes no diretório | 264 |
| Lojas criadas pela importação | 0 |
| Projetos criados pela importação | 0 |
| Atribuições de CS criadas pela importação | 0 |

As 267 linhas do diretório incluem três tenants de fixture QA que já existiam antes da importação.

## Segurança e validação

- As fontes foram gravadas pelo RPC administrativo autenticado `rpc_admin_upsert_customer_source`; escrita direta na tabela continua bloqueada.
- Foi adicionada e aplicada somente localmente a migration `20260816152000_customer_operations_read_acl_fix_v2.sql`, que restaura `EXECUTE` da função booleana usada pela policy de leitura. A ausência dessa permissão causava HTTP 42501 na Central de Clientes.
- A leitura autenticada foi validada com o usuário QA local: 264 fontes, 264 tenants importados na view, zero duplicidade, zero loja, zero projeto e zero atribuição de CS inesperada.
- O importador é idempotente por `source_system + source_external_id`; a repetição atualizou vínculos existentes sem criar duplicatas.

## Sincronizador automático do dashboard

A primeira execução automática local revelou uma falha de ACL: o worker conseguia fazer o claim dos lotes, mas a leitura direta de `hubspot_sync_runs` retornava HTTP 403 porque a migration do runner havia revogado os privilégios do `service_role`. Os itens ficavam em `running`, sem erro persistido, e o dispatcher terminava em 502.

Foi aplicada somente no banco local a migration `20260816153000_hubspot_orchestrator_service_acl_fix_v1.sql`, concedendo `SELECT` e `UPDATE` de `hubspot_sync_runs` ao `service_role`. A proteção de escrita para `authenticated` permanece intacta e a correção foi coberta por `supabase/tests/118_hubspot_orchestrator_service_acl_fix_v1.sql`.

Após a correção, uma nova execução local concluiu com status `success`, 48 itens `succeeded`, 61.843 registros recebidos e 62.066 registros promovidos. Esse ciclo validou o snapshot do dashboard no Supabase local; não houve escrita no HubSpot, Omie, produção ou qualquer serviço externo.

Com a fila ociosa, uma chamada autenticada posterior ao dispatcher retornou HTTP 200 com worker `idle`, confirmando que a correção não deixou uma nova execução presa.

## Gates após a correção

- `npm test`: 262/262 aprovados.
- `npm run test:all`: 550/550 aprovados.
- pgTAP focado (`004`, `117`, `118`): 52/52 aprovados.
- Typecheck de contratos e web: aprovado.
- Build web: aprovado, 940 módulos.
- Lint: 0 erros e 160 avisos legados.
- Secret scan: 2.178 arquivos rastreados, 0 correspondências.
- A suíte pgTAP completa percorreu 120 arquivos e 1.859 testes; um teste legado (`110_analytics_operation_scope.sql`) falhou porque a fixture espera banco sem o snapshot real recém-sincronizado. Nenhuma asserção foi enfraquecida.
- O smoke autenticado da Central de Clientes retornou 267 linhas, 264 fontes HubSpot e 0 respostas inesperadas. O smoke Playwright amplo não foi repetido porque o script tenta iniciar outro servidor em `4173`, já ocupado pelo preview local mantido em execução.

## Limitações conhecidas
- CNPJ, domínio, MRR, proprietário de CS e produtos contratados continuam disponíveis no registro retornado pelo HubSpot e no contrato de snapshot do dashboard quando o sincronizador concluir. Não foram copiados para campos operacionais adicionais da Central porque o modelo de perfil e a atribuição de CS exigem decisões de domínio explícitas.
- Todos os 264 clientes importados neste lote representam a carteira After Sale V1 porque foram filtrados por `e_cliente_aftersale_ = Sim` no HubSpot. Nenhuma equivalência com Genius, grupo econômico, guarda-chuva de marca ou carteira de CS foi inferida.

## Artefatos

- `scripts/local-qa/import-hubspot-client-directory.mjs`
- `scripts/local-qa/verify-hubspot-client-directory.mjs`
- `supabase/migrations/20260816152000_customer_operations_read_acl_fix_v2.sql`
- `supabase/migrations/20260816153000_hubspot_orchestrator_service_acl_fix_v1.sql`
- `supabase/tests/118_hubspot_orchestrator_service_acl_fix_v1.sql`
