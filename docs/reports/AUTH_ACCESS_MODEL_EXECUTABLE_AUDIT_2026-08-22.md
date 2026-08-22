# Auditoria e especificação do modelo executável de acesso

- Task: `AUTH-ACCESS-MODEL-EXECUTABLE-2026-08-22`
- Base SHA: `5a523e0e`
- Escopo: auditoria local/read-only e especificação documental
- Veredito do lote: consistente com ressalvas; não autoriza migração

## Resumo executivo

O ConfiOne possui enforcement distribuído entre contexto de ator, profile
ativo, papéis globais, memberships de tenant/área, catálogo de telas, grants
por papel/membership/profile, capabilities, overrides, release surface, guards,
RLS e RPCs. O modelo `Usuário -> Nível -> Área -> Tela -> READ/WRITE` é uma
especificação alvo, não uma entidade executável única. Este lote não alterou
runtime, SQL, migration, RLS, RPC, grant, claim, scope, secret ou serviço
externo.

## Inventário factual reproduzível

| Camada | Evidência local | Fato |
| --- | --- | --- |
| Usuário/contexto | `supabase/migrations/20260727033235_access_01_internal_control_plane.sql:25-39` | `user_actor_contexts` referencia `profiles`, com ator primário e status |
| Tenant | `supabase/migrations/20260429210127_phase1_identity_tenancy.sql:76` | `tenant_memberships` é o vínculo ao tenant |
| Área | `supabase/migrations/20260722221746_internal_profile_screen_access_contract_v1.sql:73-112` | membership vincula usuário, tenant, área, status, profile e `permission_mode` |
| Telas | `supabase/migrations/20260722221746_internal_profile_screen_access_contract_v1.sql:151-180,432-467` | catálogo e grants existem por papel, membership e profile |
| Papel | `supabase/migrations/20260722221746_internal_profile_screen_access_contract_v1.sql:238-312` | `internal_role_screen_grants` materializa telas por papel |
| Capabilities | `supabase/migrations/20260727033235_access_01_internal_control_plane.sql:40-90,290-318` | grants por papel/profile e overrides por usuário |
| Override | `supabase/migrations/20260727033235_access_01_internal_control_plane.sql:290-318` | deny vigente e `valid_until` são avaliados no helper |
| Contexto efetivo | `supabase/migrations/20260722221746_internal_profile_screen_access_contract_v1.sql:467-558` | view une contexto global e memberships ativas com tenant/área/tela ativos |
| Guard/menu | `apps/web/src/features/auth/internal-route-access.ts:30-210`; `apps/web/src/app/release-surface.mjs` | frontend usa roles/screen keys e publicação; não substitui backend/RLS |
| Backend | `docs/VIEW_RPC_CONTRACTS.md:55-95,2180-2214` | views/RPCs protegidos são fonte de dados e enforcement administrativo |
| Último admin | `supabase/migrations/20260727040334_access_01_1_admin_operational_crud.sql:251-255` | suspensão do último `platform_admin` é bloqueada |
| Auditoria | `supabase/migrations/20260722221746_internal_profile_screen_access_contract_v1.sql:390-413` | triggers cobrem catálogos, memberships e grants |

## Contrato alvo

O contrato existente em `docs/specs/AUTHORIZATION_ADMIN_ACCESS_SIMPLIFICATION_PLAN_V1.md:289-337` foi reconciliado e permanece a fonte documental do alvo:

1. **Usuário**: identidade autenticada, profile ativo e contexto de ator ativo.
2. **Nível**: vocabulário de produto, sem substituir role, capability,
   membership ou publicação; nenhum nível concede acesso sozinho.
3. **Área**: área funcional e tenant explícito. Ausência, conflito ou
   membership inativa negam.
4. **Tela**: `screen_key` do catálogo e rota publicada. Menu é descoberta,
   não autorização; release gate, guard e backend precisam concordar.
5. **READ**: leitura da tela/read model autorizado no escopo efetivo.
6. **WRITE**: comando backend autorizado e sempre implica READ; não é inferido
   de botão, rota ou estado local do frontend.

### Precedência normativa proposta

`DENY` é o padrão: (1) sessão/profile/contexto inválido nega; (2) deny
explícito vigente nega; (3) tenant/área ausente, incompatível ou stale nega ou
fica `PENDING_REVALIDATION`; (4) tela não publicada nega; (5) grant efetivo
compatível concede somente o menor escopo comprovado; (6) capability/comando
backend compatível permite a operação. WRITE inclui READ.

A precedência entre grants positivos de role, membership e profile ainda não é
fato único do runtime e requer decisão antes de migração. O deny de capability
observado no helper não deve ser generalizado para screen grants sem contrato.

## Riscos e contraexemplos

| Cenário | Resultado seguro | Evidência |
| --- | --- | --- |
| rota não publicada, inclusive para `platform_admin` | negar | `internal-route-access.ts:40-45` |
| `dashboard_viewer` em configuração | negar | `tests/scripts/release-surface.test.mjs` |
| tenant ativo e área inativa | negar | joins da view de contexto efetivo |
| sessão expirada | negar e reautenticar | `AdminGate.tsx`, `ReceptionGate.tsx` |
| override deny e role allow | negar capability | helper `has_internal_capability` |
| WRITE sem READ | contrato inválido | especificação alvo |
| último `platform_admin` | abortar comando | RPC administrativo citado acima |
| URL coincide, screen key ausente | negar | não inferir por texto/rota |
| fontes em conflito | `DENIED`/`PENDING_REVIEW` | não existe resolvedor único atual |

## Plano seguro separado

1. Congelar registry versionado de telas, áreas, operações e capabilities reais.
2. Decidir precedência entre papel, membership, profile e override.
3. Criar resolvedor read-only e comparar em shadow mode.
4. Validar deny by default, WRITE implica READ, isolamento, revogação, stale e
   último admin em testes de banco/runtime.
5. Só então migrar uma área por vez com snapshot, dry-run, idempotência,
   abortagem em conflito e reconciliação pós-migração.
6. Remover fonte antiga apenas após paridade e decisão explícita do proprietário.

Este lote não cria resolvedor, não migra dados e não autoriza qualquer escrita.

## Decisões pendentes

Nomes/ordenação dos níveis; participação de screen grants de profile; precedência
formal; cadência de revalidação stale; escopo de `platform_admin` em dados de
tenant; auditoria mínima; e tratamento de registros ambíguos.

## Validações e limitações

- Auditoria governance `changed`: PASS, 0 bloqueadores, `consistente com ressalvas`.
- `validate-governance-skill.mjs`: PASS.
- `npm run docs:validate`: PASS, 0 bloqueios.
- `npm run review:gates`: PASS, 0 regressões bloqueantes, 47 baseline resolvidos.
- `git diff --check`: PASS.
- Testes focused selecionados: 32/39 PASS e 7 falhas em
  `tests/scripts/release-surface.test.mjs`, todas relacionadas à expectativa
  preexistente de publicação de `tenants`/`/admin/tenants`, enquanto o manifesto
  local atual não o publica. Esse conflito foi apenas registrado, não corrigido
  neste lote.
- Não foram executados pgTAP, migrations, RPCs remotos, browser autenticado,
  produção ou integrações externas.

Conclusão: contrato adequado para decisão futura; implementação executável
permanece bloqueada até precedência e paridade em shadow mode serem aprovadas.
