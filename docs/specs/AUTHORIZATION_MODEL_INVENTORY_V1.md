# Inventário factual do modelo de autorização interna V1

- **Produto:** ConfiOne
- **Task:** `AUTH-MODEL-INVENTORY-2026-08-21`
- **Estado:** READY_FOR_REVIEW
- **Data da coleta:** 2026-08-22
- **Base observada:** `76a7b867783c9303d2aca845c5b99b60c268377a`
- **Escopo:** inventário documental e leitura de contratos; nenhum código,
  migration, policy, grant, secret ou serviço externo foi alterado por este
  lote.

## 1. Regra de evidência

Este documento separa fatos observados no código, contratos SQL, migrations e
testes de hipóteses e pendências. A documentação histórica não foi usada para
provar comportamento atual quando havia fonte executável local.

As referências de linha abaixo são evidência de coleta no estado informado.
Qualquer mudança posterior no worktree deve gerar nova coleta antes de tratar
este inventário como atual.

## 2. Resumo executivo factual

1. A autenticação é fornecida pelo Supabase Auth no navegador. O
   `AuthProvider` carrega a sessão inicial, acompanha `onAuthStateChange` e
   separa `booting`, `anonymous`, `authenticated` e `config-error`
   (`apps/web/src/features/auth/auth-context.tsx:21-48,103-147,228-265`).
2. A autenticação não é autorização. O gate administrativo consulta em
   paralelo `vw_admin_auth_context` e `rpc_internal_actor_workspace_context`,
   valida `profiles.is_active`, papéis globais e telas efetivas
   (`apps/web/src/features/auth/auth-api.ts:44-114`).
3. O modelo atual possui várias fontes de autorização: papel global, contexto
   interno, membership de área, perfil nomeado, grant de tela, grant de
   capability e override individual. Não há evidência suficiente para remover
   nenhuma delas neste lote.
4. `/inicio` é uma rota real de recepção autenticada e é usada como destino
   seguro quando a rota solicitada não é permitida. A negação não desloga o
   usuário por si só (`apps/web/src/features/auth/post-login-redirect.ts:38-55,118-212`;
   `apps/web/src/features/auth/AccessDeniedPage.tsx:26-44`).
5. O backend mantém a fonte de autorização dos dados. Views e RPCs são
   restringidos por `auth.uid()`, perfil ativo, capability e grants de
   execução; as tabelas internas não são o contrato de leitura direta para o
   cliente (`supabase/migrations/20260727033235_access_01_internal_control_plane.sql:290-352,431-460`).
6. O menu é uma projeção de release publicada intersectada com `screenKeys` e
   papel. A existência de um item no menu não substitui o guard de rota nem a
   autorização do backend (`apps/web/src/features/navigation/minimal-navigation.ts:73-85,203-260`).

## 3. Entidades e fontes canônicas

| Entidade ou conceito | Fonte executável | Consumidores | Escopo e regra observada |
| --- | --- | --- | --- |
| Identidade autenticada | `auth.users`, sessão Supabase | `AuthProvider`, `signInWithPassword`, `signOutAdminSession` | A sessão é o vínculo de identidade. O frontend não transforma sessão em autorização. `apps/web/src/features/auth/auth-context.tsx:228-265`; `apps/web/src/features/auth/auth-api.ts:17-41`. |
| Perfil interno | `public.profiles` | `vw_admin_auth_context`, `require_active_actor`, gates | `profiles.id` referencia `auth.users.id`; `is_active` é requisito operacional. `supabase/migrations/20260429210127_phase1_identity_tenancy.sql:26-38`; `supabase/migrations/20260429215122_phase1_2_admin_control_plane.sql:22-46`. |
| Papel global | `public.user_global_roles`, enum `platform_role` | `vw_admin_auth_context`, capabilities, grants de tela, guards | Papéis globais são por usuário e são compatibilidade e autorização sistêmica, não tenant membership. `supabase/migrations/20260429210127_phase1_identity_tenancy.sql:7-15,44-56`. |
| Contexto do ator | `public.user_actor_contexts` | `has_internal_capability`, read models, aceite de convite | Distingue `internal` de `customer` e possui `active`, `suspended`, `revoked`. `supabase/migrations/20260727033235_access_01_internal_control_plane.sql:7-38`. |
| Tenant e membership cliente | `public.tenants`, `public.tenant_memberships` | views/RLS de dados por tenant, portal e operações | O membership possui papel de tenant e status `invited`, `active`, `revoked`; é distinto da autorização interna. `supabase/migrations/20260429210127_phase1_identity_tenancy.sql:17-24,58-94`. |
| Área organizacional | `internal_organizational_areas` | control plane administrativo, funções, memberships | Catálogo organizacional com `is_active`; separado do catálogo legado de áreas de acionamento. `supabase/migrations/20260727040334_access_01_1_admin_operational_crud.sql:5-42,360`. |
| Membership interno | `internal_area_memberships` | contexto de workspace, read model de usuários, assignment RPC | A estrutura vincula usuário, `tenant_id`, área, função, status, perfil e modo `custom/profile`; o status válido inclui `active`, `inactive`, `archived`. No runtime vigente do workspace, a função efetiva consulta `user_id` e `status = active`, mas não valida `tenant_memberships.status`, `tenants.status` ou `permission_mode` diretamente. `supabase/migrations/20260722221746_internal_profile_screen_access_contract_v1.sql:98-111`; `supabase/migrations/20260727173000_access_01_3_workspace_context_runtime_hardening.sql:39-82`. |
| Perfil de acesso | `internal_access_profiles` | grants de capabilities/telas, detalhe de usuário | Perfil nomeado pode ser sistêmico ou por área e possui `is_active`; não substitui a identidade. `supabase/migrations/20260722221746_internal_profile_screen_access_contract_v1.sql:67-96,172-193`. |
| Tela e rota | `internal_screen_catalog` | RPC de workspace, menu, guards e release | A tela possui chave, label, rota, categoria, ordem, `is_active` e, após ACCESS-01, `release_enabled/release_stage`. `supabase/migrations/20260722221746_internal_profile_screen_access_contract_v1.sql:21-39`; `supabase/migrations/20260727033235_access_01_internal_control_plane.sql:114-124,160-174`. |
| Grant de tela | `internal_role_screen_grants`, `internal_area_membership_screen_grants`, `internal_access_profile_screen_grants` | função/RPC de workspace, frontend `screenKeys` | O RPC vigente de workspace seleciona diretamente grants de papel global e de membership de área. Grants de perfil existem no modelo e podem participar da resolução de capabilities, mas não são selecionados diretamente pela função de workspace vigente; essa diferença é uma lacuna para a auditoria. O read model retorna `permission_source` e, no ramo de membership, `tenant_id`/área. `supabase/migrations/20260727173000_access_01_3_workspace_context_runtime_hardening.sql:24-82`; `supabase/migrations/20260727033235_access_01_internal_control_plane.sql:336-352`; `apps/web/src/contracts/admin-contracts.ts:331-342`. |
| Capability | `internal_capabilities` e grants por papel/perfil | `has_internal_capability`, RPCs administrativos, read models | Capability é granular por domínio, com efeito efetivo derivado de grants e overrides. Seeds incluem analytics, knowledge, access, settings e telas. `supabase/migrations/20260727033235_access_01_internal_control_plane.sql:54-79,126-157,176-231`. |
| Override individual | `internal_user_capability_overrides` | `has_internal_capability`, detalhe efetivo e RPC administrativo | Possui `allow/deny`, justificativa, validade e autor. Negação vigente impede a capability mesmo quando existe allow. `supabase/migrations/20260727033235_access_01_internal_control_plane.sql:81-92,290-317`; `supabase/migrations/20260811130000_access_control_v2_lifecycle_effective_permissions.sql:206-246,316-355`. |
| Release surface | `apps/web/src/app/release-surface.mjs` | `ReleaseSurfaceGate`, `canOpenInternalRoute`, menu | Publicação é uma camada anterior à permissão de rota. Rota não publicada é negada inclusive para `platform_admin`, salvo redirect técnico explicitamente configurado. `apps/web/src/features/auth/ReleaseSurfaceGate.tsx:8-38`; `apps/web/src/features/auth/internal-route-access.ts:30-44`. |

## 4. Fluxo real de autenticação até autorização

### 4.1 Login e sessão

`AuthProvider` lê a configuração de runtime, obtém a sessão existente e se
inscreve em mudanças do Supabase Auth. Quando havia sessão e ela desaparece
sem logout manual, marca `sessionExpired`; isso é um estado de sessão, não uma
revogação de autorização (`apps/web/src/features/auth/auth-context.tsx:103-147`).

O login usa `signInWithPassword`. O logout chama `client.auth.signOut()`;
nenhuma dessas funções altera `profiles.is_active`, roles, memberships ou
grants (`apps/web/src/features/auth/auth-api.ts:17-41`).

### 4.2 Contexto administrativo

`fetchAdminActorContext` executa:

- leitura de `vw_admin_auth_context`;
- RPC `rpc_internal_actor_workspace_context`;
- negação por profile ausente;
- negação por profile inativo;
- cálculo de `is_platform_admin` e `is_dashboard_viewer`;
- normalização ordenada e deduplicada de `screen_keys`;
- negação quando não há papel relevante nem tela autorizada.

Evidência: `apps/web/src/features/auth/auth-api.ts:44-114`.

`vw_admin_auth_context` é um read model self-bound: retorna somente o profile
de `auth.uid()` e seus papéis globais, com `security_barrier`; o status
`is_active` é deliberadamente exposto para o gate do frontend
(`supabase/migrations/20260430144642_phase3_1_admin_auth_context.sql:1-24`).

### 4.3 Workspace autorizado

O runtime efetivo de workspace é a função privada
`app_private.internal_actor_workspace_context()`, exposta ao cliente autenticado
por `rpc_internal_actor_workspace_context()` e pela view correspondente. Ele
combina duas origens diretamente observadas:

1. grant de tela derivado de papel global;
2. grant de tela derivado de membership interno.

No ramo de papel global, a função exige profile ativo, papel global, grant de
tela, tela ativa/publicada e capability interna efetiva. No ramo de membership,
exige usuário correspondente, `internal_area_memberships.status = active`,
grant de tela da membership, tela ativa/publicada e capability interna efetiva.
O ramo de membership devolve o `tenant_id` armazenado na membership, mas a
função vigente não faz join com `tenant_memberships` ou `tenants.status` e não
aplica diretamente `permission_mode = profile`
(`supabase/migrations/20260727173000_access_01_3_workspace_context_runtime_hardening.sql:10-124`).

O contrato de `20260722221746_internal_profile_screen_access_contract_v1.sql`
continua sendo evidência estrutural histórica do modelo de perfis, grants e
campos de membership, mas não deve ser tratado como a implementação efetiva
do read model atual. A função `has_internal_capability` ainda possui uma
ramificação para grants de capability por `permission_mode = profile`, o que
não equivale a selecionar grants de tela de perfil no RPC de workspace
(`supabase/migrations/20260727033235_access_01_internal_control_plane.sql:290-317`).
Essa diferença entre modelo estrutural, capability e workspace é uma lacuna
explícita para a auditoria seguinte.

O contrato TypeScript preserva a origem como `global_role` ou
`area_membership`, além de tenant, área, papel, rota, categoria e ordem
(`apps/web/src/contracts/admin-contracts.ts:331-342`).

### 4.4 Rota e fallback

`AdminGate` aplica, nesta ordem observada:

1. erro de configuração;
2. sessão expirada;
3. boot/loading;
4. usuário anônimo para login com `redirectTo`;
5. indisponibilidade ou erro do contrato;
6. gate negado para `/access-denied`;
7. teste de `canOpenInternalRoute` para a rota atual;
8. renderização do conteúdo.

Evidência: `apps/web/src/features/auth/AdminGate.tsx:20-139`.

`ReleaseSurfaceGate` antecede os gates das famílias de rota e manda rota não
publicada para `/access-denied`, enquanto redirects técnicos vão para uma
superfície publicada (`apps/web/src/features/auth/ReleaseSurfaceGate.tsx:8-38`).

## 5. Matriz de autorização por superfície

| Superfície | Frontend | Evidência de permissão | Observação |
| --- | --- | --- | --- |
| Meu espaço `/inicio` | `ReceptionGate` + `MinimalAppShell` | Sessão autenticada; menu é filtrado pelo actor quando disponível | É a recepção segura. `router.tsx:574-580`; `ReceptionGate.tsx:19-83`. |
| Admin Console `/admin/*` | `ReleaseSurfaceGate` + `AdminGate` | `platform_admin` ou `screenKeys` compatíveis com a rota | `platform_admin` pode abrir Admin Console publicado mesmo sem grant de tela materializado. `internal-route-access.ts:65-103`. |
| Dashboard | `AdminGate` + `AnalyticsShell` | `analytics` ou `dashboard_viewer`, além da publicação | O backend ainda valida RPCs e read models; o frontend recebe actor context. `minimal-navigation.ts:84-125`; `084_access_01_internal_control_plane.sql:13-22`. |
| Configurações e Acessos | `AdminGate`, menu e submenus | `settings`/`access` ou `platform_admin` | Submenus usam `canOpenSettingsSection`; a release surface também participa. `minimal-navigation.ts:165-201`; `router.tsx:472-505`. |
| Suporte | `SupportGate` | `platform_admin`, roles de suporte ou screen keys de suporte | `dashboard_viewer` é explicitamente bloqueado. `SupportGate.tsx:87-119`. |
| Customer Success | `ReleaseSurfaceGate` + `CsGate` | fase de autenticação; bloqueio explícito de `dashboard_viewer`; carteira carregada por `useCsCustomerPortfolio`; ausência de carteira nega não-admin | O fluxo do router não usa `canOpenInternalRoute()` como wrapper. A proteção de dados da carteira deve ser distinguida do gate de rota: o backend usa `can_access_cs_customer_portfolio()` e membership ativa de `customer_success`. `router.tsx:510-527`; `CsGate.tsx:147-205`; `supabase/migrations/20260604193000_cs_portfolio_contract_foundation.sql:1-32`. |
| Portal cliente `/portal` | `CustomerPortalGate` e views de portal | contexto de portal cliente e tenant | É customer-facing, não deve ser confundido com actor interno. `post-login-redirect.ts:58-70`; `router.tsx:384-418`. |
| Engenharia e Acionamentos | `ReleaseSurfaceGate` + `SupportGate` | `platform_admin`, roles `support_manager`/`support_agent` ou screen keys de suporte | O router não executa gates próprios de Engenharia ou Acionamentos. `canOpenInternalRoute()` possui regras separadas para essas rotas, mas elas não são o wrapper efetivo desses ramos. A divergência é lacuna para auditoria e não prova de autorização por `engineering_*`, `product` ou `internal_actions`. `router.tsx:590-646`; `SupportGate.tsx:102-120`; `internal-route-access.ts:129-142`. |
| Central Pública de Ajuda | rota pública | publicação de conteúdo, não sessão interna | Fica fora da autorização do shell interno. `router.tsx:354-378`. |

## 6. Menu, router e backend

### Menu

`buildMinimalNavigation` deriva os itens de `isPlatformAdmin`, roles,
`screenKeys` e publicação do release. No caminho de primeira release, a função
`allows` exige publicação e, para não-admin, o `screenKey`; a navegação inclui
`Meu espaço` como entrada operacional (`apps/web/src/features/navigation/minimal-navigation.ts:73-125`).

O shell recebe esses valores de `gate.actor` no Admin Console, ReceptionGate,
AccountSelfShell e SupportWorkspaceShell. Exemplos:
`apps/web/src/features/admin-shell/AdminConsoleShell.tsx:1-18` e
`apps/web/src/features/home/ReceptionGate.tsx:74-85`.

### Router

O router registra as superfícies públicas, `/access-denied`, `/portal`,
`/admin`, `/cs`, `/support`, `/inicio`, `/engineering`, `/meu-perfil` e
`/internal-actions`. A família `/admin` é envolvida pelo
`ReleaseSurfaceGate` e `AdminGate`; `/cs` usa `ReleaseSurfaceGate` e `CsGate`;
`/support`, `/engineering` e `/internal-actions` usam `ReleaseSurfaceGate` e
`SupportGate`. As regras de `canOpenInternalRoute()` para Customer Success,
Engenharia e Acionamentos não são demonstradas como wrappers efetivos nesses
ramos do router e devem ser tratadas como divergência a auditar
(`apps/web/src/app/router.tsx:510-646`; `apps/web/src/features/auth/internal-route-access.ts:117-142`).

### Backend

O backend oferece read models self-bound e RPCs actor-bound. As tabelas e views
internas sofrem `revoke` amplo; somente views e funções específicas recebem
grant para `authenticated` e `service_role`. Os comandos administrativos usam
`security definer`, `require_active_actor` e `require_internal_capability`
(`supabase/migrations/20260727033235_access_01_internal_control_plane.sql:431-460`;
`supabase/migrations/20260727040334_access_01_1_admin_operational_crud.sql:337-358`).

Alterações de usuário, convites, áreas, funções, perfis, capabilities e
overrides passam por RPCs administrativos. O contrato de teste comprova que o
cliente autenticado não possui DML direto em áreas e que views internas não
expõem token bruto (`supabase/tests/085_access_01_1_admin_operational_crud.sql:1-19`).

## 7. Estados de acesso e sessão

| Estado observado | Fonte | Resultado atual | Classificação |
| --- | --- | --- | --- |
| Sem sessão | `AuthProvider.phase = anonymous` | Gate envia para login preservando a rota solicitada em `redirectTo` | Fato coberto por `AdminGate.tsx:71-74`. |
| Sessão em boot | `phase = booting` | Estado de loading | Fato coberto por `AuthProvider` e gates. |
| Profile inexistente | `vw_admin_auth_context` sem linha | `fetchAdminActorContext` retorna `missing-profile`; o redirect pós-login trata a recepção como fallback | Fato com dois consumidores distintos; precisa de decisão no `AUTH-MODEL-AUDIT` se a semântica deve ser uniformizada. |
| Profile inativo | `profiles.is_active = false` | Gate retorna `inactive-profile`; resolução pós-login retorna sem destino; a tela de negação existe | Fato coberto por `auth-api.ts:67-77` e `post-login-redirect.ts:164-175`. |
| Sessão autenticada sem papel/tela | roles vazios e workspace vazio | Admin Console nega; sessão não é encerrada; `/inicio` é o destino seguro | Fato coberto por `auth-api.ts:98-104`, `AccessDeniedPage.tsx:34-44` e testes de deny by default. |
| Admin válido sem screen grant materializado | role `platform_admin` | Pode abrir superfície administrativa publicada | Fato coberto pelo teste `tests/scripts/auth-admin-denial-root-cause.test.mjs`. |
| Membership interno inativo/arquivado | `internal_area_memberships.status` | A função vigente de workspace não produz linhas desse ramo quando o status não é `active`; não há, nesse caminho, validação direta do status do tenant | Fato coberto por `20260727173000_access_01_3_workspace_context_runtime_hardening.sql:62-82`; a divergência com o contrato estrutural de perfil é lacuna para auditoria. |
| Contexto interno suspenso/revogado | `user_actor_contexts.status` | Falha no requisito de capability interna | Fato coberto por `has_internal_capability` em `20260727033235...:294-300`. |
| Logout explícito | `client.auth.signOut()` | Sessão termina e o usuário volta ao fluxo anônimo | Fato coberto por `auth-api.ts:34-41`. |
| Perda de sessão não manual | mudança Auth sem sessão | `sessionExpired = true`, com tentar novamente ou voltar ao login | Fato coberto por `auth-context.tsx:126-147` e `AdminGate.tsx:34-60`. |
| Rota não publicada | manifest de release | `/access-denied`, inclusive para `platform_admin`, salvo redirect técnico | Fato coberto por `ReleaseSurfaceGate.tsx:20-35`. |

## 8. Cache, revogação e estados stale

### Fatos observados

- O gate guarda `lastGateUserIdRef` e não repete a consulta para o mesmo usuário
  quando `force` não é solicitado (`apps/web/src/features/auth/auth-context.tsx:154-163`).
- A consulta pode ser forçada por `refreshGate`, exposto aos gates e estados de
  erro (`apps/web/src/features/auth/auth-context.tsx:290-297`).
- Alteração de status administrativo atualiza profile, contexto interno e
  memberships por RPC e impede suspender o próprio administrador ou o último
  `platform_admin` (`supabase/migrations/20260727040334_access_01_1_admin_operational_crud.sql:247-259`).
- A guarda do último administrador também existe em trigger de profile e em
  trigger de papel global (`supabase/migrations/20260727135003_access_01_2_invites_saga_and_navigation.sql:14-71`).
- Os testes cobrem contexto vinculado ao actor, profile inativo, grants de
  privilégio, ausência de DML direto e isolamento de views, mas não constituem
  prova de revogação em uma sessão de navegador já carregada
  (`supabase/tests/008_phase3_1_admin_auth_context.sql:142-217`;
  `supabase/tests/087_access_01_3_context_contract.sql:1-63`).

### Lacuna factual para a próxima auditoria

Uma alteração de permissão feita depois do carregamento do actor não dispara,
por si só, uma nova leitura de `fetchAdminActorContext`; o caminho observado de
atualização é `refreshGate` manual ou mudança de identidade. Isso não prova um
bypass de backend, mas cria uma janela potencial de estado stale no shell e
deve ser testado no `AUTH-MODEL-AUDIT` e na regressão de segurança.

## 9. Classificação de riscos exigida pela task

| Risco | Evidência atual | Classificação |
| --- | --- | --- |
| Cross-tenant | Views de dados usam helpers de membership e os grants de workspace preservam `tenant_id`; `vw_admin_auth_context` é self-bound | Parcialmente coberto. O inventário não substitui teste ponta a ponta de usuário interno com memberships em dois tenants. |
| Bypass por URL | Router, `ReleaseSurfaceGate`, `AdminGate`, `SupportGate` e `CsGate` avaliam rotas e contexto; backend usa views/RPCs protegidos | Parcialmente coberto. O frontend não pode ser tratado como boundary final; faltam cenários uniformes para todas as famílias. |
| Revogação | RPC de status altera profile, contexto e memberships; guards reconhecem `denied` e `sessionExpired` | Cobertura documental existente, mas revogação durante sessão carregada permanece lacuna de teste. |
| Usuário desativado | `is_active` é exposto no auth context, exigido por `require_active_actor` e usado nos gates | Coberto para leitura estrutural; falta prova de comportamento browser após desativação remota/local. |
| Cache stale | `lastGateUserIdRef` evita reload automático no mesmo usuário | Lacuna confirmada para auditoria, sem conclusão de bypass. |
| Deny/allow conflitantes | `effective_effect` é `deny` quando há deny vigente, e o detalhe expõe `has_conflict`, sources e scope | Coberto no contrato SQL/read model; falta matriz de cenários executada para cada origem. |
| Release versus permissão | Release gate roda antes da permissão e restringe até `platform_admin` | Coberto no contrato Node de release, sujeito à reconciliação com rotas reais. |

## 10. Hipóteses e decisões pendentes

Estas notas não são conclusões de implementação:

- **H1, divergência de estado no frontend:** o shell pode continuar com actor
  carregado até `refreshGate` quando a permissão muda. Confirmar o comportamento
  desejado e a cadência de revalidação.
- **H2, múltiplas fontes de verdade:** papel global, screen grant, capability,
  perfil e override coexistem. O `AUTH-MODEL-AUDIT` deve classificar o que é
  compatibilidade, o que é fonte vigente e o que é legado, sem remover nada por
  inferência.
- **H3, semântica de contexto:** a existência de `user_actor_contexts` e a
  existência de um grant de tela são fatos diferentes. Definir se a ausência de
  contexto interno deve sempre ser visível como estado de recepção ou como
  bloqueio operacional, preservando o safe landing.
- **D1, autorização de simplificação:** pendente. Nenhuma simplificação
  estrutural, alteração de RLS/RPC/migration ou mudança de catálogo foi feita.

## 11. Cobertura da task

- Cadastro/ativação/autenticação/sessão: coberto.
- Contexto interno e customer-facing: coberto.
- Router, guards, menu e release: coberto.
- Papéis, áreas, telas, capabilities, READ/WRITE e overrides: coberto no nível
  estrutural; o modelo atual não possui um campo único chamado READ/WRITE, e o
  comportamento efetivo é distribuído entre capabilities e comandos RPC.
- Backend, views, RPCs, policies, grants e migrations: coberto nos contratos
  canônicos citados.
- Ausência, revogação, usuário inativo e sessão stale: classificados; stale
  durante sessão permanece lacuna.
- Matriz entidade, fonte, consumidor, escopo, evidência e lacuna: seção 3.
- Recomendações de simplificação: não concluídas neste lote; foram separadas
  como hipóteses e pendências.

## 12. Encerramento documental da auditoria

O inventário foi reconciliado com a auditoria `AUTH-MODEL-AUDIT-2026-08-21`,
registrada no plano canônico de simplificação. A auditoria está em
`READY_FOR_REVIEW` para o Sentinel; não há simplificação aprovada, remoção de
fonte ou alteração executável neste lote. A referência histórica abaixo não
deve ser interpretada como autorização de promoção automática.

## 13. Próximo passo autorizado

Entregar a auditoria documental ao Sentinel para revisão independente. Qualquer
task posterior só pode ser promovida depois do veredito, da integração local de
um lote aprovado e do retorno de `handoffs/current/` a `IDLE`, conforme `OD-008`.
