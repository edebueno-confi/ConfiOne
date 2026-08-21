# Implementation

## Task ID

CS-DOMAIN-AUDIT-2026-08-21

## Implementador

Forge (Codex)

## Estado do handoff

READY_FOR_REVIEW

## Base e SHAs

- Base SHA: `e8347f64f9b94a778d5e10df28dcf460ae33e072`.
- Implementation SHA: `UNCOMMITTED_WORKTREE`.
- Current HEAD antes das alterações documentais: `dcea8fd051acfccb29c01a479f4b5fc0419ac48e`.
- Branch: `main`.

## Plano

- [x] localizar fontes reais de carteira, risco, churn, expansão e renovação;
- [x] confirmar semântica temporal, tenant, permissões, frescor e proveniência;
- [x] separar dados publicados, inferências, health score e lacunas;
- [x] documentar o menor lote implementável sem UI parcial;
- [x] executar os gates aplicáveis;
- [x] entregar `READY_FOR_REVIEW` ao Sentinel.

## Evidências produzidas

Auditoria concluída em `docs/ANALYTICS_CS_DOMAIN_AUDIT_V1.md`.

Fontes principais confirmadas:

- `supabase/migrations/20260604193000_cs_portfolio_contract_foundation.sql:1-183`
  define o gate de leitura por tenant e a view base da carteira, com
  assinaturas `active`/`suspended`, contadores atuais de tickets,
  `last_operational_update_at` e `health_summary_status = 'unavailable'`.
- `supabase/migrations/20260723203000_cs_real_portfolio_contract_v1.sql:5-371`
  define atribuição editável, `health_status` manual, histórico, gate de gestão
  e o enriquecimento da view.
- `packages/contracts/src/ticketing.ts:2240-2308`,
  `apps/web/src/features/cs/cs-model.ts:10-95` e
  `apps/web/src/features/cs/cs-api.ts:5-56` confirmam o contrato e o consumo
  real sem cálculo de score.
- `docs/ANALYTICS_KPI_REGISTRY_V1.md:170-189` confirma sinais atuais de CS e
  que churn/expansão dependem de histórico suficiente.
- `docs/ANALYTICS_CONTRACT_EXPIRY_FOUNDATION_V1.md:54-134` confirma a semântica
  de renovação e as lacunas de janela, owner e MRR por assinatura.

Decisões documentadas:

- carteira, risco operacional, churn, expansão e renovação permanecem
  semanticamente separados;
- `health_summary_status` é indisponível; `portfolio_health_status` é manual e
  não equivale a health score calculado/versionado;
- a indicação local de atenção da UI não é KPI nem contrato analítico;
- ausência de série, vínculo ou data permanece `unavailable`, `partial` ou
  `awaiting_history`, sem conversão para zero;
- nenhum cálculo local, heurística nova ou UI adicional foi criado.

## Resposta ao finding F-CS-001

O finding foi respondido somente na documentação da allowlist. A fundação
agora distingue capacidade oficial do HubSpot de disponibilidade no portal e
no read model do ConfiOne:

- Health Score/Health Status: a documentação oficial confirma a capacidade no
  Customer Success Workspace e a criação de propriedades em empresas/contatos.
  Por decisão do proprietário, esta é premissa do fluxo-alvo: o HubSpot
  configura e calcula, a API oficial lê e o ConfiOne futuramente ingere em
  read model com tenant, proveniência, cobertura, frescor, permissões e estados
  de ausência. O ConfiOne não recalculará o score. Os nomes internos devem ser descobertos via
  `GET /crm/properties/2026-03/{companies,contacts}` antes de qualquer leitura
  de registro. A leitura candidata é
  `GET /crm/objects/2026-03/companies/{recordId}?properties=...`, com
  `propertiesWithHistory` quando a retenção histórica for confirmada.
- Atividades: a Search API oferece objetos de calls, emails, meetings, notes e
  tasks em `/crm/objects/2026-03/{objectType}/search`; as associações podem
  ser consultadas por `/crm/v4/objects/{fromObjectType}/{objectId}/associations/{toObjectType}`
  ou pelo batch read. Nenhuma dessas fontes foi ingerida no lote.
- Churn/expansão: não foi inventado endpoint nativo. A descoberta deve testar
  propriedades, objetos, associações e histórico de empresas, deals,
  assinaturas e atividades, preservando a coorte e a data de corte como
  contrato local.
- Scopes locais documentados: `crm.objects.deals.read`,
  `crm.objects.tickets.read`, `crm.objects.owners.read`,
  `crm.schemas.deals.read` e `crm.schemas.tickets.read`. Eles não provam
  acesso às propriedades de CS, atividades ou associações; token, portal,
  plano, Service Seat e permissões não foram inspecionados.
- Limites registrados: Search pagina por `after`, suporta até 200 por página,
  limita a consulta a 10.000 resultados e possui taxa documentada de cinco
  requisições por segundo por conta; Object APIs também usam `limit`/`after` e
  `propertiesWithHistory`; batch read de associações admite até 1.000 IDs.
- Classificação: a capacidade alvo do Health Score é suportada, mas o estado
  atual é `REQUIRES_NEW_INGESTION`; `REQUIRES_SCOPE` é condicional à verificação
  do app. Não é `API_LIMITATION`. O estado analítico local de churn/expansão continua
  `awaiting_history`. Nenhuma capacidade foi classificada como
  `AVAILABLE_NOW` ou `API_LIMITATION`.
- Complemento do proprietário: o Health Score nativo é premissa do fluxo-alvo,
  com cálculo upstream no HubSpot e ingestão/read model futuro no ConfiOne. A
  prioridade documental também é um inventário read-only das
  propriedades customizadas reais de empresas, negócios, contatos, tickets e
  atividades, incluindo nome interno, label, tipo, grupo, opções, descrição,
  arquivada, cobertura/valores, histórico, origem, associações, pipelines,
  stages, owners e timestamps. A matriz classifica o que já é publicado no
  escopo local como `AVAILABLE_NOW`, o que depende de permissão como
  `REQUIRES_SCOPE`, o que precisa de nova coleta como
  `REQUIRES_NEW_INGESTION` e uma limitação real somente como
  `API_LIMITATION`.
- A diretriz de uso de reuniões/agendamentos e tarefas foi registrada como
  contexto operacional ainda pendente de confirmação pela API. Nenhuma
  propriedade, valor, cobertura ou histórico foi inventado e nenhuma chamada
  externa foi executada.

Fontes oficiais e a matriz completa estão em
`docs/ANALYTICS_CS_DOMAIN_AUDIT_V1.md`. Não houve chamada externa, leitura de
secret, sincronização, UI, cálculo, ingestão ou alteração executável.

## Arquivos previstos

- `docs/ANALYTICS_CS_DOMAIN_AUDIT_V1.md`
- `docs/PROJECT_STATE.md`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/README.md`
- artefatos de `handoffs/current/`

Nenhum arquivo executável, migration, view, RPC, RLS, contrato compartilhado,
teste de produto, integração ou UI foi alterado neste início de lote.

## Validações

Gates aplicáveis executados no fechamento do lote:

- `npm run docs:validate`: PASS; 0 documentos bloqueados. O relatório mantém
  9 alertas históricos de whitelist, sem bloqueio.
- `node .agents/skills/genius-documentation-governance/scripts/validate-governance-skill.mjs`:
  PASS; todos os arquivos obrigatórios da skill presentes.
- `node .agents/skills/genius-documentation-governance/scripts/run-documentation-audit.mjs changed --json`:
  PASS; 0 blockers e 0 security findings. O escopo `changed` inclui o
  worktree amplo preexistente e reportou ressalvas heurísticas não bloqueantes
  fora da allowlist, incluindo conflitos/drift documentais e links históricos.
- `npm run review:gates`: PASS; 0 regressões bloqueantes e 45 itens do baseline
  resolvidos pelo estado atual do checkout.
- `git diff --check`: PASS.

Revalidação após F-CS-001:

- `npm run docs:validate`: PASS; 0 documentos bloqueados; alertas históricos
  preservados.
- `node .agents/skills/genius-documentation-governance/scripts/validate-governance-skill.mjs`:
  PASS.
- `node .agents/skills/genius-documentation-governance/scripts/run-documentation-audit.mjs changed --json`:
  PASS; 0 blockers e 0 security findings; ressalvas heurísticas do worktree
  amplo permanecem fora da allowlist.
- `npm run review:gates`: PASS; 0 regressões bloqueantes e 45 itens do
  baseline resolvidos.
- `git diff --check`: PASS.

Typecheck, build, lint, testes de produto e testes de banco não são aplicáveis
a este lote documental e não foram executados como se houvesse mudança de
comportamento.

## Entrega para revisão

`READY_FOR_REVIEW`, Owner `Sentinel`, Reviewer active `Sentinel`, Review mode
`SENTINEL_REQUIRED`, aguardando re-review de F-CS-001.

## Limites

Nenhum health score, risco, churn, expansão, contrato backend ou superfície de
UI foi inventado sem evidência e autorização dentro da allowlist.
