# Criação direta de usuário interno e correção da navegação de `/admin/access` — 2026-08-06

## 1. Causa raiz do defeito visual

`InternalControlPlanePage` usava um único container como casco **e** como área de
rolagem: `flex h-full min-h-0 flex-col gap-4 overflow-y-auto`. Todos os filhos —
trilha, cabeçalho, indicadores, faixa de abas e conteúdo — eram itens flexíveis
com `flex-shrink: 1`.

A faixa de abas trazia `overflow-x-auto`. Pelo CSS Overflow, quando um eixo deixa
de ser `visible` o outro também deixa; a faixa virou container de rolagem nos dois
eixos e o seu `min-height: auto` passou a resolver para **0**. Com altura definida
no pai, o algoritmo flex ficou livre para esmagá-la em vez de gerar rolagem.

Medição antes da correção (`nav[aria-label="Seções de acessos"]`):

| viewport | aba | altura visível | altura de conteúdo |
| --- | --- | --- | --- |
| 1920×1080 | Usuários / Convites | 48 px | 48 px |
| 1366×625 | Usuários | 32 px | 36 px |
| 1366×625 | **Convites** | **8 px** | 36 px |
| 390×844 | Usuários | 13 px | 36 px |
| 390×844 | **Convites** | **8 px** | 36 px |

Em 1366×625 e em mobile, ao abrir Convites restava um fio de 8 px no lugar dos
rótulos: a navegação sumia e só a URL trazia o usuário de volta.

## 2. Correção estrutural

Novo contrato no sistema visual (`settings-ui.css`): `.gso-ui-shell` (casco que
não rola) + `.gso-ui-shell-chrome` (`flex: 0 0 auto`, fora da rolagem) +
`.gso-ui-shell-body` (única região com `overflow-y: auto`). `.gso-ui-tabs` ganhou
`min-height` e `flex: 0 0 auto`.

Depois da correção, em todas as abas, temas e viewports medidos:
altura visível = altura de conteúdo (40 px em desktop, 84 px em mobile com as abas
quebrando em duas linhas) e `scrollWidth - innerWidth = 0`.

## 3. Mudanças por camada

**Frontend**
- `apps/web/src/features/access/InternalControlPlanePage.tsx`: reescrita sobre as
  primitivas aprovadas (`UiPage*`, `UiCard*`, `UiMetric*`, `UiToolbar`, `UiTable`,
  `UiField`, `UiBadge`, `UiButton`, `UiEmptyState`, `UiDetailList`, `UiHintBand`).
  Ação primária passou a ser **Criar usuário**. A aba de convites virou histórico
  somente leitura. O formulário de "Preparar convite" saiu da tela.
- `apps/web/src/features/settings/settings-ui.css`: casco com navegação fixa.
- `apps/web/src/features/admin/admin-api.ts`: `createAdminInternalUser` e
  `sendAdminInternalUserPasswordSetup`; `createAdminInternalInvitation` removida.

**Backend**
- `supabase/functions/internal-access-user-create/index.ts` (nova).

**Banco** — nenhuma migration. O provisionamento reutiliza
`rpc_admin_update_internal_access_assignment`, e a auditoria já existe por gatilho
`audit.capture_row_change` em `profiles`, `tenant_memberships`,
`user_actor_contexts` e `internal_area_memberships`.

## 4. Como a criação direta provisiona o acesso

1. `requireActor` valida o JWT do administrador.
2. Pré-autorização sob o JWT do ator via `rpc_admin_list_internal_areas`
   (exige `access.view`) e validação da área pedida.
3. `profiles` (espelho de `auth.users`) resolve idempotência por e-mail.
4. Se a identidade não existe, `auth.admin.createUser` cria a conta com
   `email_confirm: true` e **sem senha informada**.
5. `rpc_admin_update_internal_access_assignment`, chamada com o JWT do
   administrador, materializa contexto interno, tenant, membership de tenant e
   vínculo de área/função/perfil. É aí que `access.users.manage` é exigida.
6. Falha depois da criação dispara compensação: a conta recém-criada é removida
   somente se ficou sem contexto e sem vínculo.
7. Credencial: a conta nasce sem senha utilizável e a definição usa o fluxo
   oficial de recuperação do Auth, disparado só no servidor
   (`action: 'password-setup'`).

## 5. Decisão registrada — convite aposentado

O convite deixou de ser caminho de liberação de acesso. A aba permanece como
**Convites (histórico)**, somente leitura, com a única ação de revogar convites
ainda abertos. Nenhum dado de `internal_invites` foi apagado, nenhuma tabela foi
migrada e a Edge Function `internal-access-invite` continua publicada para o
aceite de convites históricos que ainda cheguem por link.

## 6. Correções secundárias encontradas na revisão

- A lista de usuários exigia `user.areas.some(...)` mesmo sem filtro, então quem
  ainda não tinha área sumia da tela apesar de constar no read model. Agora o
  filtro de estrutura só é aplicado quando algum filtro está selecionado.
- `vw_admin_access_internal_users.last_access_at` é
  `coalesce(max(user_actor_contexts.updated_at), profiles.updated_at)` — não é
  último login. O rótulo virou **Contexto atualizado**, o texto inventado
  "Nunca acessou" virou "Indisponível" e o indicador "Sem primeiro acesso" foi
  substituído por "Sem área atribuída", que é dado real do read model.

## 7. Riscos, limitações e rollback

- `resetPasswordForEmail` depende de SMTP. Em produção continua valendo a
  limitação do relatório `2026-08-06_invite-smtp-delivery-diagnosis.md`.
- A prova de `access.users.manage` acontece no comando de atribuição, não antes da
  criação da conta. A janela é coberta pela compensação; quem não tem
  `access.view` é barrado antes de qualquer escrita.
- Rollback: reverter os quatro arquivos de aplicação e remover o diretório da nova
  Edge Function. Não há migration, grant, policy ou dado a desfazer.
