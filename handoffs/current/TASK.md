# Task

## Task ID

DATA-TEMPORAL-SEMANTICS-2026-08-21

## Título

Separar criado no período de existente no período

## Estado

READY_FOR_IMPLEMENTATION

## Contexto

O lote anterior formalizou a compatibilidade entre Operação, Pipeline e Stage.
O próximo risco autorizado é misturar, nos mesmos indicadores, movimento criado
dentro da janela selecionada e estoque que apenas existe no estado atual. A
semântica deve ser determinada pelos contratos, read models, RPCs e dados reais,
sem inferência cosmética no frontend.

## Objetivo

Definir e aplicar, somente onde houver divergência comprovada, a separação entre
eventos criados no período e entidades existentes no período, preservando a
fonte da verdade no backend e tornando janelas, coortes, timezone e nulos
explícitos.

## Escopo

- inventariar RPCs, views, read models, snapshots e consumidores de métricas
  temporais e de estoque;
- verificar a semântica atual de período, criação, atualização, status e
  permanência;
- investigar timezone, limites inclusivos/exclusivos, nulos, reaberturas,
  coortes e diferença entre estoque e movimento;
- corrigir apenas divergências comprovadas no caminho atual;
- adicionar testes comportamentais ou de contrato sem enfraquecer asserções;
- preservar tenant isolation, autorização, RLS, auditoria e compatibilidade.

## Fora de escopo

- criar KPIs, coortes ou regras sem fonte real;
- alterar release surface, landing, rotas públicas ou permissões;
- criar integração, credencial ou catálogo paralelo;
- alterar dados históricos para obter números esperados;
- executar migration remota, push, merge, deploy ou alterar secrets;
- corrigir findings não relacionados.

## Requisitos funcionais

1. O período deve distinguir movimento criado dentro da janela de estoque
   existente no estado consultado.
2. Limites de data, timezone e tratamento de nulos devem ser explícitos no
   contrato aplicável.
3. Reaberturas, mudanças de status e entidades sem evento temporal não podem
   ser classificadas silenciosamente.
4. Ausência de dimensão ou evidência deve permanecer explícita, nunca virar
   zero ou total global silencioso.
5. Nenhuma correção pode enfraquecer isolamento de tenant, RLS, autorização,
   auditoria ou segurança.

## Requisitos técnicos

- validar documentação contra código executável, migrations, RPCs, views e
  testes reais;
- manter o backend como fonte da verdade;
- testar lógica pura quando aplicável e adicionar contra-testes reais;
- registrar comandos, resultados e limitações em IMPLEMENTATION.md;
- registrar `UNRESOLVED — requires project owner decision` quando a semântica
  não puder ser determinada com segurança.

## Critérios de aceitação

- [ ] inventário de fontes e consumidores temporais documentado;
- [ ] criado no período e existente no período possuem evidência separada;
- [ ] timezone, limites, nulos, coortes, reaberturas e estoque/movimento foram
      tratados ou explicitamente classificados;
- [ ] nenhum hardcode ou heurística local foi criado para decidir semântica;
- [ ] testes relevantes, typecheck/build/lint aplicáveis e `git diff --check`
      executados e registrados;
- [ ] diff limitado ao lote, sem absorver alterações preexistentes;
- [ ] implementação entregue em `READY_FOR_REVIEW` com `Owner = Claude`.

## Documentos normativos aplicáveis

- `AGENTS.md`
- `docs/PROJECT_STATE.md`
- `docs/engineering/PROJECT.md`
- `docs/engineering/ARCHITECTURE.md`
- `docs/engineering/ENGINEERING_RULES.md`
- `docs/engineering/SECURITY.md`
- `docs/engineering/REVIEW_PROTOCOL.md`
- `handoffs/README.md`

## Base e responsabilidade

- Base commit SHA: `c7c700d`
- Branch: `main`
- Responsável atual: Codex
- Approval: APPROVED na fila canônica
- Observações do proprietário: não alterar release surface nem executar
  operações externas protegidas.
