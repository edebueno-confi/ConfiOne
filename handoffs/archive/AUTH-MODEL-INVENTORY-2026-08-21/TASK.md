# TASK

- Task ID: `AUTH-MODEL-INVENTORY-2026-08-21`
- State: `READY_FOR_REVIEW`
- Owner: `Sentinel`
- Role: `REVIEWER`
- Reviewer active: `Sentinel`
- Review mode: `SENTINEL_REQUIRED`
- Agent coordination: `REVIEW_ACTIVE`
- Approval: `APPROVED`
- Base SHA: `76a7b867783c9303d2aca845c5b99b60c268377a`
- Current SHA: `UNCOMMITTED_WORKTREE`
- Allowlist: inventário e documentação factual da autorização; arquivos
  documentais estritamente necessários; testes de contrato de leitura, se
  aplicáveis. Não alterar produto executável neste lote.

Forge respondeu aos findings documentais F-AUTH-001, F-AUTH-002 e F-AUTH-003 e
devolveu o lote em `READY_FOR_REVIEW` para re-review independente. Não há HOLD
vigente.

## Objetivo

Produzir um inventário factual do cadastro, ativação, identidade, contexto,
papéis, áreas, telas, capabilities, guards, views, RPCs, policies, menu e
sessão que participam da autorização interna do ConfiOne.

## Escopo obrigatório

- mapear o fluxo real desde cadastro/ativação e autenticação até sessão,
  contexto, autorização, route guard, menu, página e backend;
- localizar os consumidores reais em router, guards, shell, páginas, contratos,
  views, RPCs, policies, migrations e testes;
- separar autenticação de autorização, usuário ativo/inativo, ausência de
  workspace, contexto interno, tenant/organização, papel, área, tela,
  capability e READ/WRITE;
- registrar diferenças entre interno e customer-facing;
- documentar estados de ausência, revogação, sessão stale e cache;
- produzir matriz com entidade, fonte, consumidor, escopo, evidência e lacunas.

## Critérios de aceite

- cada afirmação factual aponta para arquivo, contrato, migration, view, RPC,
  policy, teste ou comportamento reproduzido;
- hipóteses, recomendações e decisões pendentes aparecem separadas dos fatos;
- não há recomendação de remoção ou simplificação apresentada como conclusão;
- o inventário cobre menu, router e backend, não apenas o frontend;
- riscos cross-tenant, bypass por URL, revogação, usuário desativado e cache
  stale são explicitamente classificados;
- validações executadas e limitações do ambiente são registradas em
  `IMPLEMENTATION.md`;
- a entrega termina em `READY_FOR_REVIEW` para Sentinel.

## Fora do escopo

Não implementar a simplificação do modelo, não alterar RLS, RPC, migration,
policy, catálogo de telas, grants, secrets, release surface ou serviço externo.
Não criar bypass para administrador, não alterar `is_active` e não fazer
escrita remota.
