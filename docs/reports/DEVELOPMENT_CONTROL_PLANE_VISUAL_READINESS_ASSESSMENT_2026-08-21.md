# Development Control Plane Visual — avaliação de prontidão

**Data:** 2026-08-21
**Produto:** ConfiOne
**Classificação:** `C. PARCIALMENTE IMPLEMENTADO`
**Escopo:** descoberta, arquitetura e estimativa. Nenhuma implementação foi
iniciada por este relatório.

## 1. Resposta executiva

O repositório já contém um MVP visual local e somente leitura do Development
Control Plane. Ele lê a fila, o handoff corrente, arquivos arquivados e o Git,
mas ainda não representa o Control Plane completo com contrato de dados
confiável, detalhe navegável de cada task, heartbeat persistido, decisões
duráveis e publicação online protegida.

A recomendação é `SIM, COM PRÉ-REQUISITOS` para uma V1 online read-only. O MVP
local deve continuar como ferramenta de engenharia. Essa frente é separada e
não bloqueia a Release 1 do ConfiOne.

## 2. O que foi planejado

O objetivo da descoberta foi avaliar um painel visual para acompanhar estado do
projeto, fila de tasks, tarefa corrente, dependências, gates, agentes,
heartbeat, decisões do proprietário, atividade, revisões e evidências, sem
criar uma segunda fonte de verdade.

## 3. O que já existe

Arquivos principais:

- `tools/dev-control/server.mjs`
- `tools/dev-control/public/index.html`
- `tools/dev-control/public/app.js`
- `tools/dev-control/public/queue-state.js`
- `tests/scripts/dev-control-mvp.test.mjs`
- script npm `dev-control`

O servidor usa `127.0.0.1:4178`, expõe apenas `GET /api/snapshot` e retorna
um snapshot read-only. Ele lê `handoffs/README.md`,
`handoffs/current/{TASK,IMPLEMENTATION,REVIEW,STATUS}.md`, arquivos arquivados e
informações locais do Git.

## 4. Arquitetura e fontes atuais

O fluxo atual é:

`arquivos versionados + Git local -> parser Node -> snapshot HTTP local -> UI estática`

Fontes canônicas que devem continuar prevalecendo:

1. `handoffs/current/` para a tarefa ativa e seu estado detalhado;
2. `handoffs/README.md` para a fila canônica;
3. `docs/engineering/OWNER_DECISIONS.md` para decisões duráveis;
4. `docs/ROADMAP_BUILDOUT_V3.md` para ordem de produto;
5. `.review/` como complemento técnico, sem substituir os handoffs.

O código atual declara `.review/` como fonte de revisão, mas ainda não o
interpreta diretamente no snapshot. As decisões duráveis também não são
carregadas de `OWNER_DECISIONS.md`; o snapshot validado retornou `decisions: []`.

## 5. Kanban e estado

O painel possui cards e colunas para estados como `PROPOSED`, `APPROVED`,
`READY_FOR_IMPLEMENTATION`, `ACTIVE`, `READY_FOR_REVIEW`,
`CHANGES_REQUESTED`, `OWNER_DECISION_REQUIRED`, `BLOCKED`, `DONE` e
`UNRESOLVED`.

Foi identificado drift: a fila canônica usa `BACKLOG` e `READY`, enquanto as
colunas visuais não os representam. Por isso itens correntes podem cair em
`UNRESOLVED`, mesmo quando o estado é válido no protocolo.

O parser de review também não reconhece literalmente `CHANGES_REQUESTED`, o
que pode exibir `PENDING` apesar de existirem findings abertos.

## 6. Task corrente e detalhe

O painel exibe a task corrente, owner, base SHA, head SHA, documentos
disponíveis, resultado da revisão, quantidade de findings e data de atualização.

Ainda não existe detalhe clicável completo por task com critérios de aceite,
arquivos permitidos, evidências, commits, dependências resolvidas, histórico
de transições e links diretos para os artefatos.

## 7. Forge, Sentinel e heartbeat

O estado corrente identifica o owner da task, mas não há uma área operacional
com presença, papel, último heartbeat, atraso, próximo passo e motivo de
bloqueio de Forge e Sentinel.

`docs/KANBAN_OPERATIONAL_GOVERNANCE.md` documenta jobs históricos de heartbeat,
mas o servidor atual não lê nem expõe heartbeat persistido. O painel não deve
inferir atividade de um agente apenas pelo owner textual.

## 8. Lacunas locais

- parser incompleto de decisões, review e campos da fila;
- drift entre estados canônicos e colunas do Kanban;
- ausência de detalhe navegável de task;
- ausência de contrato versionado do snapshot;
- ausência de heartbeat observável;
- ausência de evidência direta de `.review/`;
- teste MVP com uma asserção histórica que permite apenas `Codex`, `Claude` ou
  `Ede`, embora o reviewer corrente seja `Sentinel`;
- validação feita por testes de servidor/parser, sem validação do fluxo
  renderizado no navegador nesta descoberta.

## 9. Lacunas para operação online

O servidor local não deve ser exposto diretamente à internet. Ele depende de
filesystem e Git locais, não possui autenticação online, não implementa RLS,
não tem rate limit de publicação e não oferece um modelo sanitizado de
evidências.

Não é recomendável colocar um snapshot privado completo dentro do JavaScript
público nem usar um token de GitHub no runtime do navegador.

## 10. Opções de publicação

### Opção A — ferramenta local

Manter Node local, protegido por loopback. Menor custo e menor risco, mas não
atende acesso online.

### Opção B — snapshot sanitizado publicado por CI

Gerar um read model versionado e sanitizado a partir do repositório/CI, publicar
em endpoint protegido e consumir no painel. É a opção recomendada para V1.

### Opção C — leitura direta do GitHub em runtime

Evitar na V1. Aumenta dependência externa, exposição de token, complexidade de
cache e variabilidade de disponibilidade.

## 11. Recomendação de V1 online

Reutilizar o shell e a autenticação existentes do ConfiOne e publicar apenas
um read model sanitizado em endpoint server-side protegido por uma capability
como `platform_admin`. O endpoint deve fornecer snapshot versionado, polling
de 30 a 60 segundos, status de atualização, estado da fila, task corrente,
decisões, atividade e links controlados para artefatos permitidos.

Não incluir writes, comandos de execução, alteração de fila, aprovação,
transição de handoff ou ação sobre produção na V1.

## 12. Segurança

- autenticar e autorizar no backend, nunca somente no frontend;
- não expor secrets, tokens, cookies, JWTs, `service_role`, conteúdo bruto de
  handoffs sensíveis ou dados de clientes;
- aplicar allowlist de campos e artefatos publicados;
- separar estado operacional do produto e dados de clientes;
- registrar auditoria de leitura administrativa quando exigido;
- bloquear cross-tenant e acesso de usuários sem capability;
- tratar GitHub, CI e storage como fontes de publicação, não como comandos
  executáveis pelo navegador.

## 13. Estimativa preliminar

Estimativa de engenharia, sujeita a refinamento depois do contrato de dados:

| Escopo | Estimativa | Observação |
| --- | --- | --- |
| Hardening local do MVP | XS/S, 0,5 a 1,5 dia de agente | Parser, estados, decisões e testes. |
| V1 online read-only | M, 3 a 5 dias de agente | Snapshot sanitizado, endpoint protegido, rota e QA. |
| V1.5 de observabilidade | M, 3 a 6 dias de agente | Heartbeat, atraso, atividade e histórico. |
| V2 interativa | L, 7 a 15 dias de agente | Writes, approvals e transições, somente após novo contrato de segurança. |

As faixas não incluem mudanças de infraestrutura externa, aprovação de
segurança, publicação ou operação contínua.

## 14. Dependências

- contrato do snapshot e sua política de sanitização;
- capability e rota autenticada no ConfiOne;
- processo confiável de publicação a partir do Git/CI;
- definição de heartbeat persistido e sua fonte;
- reconciliação de estados entre fila, handoff, review e `.review/`;
- validação de browser autenticado e acessibilidade.

## 15. Riscos

- criar uma segunda fonte de verdade;
- publicar dados internos ou segredos por engano;
- confundir owner textual com agente ativo;
- mostrar estado incorreto por parser desatualizado;
- transformar um painel de observação em superfície de execução sem revisão;
- bloquear a Release 1 por uma ferramenta de governança interna.

## 16. Tasks futuras propostas

Estas propostas não foram criadas na fila por este relatório:

1. contrato e parser versionado do snapshot;
2. projeção sanitizada publicada por CI;
3. endpoint autenticado read-only com capability e auditoria;
4. rota visual online com detalhe de task e estados canônicos;
5. heartbeat e observabilidade de Forge/Sentinel;
6. QA de segurança, browser, acessibilidade e regressão.

## 17. Prioridade

Classificar como P2, separada da execução da Release 1. O Control Plane Visual
deve acompanhar o desenvolvimento do ConfiOne, mas não deve deslocar a fila de
autenticação, safe landing, shell, Dashboard, Configurações, Ajuda e gates de
release.

## Validação desta descoberta

- `node --test tests/scripts/dev-control-mvp.test.mjs`: 7 aprovados e 1 falha
  por asserção histórica de owner que não inclui `Sentinel`;
- leitura direta de `readSnapshot()`: servidor, fila, task corrente, arquivos
  arquivados e Git foram confirmados;
- classificação final: `C. PARCIALMENTE IMPLEMENTADO`;
- não houve implementação, deploy, escrita remota ou publicação online.

## 18. Evolução visual executada em DEV-CONTROL-VISUAL-V1

O lote `DEV-CONTROL-VISUAL-V1-2026-08-22` evolui o MVP local sem criar uma
segunda fonte de verdade:

- o servidor continua lendo diretamente `handoffs/current/`,
  `handoffs/README.md`, `handoffs/archive/` e o Git local;
- o snapshot agora expõe, além da fila e do handoff, o papel, reviewer ativo,
  coordinator, `Agent coordination` e os agentes Forge, Sentinel e Codex;
- a fila preserva o estado bruto e adiciona uma classificação visual explícita
  para `BACKLOG`, `READY`, `IMPLEMENTING`, `READY_FOR_REVIEW`,
  `CHANGES_REQUESTED`, `APPROVED`, `DONE`, `BLOCKED` e
  `OWNER_DECISION_REQUIRED`; estados desconhecidos ficam em
  `UNRESOLVED`;
- o painel mostra dependências, approval, revisão, findings, gates, worktree,
  decisões, atividade e a última evidência observável;
- cada card da fila permite inspeção detalhada no próprio painel, sem executar
  transição, comando, aprovação, escrita ou publicação;
- loading, erro de snapshot, vazio, worktree sujo e ausência de evidência são
  apresentados explicitamente, sem inventar progresso;
- a referência visual de review é Sentinel. Claude permanece apenas como
  referência histórica nos artefatos antigos.

O heartbeat não é inventado pelo painel. Quando o handoff corrente possui
timestamp observável, ele é exibido como evidência do handoff; sem timestamp,
o agente é marcado como sem atualização observável. Isso evita interpretar a
ausência de uma linha como prova de execução.

Validações específicas do lote:

- `node --test tests/scripts/dev-control-mvp.test.mjs`: 9/9 PASS;
- servidor e endpoint continuam GET/read-only, com métodos de escrita
  respondendo 405;
- nenhuma alteração em código de produto, banco, migration, integração,
  secret, produção ou superfície de release.
