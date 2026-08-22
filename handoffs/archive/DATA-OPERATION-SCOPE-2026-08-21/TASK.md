# Task

Task ID: DATA-OPERATION-SCOPE-2026-08-21
Título: Auditar e fechar o filtro de Operação ponta a ponta
Estado: READY_FOR_REVIEW

## Contexto

A fila autorizada de desenvolvimento analítico exige que o escopo de Operação
seja uma dimensão válida e coerente em toda a leitura de dados. O código e os
contratos existentes devem ser investigados antes de qualquer alteração. A
fonte compartilhada da verdade é o backend, seus read models, contratos,
políticas e evidências de teste.

## Objetivo

Garantir, com evidência executável, que o escopo de Operação aplicado pelo
usuário seja respeitado de ponta a ponta nos KPIs, gráficos, tabelas, pipeline,
responsáveis, totais e comparativos que publicam essa dimensão.

## Escopo

- localizar o contrato canônico de operação e sua origem de dados;
- mapear filtros, parâmetros, read models, views/RPCs e consumidores da tela;
- verificar tenant isolation, autorização e comportamento para operação válida,
  múltiplas operações, operação ausente e payload parcial;
- corrigir somente divergências comprovadas no caminho atual;
- acrescentar testes comportamentais ou de contrato sem enfraquecer asserções;
- registrar lacunas de integração e capacidades de API como
  `AVAILABLE_NOW`, `REQUIRES_SCOPE`, `REQUIRES_NEW_INGESTION` ou
  `API_LIMITATION`, quando aplicável.

## Fora de escopo

- criar nova fonte externa, integração ou credencial;
- alterar release surface, landing, rotas públicas ou permissões sem requisito;
- redesenhar UI ou criar novo dashboard;
- formalizar compatibilidade Pipeline → Stage, semântica temporal ou KPIs
  derivados, que pertencem a lotes posteriores;
- alterar dados remotos, executar migration remota, push, merge, deploy ou
  alterar secrets;
- corrigir findings não relacionados.

## Requisitos funcionais

1. Uma seleção de Operação deve governar apenas dados cuja fonte declare essa
   dimensão e não pode vazar dados de outra operação.
2. A ausência, ambiguidade ou cobertura parcial da dimensão deve permanecer
   explícita; não pode virar zero, lista vazia ou regra local inventada.
3. KPIs, gráficos, tabelas, pipeline, responsáveis, totais e comparativos devem
   usar o mesmo contrato de escopo quando declararem suporte à Operação.
4. Nenhuma correção pode enfraquecer tenant isolation, RLS, autorização ou
   auditoria existentes.

## Requisitos técnicos

- validar a documentação canônica contra código executável e contratos reais;
- preservar padrões de backend como fonte da verdade;
- testar comportamento, não somente presença textual, quando houver lógica
  pura testável;
- registrar comandos, resultados e limitações em IMPLEMENTATION.md;
- se a fonte necessária não existir, registrar
  `UNRESOLVED — requires project owner decision` ou a classificação de
  capacidade correspondente, sem fabricar implementação.

## Critérios de aceitação

- [ ] inventário de fontes e consumidores da dimensão Operação documentado;
- [ ] caminho de filtro validado para KPIs, gráficos, tabelas, pipeline,
      responsáveis, totais e comparativos aplicáveis;
- [ ] contraexemplos de operação incompatível, ausente ou parcial cobertos;
- [ ] nenhum dado ou regra foi hardcoded no frontend;
- [ ] testes relevantes, typecheck/build/lint aplicáveis e `git diff --check`
      executados e registrados;
- [ ] diff limitado ao lote, sem código de produto não relacionado;
- [ ] implementação entregue em `READY_FOR_REVIEW` com `Owner = Claude`.

## Documentos normativos aplicáveis

- `AGENTS.md`
- `docs/PROJECT_STATE.md`
- `docs/README.md`
- `docs/ROADMAP_BUILDOUT_V3.md`
- `docs/ARCHITECTURE_RULES.md`
- `docs/VIEW_RPC_CONTRACTS.md`
- `docs/AUTH_CONTEXT_STRATEGY.md`
- `docs/AI_GOVERNANCE.md`
- `docs/engineering/PROJECT.md`
- `docs/engineering/ARCHITECTURE.md`
- `docs/engineering/ENGINEERING_RULES.md`
- `docs/engineering/SECURITY.md`
- `docs/engineering/REVIEW_PROTOCOL.md`
- `handoffs/README.md`

## Riscos conhecidos

- O código pode conter dimensões com cobertura diferente entre fontes; isso
  precisa ser exposto como estado de cobertura e não normalizado como sucesso.
- A capacidade de API pode depender de escopo, endpoint, associação ou
  ingestão que não está presente localmente.
- Uma divergência entre documentação e contrato executável deve ser reportada,
  não resolvida por preferência do executor.

## Base e responsabilidade

Base commit SHA: bdc1ea6404928e1ca4e8c7ccf9213d6a3090b6f9
Branch: main
Responsável atual: Codex
Approval: APPROVED na fila canônica do proprietário
Reviewer: Claude

## Observações do proprietário

Executar somente este lote. Preservar o baseline legado e alterações
preexistentes. Não avançar para `DATA-PIPELINE-STAGE-SCOPE-2026-08-21` antes de
aprovação e finalização deste lote.

## Entrega

Implementação concluída pelo Codex e entregue ao Claude para revisão
independente. O escopo temporal continua reservado ao lote posterior de
semântica temporal.
