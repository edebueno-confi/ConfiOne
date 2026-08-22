# REVIEW

- Task ID: `AUTH-LEGACY-MIGRATION-SAFEGUARDS-2026-08-21`
- Reviewer: Sentinel (Codex Independent Reviewer)
- Review mode: SENTINEL_REQUIRED
- Estado revisado: `READY_FOR_REVIEW`
- Base SHA: `a1c6993`
- Implementation SHA: `UNCOMMITTED_WORKTREE`
- Data da revisão: `2026-08-22`

## Funcionalidade revisada

Auditoria documental/read-only do de-para de autorização e das salvaguardas
para uma eventual normalização legada. Nenhuma normalização ou alteração de
fonte executável foi realizada.

## Resultado

`CHANGES_REQUESTED`

O relatório separa corretamente identidade, contexto, tenant, área, perfil,
tela, capability, override, publicação e auditoria. Também cobre deny by
default, escalada, último administrador, cross-tenant, stale, conflitos,
idempotência e rollback como temas de risco, sem autorizar execução futura.

## Findings

### F-AUTHLEGACY-001 — MEDIUM — Evidência da matriz não é reproduzível

- Evidência: a matriz cita nomes de tabelas, manifests, guards, feeds e
  migrations, mas não fornece caminhos e trechos/linhas para a maior parte das
  afirmações; a seção final apenas informa que as fontes foram inspecionadas.
- Impacto: uma revisão futura não consegue distinguir rapidamente fato
  executável, interpretação da auditoria e hipótese de migração, especialmente
  para `internal_area_memberships`, screen grants, capabilities, overrides e
  auditoria.
- Correção esperada: acrescentar referências rastreáveis por linha ou objeto,
  incluindo pelo menos a fonte de identidade/contexto, membership de tenant e
  área, perfil/grants, override deny, release gate, proteção do último admin,
  trilha de auditoria e testes/contraexemplos correspondentes. Manter as
  referências como evidência local, sem alegar validação remota.

### F-AUTHLEGACY-002 — MEDIUM — Salvaguarda de rollback ainda é genérica

- Evidência: a salvaguarda 6 recomenda “lote idempotente, contingência,
  registro de decisão por item e reconciliação pós-operação”, mas não define
  pré-condição de snapshot/dry-run, chave de idempotência, ponto de abortagem,
  fonte de restauração, ordem de reversão ou critério para declarar rollback
  concluído.
- Impacto: uma futura execução poderia alterar parte do acesso e ficar sem
  mecanismo verificável de retorno, agravando perda de acesso, escalada ou
  divergência entre fontes.
- Correção esperada: documentar o contrato mínimo de rollback como pré-condição
  da futura task, ou declarar explicitamente que rollback não está definido e
  que nenhuma escrita pode ser autorizada até decisão do proprietário. Incluir
  dry-run somente leitura, snapshot/estado anterior, abortar em conflito ou
  falha de cardinalidade, restauração auditada e reconciliação pós-rollback.

## Gates e evidências

- `npm run docs:validate`: PASS, 0 bloqueios; alertas históricos permanecem
  fora deste lote.
- `npm run review:gates`: PASS, 0 regressões bloqueantes e 47 itens do
  baseline resolvidos.
- `git diff --check`: PASS.
- Não houve execução de migration, seed, banco, pgTAP mutável, integração,
  chamada externa ou escrita local/remota.

## Limitações preservadas

Não há prova de estado remoto, precedência final entre role/perfil/grant/
override, representação executável única de READ/WRITE, revalidação de sessão
stale ou rollback operacional. Essas lacunas não foram tratadas como resolvidas.

## Decisão e próximo passo

`CHANGES_REQUESTED`. Forge deve completar a rastreabilidade das evidências e
explicitar o contrato de rollback ou sua ausência bloqueante, repetir os gates
documentais e devolver `READY_FOR_REVIEW` com `Owner: Sentinel`. Nenhuma
normalização, migration, grant ou escrita é autorizada por esta revisão.

## Re-review incremental

- Estado revisado: `READY_FOR_REVIEW` após resposta aos findings.
- Base SHA: `a1c6993`.
- Implementation SHA: `UNCOMMITTED_WORKTREE`.
- Reviewer: Sentinel (Codex Independent Reviewer).

### F-AUTHLEGACY-001 — RESOLVIDO

O relatório adicionou referências reproduzíveis com caminhos e linhas/objetos
para identidade/contexto, tenant/área, perfis/grants, overrides, release gate,
proteção do último administrador, auditoria e testes/contraexemplos. As
referências permanecem locais e não são apresentadas como validação remota.

### F-AUTHLEGACY-002 — RESOLVIDO

O relatório agora define o contrato mínimo de rollback: dry-run read-only,
snapshot imutável por item, chave de idempotência, abortagem antes da escrita
em conflito ou falha de cardinalidade, restauração ordenada pela fonte
anterior, auditoria por item e reconciliação pós-rollback. Também afirma que
qualquer escrita futura permanece bloqueada sem snapshot aprovado, dry-run
validado e fonte de restauração disponível.

## Veredito final

`APPROVED`

Os limites documentais foram preservados: não houve normalização, migration,
seed, banco, integração, chamada externa ou escrita local/remota. Gates
repetidos: `docs:validate` PASS, `review:gates` PASS sem regressões
bloqueantes e `git diff --check` PASS.

O lote está aprovado para `FINALIZE_LOCAL` seletivo pela fila autorizada.
Forge pode criar o commit local exclusivo, arquivar o handoff e normalizar
`current/`. Push, merge, deploy, produção, secrets e qualquer escrita de
autorização continuam proibidos.
