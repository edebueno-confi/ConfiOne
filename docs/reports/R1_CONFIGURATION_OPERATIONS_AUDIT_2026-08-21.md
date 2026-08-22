# R1 Configuration Operations Audit

## Escopo e segurança

- Task: `R1-CONFIGURATION-OPERATIONS-2026-08-21`
- Base SHA: `0e7d7c1bccb2aed0b0fd9eb673d4e2eb72fcb230`
- Auditoria local e read-only, sem leitura de valores de secrets, chamadas externas, escrita em HubSpot/OMIE, produção ou alteração de credenciais.
- HTTP 200 isolado não foi tratado como sucesso funcional. A classificação usa contrato, payload, estado publicado e erro sanitizado disponíveis no código local.

## Matriz factual

| Superfície | UI e fontes locais | Evidência de estado, cobertura e integridade | Permissão e limite |
|---|---|---|---|
| Integrações | `apps/web/src/features/settings/SettingsIntegrationsPanel.tsx`; `settings-api.ts:listManagedIntegrations`; `vw_admin_managed_integrations`; `rpc_analytics_source_status` | A publicação filtra HubSpot e OMIE. O painel combina configuração gerencial com status de fonte e exibe estados como atualizada, sincronizando, falhou, parcial, desatualizada e ainda não atualizada. O status depende de execução publicada, não de mera existência da configuração. | A permissão local `canManageAnalyticsIntegration` restringe gestão/execução a `platform_admin`; `dashboard_viewer` é negado pelos testes focused. Formulários aceitam credenciais, mas nenhuma foi lida, enviada ou alterada nesta auditoria. |
| Governança de dados | `DashboardSourcesSettingsPage.tsx`; `analytics-api.ts:listAnalyticsSourceConfig`, `getAnalyticsSourceStatus`, `getIntegrationSchedule`; RPCs `rpc_analytics_source_status`, `rpc_analytics_pipeline_inventory`; `vw_analytics_integration_schedule_read` | O read model expõe pipelines, tipo de objeto, área, operação, arquivamento, atividade, descoberta e fonte da classificação. A UI distingue operação confirmada de sugestão pendente e não deve usar configuração ambígua como evidência de cobertura publicada. Schedule e source status são leituras separadas; frequência desligada é exibida como desativada. | Alterações de área/operação/schedule existem como RPCs administrativos, mas não foram executadas. A cobertura real depende dos contratos/read models locais e do estado do ambiente; portal externo, scopes e paridade de produção não foram verificados. |
| Histórico de sincronizações | `SyncHistorySettingsPage.tsx`; `analytics-api.ts:listAnalyticsSyncHistory`; `vw_admin_analytics_sync_history_v2` | O histórico carrega no máximo 100 linhas publicadas, agrupa por ciclo e fonte e preserva estados de sucesso, parcial, falha, execução e ausência. Exibe início, fim, duração, quantidade processada, erro sanitizado e correlação quando publicados. Filtros e paginação atuam sobre o recorte carregado, não simulam histórico inexistente. | Erros de rede/execução são tratados como estado de erro. Recortes anteriores ao limite do read model não são afirmados como disponíveis. A auditoria não realizou sincronização nem validou uma integração externa. |
| Marcas | `BrandsSettingsPage.tsx`; `SettingsPage.tsx`; `settings-api.ts:listBrands`; tabela `brands`; perfil complementar `useKnowledgeSpaceProfiles` | A fonte da lista é `brands` com `id`, `key`, `label`, `help_center_slug`, `sort_order` e `is_active`. A tela deriva apenas iniciais e vínculo com central de ajuda; artigos publicados só aparecem quando o perfil local da central está pronto. Ausência de perfil vira indisponível, sem inventar contagem. | Criar e arquivar usam RPCs administrativos, mas não foram executados. Não há evidência local de edição de logo, cor, idioma ou domínio. Cobertura de marcas é a lista local, não prova de publicação externa da central. |

## Fatos, hipóteses e limitações

### Fatos reproduzidos localmente

- A cadeia de leitura possui fontes distintas por superfície, sem fallback silencioso entre integrações, histórico e marcas.
- O status de fonte é derivado de execução/estado publicado e mantém a distinção entre tentativa, sucesso anterior, falha, parcial e ausência.
- Testes focused confirmam permissão de administrador, estados canônicos de fonte, proteção contra marcar dado nunca sincronizado como fresco, orquestração HubSpot/OMIE, erros sanitizados e separação das CTAs administrativas.
- A configuração de pipeline representa área/operação e distingue `groupCompanySource=confirmed` de sugestão pendente.

### Hipóteses não promovidas a fato

- Não é possível concluir paridade com produção, saúde atual do portal, existência dos scopes ou execução de scheduler externo a partir do checkout local.
- Não é possível concluir que uma credencial configurada seja válida sem uma validação autorizada da integração. Nenhuma credencial foi acessada.
- A presença de uma linha em `brands` não prova que a marca esteja publicada em um serviço externo.

### Limitações e pendências

- Não houve chamada externa, QA autenticado de navegador, validação de produção ou inspeção de valores sensíveis.
- A validação deste lote cobre contratos e composição local. Execução real de sync, reconciliação de tenant e confirmação de scopes/segredos exigem ambiente autorizado e task própria.
- Ações de escrita existentes permanecem fora da auditoria operacional: salvar integração, confirmar operação, alterar schedule, criar marca e arquivar marca.

## Validação

- Testes focused: `node --test` com 11 arquivos de contrato/orquestração/telemetria, **49/49 PASS**.
- `git diff --check`: PASS no estado de evidência antes da entrega.
- Gates amplos foram registrados em `IMPLEMENTATION.md` e validados antes da entrega.
