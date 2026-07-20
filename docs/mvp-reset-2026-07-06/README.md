# Genius Support OS MVP Reset

Esta pasta consolida a leitura do projeto atual e define a base simplificada para recomecar o Genius Support OS como MVP controlado.

O objetivo nao e continuar o buildout inchado atual. O objetivo e preservar o aprendizado valido, descartar complexidade prematura e criar um novo ponto de partida documental para um projeto Codex mais simples.

## Ordem de leitura

1. `01-produto-mvp.md`
2. `02-escopo-e-nao-escopo.md`
3. `03-arquitetura-mvp.md`
4. `04-modelo-de-dados-mvp.md`
5. `05-fluxos-operacionais.md`
6. `06-roadmap-controlado.md`
7. `07-aprendizados-do-projeto-atual.md`
8. `08-modulos-e-funcionalidades.md`
9. `09-roadmap-agentico.md`
10. `10-backlog-executavel.md`
11. `11-operacao-autonoma-do-agente.md`
12. `12-gates-de-validacao.md`

## Decisao de reset

O projeto original nasceu como uma central de ajuda publica baseada em conteudo extraido da OctaDesk. A partir disso, cresceu para uma plataforma operacional ampla com portal cliente, suporte, CS, engenharia, acionamentos internos, administracao, AI readiness, catalogo comercial, subscriptions e documentacao interna.

Esse crescimento gerou uma arquitetura rica, mas excessiva para o proximo passo. O novo MVP deve voltar ao problema principal:

- organizar conhecimento publico da Genius;
- permitir que clientes B2B acompanhem demandas;
- permitir que o suporte receba, responda e acompanhe essas demandas;
- permitir que areas internas sejam acionadas quando o suporte precisar de ajuda;
- manter seguranca, multi-tenancy, auditoria e permissao como fundacao.

## Fontes auditadas

Leitura documental e mecanica feita neste lote:

- `README.md`
- `AGENTS.md`
- `PRODUCT.md`
- `docs/PROJECT_STATE.md`
- `docs/README.md`
- `docs/ROADMAP_BUILDOUT_V3.md`
- `docs/OPERATIONAL_CONTROL_PLANE_V1.md`
- `docs/CODEX_EXECUTION_RULES.md`
- `docs/VALIDATION_CHECKLIST.md`
- `docs/ARCHITECTURE_RULES.md`
- `docs/VIEW_RPC_CONTRACTS.md`
- `docs/AUTH_CONTEXT_STRATEGY.md`
- `docs/AI_GOVERNANCE.md`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`
- `docs/PRODUCT_VISION.md`
- `docs/SUPPORT_WORKFLOW.md`
- `docs/KNOWLEDGE_BASE_STRATEGY.md`
- `raw_knowledge/octadesk_export/latest/SUMMARY.md`
- `raw_knowledge/octadesk_export/latest/manifest.json`
- inventario de `docs/`, `supabase/migrations`, `supabase/tests`, rotas frontend e contratos existentes.

## Inventario objetivo observado

- `271` documentos Markdown em `docs/`.
- `93` relatorios em `docs/reports/`.
- `35` documentos de Knowledge em `docs/knowledge/`.
- `14` documentos de design em `docs/design/`.
- `64` migrations Supabase.
- `51` testes pgTAP.
- `3` Edge Functions/arquivos de functions.
- `58` artigos extraidos da OctaDesk.
- `129` assets extraidos da OctaDesk.
- Rotas existentes para Help publico, Portal cliente, Support, CS, Engenharia, Acionamentos internos e Admin.

## Como usar esta pasta

Esta pasta deve ser tratada como o pacote de briefing do novo projeto.

Ao criar um novo projeto Codex, copiar ou referenciar estes documentos como fonte inicial. O codigo atual pode ser consultado como referencia tecnica, mas nao deve ser carregado como plano de implementacao automatico.

Para trabalho autonomo de agente, a ordem operacional e:

1. Ler esta pasta inteira.
2. Abrir `09-roadmap-agentico.md`.
3. Escolher o primeiro ciclo com status `pendente` ou `em_execucao`.
4. Quebrar apenas o lote atual em tarefas pequenas.
5. Implementar com base em `10-backlog-executavel.md`.
6. Validar usando `12-gates-de-validacao.md`.
7. Atualizar os documentos do novo projeto com decisao, evidencia e proximo ciclo.
8. Iniciar o proximo ciclo sem pedir intervencao humana, exceto nas condicoes de parada.

## Regra de continuidade

Preservar do projeto atual:

- contratos backend-first;
- isolamento por tenant;
- RLS e audit logs;
- leitura por views/read models;
- escrita por RPCs/commands;
- governanca de Knowledge;
- separacao entre cliente, suporte, CS, engenharia e areas internas;
- conteudo bruto OctaDesk como fonte inicial da central de ajuda.

Descartar do novo MVP inicial:

- Operational Control Plane amplo;
- catalogo comercial e subscriptions;
- AI readiness operacional;
- dashboards administrativos amplos;
- workspaces completos de CS, financeiro, projetos e produto;
- automacoes externas;
- integracao Gmail antes do fluxo basico estar estavel;
- qualquer tela que exista apenas porque o projeto atual ja a implementou.

## Condicoes de parada humana

Mesmo com autonomia alta, o agente deve parar antes de:

- deploy remoto ou producao;
- migracao remota;
- reset destrutivo;
- alteracao/uso privilegiado de secrets;
- envio externo de e-mail, WhatsApp ou mensagem real;
- operacao com custo;
- acesso a dado real sensivel sem autorizacao;
- decisao de produto que mude escopo do MVP.
