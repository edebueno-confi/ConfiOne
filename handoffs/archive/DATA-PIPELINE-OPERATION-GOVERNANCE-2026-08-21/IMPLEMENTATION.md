# IMPLEMENTATION

- Task ID: `DATA-PIPELINE-OPERATION-GOVERNANCE-2026-08-21`
- State: `READY_FOR_REVIEW`
- Owner: `Sentinel`
- Role: `REVIEWER`
- Reviewer active: `Sentinel`
- Review mode: `SENTINEL_REQUIRED`
- Coordinator: `Codex`
- Agent coordination: `REVIEW_ACTIVE`
- Approval: `APPROVED`
- Base SHA: `051ce0b`
- Implementation SHA: `UNCOMMITTED_WORKTREE`

## Resultado

Forge implementou a governança local do vínculo `pipeline_id -> area_key ->
group_company`, com estados explícitos para cobertura confirmada, sugestão,
ausência de classificação, ambiguidade e pipeline inativo. Os filtros de
Comercial e Suporte continuam nos wrappers server-side existentes; Customer
Success passou a ter wrapper server-side por operação baseado em pipeline de
ticket confirmado e associação ticket-empresa. Produto/Desenvolvimento continua
explicitamente aguardando dimensão publicada, sem números fictícios. Financeiro
permanece consolidado e fora desta dimensão.

## Arquivos do lote

- `supabase/migrations/20260822070000_analytics_pipeline_operation_governance_v1.sql`
  - substitui o inventário de pipelines por um contrato de reconciliação com
    `mapping_state`, operações elegíveis, registros publicados em Todas,
    registros sem classificação, pipelines ambíguos e pipelines inativos;
  - adiciona `rpc_analytics_customer_success_kpis_by_operation(text)`;
  - restringe Customer Success por associação real ticket -> empresa e por
    classificação confirmada, sem fallback por nome;
  - mantém grants somente para `authenticated` e `service_role`, com `anon`
    revogado.
- `supabase/migrations/20260822073000_analytics_pipeline_operation_governance_findings_v1.sql`
  - fecha F-DATA-001 com a função interna de elegibilidade canônica, aplica a
    regra aos KPIs/snapshots publicados e passa a retornar cobertura explícita
    do Customer Success.
- `supabase/migrations/20260822074000_analytics_pipeline_operation_governance_snapshot_area_fix.sql`
  - reconcilia o snapshot publicado de Suporte com a área `support`, sem
    confundir esse read model com o wrapper de Customer Success.
- `supabase/tests/121_analytics_pipeline_operation_governance.sql`
  - cobre existência, contrato de mapeamento, exclusão de Financeiro,
    fixtures independentes `suggested`/`ambiguous`, exclusão em KPIs e
    snapshots, associação ticket-empresa, proveniência e privilégios.
- `apps/web/src/features/analytics/analytics-api.ts`
  - chama o wrapper de Customer Success com `p_group_company`.
- `apps/web/src/features/analytics/AnalyticsCustomerSuccessPage.tsx`
  - reutiliza a operação compartilhada, lê o inventário canônico confirmado e
    exibe estado, razão e contagens quando a cobertura ticket-empresa é ausente
    ou parcial.
- `apps/web/src/features/analytics/analytics-model.ts`
- `apps/web/src/features/analytics/AnalyticsOperationScope.tsx`
  - impede seleção de operações `pending`/`suggested` no seletor publicado.
  - reconhece `confirmed` no catálogo de fontes.
- `apps/web/src/features/analytics/AnalyticsCeoPage.tsx`
  - comunica o recorte server-side e mantém Financeiro fora da dimensão.
- `apps/web/src/features/analytics/AnalyticsUnavailablePages.tsx`
  - mantém Produto/Desenvolvimento como espera de integração, sem fetch ou
    dados inventados.
- `tests/scripts/analytics-dashboard-domains-integrations.test.mjs`
  - atualiza asserções para os wrappers atuais e cobre Customer Success,
    Produto/Desenvolvimento e Financeiro.
- `docs/ANALYTICS_PIPELINE_OPERATION_GOVERNANCE_V1.md`
  - documenta fonte de verdade, inventário, estados, reconciliação, cobertura e
    limitações.
- `docs/README.md`, `docs/VIEW_RPC_CONTRACTS.md`, `docs/PROJECT_STATE.md` e
  `docs/DOCUMENTATION_LEDGER.md`
  - registram o contrato e a entrega deste lote.

## Inventário local reproduzido

O inventário abaixo vem de `analytics_source_config` e dos contratos locais. Não
é validação do portal HubSpot nem substitui uma futura descoberta autorizada.

| Objeto | Área/operação | IDs observados | Estado |
|---|---|---|---|
| deal | After Sales / Comercial | `5014418`, `5051729`, `5038166`, `892833861` | confirmado |
| deal | After Sales / Customer Success | `5038168`, `5014421`, `10888352` | confirmado |
| deal | After Sales / Customer Success | `918743098` | pendente |
| deal | Conf / Comercial | `727372071`, `11065107`, `890074168` | pendente |
| ticket | Conf / Customer Success | `1585486` | confirmado |
| ticket | Conf / Suporte | `2013870`, `841635`, `23949674`, `95268403`, `53130860` | confirmado |
| ticket | After Sales / Customer Success | `5038170`, `5080662` | confirmado |
| ticket | After Sales / Suporte | `5034314`, `5014430`, `149481576` | confirmado |
| ticket | After Sales / Comercial | `5423143` | confirmado |
| ticket | Conf ou After Sales / classificação pendente | `918901665`, `917379333`, `750874202`, `751323779`, `10909186`, `9904973`, `16235599` | pendente |
| ticket | candidatos inativos sem classificação publicada | `5433491`, `5034315`, `1530793`, `738183788` | inativo |
| deal/ticket | Neo Trust | não há vínculo confirmado no catálogo local corrente | não inferido |

IDs sem classificação confirmada continuam visíveis para triagem, mas não entram
silenciosamente nos KPIs publicados. `mapping_state=ambiguous` é calculado quando
o mesmo pipeline possui mais de uma variante de área/operação. O mapa não usa o
nome do pipeline para decidir o recorte.

## Fatos, hipóteses e limitações

- Fato local: o catálogo persistido contém os IDs e classificações acima, e os
  wrappers de Comercial/Suporte já aplicam escopo no servidor.
- Fato local: Customer Success agora restringe por associação ticket-empresa,
  pipeline de ticket ativo/não arquivado e `group_company_source='confirmed'`.
- Fato local: Produto/Desenvolvimento não possui dimensão publicada neste lote;
  a interface permanece em espera e não estima throughput, lead time ou rollout.
- Fato local: Financeiro não participa da reconciliação operacional.
- Hipótese não validada externamente: divergências restantes entre o portal e o
  catálogo local podem exigir descoberta autorizada e nova ingestão.
- Limitação: não houve chamada externa, leitura de secrets, validação online do
  HubSpot, escrita no HubSpot/OMIE, deploy ou validação em produção.
- Limitação: o banco Supabase local foi atualizado apenas pela migration deste
  lote para permitir os testes pgTAP; nenhum banco remoto foi alterado.

## Gates e evidências

- `node --test tests/scripts/analytics-dashboard-domains-integrations.test.mjs`
  - PASS, 7/7.
- `npm run web:typecheck`
  - PASS.
- `npm run web:build`
  - PASS, 945 módulos transformados.
- `npm run lint`
  - PASS, 0 erros e 160 warnings legados.
- `npm run review:gates`
  - PASS, 0 regressões bloqueantes e 47 itens do baseline resolvidos.
- `npm run docs:validate`
  - PASS, 0 documentos bloqueados; alertas históricos permanecem registrados.
- `node .agents/skills/genius-documentation-governance/scripts/validate-governance-skill.mjs`
  - PASS, estrutura válida e 0 erros.
- `node .agents/skills/genius-documentation-governance/scripts/run-documentation-audit.mjs changed`
  - PASS, 0 bloqueadores; veredito `consistente com ressalvas` por achados
    heurísticos/históricos do worktree.
- `npm run quality:changed`
  - PASS, resultado `aprovado com observações`, 0 blockers confirmados e 18
    candidatos informativos/médios fora do escopo direto.
- `npm run supabase:lint:db`
  - processo PASS; o lint emitiu diagnósticos históricos da extensão `pgtap`,
    sem apontar falha na migration deste lote.
- `npm exec -- supabase migration up --local`
  - PASS, aplicou as migrations locais
    `20260822070000_analytics_pipeline_operation_governance_v1.sql`,
    `20260822073000_analytics_pipeline_operation_governance_findings_v1.sql` e
    `20260822074000_analytics_pipeline_operation_governance_snapshot_area_fix.sql`.
- `npm run supabase:test:db`
  - PASS, 126 arquivos e 1.945 testes pgTAP.
- `git diff --check`
  - PASS.

## Resposta aos findings do Sentinel

### F-DATA-001

Resolvido no server-side. A nova função interna
`app_private.analytics_pipeline_operation_eligible(...)` exige, por
`object_type + pipeline_id`, registro ativo e não arquivado, área classificada,
operação definida, `group_company_source='confirmed'` e uma única variante de
área/operação. O predicado foi aplicado aos read models de Comercial e Suporte,
à distribuição/saúde da fila e aos snapshots publicados. Pipelines `suggested`,
`unclassified` ou `ambiguous` continuam no inventário para triagem, mas são
excluídos dos números e não aparecem no seletor de operação.

Regressões determinísticas adicionadas em `supabase/tests/121...sql` usam
fixtures independentes do catálogo atual: pipeline de deal `suggested` e
pipeline de ticket `ambiguous` são rejeitados pelo helper e retornam zero nos
KPIs/snapshots correspondentes. O teste também confirma o contrato das funções
publicadas e a ausência de Financeiro nessa dimensão.

### F-DATA-002

Resolvido no wrapper de Customer Success. A disponibilidade agora mede tickets
em pipelines CS elegíveis e associações reais ticket-empresa contra o read model
de empresas. O payload retorna `ticket_count`, `associated_ticket_count`,
`coverage_percent`, estado `available`, `partial` ou `unavailable` e razões
`operation_ticket_coverage_missing`, `ticket_company_association_missing` ou
`ticket_company_association_partial`. A fixture de pipeline confirmado sem
associações comprova `unavailable`; a UI exibe o estado, a razão e as contagens.
Não existe fallback por nome, deal ou texto.

### Gates da correção

- `node --test tests/scripts/analytics-dashboard-domains-integrations.test.mjs tests/scripts/analytics-operation-scope.test.mjs` — PASS, 7/7.
- `npm exec -- supabase test db --local supabase/tests/110_analytics_operation_scope.sql supabase/tests/120_analytics_pipeline_stage_scope.sql supabase/tests/121_analytics_pipeline_operation_governance.sql` — PASS, 3 arquivos e 42 testes pgTAP focados.
- `npm run supabase:test:db` — PASS, 126 arquivos e 1.945 testes pgTAP.
- `npm run web:typecheck` — PASS.
- `npm run web:build` — PASS, 945 módulos transformados.
- `npm run lint` — PASS, 0 erros e 160 warnings legados.
- `npm run review:gates` — PASS, 0 regressões bloqueantes e 47 itens do baseline resolvidos.
- `npm run docs:validate` — PASS, 0 documentos bloqueados; alertas históricos permanecem registrados.
- `node .agents/skills/genius-documentation-governance/scripts/validate-governance-skill.mjs` — PASS, estrutura válida e 0 erros.
- `node .agents/skills/genius-documentation-governance/scripts/run-documentation-audit.mjs changed` — PASS, 0 bloqueadores; veredito `consistente com ressalvas` por achados heurísticos/históricos.
- `npm run quality:changed` — PASS, 0 blockers confirmados e 18 candidatos fora do escopo direto.
- `git diff --check` — PASS.

## Transferência

O lote está pronto para revisão independente do Sentinel. `REVIEW.md` foi
preservado sem alteração nesta execução. Não houve commit, push, merge, deploy,
migration remota, alteração de secrets, chamada externa ou escrita em HubSpot,
OMIE ou produção.
