# Customer Operations and Migration Domain V1

**Produto:** ConfiOne
**Data:** 2026-08-16
**Escopo:** backend, contratos compartilhados, RLS, importação de inventário, projetos de migração e uma leitura operacional aditiva na Central de Clientes. Nenhuma escrita externa nesta etapa.

## Decisões de domínio

- `tenants` continua sendo o cliente/conta operacional e não foi duplicado.
- `customer_account_groups` e `customer_account_group_members` continuam representando relacionamento interno de grupo econômico ou guarda-chuva de serviço. Carteira CS permanece em `cs_customer_portfolio_assignments` e nunca deve ser criada como agrupamento de marcas, full commerce ou grupo econômico.
- `customer_account_sources` diferencia explicitamente `after_sale/v1` de `genius/current`. As duas origens não compartilham equivalências automaticamente.
- `customer_account_stores` identifica cada loja por origem, cliente e identificador externo. Nenhum projeto pode incluir loja de outro cliente ou origem.
- O inventário é recebido como pacote sanitizado, versionado por snapshot e idempotente por `store_id + fingerprint`.
- `customer_projects` é a entidade genérica. `customer_migration_projects` é a especialização de migração para `after_sale/v2`.
- O executor externo tem somente contrato de solicitação e retorno local. Não há login automático, scraping ou escrita em After Sale V1, Boss, Genius ou After Sale V2.

## Entidades

| Entidade | Função |
|---|---|
| `customer_account_sources` | Origem e versão do cliente |
| `customer_account_stores` | Loja individual confirmada |
| `customer_inventory_snapshots` | Pacote versionado de inventário |
| `customer_inventory_feature_observations` | Estado contratado, Boss, observado e uso confirmado |
| `customer_operation_evidence` | Metadados de Storage privado sem secrets |
| `customer_projects` | Projeto operacional genérico |
| `customer_migration_projects` | Dados específicos da migração |
| `customer_migration_project_stores` | Escopo explícito de lojas |
| `customer_migration_eligibility_evaluations` | Elegibilidade explicável |
| `customer_migration_batches` / `customer_migration_waves` | Lotes e levas |
| `customer_migration_approvals` | Aprovação antes da execução |
| `customer_migration_execution_requests` | Contrato de executor externo |
| `customer_migration_validation_results` | Evidência do pós-save e divergências |
| `customer_project_comments` / `customer_project_activities` | Comentários, decisões e histórico operacional |

## Regras de segurança

- Leitura operacional exige perfil ativo e papel interno autorizado.
- Escrita exige `platform_admin` ou `engineering_manager` e passa por RPC `security definer`.
- Tabelas não concedem DML direto ao `authenticated`; views possuem `security_barrier`.
- Auditoria de linha é append-only por `audit.capture_row_change`.
- Pacotes rejeitam conteúdo não sanitizado e paths que contenham credenciais.
- A RPC de execução exige elegibilidade aprovada, aprovação válida e escopo explícito de lojas.
- Transições são validadas no banco. `standby` e `blocked` exigem motivo.
- Resultados `divergent` e `validated_with_reservation` exigem divergência registrada.

## RPCs principais

- `rpc_admin_upsert_customer_source`
- `rpc_admin_upsert_customer_store`
- `rpc_admin_import_customer_inventory_snapshot`
- `rpc_admin_create_customer_migration_project`
- `rpc_admin_link_migration_project_store`
- `rpc_admin_evaluate_customer_migration`
- `rpc_admin_transition_customer_project`
- `rpc_admin_approve_customer_migration`
- `rpc_admin_create_customer_migration_batch`
- `rpc_admin_create_customer_migration_wave`
- `rpc_admin_add_customer_migration_batch_item`
- `rpc_admin_request_customer_migration_execution`
- `rpc_admin_record_customer_migration_validation`
- `rpc_admin_add_customer_project_comment`
- `rpc_admin_record_customer_project_activity`

## Read models

- `vw_admin_customer_operations_directory`
- `vw_admin_customer_inventory_observations`
- `vw_admin_customer_migration_kanban`

## Superfície operacional atual

`CustomerOperationsPanel` é um drawer somente leitura aberto pela Central de Clientes. Ele apresenta o diretório de clientes, fontes, lojas, projetos de migração e observações de inventário. O vínculo de CS é mostrado separadamente do contexto de grupo, sem criar ou editar carteira. Lojas, inventário e projetos permanecem vazios quando ainda não há escopo operacional confirmado; isso é um estado real do ambiente, não dado mockado.

Para a futura Release 2, esse drawer não é o workspace principal do cliente. A
direção aprovada passa a ser uma rota dedicada conforme os blueprints
[`CENTRAL_CLIENTES_HOME_V1.png`](design/blueprints/central-clientes/CENTRAL_CLIENTES_HOME_V1.png)
e [`CLIENTE_RESUMO_V1.png`](design/blueprints/central-clientes/CLIENTE_RESUMO_V1.png).
O painel atual permanece como sub-superfície operacional somente leitura até a
reconciliação do contrato e dos dados reais.

## Importação local de clientes HubSpot

Em 2026-08-16, o diretório local recebeu 264 empresas HubSpot filtradas por `e_cliente_aftersale_ = Sim`. Esses registros representam exclusivamente clientes After Sale V1. Cada empresa foi vinculada a `tenants` e a `customer_account_sources` com `source_system = hubspot`, sem criação de lojas, grupos, projetos ou carteiras de CS. O resultado, a correção de ACL do sincronizador automático e as limitações restantes estão registrados em `docs/reports/HUBSPOT_CUSTOMER_DIRECTORY_IMPORT_2026-08-16.md`.

## Validação local

- Migration aplicada sem reset destrutivo.
- pgTAP focado do domínio e da ACL: 3 arquivos, 52 testes aprovados. A suíte completa local agora percorre 120 arquivos e 1.859 testes; um teste legado de escopo (`110_analytics_operation_scope.sql`) falha porque o snapshot real recém-sincronizado adiciona tickets à contagem global esperada pela fixture. Nenhum teste foi enfraquecido.
- Teste específico: `supabase/tests/117_customer_operations_migration_domain_v1.sql`.
- SQL lint aprovado, com avisos legados e nenhum erro bloqueante.
- Typecheck de `packages/contracts` aprovado.

## Fora do escopo

- Edição visual de projetos, Kanban completo, importação assistida e filtros avançados de tela.
- Scraping, login automatizado e chamadas de escrita nas origens ou no destino.
- Importação real de Grendene, Genius ou After Sale V1 sem pacote autorizado e evidência de origem.
- Conversão automática de nomes semelhantes, defaults da V2 ou permissões do Boss em equivalências.
