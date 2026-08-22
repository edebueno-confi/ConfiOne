# Governança de pipeline, área e operação no Analytics V1

Estado: `READY_FOR_REVIEW`
Task: `DATA-PIPELINE-OPERATION-GOVERNANCE-2026-08-21`
Base do lote: `051ce0b`
Escopo: leitura local e contratos server-side; sem chamada externa, escrita em HubSpot/OMIE, produção ou secrets.

## Regra canônica

O vínculo publicado é:

```text
pipeline_id -> area_key -> group_company
```

`analytics_source_config` é o catálogo local que preserva o identificador real do pipeline, o objeto (`deal` ou `ticket`), o nome oficial capturado, o alias, a área e a operação. O `pipeline_id` é a identidade; nomes e emojis não são usados como regra de seleção.

Uma linha só é elegível para um recorte operacional quando está ativa, não arquivada, tem `area_key` classificada, `group_company` definido e `group_company_source = confirmed`. Sugestões, pendências, pipelines inativos e conflitos continuam no inventário e ficam fora dos KPIs, sem fallback silencioso.

Essa regra é aplicada por `app_private.analytics_pipeline_operation_eligible(...)`,
que também rejeita variantes conflitantes do mesmo `object_type + pipeline_id`.
Os seletores de operação recebem somente linhas `mapping_state=confirmed`; a UI
não transforma sugestão ou pendência em operação publicada.

O inventário server-side `rpc_analytics_pipeline_inventory(text)` consolida registros repetidos do mesmo objeto e `pipeline_id`, expõe `mapping_state` (`confirmed`, `suggested`, `unclassified`, `ambiguous`, `inactive`) e retorna a reconciliação de registros publicados de Todas as operações contra cada operação elegível.

## Inventário local conhecido

O catálogo foi semeado pelas migrations de classificação local com IDs de pipeline observados no contrato HubSpot. A tabela abaixo resume os vínculos relevantes para After Sales, Conf e Neo Trust. `a_definir` e `a_classificar` são pendências deliberadas, não classificações válidas.

| Objeto | Operação | Área | Pipeline IDs confirmados/observados | Estado |
|---|---|---|---|---|
| Deal | Aftersale | Comercial | `5014418`, `5051729`, `5038166`, `892833861` | confirmado |
| Deal | Aftersale | Customer Success | `5038168`, `5014421`, `10888352` | confirmado |
| Deal | Aftersale | Customer Success | `918743098` | pendente (`a_definir`) |
| Deal | Confi | Comercial | `727372071`, `11065107`, `890074168` | pendente (`a_definir`) |
| Deal | Neotrust | Comercial | nenhum vínculo confirmado na classificação atual | sem cobertura publicada |
| Ticket | Aftersale | Comercial | `5423143` | confirmado |
| Ticket | Aftersale | Customer Success | `5038170`, `5080662` | confirmado |
| Ticket | Aftersale | Suporte | `5034314`, `5014430`, `149481576` | confirmado |
| Ticket | Aftersale | Produto/Desenvolvimento | `5433491`, `5034315` | inativo e fora do dashboard; destino GitHub |
| Ticket | Confi | Customer Success | `1585486` | confirmado |
| Ticket | Confi | Suporte | `2013870`, `841635`, `23949674`, `95268403` | confirmado |
| Ticket | Confi Analytics | Suporte | `53130860` | confirmado |
| Ticket | Confi | Customer Success | `918901665`, `917379333`, `750874202`, `751323779`, `10909186`, `9904973` | pendente (`a_definir`) |
| Ticket | Confi | Suporte | `16235599` | pendente (`a_definir`) |
| Ticket | Aftersale | Produto/Desenvolvimento | nenhum pipeline HubSpot ativo publicado | indisponível; GitHub pendente |
| Ticket | não classificado | não classificado | `1530793`, `738183788` | inativo e fora dos KPIs |

Os nomes exibidos na tabela são rótulos de catálogo para auditoria. A seleção executável usa os IDs e as colunas de classificação persistidas. Os grupos `Conf` e `Neo Trust` permanecem diferenciados dos nomes históricos `Confi` e `Neotrust` quando a fonte local assim os registra; nenhuma normalização textual foi criada neste lote.

## Aplicação por área

- **Visão Geral:** Comercial e Suporte recebem snapshots e KPIs com `p_group_company` no backend. Financeiro é mascarado como fora da dimensão e não recebe operação.
- **Comercial:** `rpc_analytics_commercial_kpis_by_operation` e `rpc_analytics_commercial_snapshot_by_operation` aplicam o escopo server-side usando o catálogo de deals.
- **Customer Success:** `rpc_analytics_customer_success_kpis_by_operation` aplica o escopo server-side por pipeline de ticket confirmado e associação real `ticket -> company`. O payload informa contagem de tickets, contagem associada, percentual e `operation_scope.state` (`available`, `partial` ou `unavailable`) com razão explícita; pipeline confirmado sem associações fica indisponível. Nenhuma carteira é inferida pelo nome, deal ou texto.
- **Suporte:** KPIs, distribuição por etapa, saúde de fila e snapshot usam wrappers por operação e filtram pipelines de ticket.
- **Produto e Desenvolvimento:** não possui dimensão HubSpot publicada. A UI permanece em estado `Indisponível`, não chama GitHub, não cria números e comunica que o recorte de operação também não tem dimensão publicada.
- **Financeiro:** permanece consolidado e fora desta dimensão. Nenhum pipeline financeiro foi incluído no mapa.

## Reconciliação e limites

`Todas` representa os registros cujo mapeamento está confirmado e elegível. A saída de `rpc_analytics_pipeline_inventory` informa `published_records_all_operations` e a lista `operations`, permitindo comparar o total com cada soma por operação sem misturar pendências ou inativos.

O recorte de Customer Success tem uma limitação importante: a carteira é de empresas, e o vínculo operacional disponível localmente é a associação ingerida de tickets para empresas. Uma empresa sem associação de ticket CS confirmada não é atribuída por nome, deal ou proximidade textual. O payload mantém `operation_scope.state` e `operation_scope.reason` para diferenciar ausência de pipeline, classificação não confirmada e operação disponível.

O diagnóstico foi feito contra migrations, views, RPCs, frontend e testes locais. Não houve consulta ao portal HubSpot, chamada externa, leitura de secrets ou escrita em qualquer integração. A confirmação de paridade do catálogo com o portal depende de uma próxima execução autorizada de sincronização read-only.

## Fontes executáveis

- `supabase/migrations/20260717150000_analytics_hubspot_foundation_v1.sql`
- `supabase/migrations/20260807140000_analytics_hubspot_relations_and_history_v1.sql`
- `supabase/migrations/20260808200000_operacao_do_grupo_em_negocios.sql`
- `supabase/migrations/20260808290000_analytics_operation_scope_v1.sql`
- `supabase/migrations/20260810200000_analytics_pipeline_classification_by_brand_v1.sql`
- `supabase/migrations/20260822070000_analytics_pipeline_operation_governance_v1.sql`
- `supabase/migrations/20260822073000_analytics_pipeline_operation_governance_findings_v1.sql`
- `supabase/migrations/20260822074000_analytics_pipeline_operation_governance_snapshot_area_fix.sql`
- `supabase/tests/110_analytics_operation_scope.sql`
- `supabase/tests/121_analytics_pipeline_operation_governance.sql`
- `tests/scripts/analytics-dashboard-domains-integrations.test.mjs`
