# TASK

- Task ID: `R1-RELEASE-READINESS-2026-08-21`
- State: APPROVED
- Owner: Forge
- Role: EXECUTOR
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `d1373aee`

## Objetivo

Consolidar a prontidão da Release 1 com decisão go/no-go baseada em evidência,
sem confundir validação local com autorização de deploy ou produção.

## Escopo

Reconciliar os gates das tasks R1, AUTH, Dashboard, Configurações, Central de
Ajuda, QA integrado e limitações remanescentes. Verificar se existe P1 aberto,
superfície parcial declarada como pronta, finding bloqueante, dependência
pendente ou risco de segurança que impeça a prontidão. Classificar cada item
como comprovado, não comprovado, pendente, bloqueado ou fora do escopo.

## Fora do escopo

Não fazer deploy, publicação, produção, alteração de secrets, migrations
remotas, escrita externa, push ou merge. Não transformar um relatório local em
autorização de release. Não apagar histórico ou suavizar limitações.

## Critérios de aceite

- matriz de evidências e gates por superfície da Release 1;
- P1s, findings e dependências avaliados sem aprovação automática;
- limitações de browser, runtime, RLS, cross-tenant, performance e integrações
  separadas dos itens comprovados;
- decisão documental de prontidão local ou não prontidão, com justificativa;
- recomendação de próximos gates e riscos para o proprietário.
