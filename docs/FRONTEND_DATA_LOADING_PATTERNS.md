# FRONTEND_DATA_LOADING_PATTERNS.md

Padrão canônico para carregadores de dados no frontend do Genius Support OS.

Nasceu do tratamento dos avisos `react-hooks/rules-of-hooks`, que apontam
funções criadas com `useEffectEvent` sendo chamadas de handlers de UI. Este
documento existe para impedir a conversão cega desses casos, que pode gerar
refetch extra, dado velho na tela ou loop de render.

## Regra da biblioteca

`useEffectEvent` cria um Effect Event: função não reativa, sempre com o valor mais
recente do render. A regra oficial é que Effect Event só pode ser chamado de
dentro de um Effect ou de outro Effect Event. Chamar de `onClick`, `onSubmit` ou
qualquer handler é uso inválido, e é isso que o lint reporta.

## Classifique o carregador antes de mexer

Pergunte apenas isto: **o corpo da função lê algum valor reativo?**

Valor reativo é estado, prop, contexto instável ou derivado deles. Setter de
`useState`, `useRef` e função de módulo não contam.

### Caso 1 — não lê valor reativo

Converta para `useCallback` com dependências reais e liste a função nas
dependências do Effect. A referência fica estável, o handler pode chamar
livremente e o comportamento não muda.

```ts
// Antes: Effect Event chamado também em onClick de nova tentativa.
const loadArticle = useEffectEvent(async (spaceSlug: string, slug: string) => { /* ... */ });

// Depois: referência estável, chamável de qualquer lugar.
const loadArticle = useCallback(async (spaceSlug: string, slug: string) => { /* ... */ }, []);

useEffect(() => {
  void loadArticle(spaceSlug, articleSlug);
}, [articleSlug, loadArticle, spaceSlug]);
```

Aplicado na Central Pública (`loadSpaces`, `loadSpace`, `loadArticle`,
`loadSearch`) e em `features/access/AccessPage.tsx` (`loadSurface`, que só depende
de `markSessionExpired`, estável no provider de auth).

### Caso 2 — lê valor reativo e só é chamado de Effects

Mantenha `useEffectEvent`. É exatamente o cenário para o qual a API existe e não
há aviso de lint.

### Caso 3 — lê valor reativo e também precisa ser chamado de handler

Não converta para `useCallback`. As dependências reativas fazem a função mudar de
identidade, o que provoca refetch a cada mudança de filtro ou seleção, e pode
entrar em loop quando a própria função altera o estado que está nas dependências.

Use um token de recarga. O handler só sinaliza; o Effect continua sendo o único
lugar que chama o Effect Event.

```ts
const [reloadToken, setReloadToken] = useState(0);
const requestReload = () => setReloadToken((current) => current + 1);

const loadSurface = useEffectEvent(async () => { /* lê filtros e seleção atuais */ });

useEffect(() => {
  void loadSurface();
}, [reloadToken]);

// UI
<AppButton onClick={requestReload}>Tentar novamente</AppButton>
```

Para recarregar depois de uma escrita bem-sucedida, o handler de submit também
chama `requestReload()` em vez de chamar o carregador diretamente.

## Por que a maior parte da dívida está bloqueada

Uma tela interna só aparece para o usuário quando **três camadas** independentes
liberam, conforme `rpc_internal_actor_workspace_context` e
`app_private.has_internal_capability`:

1. **Release**: `public.internal_screen_catalog.release_enabled = true`.
2. **Grant de tela**: `internal_role_screen_grants` para a role global do usuário,
   ou `internal_area_membership_screen_grants` para a membership.
3. **Capability**: `internal_role_capability_grants` para a role, grant de perfil
   de acesso, ou override de usuário. A capability exigida é a de
   `internal_screen_capability_requirements` quando existe, senão o padrão
   derivado `screen.<screen_key>.view`.

Verificado no banco local em 2026-08-05: `platform_admin` **tem** grant de tela
para `tenants`, `system`, `customer_portal_admin` e as demais internas, mas as
telas seguem invisíveis porque falham na camada 1 e, mesmo publicadas, na
camada 3. Ou seja, ligar o flag de release não é suficiente.

Estado do catálogo local em 2026-08-05:

- `release_enabled = true`: `analytics`, `knowledge`, `access`, `settings`
- `release_enabled = false`: `admin_overview`, `tenants`, `system`,
  `internal_areas`, `product_docs`, `customer_portal_admin`, `cs_portfolio`,
  `customers_b2b`, `home`, `internal_actions`, `product`, `support_inbox`,
  `support_queue`, `support_tickets`

Existe ferramenta local para a camada 1:
`npm run supabase:qa:local-release-preview -- --screens=<lista>` liga
`release_enabled` somente no banco local, guarda o estado anterior em
`output/local-qa/release-preview-backup.json` e restaura com
`npm run supabase:qa:local-release-preview:disable`. Ela exige lista explícita de
telas: ligar o catálogo inteiro de uma vez mudou a superfície navegável e fez o
smoke autenticado falhar com 401 em `vw_admin_auth_context`.

A ferramenta não destrava a camada 3 de propósito. Conceder capability é o
controle mais sensível do control plane e não deve ser aberto para conveniência de
teste. Enquanto a decisão de publicar essas telas não existir, a dívida de hooks
nelas permanece congelada.

## Estado atual da dívida

Em 2026-08-05 restam 37 avisos de `rules-of-hooks`, todos do Caso 3, concentrados
em telas que hoje estão fora da superfície publicada do primeiro release:

| Arquivo | Avisos | Situação da superfície |
| --- | --- | --- |
| `features/support/SupportWorkspacePage.tsx` | 15 | `/support/*` responde `/access-denied` para as personas da fixture |
| `features/tenants/TenantsPage.tsx` | 15 | `/admin/tenants` responde `/access-denied` |
| `features/system/SystemPage.tsx` | 3 | `/admin/system` responde `/access-denied` |
| `features/admin/CustomerPortalAdminPage.tsx` | 2 | `/admin/customer-portal` responde `/access-denied` |
| `features/knowledge/KnowledgePage.tsx` | 2 | publicada; o token de recarga já cobre o bootstrap, faltam os dois pontos que recarregam depois de escrita |

Decisão registrada: esses casos ficam congelados até haver caminho de verificação
real. Refatorar fluxo de recarga sem QA de escrita na tela afetada troca dívida de
lint por risco de comportamento, o que é pior.

Em `KnowledgePage.tsx` o token de recarga já foi aplicado ao bootstrap das
centrais, que é verificável pelo smoke. Os dois avisos restantes estão em
`refreshSelectedSpace` e `refreshArticleDetail`, chamados por handlers de escrita
de artigo, categoria e revisão editorial. Eles só devem ser convertidos quando
existir QA de escrita para Conhecimento, porque é exatamente o caminho que muda.

## Como verificar antes de fechar o lote

- `npm run lint` para confirmar que o aviso saiu e nenhum novo `exhaustive-deps`
  entrou;
- `npm run web:typecheck` e `npm run web:build`;
- `npm run local:qa:smoke` quando a tela estiver coberta pelo harness;
- QA manual da tela quando ela for pública, como na Central de Ajuda.
