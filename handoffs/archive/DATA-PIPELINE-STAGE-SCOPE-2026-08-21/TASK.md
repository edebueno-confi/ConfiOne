# Task

Task ID: DATA-PIPELINE-STAGE-SCOPE-2026-08-21
Título: Formalizar compatibilidade Operação → Pipeline → Stage
Estado: COMPLETED

## Contexto

O lote anterior fechou o escopo de Operação nos caminhos de leitura aplicáveis.
O próximo risco autorizado é permitir que uma Operação, Pipeline e Stage
incompatíveis sejam combinados no frontend ou aceitos por contratos de leitura.
A fonte da verdade deve continuar sendo o backend, sua configuração canônica,
read models, RPCs, políticas e testes.

## Objetivo

Garantir que os filtros de Operação, Pipeline e Stage representem somente
combinações publicadas e compatíveis, com estado explícito quando a fonte não
possuir cobertura suficiente.

## Escopo

- localizar o contrato canônico de compatibilidade entre operação, pipeline e
  stage;
- mapear as fontes, RPCs, read models e consumidores dos filtros de Comercial e
  Suporte;
- verificar opções incompatíveis, operação ausente, pipeline sem operação,
  stage sem cruzamento e payload parcial;
- corrigir somente divergências comprovadas no caminho atual;
- adicionar testes comportamentais ou de contrato sem enfraquecer asserções;
- preservar tenant isolation, autorização, RLS e auditoria existentes.

## Fora de escopo

- criar fonte externa, integração, credencial ou catálogo paralelo;
- inventar compatibilidade por nome, posição, heurística ou regra local no
  frontend;
- formalizar semântica temporal, coortes, KPIs derivados ou reconciliação
  comercial, reservados a lotes posteriores;
- alterar release surface, landing, rotas públicas, permissões ou produção;
- executar migration remota, push, merge, deploy ou alterar secrets;
- corrigir findings não relacionados.

## Requisitos funcionais

1. Combinações válidas devem vir de contrato ou configuração publicada pelo
   backend.
2. Combinações incompatíveis devem ser impedidas ou marcadas explicitamente,
   sem virar zero, lista vazia ou total global silencioso.
3. O filtro de Stage deve respeitar a Operação e o Pipeline efetivamente
   selecionados.
4. Ausência ou cobertura parcial deve permanecer visível para o operador.
5. Nenhuma correção pode enfraquecer tenant isolation, RLS, autorização ou
   auditoria.

## Requisitos técnicos

- validar documentação canônica contra código executável e contratos reais;
- manter o backend como fonte da verdade;
- testar comportamento quando houver lógica pura testável;
- registrar comandos, resultados e limitações em IMPLEMENTATION.md;
- registrar `UNRESOLVED — requires project owner decision` quando a
  compatibilidade não puder ser determinada com segurança.

## Critérios de aceitação

- [ ] inventário de fontes e consumidores da compatibilidade documentado;
- [ ] combinações válidas e inválidas cobertas por evidência executável;
- [ ] operação ausente, pipeline sem operação, stage sem cruzamento e payload
      parcial tratados explicitamente;
- [ ] nenhum hardcode ou heurística local foi criado para decidir compatibilidade;
- [ ] testes relevantes, typecheck/build/lint aplicáveis e `git diff --check`
      executados e registrados;
- [ ] diff limitado ao lote, sem absorver alterações preexistentes;
- [ ] implementação entregue em `READY_FOR_REVIEW` com `Owner = Claude`.

## Documentos normativos aplicáveis

- `AGENTS.md`
- `docs/PROJECT_STATE.md`
- `docs/README.md`
- `docs/ROADMAP_BUILDOUT_V3.md`
- `docs/ARCHITECTURE_RULES.md`
- `docs/VIEW_RPC_CONTRACTS.md`
- `docs/AUTH_CONTEXT_STRATEGY.md`
- `docs/engineering/PROJECT.md`
- `docs/engineering/ARCHITECTURE.md`
- `docs/engineering/ENGINEERING_RULES.md`
- `docs/engineering/SECURITY.md`
- `docs/engineering/REVIEW_PROTOCOL.md`
- `handoffs/README.md`

## Riscos conhecidos

- A estrutura atual pode publicar pipeline sem stage compatível ou stage sem
  cruzamento verificável.
- A origem pode possuir cobertura parcial por operação e por pipeline.
- Uma divergência entre documentação, configuração e contrato executável deve
  ser reportada, não resolvida por preferência do executor.

## Base e responsabilidade

Base commit SHA: b676e6f095cdff09bb9b4150af36822612b3c5b7
Branch: main
Responsável atual: Claude
Approval: APPROVED na fila canônica do proprietário
Reviewer: Claude

## Observações do proprietário

Executar somente este lote. Preservar o baseline legado e alterações
preexistentes. Não avançar para `DATA-TEMPORAL-SEMANTICS-2026-08-21` antes de
aprovação e finalização deste lote.
