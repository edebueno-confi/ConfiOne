# Codex Goal Mode Readiness Audit

Data: 2026-06-01

## Resumo executivo

O repositório possui documentação canônica ampla, regras arquiteturais claras, contratos backend-first e um roadmap vivo suficiente para orientar direção técnica e produto. Porém, ainda não existe um arquivo versionado de orquestração específico para Codex Goal Mode (`/goal`) que traduza essa documentação em macro-lotes executáveis, gates obrigatórios, stop conditions e ordem segura de consumo documental.

Recomendação: **preparar antes** de usar `/goal` para implementação autônoma ampla. O uso de `/goal` já é aceitável para auditorias documentais e lotes muito pequenos com escopo explícito no prompt, mas não para macro-execução de produto sem um `GOAL_EXECUTION_PLAN.md` ou equivalente.

## Documentos encontrados

Documentos solicitados e status:

| Documento | Status | Observação |
| --- | --- | --- |
| `docs/PROJECT_STATE.md` | existe | Fonte viva do estado real, extensa e atualizada até 2026-05-29/2026-06-01 por relatórios recentes. |
| `docs/ROADMAP_BUILDOUT_V3.md` | existe | Roadmap vivo com checkpoints, lacunas, backlog faseado e próximos lotes técnicos. |
| `docs/ARCHITECTURE_RULES.md` | existe | Regras permanentes de arquitetura backend-first, multi-tenancy, domínios e proibições. |
| `docs/VIEW_RPC_CONTRACTS.md` | existe | Inventário contratual de views/RPCs; deve ser fonte para leitura/escrita antes de qualquer UI/runtime. |
| `docs/AUTH_CONTEXT_STRATEGY.md` | existe | Estratégia de auth, papéis, boundaries Admin/Portal, redirect e regras de contexto. |
| `docs/AI_GOVERNANCE.md` | existe | Política de IA human-governed; IA não está ativa e não pode ser source of truth. |
| `docs/DOCUMENTATION_LEDGER.md` | existe | Ledger documental por fase/lote; muito extenso, útil para rastreabilidade. |
| `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md` | existe | Contrato visual canônico do Design System V3. |
| `AGENTS.md` | não encontrado | Não há arquivo versionado na raiz nem no repositório ativo. As regras recebidas estão no prompt, não no repo. |
| `CODEX_EXECUTION_RULES.md` | existe em `docs/` | Regras operacionais do Codex, mas não como `AGENTS.md` permanente na raiz. |
| `VALIDATION_CHECKLIST.md` | existe em `docs/` | Checklist mínimo de validação e bloqueadores. |
| `docs/IMPLEMENTATION_PLAN.md` | existe | Plano histórico, parcialmente desatualizado frente ao estado atual. |
| `docs/ROADMAP.md` | existe | Roadmap curto e genérico; secundário perante V3. |
| `docs/OPERATIONAL_CONTROL_PLANE_V1.md` | existe | Plano canônico OCP V1 com sequência futura de implementação. |
| `GOAL_EXECUTION_PLAN.md` | não encontrado | Lacuna principal para `/goal`. |
| `ROADMAP_EXECUTION_PLAN.md` / `PLANS.md` | não encontrados | Não há equivalente direto no repo ativo. |

Também foram encontrados documentos auxiliares relevantes:

- `README.md`
- `PRODUCT.md`
- `DESIGN.md`
- `docs/README.md`
- `docs/DOCUMENTATION_GOVERNANCE_RUNBOOK.md`
- `docs/reports/PROJECT_FORENSIC_RECOVERY_AUDIT_2026-05-29.md`
- `docs/reports/OPERATIONAL_CONTROL_PLANE_V1_PLANNING_AND_CONTRACT_AUDIT.md`
- `docs/reports/OCP_V1_A_INTERNAL_AREAS_CONTRACT_CONSOLIDATION_2026-06-01.md`
- `docs/reports/OCP_V1_B_COMMERCIAL_PRODUCT_CATALOG_PLANNING_AND_CONTRACT_DESIGN_2026-06-01.md`
- `docs/reports/OCP_V1_C_PRODUCT_CATALOG_FOUNDATION_2026-06-01.md`
- `docs/reports/OCP_V1_D_CUSTOMER_PRODUCT_SUBSCRIPTIONS_PLANNING_2026-06-01.md`

Há cópias em `docs/GPT/` e `.worktrees/`, mas a própria documentação declara `docs/GPT/` como árvore auxiliar não canônica. Cópias em `.worktrees/` não devem orientar execução do checkout ativo.

## Documentos canônicos

Canônicos para estado, direção e execução:

- `docs/PROJECT_STATE.md`: estado real corrente e histórico de lotes.
- `docs/README.md`: navegação documental e política de leitura.
- `docs/ROADMAP_BUILDOUT_V3.md`: roadmap vivo de buildout e próximos lotes.
- `docs/OPERATIONAL_CONTROL_PLANE_V1.md`: plano oficial do Operational Control Plane V1.
- `docs/ARCHITECTURE_RULES.md`: regra máxima de backend como source of truth.
- `docs/VIEW_RPC_CONTRACTS.md`: contratos reais de views/RPCs.
- `docs/AUTH_CONTEXT_STRATEGY.md`: contexto de auth e boundaries.
- `docs/AI_GOVERNANCE.md`: limites para IA.
- `docs/DOCUMENTATION_LEDGER.md`: rastreabilidade documental.
- `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`: contrato visual canônico.
- `docs/CODEX_EXECUTION_RULES.md`: regras operacionais do Codex.
- `docs/VALIDATION_CHECKLIST.md`: gates mínimos e bloqueadores.

Canônicos de apoio:

- `PRODUCT.md`: visão de produto e fronteiras.
- `DESIGN.md`: contexto visual para execução, sem substituir `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`.
- Relatórios recentes em `docs/reports/` para decisões de lotes já fechados.

Não canônicos ou secundários:

- `docs/GPT/`: shadow tree auxiliar, não fonte de execução.
- `.worktrees/*`: cópias de worktree, não fonte do checkout ativo.
- `docs/ROADMAP.md`: genérico e menos atual que `ROADMAP_BUILDOUT_V3.md`.
- `docs/IMPLEMENTATION_PLAN.md`: histórico; contém premissas antigas como frontend ainda bloqueado e próxima etapa de deploy remoto controlado, incompatíveis com o estado atual já materializado.

## Roadmap existente

`docs/ROADMAP_BUILDOUT_V3.md` é suficiente como roadmap de produto/arquitetura em macrovisão. Ele contém:

- objetivo de buildout funcional;
- premissas vigentes;
- checkpoints recentes, incluindo retomada forense de 2026-05-29 e OCP de 2026-06-01;
- auditoria de rotas;
- lacunas por domínio;
- quick wins seguros;
- backlog faseado;
- próximos lotes técnicos recomendados;
- decisões pendentes de produto;
- critério de parada de etapa.

O próprio documento alerta que possui blocos históricos já concluídos e não deve ser lido linearmente como "próximo passo" atual. Isso não invalida o roadmap, mas impede uso direto por `/goal` sem uma camada de orquestração que diga:

- qual checkpoint é a âncora atual;
- quais lotes estão fechados;
- qual lote é o próximo;
- quais documentos devem ser lidos antes de cada macro-lote;
- quais comandos validam cada tipo de mudança;
- quando o agente deve parar.

Para a frente atual, `docs/OPERATIONAL_CONTROL_PLANE_V1.md` complementa o roadmap com sequência aprovada de implementação futura:

1. Internal Areas & Collaborators.
2. Product Catalog & Plans.
3. Customer Product Subscriptions & Ownership.
4. Internal Actions connected to canonical areas.
5. Role-Based routing and workspaces.
6. CS Workspace.
7. Finance Workspace.
8. Engineering Product Demand Workspace.
9. Operational Tasks/Kanban.
10. Operational Projects.
11. UI blueprints + Impeccable pass.

Os relatórios OCP V1-A a V1-D mostram que parte da execução/planejamento OCP já avançou e que existem bloqueios de produto para subscriptions/entitlements comerciais.

## Lacunas reais

1. Falta `AGENTS.md` versionado na raiz.
   - O projeto tem `docs/CODEX_EXECUTION_RULES.md`, mas não possui uma regra permanente de entrada que o Codex leia antes de qualquer lote.
   - As instruções do prompt atual são adequadas, mas não estão persistidas no repo.

2. Falta plano específico para `/goal`.
   - Não existe `GOAL_EXECUTION_PLAN.md`, `ROADMAP_EXECUTION_PLAN.md` ou equivalente.
   - O roadmap é suficiente para direção, mas não para automação controlada sem interpretação excessiva.

3. Há documentos históricos que podem confundir execução autônoma.
   - `docs/IMPLEMENTATION_PLAN.md` ainda descreve fase antiga com frontend bloqueado e deploy remoto como próxima etapa.
   - `docs/ROADMAP.md` é genérico.
   - `docs/GPT/` possui versões auxiliares não canônicas.

4. Stop conditions não estão centralizadas.
   - Existem bloqueadores espalhados em `CODEX_EXECUTION_RULES.md`, `VALIDATION_CHECKLIST.md`, `AI_GOVERNANCE.md`, `AUTH_CONTEXT_STRATEGY.md` e relatórios.
   - Para `/goal`, isso precisa virar uma lista operacional única de parada obrigatória.

5. Gates por macro-lote não estão normalizados.
   - Há comandos em `package.json` e validações históricas no `PROJECT_STATE.md`, mas falta matriz simples por tipo de alteração: docs-only, contracts, web, Supabase local, QA visual, release/staging.

6. Estado OCP recente exige decisão de produto antes de continuar algumas frentes.
   - `ROADMAP_BUILDOUT_V3.md` registra que OCP V1-D ficou bloqueado por decisões sobre After Sale, multiproduto, visibilidade por papel e ownership de manutenção.

## Riscos de usar `/goal` agora

- O agente pode ler `ROADMAP_BUILDOUT_V3.md` linearmente e retomar bloco histórico já concluído.
- O agente pode seguir `docs/IMPLEMENTATION_PLAN.md` como plano corrente e tomar decisões incompatíveis com o estado atual.
- O agente pode implementar OCP sem respeitar bloqueios de produto já registrados.
- Sem `AGENTS.md`, regras permanentes dependem do prompt do turno e podem não acompanhar futuras sessões.
- Sem stop conditions centralizadas, `/goal` pode avançar para migration, Supabase, UI ou deploy sem a confirmação exigida.
- Sem matriz de validação por macro-lote, a execução pode encerrar sem gates adequados ou rodar validações destrutivas desnecessárias.

## Recomendação: usar `/goal` agora, preparar antes, ou bloquear

Recomendação: **preparar antes**.

Não é necessário criar novo roadmap. `docs/ROADMAP_BUILDOUT_V3.md` deve ser reaproveitado como roadmap canônico de buildout, com `docs/OPERATIONAL_CONTROL_PLANE_V1.md` como plano canônico da frente OCP.

O menor complemento recomendado é criar um arquivo de orquestração, por exemplo `docs/GOAL_EXECUTION_PLAN.md`, sem duplicar o roadmap. Esse arquivo deve apenas mapear:

- ordem de leitura obrigatória;
- macro-lotes executáveis;
- documento-fonte de cada lote;
- gates de entrada;
- validações mínimas;
- stop conditions;
- o que exige confirmação humana;
- regra de não avançar para próximo macro-lote sem fechar relatório/status.

Estrutura mínima sugerida:

```md
# GOAL_EXECUTION_PLAN.md

## Fonte de verdade
- Ler primeiro: docs/PROJECT_STATE.md, docs/README.md, docs/ROADMAP_BUILDOUT_V3.md.
- Para OCP: docs/OPERATIONAL_CONTROL_PLANE_V1.md e relatórios OCP V1-A a V1-D.

## Regras permanentes
- Apontar para docs/CODEX_EXECUTION_RULES.md, docs/VALIDATION_CHECKLIST.md, docs/ARCHITECTURE_RULES.md e docs/AUTH_CONTEXT_STRATEGY.md.

## Macro-lotes
- Lote 0: auditoria/estado.
- Lote 1: próximo lote OCP autorizado.
- Lote 2: contratos backend.
- Lote 3: integração frontend somente após contratos.
- Lote 4: QA e documentação.

## Gates
- Docs-only: git status, busca textual, relatório.
- Backend/Supabase: contratos, RLS, pgTAP, lint/test/verify local.
- Web: contracts:typecheck, web:typecheck, web:build, QA visual quando houver UI.

## Stop conditions
- deploy remoto, migration remota, secrets, service_role, dados reais, ação externa, custo, decisão de produto pendente, conflito documental, falta de contrato real.
```

Além disso, criar `AGENTS.md` na raiz seria recomendável como complemento permanente, apontando para os documentos canônicos em `docs/`, sem replicar todo o conteúdo.

## Próximo prompt recomendado

```text
Atue como engenheiro de software sênior e docs/governance owner do Genius Support OS.

Objetivo: preparar o projeto para execução autônoma controlada via Codex Goal Mode (`/goal`), sem implementar produto.

Crie apenas os menores complementos documentais necessários:
1. `AGENTS.md` na raiz, apontando para as regras canônicas em `docs/`.
2. `docs/GOAL_EXECUTION_PLAN.md`, sem duplicar `ROADMAP_BUILDOUT_V3.md`, traduzindo o roadmap/OCP em macro-lotes, gates, validações e stop conditions.

Não altere backend, Supabase, runtime, UI, contratos, migrations ou scripts.

Use como fontes:
- `docs/PROJECT_STATE.md`
- `docs/ROADMAP_BUILDOUT_V3.md`
- `docs/OPERATIONAL_CONTROL_PLANE_V1.md`
- `docs/CODEX_EXECUTION_RULES.md`
- `docs/VALIDATION_CHECKLIST.md`
- `docs/ARCHITECTURE_RULES.md`
- `docs/AUTH_CONTEXT_STRATEGY.md`
- `docs/AI_GOVERNANCE.md`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`

Valide com:
- `git status --short`
- busca textual dos arquivos criados
- verificação de que o plano referencia, mas não duplica, o roadmap

Ao final, reporte:
- arquivos criados/alterados
- lacunas fechadas
- lacunas ainda abertas
- recomendação final para uso de `/goal`
- git status
```

## Validações executadas nesta auditoria

- `git status --short`
- `git branch --show-current`
- `git log --oneline -5`
- listagem da raiz do repositório
- leitura inicial de `README.md`, `PRODUCT.md`, `DESIGN.md` e `package.json`
- busca de arquivos relevantes por nome exato
- busca de planos/roadmaps/regras/checklists/governança em `docs/`
- verificação textual por headings e termos de canonicidade, roadmap, gates, validação, bloqueio, Codex e `/goal`
- verificação específica de ausência de `AGENTS.md`

Não foram rodados testes de app porque este lote alterou apenas documentação e não tocou runtime, backend, Supabase, contratos ou UI.
