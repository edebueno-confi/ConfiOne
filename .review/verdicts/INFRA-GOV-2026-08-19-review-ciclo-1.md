# Review

## Task ID

INFRA-GOV-2026-08-19

## Reviewer

Claude, Principal Engineer / Independent Code Reviewer

## Commit revisado

UNCOMMITTED_WORKTREE

## Base commit

55353058f537761536d53513b7db4d2e412c81f3

## Data da revisão

2026-08-20

## Resultado final

REQUEST_CHANGES

A divisão macro proposta pelo Codex é coerente e é adotada formalmente:

- `handoffs/current/` como estado operacional e comunicação entre agentes;
- `.review/` como quality gates, baseline e evidência técnica auxiliar;
- `docs/engineering/` como camada normativa;
- `docs/CODE_REVIEW_PROTOCOL_V1.md` preservado e integrado.

Nenhuma terceira estrutura é necessária e nenhuma foi criada. O que impede APPROVED
são arestas de duplicação normativa que hoje entregam instruções contraditórias ao
próprio Codex dentro de `AGENTS.md`, além de duas escalas de severidade e dois
vocabulários de veredito coexistindo como norma.

## Escopo efetivamente revisado

Lote INFRA-GOV-2026-08-19, comparado contra a base SHA. Arquivos do lote:

- adicionados: `docs/engineering/PROJECT.md`, `PRODUCT.md`, `ARCHITECTURE.md`,
  `ENGINEERING_RULES.md`, `SECURITY.md`, `DESIGN_SYSTEM.md`, `REVIEW_PROTOCOL.md`;
  `handoffs/README.md`, `handoffs/archive/README.md`, `handoffs/current/TASK.md`,
  `IMPLEMENTATION.md`, `REVIEW.md`, `STATUS.md`;
- modificados: `AGENTS.md`, `CLAUDE.md`, `README.md`, `docs/README.md`.

Confirmado que `docs/engineering/CODE_QUALITY_SKILL.md` e
`DOCUMENTATION_GOVERNANCE_SKILL.md` já eram rastreados antes deste lote
(`git ls-files docs/engineering`), portanto não são duplicação introduzida aqui e a
contagem de sete documentos novos em IMPLEMENTATION.md está correta.

Fora deste escopo, e não revisado neste ciclo: as 35 modificações e 35 entradas não
rastreadas preexistentes de produto, cobertas pelo review de baseline (ciclo 0) em
`.review/verdicts/takeover-worktree-2026-08-19.md`, findings R-01 a R-14.

## Evidências executadas ou analisadas

| Comando ou fonte | Resultado |
| --- | --- |
| `git status --short --branch` | `## main...origin/main [ahead 1]`, 83 entradas |
| `git rev-parse HEAD` | `55353058f537761536d53513b7db4d2e412c81f3` |
| `git rev-parse origin/main` | `87d7a406c5c131ca23602e00e55f7003d5aa873b` |
| `git diff --check` | limpo, exit 0 |
| `git ls-files docs/engineering` | 2 arquivos preexistentes, confirmando que os 7 novos são deste lote |
| `node scripts/review/quality-gates.mjs` | 0 regressões bloqueantes, baseline íntegro em 12 gates |
| `npm run docs:validate` | 12 documentos, 3 válidos, 9 com alerta, 0 bloqueados |
| Leitura integral | `docs/engineering/REVIEW_PROTOCOL.md`, `PROJECT.md`, `ENGINEERING_RULES.md`, `handoffs/README.md`, `handoffs/current/TASK.md`, `IMPLEMENTATION.md`, `STATUS.md`, `REVIEW.md`, diff de `AGENTS.md`, `CLAUDE.md`, `README.md`, `docs/README.md`, cabeçalhos de `ARCHITECTURE.md`, `PRODUCT.md`, `SECURITY.md`, `DESIGN_SYSTEM.md` |

As três validações que o IMPLEMENTATION.md declara (`git diff --check`,
`npm run docs:validate`, `npm run review:gates`) foram reexecutadas por mim e
conferem com o declarado. Nenhum PASS foi aceito sem execução.

## Findings

### F-01 — HIGH — Governança / instrução contraditória

- **Arquivo:** `AGENTS.md`, seções "Colaboração multiagente e handoff canônico" e "Revisão por agente revisor".
- **Evidência:** o mesmo arquivo instrui o Codex a publicar o lote em `handoffs/current/IMPLEMENTATION.md` e mudar `STATUS.md` para `READY_FOR_REVIEW`, e, algumas linhas depois, a "publicar o pedido de revisão em `.review/inbox/<lote>.json`". Para o revisor, o mesmo arquivo manda publicar veredito em `handoffs/current/REVIEW.md` e também em `.review/verdicts/<lote>.md` com atualização de `.review/state.json`.
- **Requisito violado:** `docs/engineering/REVIEW_PROTOCOL.md`, "Nenhuma fonte deve manter um veredito conflitante com handoffs/current/REVIEW.md"; princípio de fonte única da verdade em `docs/engineering/ARCHITECTURE.md`.
- **Impacto:** um agente que leia `AGENTS.md` de cima a baixo recebe duas ordens incompatíveis sobre onde abrir o pedido de review e onde registrar o veredito. O resultado provável é lote publicado em um canal e revisado no outro, com estado divergente entre `STATUS.md` e `.review/state.json`.
- **Correção esperada:** uma única seção de colaboração em `AGENTS.md`. A seção "Revisão por agente revisor" deve virar ponteiro para `docs/engineering/REVIEW_PROTOCOL.md` e `docs/CODE_REVIEW_PROTOCOL_V1.md`, declarando explicitamente qual artefato é canônico para pedido (`IMPLEMENTATION.md`) e para veredito (`REVIEW.md`), e classificando `.review/inbox/` e `.review/verdicts/` como complemento técnico opcional. Preservar a política de sanitização documental e a regra de `SURFACE_PENDING_UI`, que não têm equivalente na camada nova.
- **Status:** OPEN

### F-02 — HIGH — Governança / duas escalas de severidade normativas

- **Arquivos:** `docs/CODE_REVIEW_PROTOCOL_V1.md` seção 4; `docs/engineering/REVIEW_PROTOCOL.md` seção "REVIEW.md e findings".
- **Evidência:** o protocolo V1 define `BLOCKER`, `MAJOR`, `MINOR`, `NIT`. O protocolo multiagente define `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`. Os gates determinísticos emitem `blocker`, `major`, `info`. O review de baseline usa `BLOCKER`, `MAJOR`, `MINOR`, `INFO`.
- **Requisito violado:** `docs/engineering/REVIEW_PROTOCOL.md` exige severidade declarada por finding; com duas escalas simultâneas a regra deixa de ser determinística.
- **Impacto:** a regra "achado novo blocker ou major reprova o lote" não tem correspondência unívoca com `CRITICAL/HIGH`. Dois revisores, ou o mesmo revisor em ciclos diferentes, classificam o mesmo defeito de formas incomparáveis, e o histórico deixa de ser agregável.
- **Correção esperada:** eleger uma escala canônica para findings de review e publicar mapa de equivalência para os artefatos já emitidos, sem reescrever o baseline nem o veredito do ciclo 0. A escala dos gates pode permanecer própria desde que o mapa exista.
- **Status:** OPEN

### F-03 — MEDIUM — Governança / dois vocabulários de veredito

- **Arquivos:** `docs/CODE_REVIEW_PROTOCOL_V1.md` seção 6; `docs/engineering/REVIEW_PROTOCOL.md`.
- **Evidência:** V1 define `APROVADO`, `APROVADO_COM_RESSALVAS`, `BLOQUEADO`. O protocolo multiagente define `APPROVED`, `REQUEST_CHANGES`, `BLOCKED`. `APROVADO_COM_RESSALVAS` não tem estado correspondente na máquina de estados e é exatamente o veredito emitido no ciclo 0.
- **Requisito violado:** máquina de estados de `docs/engineering/REVIEW_PROTOCOL.md`; regra de não manter veredito conflitante entre fontes.
- **Impacto:** o veredito do ciclo 0 não é mapeável para a máquina de estados atual, o que impede saber se o worktree preexistente está em `CHANGES_REQUESTED` ou fora do fluxo.
- **Correção esperada:** adotar `APPROVED`, `REQUEST_CHANGES` e `BLOCKED` como vocabulário único, atualizar a seção 6 do V1 e declarar o mapeamento do ciclo 0. A classificação do worktree preexistente é decisão do proprietário, registrada abaixo.
- **Status:** OPEN

### F-04 — MEDIUM — Governança / dois lugares guardam estado de ciclo

- **Arquivos:** `handoffs/current/STATUS.md`; `.review/state.json`.
- **Evidência:** `STATUS.md` guarda Task, State, Owner, Base SHA, Current SHA, último revisor e última revisão. `.review/state.json` guarda `ultimoCommitRevisado`, `ultimoLoteRevisado`, `worktreeRevisado` e `ultimoHeartbeat`. Os dois descrevem o mesmo ciclo por campos diferentes. `REVIEW_PROTOCOL.md` prevê o conflito e manda interromper, mas não declara qual é canônico nem restringe o conteúdo de cada um.
- **Impacto:** divergência é questão de tempo, e a regra atual transforma divergência em bloqueio de aprovação em vez de preveni-la. Deixei `.review/state.json` intacto neste ciclo justamente para não alimentar a duplicação que estou reportando.
- **Correção esperada:** declarar `STATUS.md` como única fonte do estado da tarefa e restringir `.review/state.json` a metadados de automação (último HEAD varrido, contagem de entradas, último ciclo automatizado), removendo dele qualquer campo que expresse estado de review.
- **Status:** OPEN

### F-05 — MEDIUM — Governança / marcador de decisão do proprietário usado indevidamente

- **Arquivo:** `handoffs/current/STATUS.md`, campo `Last reviewer`.
- **Evidência:** `Last reviewer: UNRESOLVED — requires project owner decision`, com `Last review: NOT_STARTED` na linha seguinte.
- **Requisito violado:** `handoffs/README.md` e `docs/engineering/REVIEW_PROTOCOL.md` reservam esse marcador para dúvida material de produto, arquitetura, permissão, tenant, segurança ou operação externa.
- **Impacto:** cria pendência falsa na fila de decisões do proprietário e dilui o marcador, que perde valor de sinal quando houver ambiguidade real.
- **Correção esperada:** usar `NONE` ou `NOT_STARTED` para ausência de revisor, reservando o marcador para ambiguidade material.
- **Status:** OPEN

### F-06 — LOW — Governança / campo `Owner` não definido no protocolo

- **Arquivos:** `handoffs/current/STATUS.md`; `docs/engineering/REVIEW_PROTOCOL.md`.
- **Evidência:** `STATUS.md` traz `Owner: Claude` com `State: READY_FOR_REVIEW`. O protocolo não define o que `Owner` significa nem quem o atualiza.
- **Impacto:** ambiguidade entre "responsável pelo próximo passo" e "responsável pelo lote". Com dois agentes escrevendo no mesmo arquivo, isso vira disputa de campo.
- **Correção esperada:** definir `Owner` no protocolo como o agente responsável pelo próximo passo do estado atual, e declarar quem pode alterá-lo em cada transição.
- **Status:** OPEN

### F-07 — LOW — Governança / obrigatoriedade do inbox descrita de formas diferentes

- **Arquivos:** `docs/engineering/REVIEW_PROTOCOL.md`, "Artefatos obrigatórios"; `docs/CODE_REVIEW_PROTOCOL_V1.md`, seção 2.1.
- **Evidência:** o protocolo multiagente descreve `.review/inbox/<task-id>.json` como "pedido automatizado, quando o quality gate for aplicável". O V1 descreve o mesmo arquivo como o pedido de revisão do lote, e afirma que pedido sem validações reais é devolvido sem revisão técnica.
- **Impacto:** o Codex não tem como saber se o inbox é obrigatório. Complementa F-01.
- **Correção esperada:** alinhar a seção 2.1 do V1 ao papel definitivo do inbox depois da decisão de F-01.
- **Status:** OPEN

### F-08 — INFO — Observação sem ação necessária

`docs/engineering/` já continha `CODE_QUALITY_SKILL.md` e
`DOCUMENTATION_GOVERNANCE_SKILL.md` antes deste lote. O índice novo em
`docs/README.md` aponta `docs/engineering/PROJECT.md` como "índice inicial da camada
normativa", mas nenhum documento da camada referencia esses dois. Não é conflito e não
bloqueia; vale um ponteiro quando outro lote tocar a área.

## Decisões do proprietário pendentes

### D-01 — Classificação do worktree preexistente

- **Contexto:** as 35 modificações e 35 entradas não rastreadas de produto foram revisadas no ciclo 0 com veredito `APROVADO_COM_RESSALVAS`, vocabulário que não existe na máquina de estados atual. F-03 elimina esse termo.
- **Opção A:** tratar o worktree preexistente como lote próprio em `CHANGES_REQUESTED`, com TASK própria e os findings R-01 a R-14 como fila de correção. **Impacto:** o Codex passa a ter escopo formal para corrigir; o fluxo fica auditável de ponta a ponta; exige uma TASK adicional.
- **Opção B:** manter o worktree fora da máquina de estados, como contexto herdado, e abrir TASKs pequenas apenas para os itens que forem priorizados. **Impacto:** menos burocracia imediata; os findings ficam sem estado formal e o risco de esquecimento aumenta.
- **Recomendação técnica:** Opção A. R-01 e R-03 já bloqueiam publicação de Support, e sem lote formal essa condição não tem onde ser registrada.
- **Blocking:** NO para este lote, YES para publicar qualquer superfície nova.

### D-02 — Ativação de release já presente no worktree

- **Contexto:** finding R-04 do ciclo 0. `/inicio` e `/admin/tenants` entraram em `FIRST_RELEASE_SCREEN_KEYS` e a landing pós-login mudou para `/inicio`, sem commit e sem aceite registrado.
- **Opção A:** confirmar a ativação como intencional e registrar a autorização. **Impacto:** a mudança de landing vale para todos os perfis; a Central de Clientes fica publicada, com autorização real restrita a `platform_admin` pelo backend.
- **Opção B:** reverter no próximo lote e publicar por decisão separada. **Impacto:** mantém a régua que o handoff exige para Support, ao custo de um lote de reversão.
- **Recomendação técnica:** nenhuma. É decisão de produto.
- **Blocking:** YES para qualquer commit que inclua `release-surface.mjs`.

## O que não foi validado

- Não revisei linha a linha `ARCHITECTURE.md`, `PRODUCT.md`, `SECURITY.md` e
  `DESIGN_SYSTEM.md`. Verifiquei apenas o cabeçalho de precedência de cada um, que
  declara não substituir os documentos canônicos existentes, e a ausência de
  contradição direta com `REVIEW_PROTOCOL.md`. Uma leitura integral desses quatro
  documentos contra `docs/ARCHITECTURE_RULES.md`, `docs/PRODUCT_VISION.md`,
  `docs/AUTH_CONTEXT_STRATEGY.md` e o design system fica pendente.
- Não executei `lint`, `typecheck`, `build`, `test`, pgTAP nem smokes neste ciclo. O
  lote é exclusivamente documental, não toca código de produto, e os gates
  determinísticos não acusaram regressão. Concordo com a proporcionalidade declarada
  pelo Codex.
- Não validei o fluxo completo `READY_FOR_IMPLEMENTATION → DONE` na prática. Este é o
  primeiro ciclo usando os artefatos; a máquina de estados foi verificada por leitura,
  não por execução.
- Não consultei ambiente remoto, não executei operação de Git que altere histórico e
  não alterei código de produto, migrations, testes, contratos ou configuração
  executável.

## Próximo passo

Codex assume `CHANGES_REQUESTED` e responde F-01 a F-07 com correção ou contestação
fundamentada. F-01, F-02 e F-03 são pré-requisito para o primeiro lote de produto
entrar no fluxo, porque hoje o próprio `AGENTS.md` entrega instrução contraditória e a
severidade de findings não é comparável entre os dois protocolos.

Discordância com evidência é resultado válido. Se o Codex demonstrar que alguma
duplicação apontada é intencional e não gera ambiguidade operacional, o finding é
encerrado como `DISAGREEMENT_ACCEPTED` sem necessidade de mudança.

As decisões D-01 e D-02 são do proprietário e não devem ser resolvidas por nenhum dos
agentes.
