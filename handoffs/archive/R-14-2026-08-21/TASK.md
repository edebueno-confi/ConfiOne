# Task

## Task ID

R-14

## Project

ConfiOne

## Título

Formalizar deny-all intencional para tabelas RLS sem policy

## Contexto

O finding legado R-14, registrado em
`.review/verdicts/takeover-worktree-2026-08-19.md`, identifica 19 tabelas com
RLS habilitada e sem policy. A evidência das migrations indica que essas tabelas
são internas, de staging, telemetria ou de grants e foram protegidas por
revogação de acesso aos papéis interativos. O problema restante é documental e
de governança: o gate não diferencia deny-all intencional de policy esquecida.

R-11 foi aprovado e integrado no checkpoint local `53e705c` antes da abertura
deste lote.

## Objetivo

Versionar uma declaração verificável de deny-all para as 19 tabelas e fazer o
quality gate aceitar somente tabelas explicitamente declaradas, preservando o
alerta para qualquer tabela futura que tenha RLS sem policy e sem justificativa.

## Escopo

- Criar `.review/rls-deny-all-allowlist.json` com as 19 tabelas e o motivo de
  cada declaração.
- Materializar ou ajustar somente o suporte existente do quality gate necessário
  para ler essa allowlist, sem criar infraestrutura paralela.
- Adicionar teste de contrato que confira a correspondência entre a allowlist,
  as migrations, a ausência de policies e as revogações de acesso interativo.
- Executar os gates aplicáveis e atualizar os quatro artefatos de
  `handoffs/current/`.

## Fora de escopo

- Criar policies, alterar RLS, grants, funções, views ou migrations de produto.
- Alterar dados locais ou remotos, resetar banco ou executar migration remota.
- Reescrever `.review/baseline.json` para mascarar o finding.
- Alterar código de produto, release surface, push, merge ou deploy.
- Corrigir qualquer finding diferente de R-14.

## Requisitos funcionais

- Todas as tabelas atualmente detectadas por `RLS_WITHOUT_POLICY` devem estar
  declaradas uma única vez na allowlist.
- Cada entrada deve conter justificativa não vazia e indicar a fronteira de
  acesso interno que mantém o deny-all para usuários interativos.
- Uma tabela nova com RLS sem policy e ausente da allowlist deve continuar sendo
  reportada pelo gate como regressão.
- O baseline histórico deve permanecer intacto.

## Requisitos técnicos

- Usar JSON versionado e determinístico.
- Não confiar somente no nome da tabela: o teste deve verificar a evidência nas
  migrations.
- Não enfraquecer asserções nem transformar ausência de policy em acesso.
- Reutilizar o quality gate existente no repositório.

## Critérios de aceitação

- `.review/rls-deny-all-allowlist.json` contém as 19 tabelas do finding e uma
  razão verificável para cada uma.
- O teste de contrato passa e falha se uma tabela detectada ficar fora da
  allowlist, se houver entrada extra ou se faltar revogação interativa.
- `npm run review:gates -- --gate=RLS_WITHOUT_POLICY` ou equivalente reporta
  zero findings atuais, 19 itens históricos resolvidos e zero regressões.
- `git diff --check` passa e o baseline não é modificado.
- O lote termina em `READY_FOR_REVIEW` com `Owner = Claude`.

## Documentos normativos aplicáveis

- `AGENTS.md`.
- `docs/engineering/REVIEW_PROTOCOL.md`.
- `docs/CODE_REVIEW_PROTOCOL_V1.md`.
- `handoffs/README.md`.
- `.review/README.md`.
- `.review/baseline.json`.
- `.review/verdicts/takeover-worktree-2026-08-19.md`.

## Riscos conhecidos

- A allowlist documenta uma decisão de segurança, não concede acesso. Qualquer
  mudança futura de grant, função ou policy exige revisão própria.
- Algumas tabelas mantêm acesso `service_role` para workers ou funções internas;
  isso não equivale a acesso interativo e deve permanecer explícito na razão.
- O worktree continua contendo alterações preexistentes de produto. Nenhuma deve
  ser incluída neste lote.

## Base commit SHA

53e705c

## Branch

main

## Responsável atual

Codex implementou e validou. Nesta rodada, Codex atua exclusivamente como
`Reviewer mode` sob `OWNER_AUTHORIZED_SELF_REVIEW`; não deve alterar a
implementação durante a revisão.

## Observações do proprietário

R-14 é o próximo item previamente autorizado da fila. Executar somente este
finding. Commits locais após `APPROVED` estão autorizados pela regra persistente
do protocolo; push, merge e deploy continuam proibidos.

O proprietário autorizou temporariamente a alternância entre os papéis de
executor e revisor até nova decisão. Essa auto-revisão não deve ser apresentada
como revisão independente do Claude.
