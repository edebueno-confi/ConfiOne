# Plano de cadastro, liberação e autorização de usuários V1

**Status:** PLANEJAMENTO REGISTRADO, sem implementação neste lote
**Data:** 2026-08-21
**Owner:** Ede
**Navigator:** planejamento e Control Plane
**Executor previsto:** Forge
**Reviewer previsto:** Sentinel

## Decisão e limite deste documento

O Product Owner determinou uma revisão profunda do cadastro, liberação e
autorização de usuários, com prioridade imediata para o caso em que um
administrador válido recebe `Acesso negado`. A decisão também orienta a
simplificação progressiva da experiência administrativa para o modelo:

```text
Usuário -> Nível -> Área -> Tela -> READ / WRITE
```

Este documento registra requisito, evidência, decomposição e critérios para o
Development Control Plane. Não autoriza, descreve ou substitui implementação de
frontend, backend, migration, RLS, RPC, release surface ou alteração remota.

## Avaliação executiva

### Estado encontrado

- O fluxo anterior `R-01 / R01-B` foi concluído na fila, mas tratou feedback de
  negação e propagação de contexto pós-login. Não provou a causa raiz de um
  administrador válido ser rejeitado pela autorização.
- O modelo atual combina papel global, contexto interno, áreas, funções,
  perfis, capabilities, overrides e allowlist de release. As fontes canônicas
  incluem `vw_admin_auth_context`, `vw_admin_access_*`,
  `user_actor_contexts`, `internal_organizational_areas`,
  `internal_area_memberships` e RPCs administrativas.
- `docs/AUTH_CONTEXT_STRATEGY.md` define `platform_admin`, `tenant_admin`,
  `tenant_manager` e outros papéis/contextos com regras distintas. Isso é
  comportamento/documentação vigente, não deve ser removido por suposição.
- O handoff corrente está ocupado por
  `SUPPORT-DOMAIN-AUDIT-2026-08-21`, em `READY_FOR_REVIEW`, com
  `Owner: Sentinel`. Por isso a primeira task desta frente fica pronta na fila,
  mas não substitui o handoff corrente neste lote.
- O código atual já trata `/inicio` como recepção autenticada: `AccessDeniedPage`
  navega sessões autenticadas para `/inicio`, `HomePage` exibe o aviso de rota
  negada e `getDefaultInternalLandingRoute` prioriza `/inicio` quando a
  recepção está publicada. Isso é evidência do comportamento local atual, não
  prova de cobertura ponta a ponta.

### Riscos e inconsistências

- Corrigir apenas o redirect esconderia a falha de autorização e não provaria
  vínculo, sessão, tenant, papel, capability, route guard, RLS ou backend.
- Confundir rota negada com usuário inativo pode retirar uma sessão válida por
  erro de URL ou de configuração. A negação de uma tela deve ser separada de
  `inactive-profile`, que é um estado de identidade/autorização diferente.
- Tratar `Administrador` como bypass frontend criaria risco de escalada,
  bypass por URL, acesso horizontal e divergência entre menu, router e banco.
- A simplificação pode quebrar usuários existentes se não houver inventário,
  de-para, proteção do último administrador e validação pós-migração.
- O catálogo de áreas/telas sugerido pelo Owner é direção de produto, não lista
  factual. A lista final deve sair da aplicação, rotas, catálogo e contratos
  reais.

### Abordagem aprovada para planejamento

1. Reproduzir e corrigir o acesso administrativo inválido, com causa raiz e
   teste de regressão, sem esperar a arquitetura futura.
2. Preservar a sessão em negações de rota e oferecer a recepção “Meu espaço”
   como fallback quando ela estiver autorizada; exibir estado explícito quando
   nenhum workspace estiver disponível.
3. Auditar o modelo atual e suas opções antes de decidir o que será consolidado,
   preservado, removido ou adiado.
4. Definir registry de domínio, tela, rota e capabilities a partir dos
   consumidores reais.
5. Especificar o modelo simplificado, a precedência, o de-para e as proteções
   antes de qualquer escrita estrutural.
6. Consolidar resolução, menu e guards em uma fonte de verdade backend-first.
7. Só então implementar painel, normalização e validação de segurança.

## Decomposição no Control Plane

### AUTH-ADMIN-DENIAL-ROOT-CAUSE-2026-08-21

- **Título:** Reproduzir e corrigir administrador válido recebendo Acesso negado
- **Prioridade:** P1 alto
- **Estado:** READY
- **Approval:** APPROVED para abertura pelo Forge após `handoffs/current/` voltar a `IDLE`
- **Dependências:** nenhuma de produto; gate operacional do handoff corrente
- **Objetivo:** rastrear e corrigir a causa raiz no fluxo cadastro -> convite/ativação
  -> autenticação -> sessão -> perfil -> tenant/organização -> role ->
  permissões -> route guard -> página -> backend -> dados.
- **Escopo:** reproduzir o cenário com usuário administrador válido; inspecionar
  role persistida e carregada, vínculo organizacional, sessão, cache, guards,
  redirects, resolução de permissões, views/RPCs, policies e rotas; corrigir a
  causa mínima; adicionar teste que autentique, confirme vínculo, acesse a rota
  esperada e não produza `Acesso negado` indevido. Confirmar que uma rota
  negada não altera `is_active`, não encerra a sessão e oferece `/inicio` como
  recepção quando autorizado.
- **Fora de escopo:** nova taxonomia de permissões, redesign do painel,
  migração em massa, bypass por e-mail ou frontend, remoção de RLS, alteração
  remota, deploy, secret ou release não autorizado.
- **Critérios de aceite:** causa raiz documentada com evidência de código/contrato;
  cenário reproduzido antes da correção ou limitação explicitada; correção
  validada no backend e na rota; regressão automatizada; deny by default,
  isolamento entre organizações e usuário desativado preservados; nenhuma
  alteração fora da allowlist do lote; rota negada e perfil inativo cobertos
  como estados distintos.

### AUTH-MODEL-INVENTORY-2026-08-21

- **Título:** Mapear fluxo e modelo atual de autorização
- **Prioridade:** P1
- **Estado:** READY
- **Approval:** APPROVED por `OD-007` em 2026-08-22
- **Dependências:** `AUTH-ADMIN-DENIAL-ROOT-CAUSE-2026-08-21`
- **Objetivo:** produzir inventário factual do cadastro, ativação, identidade,
  contexto, papéis, áreas, telas, capabilities, guards, views, RPCs, policies,
  menu e sessão.
- **Critérios de aceite:** matriz por entidade/contrato/consumidor/escopo;
  diferenciação entre interno e customer-facing; estados de ausência, revogação
  e cache; referências de código e migration; nenhuma recomendação apresentada
  como fato.

**Limite de abertura:** esta promoção autoriza somente inventário e descoberta
factual. Não autoriza simplificação estrutural, alteração de RLS/RPC/migration,
normalização de usuários, escrita remota ou execução das tasks seguintes.

### AUTH-MODEL-AUDIT-2026-08-21

- **Título:** Auditar complexidade, redundâncias e regras legadas
- **Prioridade:** P1
- **Estado:** BACKLOG
- **Approval:** PROPOSED
- **Dependências:** `AUTH-MODEL-INVENTORY-2026-08-21`
- **Objetivo:** classificar cada opção atual como necessária, redundante,
  legada, futura, ambígua ou potencialmente insegura, incluindo semântica real
  de administrador.
- **Critérios de aceite:** tabela de decisão com evidência, impacto, risco e
  destino; lista explícita do que não pode ser removido; contraexemplos e
  dependências ocultas; decisão pendente separada de recomendação técnica.

#### Resultado documental do lote corrente

O lote `AUTH-MODEL-AUDIT-2026-08-21` está em `READY_FOR_REVIEW`, com revisão
independente do Sentinel pendente. A classificação abaixo é uma auditoria do
estado executável local na base `da206123b77c7cfab6ee10ffe32fa3b7b8f7b498`;
não autoriza simplificação, remoção ou alteração de runtime.

| Fonte/opção | Consumidor observado | Classificação | Evidência e impacto | Destino proposto | Dependências |
| --- | --- | --- | --- | --- | --- |
| Sessão Supabase/AuthProvider | `AdminGate`, contexto e redirecionamento | NECESSÁRIA | Identidade e sessão precedem autorização; sem sessão o acesso é negado | Preservar | Contrato de sessão e estados de expiração |
| `profiles.is_active` | view/RPC de contexto e `require_active_actor` | NECESSÁRIA | Usuário inativo é rejeitado estruturalmente; não é substituível por guard visual | Preservar | Profile, RPCs e testes de inatividade |
| Papel global e `platform_admin` | contexto, `canOpenInternalRoute`, capabilities | NECESSÁRIA | Admin abre o Admin Console publicado mesmo sem screen grant materializado, mas não recebe bypass de release ou backend | Preservar com semântica explícita | Catálogo publicado, capabilities e RLS/RPC |
| `user_actor_contexts` | contexto interno, status e separação de ator | NECESSÁRIA | Active/suspended/revoked são estados distintos de profile e grant | Preservar | Workspace context e auditoria |
| `tenant_memberships` | escopo de tenant e helpers de autorização | NECESSÁRIA | É a fronteira de isolamento de dados; não pode ser inferida por rota ou papel global | Preservar | RLS, membership e validação cross-tenant |
| `internal_area_memberships` | workspace, área, role, tenant e `permission_mode` | NECESSÁRIA | Vincula ator à operação, mas o runtime observado não valida diretamente todos os estados de tenant/permission mode | Preservar e validar em lote próprio | RPC de workspace e contratos de área |
| `internal_access_profiles` | capabilities e grants de perfil | AMBÍGUA | Estrutura existe e é usada por capabilities, enquanto workspace resolve grants diretos de role/área | Não remover; definir precedência | Contrato de resolução e registry futuro |
| Screen catalog e screen grants | workspace, menu e rotas | NECESSÁRIA | Telas publicadas, role grants e area grants participam da superfície efetiva | Preservar | Release registry e route registry |
| Profile screen grants | modelo e migrations de acesso | AMBÍGUA | Grant existe no modelo, mas não foi observado como fonte direta do workspace atual | Não remover por inferência | Decisão sobre resolução efetiva |
| Capabilities e grants de papel/perfil | helpers SQL, comandos e backend | NECESSÁRIA | Backend usa capability efetiva e deny vigente pode prevalecer; frontend não substitui essa barreira | Preservar | `has_internal_capability`, RPC e RLS |
| Overrides allow/deny/expiry | efetividade e auditoria | NECESSÁRIA | Permite exceção temporal e deny explícito; removê-la altera segurança e operação | Preservar | Auditoria e precedência deny/allow |
| `ReleaseSurfaceGate` | publicação de rota antes da autorização | NECESSÁRIA | Rota não publicada é negada inclusive para `platform_admin` | Preservar | Manifesto de release |
| `AdminGate` e predicados de rota | defesa UX e acesso publicado | AMBÍGUA | Protegem navegação, mas não são boundary final; divergência entre famílias aumenta risco de manutenção | Consolidar somente após contrato aprovado | Backend, route registry e testes |
| `SupportGate`/`CsGate` | Support e Customer Success | AMBÍGUA | Há wrappers e contratos próprios; CS usa portfolio/backend e não é equivalente a `/admin` | Não remover; reconciliar | Contratos de domínio e cobertura tenant |
| Menu/landing/redirect | descoberta e safe landing | AMBÍGUA | Menu é interseção de publicação e grants, não autorização final; divergência pode produzir tela exibida e rota negada | Unificar referência em task posterior | Route/screen registry |
| READ/WRITE | capabilities e RPCs | NECESSÁRIA como semântica, AMBÍGUA como representação | Não existe campo único; `WRITE` não deve ser inventado no frontend | Definir contrato explícito sem remover fontes | Target access contract |
| Cache por `lastGateUserIdRef` | shell já carregado | POTENCIALMENTE_INSEGURA | Evita nova leitura para o mesmo usuário; revogação durante sessão não foi comprovada no browser | Testar revalidação antes de alterar | Estratégia de sessão stale |
| Last-admin guards | RPCs e triggers | NECESSÁRIA | Impede remover/suspender o último `platform_admin` e auto-suspensão | Preservar | CRUD administrativo e triggers |

Fatos não devem ser confundidos com hipóteses: nenhuma entrada foi classificada
como `REDUNDANTE` ou `LEGADA` apenas por sobreposição aparente. `FUTURA` aplica
somente a registry/contrato de consolidação ainda não implementado; sua criação
não transforma a fonte atual em descartável.

#### Semântica factual de administrador

Um `platform_admin` autenticado, com profile ativo e contexto válido, pode abrir
o Admin Console quando a superfície estiver publicada mesmo sem screen grant
materializado. Isso é uma regra de navegação do console, não bypass de
`ReleaseSurfaceGate`, RLS, capability, RPC ou escopo de tenant. Rotas não
publicadas continuam indisponíveis e operações backend continuam exigindo os
contratos de autorização. O modelo, portanto, diferencia identidade, papel
global, contexto, publicação e permissão efetiva.

Não pode ser removido sem task própria: sessão e profile ativo; deny by default;
release gate; actor/contexto e membership tenant/área; capabilities, RLS, RPCs
e grants explícitos; overrides e auditoria; proteção do último administrador;
estados de revogação; e a semântica de READ/WRITE, ainda que distribuída.

#### Contraexemplos e estado da evidência

| Cenário | Estado | Leitura factual |
| --- | --- | --- |
| Sem sessão ou sessão expirada | Reproduzido em contratos/gates | Login é exigido e a sessão é preservada ao negar rota |
| Profile ausente/inativo | Reproduzido em testes/contratos | Contexto inválido não vira autorização parcial |
| Usuário autenticado sem role/screen | Reproduzido | Deny by default |
| `platform_admin` sem screen grant | Reproduzido no teste de causa raiz | Console publicado abre; grants de backend permanecem exigidos |
| URL direta não publicada | Reproduzido no contrato de release | Release gate precede autorização |
| Revogação após sessão carregada | Não reproduzido ponta a ponta | RPC propaga status, mas browser stale depende de revalidação |
| Cross-tenant | Parcialmente coberto | Helpers e memberships existem; falta cenário ponta a ponta em dois tenants |
| `SupportGate` versus predicado de rota | Divergência documentada | Não tratar como fontes substituíveis sem contrato |
| `CsGate` versus `/cs` e backend | Divergência documentada | Portfolio/backend é requisito adicional ao guard de navegação |
| Menu versus guard/backend | Risco documentado | Menu é descoberta, não boundary final |

#### Recomendações técnicas e decisões do proprietário

Recomendações sem autorização de implementação: definir precedência única das
fontes; decidir participação de profile screen grants no workspace; validar
tenant/permission mode diretamente no contrato apropriado; estabelecer
revalidação para revogação e stale; criar registry derivado de área/tela/rota;
e cobrir matriz de conflitos com testes determinísticos.

Exigem decisão do proprietário: remover ou consolidar qualquer fonte existente;
definir se `/admin` e subrotas possuem a mesma semântica; escolher a fonte
canônica de grants de tela; estabelecer a política de sessão stale; e aprovar
qualquer mudança de RLS, RPC, migration, grants ou comportamento de admin.
Essas decisões não promovem `AUTH-SCREEN-REGISTRY` nem qualquer task seguinte.

### AUTH-SCREEN-REGISTRY-2026-08-21

- **Título:** Definir registry canônico de áreas, telas, rotas e capabilities
- **Prioridade:** P1
- **Estado:** BACKLOG
- **Approval:** PROPOSED
- **Dependências:** `AUTH-MODEL-AUDIT-2026-08-21`
- **Objetivo:** consolidar uma fonte declarativa derivada da aplicação real para
  `domain -> screen -> route -> capabilities`, sem espalhar nomes internos.
- **Critérios de aceite:** cada tela publicada tem área, rota, capacidade de
  leitura e escrita quando aplicável; menu e guard usam a mesma referência;
  telas sem contrato são classificadas como pendência, não inventadas; áreas
  sugeridas pelo Owner só entram após confirmação factual.

#### Auditoria documental do registry

O mapa abaixo é factual e derivado do código local na base
`56b8119`. Ele não é um registry executável e não autoriza alterar runtime.

| Domínio/superfície | Screen key e rota observados | Publicação | Menu | Guard | Backend/capability | Classificação |
| --- | --- | --- | --- | --- | --- | --- |
| Recepção | `home` → `/inicio` | `FIRST_RELEASE_ROUTES` | `buildReleaseNavigation` | `canOpenInternalRoute`/ReceptionGate | contexto autenticado e permissões de recepção | NECESSÁRIA |
| Analytics | `analytics` → `/admin/analytics` | primeiro release | seção Dashboard | `AdminGate` e predicado de rota | capability `analytics.view`; `dashboard_viewer` é papel global, não capability | NECESSÁRIA |
| Conhecimento | `knowledge` → `/admin/knowledge` | primeiro release | Configurações | `AdminGate` | capability de conhecimento e RPCs protegidos | NECESSÁRIA |
| Configurações | `settings` → `/admin/settings` e seções | primeiro release | `canOpenSettingsSection` | `AdminGate` | capacidades administrativas | NECESSÁRIA |
| Acessos | `access` → `/admin/access` | primeiro release | Configurações | `AdminGate` | `access.view` e comandos administrativos | NECESSÁRIA |
| Tenants | `tenants` → `/admin/tenants` | primeiro release | Configurações | `AdminGate` | `access.areas.manage` e RLS/RPC | NECESSÁRIA |
| Customer Success | `cs_portfolio` → `/cs` | não publicado em `first-release` | não equivale ao menu admin | `ReleaseSurfaceGate` + `CsGate` quando publicado | `can_access_cs_customer_portfolio` | FUTURA/LACUNA_A_CONFIRMAR |
| Support | famílias `/support/*` | não publicadas em `first-release` | navegação própria, sem publicação atual | `SupportGate` quando publicado | roles, screen keys e capabilities de suporte | FUTURA/LACUNA_A_CONFIRMAR |
| Engenharia | `product`/área engineering → `/engineering` | rota interna não publicada em `first-release` | navegação mínima | predicado de engenharia quando publicado | capabilities de produto/engenharia | FUTURA/LACUNA_A_CONFIRMAR |
| Portal customer | `portal` → `/portal` | superfície separada, fora do registry interno | fora do menu interno | gate de portal | contrato customer-facing | FORA_DO_REGISTRY_INTERNO |

Fatos e lacunas: o manifesto é a fonte de publicação, o menu é apenas
descoberta, os guards protegem a UX e o backend continua a fronteira final.
`platform_admin` pode alcançar as rotas publicadas do primeiro release, mas
rotas ocultas permanecem bloqueadas. Support, Engenharia e CS existem no
router/guards, mas não são publicados no manifesto `first-release`. Não foi
encontrado um contrato único que
faça Support, CS, menu e backend consumirem a mesma tabela. Isso é uma lacuna
documental/arquitetural, não motivo para inventar uma capability ou remover um
guard.

As áreas `logs`, `config` e outras rotas ocultas não foram promovidas ao
registry publicado. Sua ausência é `FUTURA` ou `LACUNA_A_CONFIRMAR`, conforme a
fonte, e não evidência de tela inexistente. O próximo passo técnico é definir
uma referência canônica e testes de integridade, mediante task aprovada.

### AUTH-TARGET-ACCESS-CONTRACT-2026-08-21

- **Título:** Especificar modelo simplificado de nível, área, tela e READ/WRITE
- **Prioridade:** P1
- **Estado:** BACKLOG
- **Approval:** PROPOSED
- **Dependências:** `AUTH-MODEL-AUDIT-2026-08-21`, `AUTH-SCREEN-REGISTRY-2026-08-21`
- **Objetivo:** transformar a direção de produto em contrato implementável,
  mantendo backend como fonte da verdade e preparando extensão futura sem
  implementar grupos ou perfis customizados agora.
- **Critérios de aceite:** níveis mínimos com semântica inequívoca; `WRITE`
  implica `READ`; deny by default; precedência de deny e escopo tenant/área;
  regras para último administrador e autoalteração; de-para do modelo atual;
  estados de sessão/cache após concessão ou remoção; auditoria e contratos de
  leitura/escrita definidos.

### AUTH-RESOLUTION-GUARDS-NAVIGATION-2026-08-21

- **Título:** Consolidar resolução de autorização, menu e route guards
- **Prioridade:** P1
- **Estado:** BACKLOG
- **Approval:** PROPOSED
- **Dependências:** `AUTH-ADMIN-DENIAL-ROOT-CAUSE-2026-08-21`,
  `AUTH-SCREEN-REGISTRY-2026-08-21`, `AUTH-TARGET-ACCESS-CONTRACT-2026-08-21`
- **Objetivo:** fazer menu, landing pós-login, router, página e backend
  consumirem a mesma autorização efetiva.
- **Critérios de aceite:** menu não mostra tela que o guard rejeitará; URL direta
  é protegida; rota negada preserva a sessão e oferece retorno ao `/inicio`
  quando a recepção estiver autorizada; ausência total de workspace exibe
  estado explícito sem loop; autenticação e autorização permanecem distintas;
  remoção de acesso não fica válida indefinidamente em cache; nenhuma rota
  negada inativa o usuário por efeito colateral.

### AUTH-ADMIN-CONSOLE-SIMPLIFICATION-2026-08-21

- **Título:** Simplificar painel administrativo de usuários e acessos
- **Prioridade:** P2
- **Estado:** BACKLOG
- **Approval:** PROPOSED
- **Dependências:** `AUTH-TARGET-ACCESS-CONTRACT-2026-08-21`,
  `AUTH-RESOLUTION-GUARDS-NAVIGATION-2026-08-21`
- **Objetivo:** permitir criar/editar usuário, definir nível, áreas, telas e
  READ/WRITE em linguagem do produto, sem expor claims, scopes, IDs, policy IDs
  ou guards.
- **Critérios de aceite:** salvar produz exatamente o acesso declarado; edição
  mostra estado efetivo e conflitos de forma compreensível; erros são
  rastreáveis; mutações passam por backend governado; proteção do último admin e
  da própria administração é explícita; nenhuma opção oculta complementa a UI.

### AUTH-LEGACY-MIGRATION-SAFEGUARDS-2026-08-21

- **Título:** Normalizar usuários e permissões existentes com de-para seguro
- **Prioridade:** P1
- **Estado:** BACKLOG
- **Approval:** PROPOSED
- **Dependências:** `AUTH-TARGET-ACCESS-CONTRACT-2026-08-21`,
  `AUTH-ADMIN-CONSOLE-SIMPLIFICATION-2026-08-21`
- **Objetivo:** aplicar o modelo aprovado sem perder acesso válido nem ampliar
  privilégios por conversão implícita.
- **Critérios de aceite:** cada permissão antiga é equivalente, consolidada,
  removida, preservada internamente ou incompatível; registros ambíguos param e
  exigem decisão; operação é idempotente e auditável; último administrador,
  usuários desativados, cross-tenant e rollback/contingência são testados; não
  há migration destrutiva sem autorização específica.

### AUTH-SECURITY-REGRESSION-2026-08-21

- **Título:** Validar autorização funcional, segurança e regressão ponta a ponta
- **Prioridade:** P1
- **Estado:** BACKLOG
- **Approval:** PROPOSED
- **Dependências:** todas as tasks anteriores
- **Objetivo:** fechar a frente com evidência de comportamento, segurança,
  isolamento, UX administrativa e consistência frontend/backend.
- **Critérios de aceite:** matriz de personas e telas permitidas/bloqueadas;
  bypass por URL negado; cross-tenant negado; escrita sem WRITE negada; role
  removida, sessão stale e usuário desativado revalidados; testes automatizados,
  typecheck, lint, build, pgTAP e QA browser aplicáveis registrados; limitações
  de ambiente separadas de resultados aprovados.

## Critérios gerais da frente

Ao final, um administrador deve conseguir localizar ou criar um usuário, definir
nível, áreas, telas e READ/WRITE, salvar e obter autorização previsível. O
usuário deve autenticar, ver somente as telas permitidas e escrever somente onde
possui `WRITE`. Uma rota negada deve manter o usuário autenticado e oferecer o
“Meu espaço” quando autorizado. Nenhuma solução pode depender de exceção
hardcoded, esconder menu, remover segurança ou tratar administrador fora da
fonte de verdade.

## Referências e limites

- `docs/AUTH_CONTEXT_STRATEGY.md`
- `docs/OPERATIONAL_CONTROL_PLANE_V1.md`
- `docs/reports/ACCESS_01_INTERNAL_CONTROL_PLANE_2026-07-27.md`
- `docs/reports/ACCESS_CONTROL_V2_2026-08-11.md`
- `docs/specs/ADMIN_CONFIGURATION_VISUAL_CONTRACT_V1.md`
- `handoffs/archive/R01-ACCESS-DENIAL-2026-08-20/`
- `handoffs/archive/R01-B-ACCESS-DENIAL-LOGIN-2026-08-20/`

O estado de produção do bug ainda não foi reproduzido neste lote. A existência
do relato do Owner é prioridade de investigação, não prova de causa ou de
correção. Nenhuma task futura autoriza escrita remota, deploy, secret, migration
remota ou release surface.
