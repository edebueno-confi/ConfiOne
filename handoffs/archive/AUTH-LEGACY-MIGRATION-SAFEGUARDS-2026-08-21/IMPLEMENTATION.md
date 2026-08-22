# IMPLEMENTATION

- Task ID: `AUTH-LEGACY-MIGRATION-SAFEGUARDS-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Base SHA: `a1c6993`
- Implementation SHA: UNCOMMITTED_WORKTREE

## Instrução operacional

Esta promoção é somente para auditoria documental/read-only. O executor deve
reconciliar o modelo aprovado com código e fontes reais, sem alterar runtime,
SQL, migrations, RLS, RPCs, grants, policies, secrets, banco ou integrações.

## Entregáveis

- inventário factual das fontes atuais;
- matriz de de-para e divergências;
- riscos e contraexemplos de segurança;
- salvaguardas, pré-condições e decisões que exigem Owner;
- evidências e limitações registradas antes de READY_FOR_REVIEW.

Nenhum commit ou ação externa está autorizado nesta fase antes da revisão
independente e da validação de contaminação.

## Resultado da auditoria

- Relatório criado em `docs/reports/AUTH_LEGACY_MIGRATION_SAFEGUARDS_AUDIT_V1.md`.
- A matriz reconcilia identidade, contexto interno, tenant membership, área,
  perfil, tela, capability, override, publicação e auditoria.
- Salvaguardas cobrem deny by default, escalada, último administrador,
  tenant/área, estados stale/revogados, conflitos, idempotência e rollback.
- Fatos, contraexemplos, lacunas e decisões pendentes foram separados.
- Nenhuma fonte executável foi alterada e nenhuma normalização foi executada.

## Gates

- `npm run docs:validate`: PASS.
- `git diff --check`: PASS.
- Auditoria de qualidade/governança: somente leitura; sem escrita executável.

Limitações: não houve validação de estado remoto, execução de pgTAP mutável,
seed, migration, banco, integração ou QA browser. A precedência entre role,
perfil, grants e overrides e a representação executável de READ/WRITE continuam
decisões pendentes.

## Resposta aos findings

- `F-AUTHLEGACY-001`: o relatório agora possui referências locais por caminho,
  linha ou objeto para identidade/contexto, tenant/área, perfis/grants,
  overrides, release gate, último administrador, auditoria e testes.
- `F-AUTHLEGACY-002`: o rollback agora exige dry-run read-only, snapshot do
  estado anterior, chave de idempotência, abortagem, ordem/fonte de restauração,
  auditoria e reconciliação. Sem esses pré-requisitos, qualquer escrita futura
  permanece explicitamente bloqueada.
