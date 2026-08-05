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

## Estado atual da dívida

Em 2026-08-05 restam 38 avisos de `rules-of-hooks`, todos do Caso 3, concentrados
em telas que hoje estão fora da superfície publicada do primeiro release:

| Arquivo | Avisos | Situação da superfície |
| --- | --- | --- |
| `features/support/SupportWorkspacePage.tsx` | 15 | `/support/*` responde `/access-denied` para as personas da fixture |
| `features/tenants/TenantsPage.tsx` | 15 | `/admin/tenants` responde `/access-denied` |
| `features/system/SystemPage.tsx` | 3 | `/admin/system` responde `/access-denied` |
| `features/admin/CustomerPortalAdminPage.tsx` | 2 | `/admin/customer-portal` responde `/access-denied` |
| `features/knowledge/KnowledgePage.tsx` | 3 | publicada, mas os carregadores dependem de filtros e seleção |

Decisão registrada: esses casos ficam congelados até haver caminho de verificação
real. Refatorar fluxo de recarga sem QA de escrita na tela afetada troca dívida de
lint por risco de comportamento, o que é pior. `KnowledgePage.tsx` é o único
publicado da lista e deve ser o primeiro a receber o token de recarga, com QA
autenticado da tela antes e depois.

## Como verificar antes de fechar o lote

- `npm run lint` para confirmar que o aviso saiu e nenhum novo `exhaustive-deps`
  entrou;
- `npm run web:typecheck` e `npm run web:build`;
- `npm run local:qa:smoke` quando a tela estiver coberta pelo harness;
- QA manual da tela quando ela for pública, como na Central de Ajuda.
