# Handoffs entre Forge e Sentinel

## Finalidade

Este diretório é a interface persistente de colaboração entre:

- Forge, alias operacional do Codex, Senior Software Engineer / Implementer;
- Sentinel, Independent Code Reviewer / Principal Engineer ativo.

Referências a Codex e Claude em pacotes históricos permanecem preservadas. Claude
continua disponível para auditoria retroativa quando retornar, mas não bloqueia a
fila enquanto `Reviewer active = Sentinel`.

O handoff é baseado no repositório, não no histórico de conversas. O código, os
commits, os SHAs, os documentos, os testes e as evidências são a fonte compartilhada.

As decisões duráveis do proprietário estão em
[`docs/engineering/OWNER_DECISIONS.md`](../docs/engineering/OWNER_DECISIONS.md)
e devem ser consultadas quando a fila ou o protocolo dependerem de autorização
operacional.

## Estrutura

    handoffs/
      README.md
      current/
        TASK.md
        IMPLEMENTATION.md
        REVIEW.md
        STATUS.md
      archive/
      pacotes históricos ou específicos de domínio/

current/ contém uma única tarefa ativa. archive/ contém pacotes encerrados,
preservados para auditoria. Pacotes históricos existentes não devem ser apagados
nem tratados como estado corrente sem leitura e classificação.

## Fluxo

1. O proprietário ou Forge preenche current/TASK.md.
2. STATUS.md passa a READY_FOR_IMPLEMENTATION.
3. Forge muda para IMPLEMENTING, executa o lote e atualiza IMPLEMENTATION.md.
4. Forge executa as validações reais e muda para READY_FOR_REVIEW. Quando o
   lote já estiver autorizado para auto-revisão, pode usar `VALIDATING` para
   registrar os gates finais antes do veredito.
5. Sentinel lê TASK, IMPLEMENTATION, diff, contratos e evidências, muda para
   REVIEWING e escreve REVIEW.md. Claude permanece como reviewer histórico ou de
   auditoria posterior. Se o proprietário tiver ativado
   `OWNER_AUTHORIZED_SELF_REVIEW`, Codex assume `Role: REVIEWER` em uma rodada
   separada e registra essa limitação no REVIEW.md.
6. O reviewer designado em STATUS.md registra APPROVED, REQUEST_CHANGES ou
   BLOCKED.
7. REQUEST_CHANGES devolve o lote a Forge, que usa findings válidos e muda para
   FIXING.
8. Depois da correção, Forge atualiza IMPLEMENTATION, preserva REVIEW histórico
   dentro do ciclo e retorna a READY_FOR_REVIEW.
9. Em lote com `Approval = APPROVED`, `APPROVED` aciona automaticamente
   `FINALIZE_LOCAL`: validar escopo e gates, criar commit local exclusivo,
   registrar SHA, arquivar o handoff e normalizar current/ para `IDLE`.
10. O fluxo operacional completo é `IMPLEMENTING -> VALIDATING -> APPROVED ->
    FINALIZING_LOCAL -> COMPLETED -> IDLE -> próxima tarefa elegível`.
11. Push, merge, pull request, deploy, migration remota, produção, secrets e
    release surface continuam bloqueados. `DONE` permanece como classificação
    da fila após o checkpoint local concluído.

Para lotes previamente autorizados na fila, `APPROVED` autoriza o Forge a
executar `FINALIZE_LOCAL`, criar o checkpoint Git local exclusivo do lote,
arquivar o handoff e promover o próximo item elegível sem nova autorização
conversacional. O stage deve ser seletivo e baseado na allowlist do lote. Essa
autorização não inclui push, force push, merge, pull request, deploy, migration
remota, alteração de secrets ou release surface. Se alterações preexistentes
não puderem ser separadas com segurança, registrar `OWNER_DECISION_REQUIRED` e
interromper.

## Fila canônica de trabalho — ciclo prolongado 2026-08-21

O proprietário autorizou a execução sequencial desta fila. Esta tabela é a fila
canônica, mantida neste README para não criar um segundo sistema operacional.
Ela representa o trabalho futuro; `handoffs/current/` continua sendo a fonte da
tarefa ativa e de seu estado detalhado.

`Approval = APPROVED` significa autorização do proprietário para execução
autônoma. Isso não ignora dependências: Forge nunca executa item em `State =
PROPOSED`, e somente um item pode estar `ACTIVE` por vez.

| Ordem | Task ID | Project | Title | Priority | State | Approval | Dependencies | Origin | Summary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | O-01 | ConfiOne | Baseline e veredito legado em `.review/` | P1 | DONE | APPROVED | — | Owner decision 2026-08-20 | Artefatos legados materializados e divergência documental resolvida. |
| 2 | R-01 / R01-B | ConfiOne | Negação de acesso e feedback pós-login | P1 | DONE | APPROVED | O-01 | Owner queue 2026-08-20 | Denial context preservado sem autorizar nova release surface. |
| 3 | R-03 | ConfiOne | Feedback de erro no Support Workspace | P1 | DONE | APPROVED | R-01 / R01-B | Owner queue 2026-08-20 | Falhas auxiliares visíveis; integrado em `1ea22b2`. |
| 4 | DEV-CONTROL-MVP | ConfiOne / Engineering | Development Control Plane MVP read-only | P0 | DONE | APPROVED | R-03 | Owner request 2026-08-20 | Aprovado no ciclo 5; handoff arquivado para integração aplicável. |
| 5 | R-11 | ConfiOne | Scripts npm que apontam para arquivos inexistentes | P1 | DONE | APPROVED | DEV-CONTROL-MVP | Owner queue 2026-08-20 | Aprovado no ciclo 2 e integrado em checkpoint local; handoff arquivado. |
| 6 | R-14 | ConfiOne | Deny-all intencional para tabelas RLS sem policy | P1 | DONE | APPROVED | R-11 | Owner queue 2026-08-20 | APPROVED; checkpoint local exclusivo `6eec6d7` e arquivamento executados por FINALIZE_LOCAL. |
| 7 | CONTROL-PLANE-BACKLOG-2026-08-21 | ConfiOne / Engineering | Materializar backlog prolongado e estados de elegibilidade | P0 | DONE | APPROVED | R-14 | Owner mission 2026-08-21 | Registrar a decomposição normativa sem tocar no produto e preparar a primeira task do ciclo. |
| 8 | DATA-OPERATION-SCOPE-2026-08-21 | ConfiOne / Analytics | Auditar e fechar o filtro de Operação ponta a ponta | P1 | DONE | APPROVED | CONTROL-PLANE-BACKLOG-2026-08-21 | Owner mission 2026-08-21 | APPROVED no ciclo 2; checkpoint local `4219a0cd26a70c74fb11e5bcaea11db16b4ae14c`; handoff arquivado. |
| 9 | DATA-PIPELINE-STAGE-SCOPE-2026-08-21 | ConfiOne / Analytics | Formalizar compatibilidade Operação → Pipeline → Stage | P1 | DONE | APPROVED | DATA-OPERATION-SCOPE-2026-08-21 | Owner mission 2026-08-21 | APPROVED no ciclo 1; checkpoint local `c7c700d`; handoff arquivado. |
| 10 | DATA-TEMPORAL-SEMANTICS-2026-08-21 | ConfiOne / Analytics | Separar criado no período de existente no período | P1 | DONE | APPROVED | DATA-OPERATION-SCOPE-2026-08-21 | Owner mission 2026-08-21 | APPROVED por Sentinel; checkpoint local exclusivo `8d9e7da1c70d1aee8aad21e4e0896c3bf325d2d2`; handoff arquivado. |
| 11 | COMMERCIAL-RECONCILIATION-2026-08-21 | ConfiOne / Comercial | Reconciliar totais, perdidos e fechados | P1 | DONE | APPROVED | DATA-PIPELINE-STAGE-SCOPE-2026-08-21, DATA-TEMPORAL-SEMANTICS-2026-08-21 | Owner mission 2026-08-21 | APPROVED por Sentinel; implementação integrada em `0f603b7`; handoff arquivado. P-COMM-001 permanece PROPOSED fora do lote. |
| 12 | COMMERCIAL-CONVERSION-SEMANTICS-2026-08-21 | ConfiOne / Comercial | Formalizar cálculo de conversão e impedir percentuais impossíveis | P1 | ACTIVE | APPROVED | DATA-PIPELINE-STAGE-SCOPE-2026-08-21, DATA-TEMPORAL-SEMANTICS-2026-08-21 | Owner mission 2026-08-21 | Task aberta para Forge; definir universo, denominador, período e tratamento de ganhos, perdas e reaberturas. |
| 13 | COMMERCIAL-OWNER-STAGE-2026-08-21 | ConfiOne / Comercial | Corrigir filtro de estágio por responsável | P1 | BACKLOG | APPROVED | DATA-PIPELINE-STAGE-SCOPE-2026-08-21 | Owner mission 2026-08-21 | Investigar por que stages relevantes desaparecem ao selecionar responsável. |
| 14 | OVERVIEW-SNAPSHOT-FLOW-2026-08-21 | ConfiOne / Dashboard | Separar Agora de No período | P1 | BACKLOG | APPROVED | DATA-TEMPORAL-SEMANTICS-2026-08-21 | Owner mission 2026-08-21 | Snapshot atual não pode mudar com período histórico, mas deve respeitar dimensões aplicáveis. |
| 15 | OVERVIEW-QUEUE-SEMANTICS-2026-08-21 | ConfiOne / Dashboard | Resolver a duplicidade de Fila atual | P1 | BACKLOG | APPROVED | DATA-OPERATION-SCOPE-2026-08-21, DATA-TEMPORAL-SEMANTICS-2026-08-21 | Owner mission 2026-08-21 | Distinguir conceito, fonte, filtro ou erro antes de corrigir nomenclatura. |
| 16 | KPI-REGISTRY-2026-08-21 | ConfiOne / Analytics | Consolidar registro canônico de KPIs | P1 | BACKLOG | APPROVED | COMMERCIAL-RECONCILIATION-2026-08-21, COMMERCIAL-CONVERSION-SEMANTICS-2026-08-21, OVERVIEW-SNAPSHOT-FLOW-2026-08-21 | Owner mission 2026-08-21 | Registrar definição, fonte, fórmula, período, filtros, timezone, nulos e exclusões. |
| 17 | COMMERCIAL-EVOLUTION-2026-08-21 | ConfiOne / Comercial | Estruturar evolução e comparação temporal | P2 | BACKLOG | APPROVED | KPI-REGISTRY-2026-08-21 | Owner mission 2026-08-21 | Comparar período atual, anterior, delta absoluto, delta percentual, tendência e aging. |
| 18 | COMMERCIAL-GOALS-MRR-2026-08-21 | ConfiOne / Comercial | Criar fundação de metas financeiras/MRR | P2 | BACKLOG | APPROVED | KPI-REGISTRY-2026-08-21, COMMERCIAL-EVOLUTION-2026-08-21 | Owner mission 2026-08-21 | Separar período da meta de janela histórica e validar dados antes de propor distribuição. |
| 19 | COMMERCIAL-PREDICTION-2026-08-21 | ConfiOne / Comercial | Criar Predição explicável baseada em dados | P2 | BACKLOG | APPROVED | COMMERCIAL-GOALS-MRR-2026-08-21, COMMERCIAL-RECONCILIATION-2026-08-21 | Owner mission 2026-08-21 | Usar pipeline, conversão, lead time e ticket; não usar IA generativa para matemática. |
| 20 | CONTRACT-EXPIRY-2026-08-21 | ConfiOne / Customer Success | Investigar contratos próximos do vencimento | P2 | BACKLOG | APPROVED | KPI-REGISTRY-2026-08-21 | Owner mission 2026-08-21 | Confirmar fonte confiável, responsabilidade por renovação e MRR em risco antes da UI. |
| 21 | CS-DOMAIN-AUDIT-2026-08-21 | ConfiOne / Customer Success | Auditar carteira, risco, churn, expansão e renovação | P2 | BACKLOG | APPROVED | KPI-REGISTRY-2026-08-21, CONTRACT-EXPIRY-2026-08-21 | Owner mission 2026-08-21 | Diferenciar dados existentes de health score ainda não definido. |
| 22 | SUPPORT-DOMAIN-AUDIT-2026-08-21 | ConfiOne / Support | Auditar fila, SLA, aging, prioridade e operação | P2 | BACKLOG | APPROVED | KPI-REGISTRY-2026-08-21 | Owner mission 2026-08-21 | Distinguir tickets, conversas e chat com contratos reais. |
| 23 | FINANCE-DOMAIN-AUDIT-2026-08-21 | ConfiOne / Financeiro | Auditar recebido, a receber, vencido e aging | P2 | BACKLOG | APPROVED | KPI-REGISTRY-2026-08-21, CONTRACT-EXPIRY-2026-08-21 | Owner mission 2026-08-21 | Ausência de dados deve ser explícita e não virar zero. |
| 24 | PRODUCT-DEV-DOMAIN-AUDIT-2026-08-21 | ConfiOne / Produto | Auditar indicadores de Produto e Desenvolvimento | P3 | BACKLOG | APPROVED | KPI-REGISTRY-2026-08-21 | Owner mission 2026-08-21 | Manter somente indicadores ligados a decisões operacionais reais. |
| 25 | OVERVIEW-GOVERNANCE-DENSITY-2026-08-21 | ConfiOne / Dashboard | Reorganizar Atenção, Governança e cobertura | P2 | BACKLOG | APPROVED | CS-DOMAIN-AUDIT-2026-08-21, SUPPORT-DOMAIN-AUDIT-2026-08-21, FINANCE-DOMAIN-AUDIT-2026-08-21, PRODUCT-DEV-DOMAIN-AUDIT-2026-08-21 | Owner mission 2026-08-21 | Retirar ruído técnico da Visão Geral e preservar sinais gerenciais acionáveis. |
| 26 | DASHBOARD-UX-DENSITY-2026-08-21 | ConfiOne / Dashboard | Refinar densidade e qualidade de decisão | P3 | BACKLOG | APPROVED | OVERVIEW-GOVERNANCE-DENSITY-2026-08-21, COMMERCIAL-EVOLUTION-2026-08-21 | Owner mission 2026-08-21 | Validar desktop 1920×1080 sem redesenho gratuito ou preenchimento decorativo. |

Regras da fila:

- somente um item pode estar `ACTIVE` por vez;
- `BACKLOG` representa item decomposto aguardando dependência ou seleção;
- `READY` representa item elegível para abertura da próxima TASK;
- o próximo item só pode ser aberto depois de `APPROVED` no item anterior, suas
  dependências satisfeitas e o retorno de `handoffs/current/` para `IDLE`;
- `Approval` é autorização do proprietário; `State` controla elegibilidade e
  progresso. `PROPOSED` nunca é executado por Forge;
- quando um item aprovado e integrado termina, ele passa a `DONE` e a fila pode
  promover o próximo item aprovado e sem dependências pendentes para `APPROVED`;
- cada item exige TASK, IMPLEMENTATION e REVIEW próprios, com entrega em
  `READY_FOR_REVIEW` e `Owner = Sentinel` antes da revisão;
- heartbeat do Forge pode abrir automaticamente o próximo item somente quando a
  fila estiver liberada pelo `APPROVED` anterior;
- `BLOCKED`, `OWNER_DECISION_REQUIRED` ou mudança material de escopo interrompem
  a fila e exigem retorno ao proprietário;
- push, merge e deploy permanecem fora da autorização desta fila.
- commit local de lote `APPROVED` e previamente autorizado na fila não exige
  nova autorização conversacional, desde que seja exclusivo e verificável;
  `FINALIZE_LOCAL` não pode usar `git add .`.

`Owner` identifica o agente responsável pelo próximo passo do estado atual. Em
`READY_FOR_IMPLEMENTATION`, `IMPLEMENTING`, `CHANGES_REQUESTED` e `FIXING`, o
responsável esperado é Forge. Em `READY_FOR_REVIEW` e `REVIEWING`, é Sentinel
quando `Reviewer active = Sentinel`. Após `APPROVED`, o responsável volta a Forge
para integração local.

## Exceção temporária de agente único

Quando autorizada explicitamente pelo proprietário, a ausência temporária do
Claude pode ser coberta pelo mesmo Codex em rodadas alternadas:

- `Role: EXECUTOR`: Forge implementa, testa e escreve IMPLEMENTATION.md;
- `Role: REVIEWER`: o agente reviewer não altera código executável e revisa o lote contra
  TASK, diff, contratos e evidências;
- `Review mode: OWNER_AUTHORIZED_SELF_REVIEW` deve constar em STATUS.md;
- o REVIEW.md deve identificar que a revisão não é independente;
- a exceção não autoriza push, merge, deploy, release surface ou escrita remota.

O próximo passo só pode ser executado pelo papel indicado em STATUS.md. A
alternância permanece ativa até decisão contrária do proprietário e não cria
um segundo sistema de fila.

## Concorrência

Não editar código do produto simultaneamente na mesma working tree. Durante
REVIEWING, o reviewer designado somente lê o produto e escreve artefatos de revisão. Durante
IMPLEMENTING ou FIXING, Forge é o único agente autorizado a alterar produto.

## Relação com .review

`.review/` contém quality gates, inbox, contexto, baseline e vereditos técnicos.
Quando usado, seu resultado deve ser referenciado em `IMPLEMENTATION.md` ou
`REVIEW.md`. O inbox e os vereditos são opcionais, não substituem os quatro
arquivos de `current/` e não podem manter um pedido, estado ou veredito
contraditório. `.review/state.json` guarda apenas metadados de automação.

## Segurança

Nenhum handoff deve conter senha, token, cookie, JWT, service_role, segredo ou
conteúdo sensível desnecessário. Dúvida material de produto, arquitetura,
permissão, tenant, segurança ou operação externa deve ser registrada como:

UNRESOLVED — requires project owner decision
