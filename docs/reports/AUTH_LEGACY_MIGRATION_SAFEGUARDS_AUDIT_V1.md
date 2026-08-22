# Auditoria de salvaguardas para normalização legada de autorização

Task: `AUTH-LEGACY-MIGRATION-SAFEGUARDS-2026-08-21`
Base: `a1c6993`
Escopo: diagnóstico documental/read-only. Nenhuma normalização foi executada.

## Resultado executivo

Não existe um de-para mecânico seguro entre todas as fontes atuais. O sistema
separa identidade, contexto interno, membership de tenant, membership de área,
perfil, screen grants, capabilities, overrides e publicação de rotas. Uma
normalização futura precisa preservar essas fronteiras e parar diante de
ausência, conflito ou cobertura insuficiente.

## Matriz factual de fontes

| Conceito | Fonte executável | Evidência observada | Classificação para migração |
|---|---|---|---|
| Usuário/profile | `profiles`, Auth e `user_actor_contexts` | Contexto interno distingue ator `internal` de `customer`; estados `active`, `suspended`, `revoked`. | Fonte de identidade, não converter em grant. |
| Acesso a cliente | `tenant_memberships` | Escopo de tenant e papel B2B; não é área interna. | Preservar separado. |
| Acesso interno | `internal_area_memberships` | Relaciona usuário, tenant, área, função, status, perfil e `permission_mode`. | Candidato a área/escopo, exige validação de tenant e status. |
| Perfil de acesso | `internal_access_profiles` | Perfil nomeado, sistêmico ou por área, com grants e `is_active`. | Não substituir membership sem precedência aprovada. |
| Tela | screen catalog e grants de membership/perfil | Screen keys, dependências e grants aparecem em read models/RPCs administrativos. | Só migrar chaves publicadas e comprovadas. |
| Capability | `internal_capabilities`, profile grants e overrides | Capabilities são fonte de autorização efetiva; overrides têm efeito e justificativa. | Não inferir equivalência por nome. |
| Publicação | release manifest/guards | Rota publicada é pré-condição independente da autorização. | Não promover tela durante normalização. |
| Auditoria | `audit.audit_logs`, feeds administrativos | Mutações administrativas e bootstrap têm trilha auditável. | Toda mudança futura deve gerar antes/depois, ator, alvo, escopo e resultado. |

## Salvaguardas obrigatórias

1. **Deny by default:** ausência de contexto ativo, tenant/área incompatível,
   tela não publicada, grant ausente, conflito ou estado stale não pode virar
   autorização.
2. **Sem escalada:** não converter papel B2B em capability interna, nem
   capability em acesso a outra área/tenant sem vínculo explícito.
3. **Último administrador:** pré-validar cardinalidade de `platform_admin`,
   bloquear remoção/suspensão do último administrador e manter proteção de
   autoalteração.
4. **Tenant e área:** validar identidade, contexto interno, membership de área
   ativa e tenant válido; não assumir que área substitui tenant membership.
5. **Stale/revogação:** invalidar ou revalidar o contexto antes de mutação;
   `active`, `suspended`, `revoked`, `inactive` e `archived` não são sinônimos.
6. **Auditoria/rollback:** nenhuma escrita é autorizada nesta task. Em futura
   task, exigir dry-run somente leitura, snapshot imutável por item, chave de
   idempotência, abortagem em conflito/falha de cardinalidade, restauração da
   fonte anterior e reconciliação pós-rollback.
7. **Ambiguidade:** conflito entre papel, perfil, grant direto e override deve
   produzir `PENDING_REVIEW`/parada, nunca escolha implícita.

## Contraexemplos relevantes

- Tenant membership ativa sem contexto interno não deve receber área interna.
- Membership de área ativa com tenant inválido ou incompatível não deve ser
  promovida silenciosamente.
- Perfil ativo com override `deny` não pode perder o deny na conversão.
- Grant de tela não publicada não deve ganhar rota publicada.
- Revogação durante sessão carregada não prova autorização atual.
- Conversão que removeria o último `platform_admin` deve parar antes da escrita.

## Referências reproduzíveis

As referências abaixo são locais e não representam validação remota.

| Evidência | Caminho e referência |
|---|---|
| Identidade e contexto | `docs/specs/AUTHORIZATION_MODEL_INVENTORY_V1.md:55-59`; `docs/AUTH_CONTEXT_STRATEGY.md:128-138`; `supabase/migrations/20260727033235_access_01_internal_control_plane.sql:7-38,294-300`. |
| Tenant e área | `docs/specs/AUTHORIZATION_MODEL_INVENTORY_V1.md:58,110,214`; `docs/OPERATIONAL_CONTROL_PLANE_V1.md:43,76-84`; `supabase/migrations/20260429210127_phase1_identity_tenancy.sql:517-529`. |
| Perfis, grants e telas | `docs/specs/AUTHORIZATION_MODEL_INVENTORY_V1.md:59,282-283`; `supabase/migrations/20260722221746_internal_profile_screen_access_contract_v1.sql:67-96,172-193`; `apps/web/src/features/admin/admin-api.ts:1709-1780`. |
| Membership e flags administrativas | `apps/web/src/features/admin/admin-api.ts:962-999`; `apps/web/src/features/admin/InternalAreasAdminPage.tsx:919-945,969-982`. |
| Override deny | `apps/web/src/features/admin/admin-api.ts:2114-2129`; `apps/web/src/features/access/InternalControlPlanePage.tsx:982-1020`; `docs/specs/AUTHORIZATION_ADMIN_ACCESS_SIMPLIFICATION_PLAN_V1.md:331-333`. |
| Release gate | `apps/web/src/app/release-surface.mjs:37-107`; `apps/web/src/features/auth/internal-route-access.ts:1-180`; `apps/web/src/features/auth/AdminGate.tsx:15-101`. |
| Último administrador | `docs/AUTH_CONTEXT_STRATEGY.md:92-95`; `supabase/migrations/20260429212721_phase1_1_hardening.sql:113-176`; `supabase/tests/002_phase1_1_hardening.sql:105-137`. |
| Auditoria | `supabase/tests/003_phase1_2_admin_control_plane.sql:359-414`; `apps/web/src/features/admin/admin-api.ts:1021-1044`. |
| Testes e contraexemplos | `docs/specs/AUTHORIZATION_MODEL_INVENTORY_V1.md:204-231`; `apps/web/src/features/auth/AdminGate.tsx:15-101`; `tests/scripts/auth-admin-denial-root-cause.test.mjs`. |

## Contrato mínimo de rollback para futura task

- **Dry-run:** plano determinístico somente leitura com chave do item, fonte,
  destino proposto, motivo e conflito, sem INSERT/UPDATE/DELETE.
- **Snapshot:** estado anterior completo das fontes afetadas, com task, base
  SHA, timestamp, tenant/área, usuário e hash sanitizado, em fonte imutável.
- **Idempotência:** chave composta por task, base SHA, usuário, tenant/área e
  versão do de-para; repetição da chave produz no-op.
- **Abortagem:** parar antes da primeira escrita em conflito, item sem fonte,
  falha de cardinalidade do último admin, divergência de escopo ou pré-condição.
- **Restauração:** usar o snapshot anterior, em ordem reversa da aplicação,
  restaurando primeiro contexto/membership e depois perfis/grants/overrides;
  cada item restaurado deve ser auditado.
- **Reconciliação:** comparar fontes, memberships, grants, overrides, último
  admin e amostra de acesso; divergência não classificada mantém rollback
  inconcluso.

Sem snapshot aprovado, dry-run validado e fonte de restauração disponível,
qualquer escrita futura permanece bloqueada e exige decisão do Owner.

## Lacunas e decisões pendentes

- Precedência formal entre role, perfil, grant direto e override.
- Validação conjunta de tenant, `permission_mode` e perfil em cada runtime.
- Representação única de READ/WRITE, inexistente como campo executável atual.
- Cadência de revalidação stale e estratégia de rollback.

## Validação e limites

- Inspecionados documentos canônicos, `AccessPage`, `InternalControlPlanePage`,
  `admin-api`, contratos, migrations, policies/grants citados e testes read-only.
- Nenhum teste de mutação, seed, migration, banco, integração ou chamada externa
  foi executado, conforme allowlist.
- O relatório classifica evidências locais; não comprova estado remoto nem
  autoriza futura normalização.
