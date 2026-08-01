# ACCESS-01 — Control plane interno

## Estado local

Foi criada a fundação aditiva do control plane interno a partir de `origin/main` em
`codex/access-01-internal-control-plane`. Nenhuma migration remota, push, deploy,
HubSpot ou OMIE foi executado.

## Contratos implementados

- contexto explícito `internal | customer`, com status, primário e deny-by-default;
- catálogo de capacidades e grants por papel, perfil e override individual;
- allowlist de release em `internal_screen_catalog`, preservando `screen_key`;
- read models de capacidades e convites;
- convite com hash de token, expiração, revogação e aceite de uso único;
- RPCs administrativas protegidas por capacidade e RPC de aceite com conferência de e-mail;
- perfis canônicos de Analytics, Dashboard, Knowledge e Acessos;
- contexto interno automático apenas para papéis globais internos existentes;
- auditoria das novas entidades com IDs UUID e sem token bruto.

## Compatibilidade

As tabelas e grants legados permanecem. A contagem existente de áreas de acionamento não
foi alterada, pois ela é usada por contratos de suporte e testes de regressão. A separação
entre catálogo de áreas organizacionais e áreas de destino de acionamentos ainda precisa de
uma etapa própria antes de atribuir funções organizacionais novas.

## Limite desta passagem

O `/admin/access` existente ainda apresenta a governança legada de memberships de cliente;
ele não deve ser considerado a UI final do control plane interno. A refatoração da tela,
CRUD de áreas/funções/overrides e envio de convite por Edge Function permanecem bloqueados
até consolidar essa fronteira sem misturar memberships de cliente com colaboradores internos.

## Validação

- `npm run supabase:db:reset` — aprovado em banco local reconstruído;
- `npm run supabase:test:db` — suite existente aprovada após preservar contratos legados;
- teste ACCESS-01 focado — 18/18 aprovado;
- `npm run contracts:typecheck` — aprovado;
- `npm run web:typecheck` — aprovado;
- `npm run web:build` — aprovado;
- `npm run repository:check-root` — aprovado;
- `npm run local:qa:secret-scan` — 1.602 arquivos, zero ocorrências;
- `git diff --check` — aprovado.

## Próximo gate

Antes de qualquer operação remota, concluir a UI administrativa interna e os RPCs de CRUD
de áreas, funções e overrides; depois solicitar o gate remoto único previsto no handoff.
