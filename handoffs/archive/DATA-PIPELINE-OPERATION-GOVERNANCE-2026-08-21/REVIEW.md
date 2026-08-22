# REVIEW

## Identificação

- **Task ID:** `DATA-PIPELINE-OPERATION-GOVERNANCE-2026-08-21`
- **Reviewer:** Sentinel (Codex Independent Reviewer)
- **Estado revisado:** `READY_FOR_REVIEW`
- **Base SHA:** `051ce0b96c22d5ea9cbd21d4630d313f15025299`
- **HEAD observado:** `051ce0b96c22d5ea9cbd21d4630d313f15025299`
- **Implementation SHA:** `UNCOMMITTED_WORKTREE`
- **Review mode:** `SENTINEL_REQUIRED`
- **Escopo:** migration, pgTAP, contratos de Analytics, telas de Analytics e documentação listados em `IMPLEMENTATION.md`.

## Resumo da funcionalidade e ganho para o produto

O lote criou um inventário server-side do vínculo `pipeline_id -> area_key -> group_company`, com estados `confirmed`, `suggested`, `unclassified`, `ambiguous` e `inactive`. Também conectou Customer Success a um wrapper por operação baseado em pipeline de ticket confirmado e associação real ticket -> empresa, manteve Comercial e Suporte nos wrappers server-side existentes, deixou Produto/Desenvolvimento explicitamente indisponível sem inventar métricas e manteve Financeiro fora da dimensão.

O ganho potencial para o SaaS é impedir que a Visão Geral e os domínios operacionais somem pipelines de empresas diferentes sem rastreabilidade, tornando a cobertura auditável e preparando a operação para separar Aftersale, Confi e Neo Trust. A entrega ainda não pode ser aprovada porque duas garantias centrais do contrato não estão fechadas nos caminhos publicados.

## Findings

### F-DATA-001 — MEDIUM — Wrappers existentes aceitam mapeamento sugerido ou ambíguo como operação publicada

- **Requisito:** somente pipeline ativo, não arquivado, com área classificada, operação definida e `group_company_source = confirmed` deve ser elegível para KPIs; sugestões, pendências e conflitos devem permanecer fora dos números.
- **Evidência:** a documentação do lote declara essa regra em `docs/ANALYTICS_PIPELINE_OPERATION_GOVERNANCE_V1.md:18-20`. Porém, a injeção dos filtros usados por Comercial, Suporte e seus read models em `supabase/migrations/20260808290000_analytics_operation_scope_v1.sql:29-31` aplica apenas `c.group_company = current_setting(...)`. Os wrappers de snapshot excluem somente `c.group_company is distinct from p_group_company` em `:163-170` e `:194-201`; não exigem `group_company_source = 'confirmed'` nem consultam `mapping_state`/conflito.
- **Evidência complementar:** `apps/web/src/features/analytics/AnalyticsOperationScope.tsx:3-12,20-36,60-62` mantém opções `suggested` selecionáveis. O rótulo `(sugerida)` informa a origem, mas não impede o envio da operação à RPC. O teste `supabase/tests/121_analytics_pipeline_operation_governance.sql:51-78` cobre a exigência `confirmed` somente no wrapper novo de Customer Success, não nos wrappers existentes de Comercial, Suporte e snapshots.
- **Estado reproduzido:** a consulta read-only ao banco local não encontrou sugestão nomeada ativa agora; os registros não confirmados atuais estão em `a_definir`. Portanto, não há vazamento atual reproduzido, mas o contrato permite a regressão assim que uma sugestão nomeada for ingerida ou um pipeline conflitante for cadastrado.
- **Impacto:** uma seleção operacional pode publicar KPIs baseados em classificação ainda não confirmada ou incluir parte de um pipeline ambíguo. Isso contradiz a fonte de verdade do lote e pode produzir decisões gerenciais incorretas sem estado de indisponibilidade.
- **Correção esperada:** aplicar a mesma elegibilidade canônica nos wrappers de Comercial, Suporte e snapshots, excluindo explicitamente fontes não confirmadas, inativas, arquivadas e mapeamentos ambíguos. Adicionar teste de regressão com configuração `suggested` e cenário ambíguo, cobrindo KPIs e snapshots, sem depender apenas do estado atual do catálogo.

### F-DATA-002 — MEDIUM — Customer Success marca operação como disponível sem validar cobertura da associação ticket -> empresa

- **Requisito:** o recorte de Customer Success deve usar associação real ticket -> empresa e informar estado explícito quando a cobertura necessária estiver ausente ou insuficiente.
- **Evidência:** `supabase/migrations/20260822070000_analytics_pipeline_operation_governance_v1.sql:169-170` executa o KPI filtrado por associação, mas `:175-185` define `operation_scope.state = 'available'` apenas pela existência de configuração de pipeline CS confirmada. Não há contagem ou teste da existência de associação elegível nem de uma linha de carteira retornada.
- **Evidência local:** consulta read-only ao banco local encontrou `analytics_hubspot_associations` sem linhas. Ao mesmo tempo, há pipelines CS confirmados ativos com tickets locais, incluindo `1429283`, `1585486`, `5038170` e `5080662`, todos com `ticket_company_links = 0`. A base filtrada pode ficar vazia, enquanto o payload declara a operação disponível.
- **Evidência de UI:** `apps/web/src/features/analytics/AnalyticsCustomerSuccessPage.tsx:145-166` converte o estado do payload e só mostra aviso de ausência quando a operação não existe no catálogo. Para uma operação confirmada sem associação, não há mensagem específica de cobertura insuficiente.
- **Impacto:** a tela pode apresentar uma carteira vazia como operação disponível, sem distinguir ausência de clientes de ausência da ingestão de associações. Isso reduz a confiabilidade operacional e dificulta diagnóstico do pipeline de dados.
- **Correção esperada:** derivar `operation_scope.state/reason` também da cobertura da associação ou da carteira resultante, por exemplo `unavailable`/`partial` com motivo explícito quando não houver associação elegível. Adicionar teste com pipeline confirmado e zero associações, preservando a exigência de não inferir por nome.

## Segurança, isolamento e escopo

- A migration nova usa `security definer`, `set search_path = ''`, `app_private.can_read_analytics()` e grants apenas para `authenticated` e `service_role`; `anon` foi revogado para os dois RPCs novos.
- A associação usada por Customer Success é filtrada por `from_object_type = 'tickets'`, `to_object_type = 'companies'` e `to_id = company_id`, sem fallback por nome, deal ou texto.
- Financeiro permanece fora da dimensão; Produto/Desenvolvimento permanece indisponível sem chamada GitHub.
- Não houve chamada externa, leitura de secret, escrita HubSpot/OMIE/produção, migration remota, deploy, push, merge ou alteração de configuração executável pelo Sentinel.
- Alterações amplas preexistentes do worktree foram preservadas e não foram usadas para ampliar a allowlist deste lote.

## Gates e validações independentes

| Verificação | Resultado observado |
|---|---|
| `node --test tests/scripts/analytics-dashboard-domains-integrations.test.mjs` | PASS, 6/6 |
| `npm run supabase:test:file -- supabase/tests/121_analytics_pipeline_operation_governance.sql` | PASS, 12 testes |
| `npm run web:typecheck` | PASS |
| `npm run web:build` | PASS, 945 módulos transformados |
| `npm run lint` | PASS, 0 erros e 160 warnings legados |
| `npm run review:gates` | PASS, 0 regressões bloqueantes e 47 itens do baseline resolvidos |
| `npm run quality:changed` | PASS, 0 blockers confirmados; candidatos fora do escopo direto |
| `npm run docs:validate` | PASS, 0 documentos bloqueados; alertas históricos registrados |
| `validate-governance-skill.mjs` | PASS, 0 erros |
| `git diff --check` | PASS |
| Consulta local de catálogo e associações | PASS read-only; não confirmou cobertura ticket -> empresa para os pipelines CS citados |

## Veredito

`CHANGES_REQUESTED`.

A fundação do inventário, a segurança dos RPCs novos e a separação de Financeiro/Produto estão adequadas, mas os findings F-DATA-001 e F-DATA-002 afetam diretamente os critérios de elegibilidade, cobertura e estado explícito. Forge deve responder aos dois findings dentro da allowlist e devolver o handoff em `READY_FOR_REVIEW` para re-review incremental.

## Próximo passo autorizado

`Owner = Forge`. Corrigir apenas os dois findings deste lote, executar os gates relevantes novamente, preservar este REVIEW.md e devolver `STATUS.md` como `READY_FOR_REVIEW`. Nenhuma finalização, arquivamento ou promoção de outra task está autorizada antes do próximo veredito.

## Re-review incremental — 2026-08-22

- **Reviewer:** Sentinel (Codex Independent Reviewer)
- **Task ID:** `DATA-PIPELINE-OPERATION-GOVERNANCE-2026-08-21`
- **Estado revisado:** `READY_FOR_REVIEW`
- **Base SHA:** `051ce0b96c22d5ea9cbd21d4630d313f15025299`
- **HEAD observado:** `051ce0b96c22d5ea9cbd21d4630d313f15025299`
- **Implementation SHA:** `UNCOMMITTED_WORKTREE`
- **Escopo revisado:** correções nas migrations `20260822073000` e `20260822074000`, pgTAP 121 e ajustes allowlisted de Analytics/API/UI/modelo/documentação.

### Funcionalidade revisada e ganho para o SaaS

O lote agora aplica uma elegibilidade canônica server-side para `pipeline_id -> area_key -> group_company`: pipeline ativo e não arquivado, área classificada, operação definida, fonte de grupo confirmada e variante única. Comercial, Suporte, filas/snapshots e Customer Success usam esse predicado; seletores exibem apenas opções confirmadas. Customer Success passou a expor cobertura real ticket -> empresa, com estado, razão e contagens, sem substituir ausência de associação por nome, deal ou texto.

O ganho é evitar KPIs contaminados por classificação sugerida ou ambígua e diferenciar claramente ausência de clientes de falha de cobertura de associações. Isso aumenta a confiabilidade das decisões por operação, a auditabilidade do pipeline e a segurança para evolução de After Sales, Conf e Neo Trust.

### Findings anteriores

#### F-DATA-001 — RESOLVIDO

`app_private.analytics_pipeline_operation_eligible(...)` exige os cinco critérios canônicos e rejeita mappings `suggested`, `pending`, `conflict`/ambíguos, áreas não classificadas e pipelines inativos/arquivados. A aplicação foi verificada nos wrappers de Comercial e Suporte, nos snapshots e no caminho de Customer Success. O pgTAP 121 reproduz um deal `suggested` e um ticket ambíguo e confirma que ambos ficam fora de KPIs, snapshots e elegibilidade; o seletor web filtra `source === 'confirmed'`.

#### F-DATA-002 — RESOLVIDO

`rpc_analytics_customer_success_kpis_by_operation` calcula a cobertura contra associações reais ticket -> empresa no read model financeiro e retorna `available`, `partial` ou `unavailable`, com `reason`, `ticket_count`, `associated_ticket_count` e percentual. O fixture de Customer Success confirmado sem associação retorna `unavailable` com razão explícita. Não há fallback por nome, deal ou texto.

Não foram identificados novos findings bloqueantes. Os findings históricos permanecem preservados acima para rastreabilidade.

### Gates e validações da re-revisão

| Verificação | Resultado independente |
|---|---|
| Testes focados de Analytics | PASS, 7/7 |
| pgTAP focado, arquivos 110/120/121 | PASS, 42/42 |
| pgTAP do lote 121 | PASS, 25/25 |
| `npm run web:typecheck` | PASS |
| `npm run web:build` | PASS, 945 módulos |
| `npm run lint` | PASS, 0 erros e 160 warnings legados |
| `npm run review:gates` | PASS, 0 regressões bloqueantes e 47 itens do baseline resolvidos |
| `npm run docs:validate` | PASS, 0 documentos bloqueados; alertas históricos não bloqueantes |
| `npm run quality:changed` | PASS, 0 blockers confirmados; 18 candidatos informativos/preexistentes |
| Governance validator | PASS, conforme evidência do lote |
| `git diff --check` | PASS |

### Segurança, limites e escopo

O helper é interno, usa `security definer` com `search_path` vazio e não é concedido a `anon`, `authenticated` ou `public`; os wrappers publicados mantêm os grants esperados. A revisão não executou chamadas externas, leu secrets, escreveu em HubSpot/OMIE/produção, aplicou migration remota, fez deploy, push ou merge. O worktree amplo permanece sujo por alterações preexistentes; a allowlist do lote foi revisada sem incorporá-las.

### Veredito formal

`APPROVED`.

As correções fecham F-DATA-001 e F-DATA-002 e atendem aos critérios de elegibilidade, isolamento e estado explícito. `Owner` retorna a `Forge` para finalização local autorizada do lote, com commit exclusivo, arquivamento e normalização do handoff conforme o protocolo. Nenhuma promoção da próxima task, push, merge, deploy, migration remota, alteração de secret ou release está autorizada por esta revisão.
