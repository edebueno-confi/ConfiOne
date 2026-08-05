# Regra de superfície do tema: público sempre claro

Data: 2026-08-05
Checkout canônico: `C:\Projetos\GSO-old`
Branch: `codex/react-router-v8-migration-20260804`

## Regra implementada

Tema escuro é recurso do ambiente autenticado. Central Pública, login e telas
anônimas são sempre claras, inclusive quando um usuário autenticado navega até
elas, porque quem lê a Central é cliente final e essa superfície não deve
acompanhar a preferência do operador interno.

## Defeito que existia

O script anti-flash de `apps/web/index.html` aplicava a preferência salva, ou o
`prefers-color-scheme`, em qualquer rota antes da hidratação. Resultado: a Central
Pública abria escura para quem tinha preferência escura. Verificado nesta sessão:
`/help/genius/articles` renderizava em tema escuro.

Havia também um caminho secundário: `setPreference` em `theme-context.tsx`
aplicava o tema resolvido ignorando o parâmetro `enabled`, então mudar a
preferência fora do ambiente autenticado escurecia a tela.

## Mudanças

| Arquivo | Mudança |
| --- | --- |
| `apps/web/src/lib/theme.ts` | novos `PUBLIC_SURFACE_PREFIXES` e `isPublicSurfacePath`, fonte única da regra |
| `apps/web/index.html` | o script anti-flash aplica claro nas superfícies públicas e só resolve preferência fora delas |
| `apps/web/src/features/auth/AuthBootstrap.tsx` | `enabled` do `ThemeProvider` passou a ser `autenticado && !superfície pública` |
| `apps/web/src/app/theme-context.tsx` | `setPreference` respeita `enabled` ao aplicar o tema imediato |

Superfícies públicas: `/`, `/login`, `/help*`, `/access-denied`.

## Evidência

Verificação manual no navegador, com `genius.theme-preference = "dark"` no
localStorage:

```json
{"path":"/login","theme":"light","stored":"dark"}
```

`/help/genius/articles` renderizou claro, contra o tema escuro observado antes da
mudança na mesma rota.

Regressão automatizada nova no smoke, cenário `theme-surface`, executado dentro da
sessão autenticada do `platform_admin` com preferência escura salva:

```json
{"scenario":"theme-surface","internalTheme":"dark","publicTheme":"light"}
```

O cenário falha com `LOCAL_QA_THEME_INTERNAL_NOT_DARK` se o ambiente autenticado
perder o tema escuro, e com `LOCAL_QA_THEME_PUBLIC_NOT_LIGHT` se a Central Pública
escurecer. Ele limpa a preferência que criou.

## Validações executadas

| Comando | Resultado |
| --- | --- |
| `npm run web:typecheck` | pass |
| `npm run lint` | 0 erros, 181 avisos |
| `npm run local:qa:smoke` | 10 personas, 3 rotas internas, 3 cenários profundos, 7 sondadas |

## Limitações

- O portal do cliente (`/portal*`) não entrou na lista de superfícies públicas: é
  ambiente autenticado de cliente. Se o produto decidir que ele também deve ser
  sempre claro, basta incluir o prefixo em `PUBLIC_SURFACE_PREFIXES`.
- A lista de prefixos existe em dois lugares por necessidade técnica: o script
  anti-flash roda antes do bundle. Os dois pontos estão comentados apontando um
  para o outro.
- Nenhum backend, contrato ou permissão foi alterado.

## Próximo passo

Nova tela de Configurações e Integrações, fiel à referência enviada, agora sobre
uma base de tema previsível.
