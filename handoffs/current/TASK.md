# Task

## Task ID

COMMERCIAL-CONVERSION-SEMANTICS-2026-08-21

## Título

Formalizar cálculo de conversão e impedir percentuais impossíveis

## Estado

READY_FOR_IMPLEMENTATION

## Contexto

O lote anterior separou a coorte criada, a posição atual e a coorte encerrada
no snapshot comercial. A conversão precisa ter uma definição única e verificável
para que o percentual não misture universos, aceite denominador inadequado ou
produza valores impossíveis.

## Objetivo

Investigar e formalizar a conversão comercial no caminho executável atual,
preservando filtros, tenant, autorização, timezone e a distinção entre posição
atual e coorte encerrada.

## Escopo

- localizar a RPC, views, read models, contratos e consumidores que calculam ou
  exibem conversão;
- definir com evidência o numerador, denominador, período, timezone, filtros,
  nulos, ganhos, perdas e reaberturas;
- corrigir a fonte da verdade quando houver divergência comprovada;
- impedir percentuais abaixo de 0% ou acima de 100% sem mascarar dados inválidos;
- adicionar testes comportamentais e contra-testes para denominador zero,
  coortes divergentes e valores inválidos;
- atualizar a documentação canônica da métrica quando a regra vigente mudar.

## Fora de escopo

- criar uma métrica ou regra paralela sem fonte real;
- alterar dados históricos para alcançar percentuais esperados;
- criar a documentação orientada ao usuário ou a exposição contextual na UI,
  que permanecem tarefas propostas separadas na fila;
- alterar release surface, landing, rotas, permissões ou integrações externas;
- corrigir findings não relacionados;
- executar migration remota, push, merge, deploy, alterar secrets ou publicar.

## Requisitos de aceitação

1. A fórmula e o universo da conversão devem ser identificados em código,
   contrato ou consulta local verificável.
2. Numerador e denominador devem usar a mesma coorte e as mesmas dimensões de
   filtro, salvo regra explicitamente documentada.
3. Denominador zero, nulos, reaberturas e estados sem data de fechamento devem
   ter comportamento explícito e testado.
4. Nenhum caminho deve publicar conversão menor que 0% ou maior que 100% por
   aritmética silenciosa ou mistura de universos.
5. Tenant isolation, RLS, autorização, auditoria e compatibilidade devem ser
   preservados.
6. `IMPLEMENTATION.md` deve registrar investigação, arquivos, comandos,
   resultados, limitações e allowlist.
7. Ao concluir, Forge deve entregar `READY_FOR_REVIEW` com `Owner = Sentinel`.

## Documentos normativos aplicáveis

- `AGENTS.md`
- `docs/PROJECT_STATE.md`
- `docs/README.md`
- `docs/ROADMAP_BUILDOUT_V3.md`
- `docs/ANALYTICS_METRIC_CATALOG_V1.md`
- `docs/VIEW_RPC_CONTRACTS.md`
- `docs/engineering/REVIEW_PROTOCOL.md`
- `handoffs/README.md`

## Base e autorização

- Base commit SHA: `892efd4c7d6e988bc98f4e0598f00782776f721f`
- Branch: `main`
- Owner: Forge
- Reviewer active: Sentinel
- Approval: APPROVED na fila canônica
- Dependências: `DATA-PIPELINE-STAGE-SCOPE-2026-08-21` e
  `DATA-TEMPORAL-SEMANTICS-2026-08-21`, ambas DONE.

## Guardrails

- Não absorver alterações preexistentes do worktree.
- Não alterar baseline para obter aprovação.
- Se a semântica não puder ser determinada com segurança, registrar
  `UNRESOLVED — requires project owner decision` e parar o lote.
