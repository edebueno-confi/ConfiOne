# Ambiente local, suíte pgTAP e sincronização HubSpot/OMIE

Data: 2026-08-01
Branch: `claude/release-surface-visual-audit-20260731`
Agente: Claude/Anthropic

# Resumo executivo

Três problemas distintos foram confundidos em um só sintoma ("sincronização HubSpot
falha" + "pgTAP falha"). Os três foram isolados com evidência:

1. **Edge Functions nunca subiram** → todo `POST /functions/v1/*` retornava 503.
   Resolvido subindo o processo. Não era erro de código.
2. **`local:qa:hydrate` marcava pipelines fictícios como ativos** →
   `analytics_source_config` passava a instruir a sincronização real a buscar
   `qa-local-commercial` na API do HubSpot, que responde 404. Corrigido na raiz.
3. **`local:qa:hydrate` e as fixtures pgTAP colidem no mesmo UUID de tenant** →
   17 arquivos de teste abortam. Condição pré-existente do repositório, **não
   corrigida** neste ciclo. Documentada abaixo.

## Estado encontrado

### 1. Edge Functions ausentes

`supabase start` sobe Postgres, Kong, Auth e Storage, mas **não** o runtime de
Edge Functions. Sem `supabase functions serve`, as rotas `/functions/v1/*` não
existem e o Kong responde 503. As mensagens vistas na interface
("O serviço de sincronização do OMIE está indisponível (HTTP 503)") eram
literalmente corretas.

### 2. Pipelines sintéticos ativos

`scripts/local-qa/hydrate.mjs` inseria em `public.analytics_source_config`:

```
('commercial','deal','qa-local-commercial','QA Local Comercial', true)
('cs','ticket','qa-local-cs','QA Local Suporte', true)
```

`analytics_source_config` é o contrato que a sincronização HubSpot lê para
decidir **quais pipelines buscar na API real**. Pipeline fictício ativo =
chamada real a um ID inexistente.

Erro real registrado em `hubspot_sync_runs`:

```
HubSpot GET /crm/v3/pipelines/deals/qa-local-commercial falhou (404)
```

Efeito colateral: o teste `052_analytics_hubspot_pipe_alignment.sql`
("CS possui os seis pipelines ativos configurados") passava a contar 7 e falhava.

### 3. Colisão de fixtures entre hydrate e pgTAP

Os testes pgTAP inserem tenants com UUID fixo. O hydrate insere o mesmo UUID.
Resultado, ao rodar `supabase test db` sobre um banco hidratado:

```
ERROR: duplicate key value violates unique constraint "tenants_pkey"
DETAIL: Key (id)=(11111111-1111-4111-8111-111111111111) already exists.
```

A transação aborta e o arquivo inteiro morre com `Bad plan. You planned N tests
but ran 0`. Atinge 17 arquivos.

**Prova de que é o hydrate e não o código de produção:** a suíte completa passa
em banco resetado sem hidratação.

| Estado do banco | Resultado pgTAP |
| --- | --- |
| `db reset` apenas | `Result: PASS`, exit 0, 82 arquivos |
| `db reset` + `local:qa:hydrate` | `Result: FAIL`, 17 arquivos abortam |

Isso também confirma que as duas migrations novas deste ciclo
(`20260801030000_*` e `20260801030100_*`) estão íntegras e não introduziram
regressão.

## Alterações

| Arquivo | Alteração |
| --- | --- |
| `scripts/local-qa/hydrate.mjs` | Pipelines sintéticos passam a ser inseridos com `is_active = false`, e o `on conflict` deixa de reativá-los. Comentário explica por quê. |

Nenhuma outra alteração de código. Nenhuma migration nova. Nenhum commit.

Correção pontual de estado aplicada ao banco local durante a investigação
(desativação de `qa-local-%` e encerramento de execuções presas em `running`).
Com a correção no hydrate, essa intervenção manual deixa de ser necessária.

## Validações

| Validação | Resultado |
| --- | --- |
| `npm run supabase:db:reset` | exit 0 |
| `npx supabase test db --local` (banco limpo) | `Result: PASS`, exit 0 |
| `npm run local:qa:hydrate` | exit 0 — `{"hydrated":true,"users":5,"tenants":3,"tickets":18}` |
| `052_analytics_hubspot_pipe_alignment.sql` pós-hydrate | `Result: PASS`, exit 0 |
| Contagem de pipelines pós-hydrate | `commercial 11 ativos / 1 inativo`, `cs 6 ativos / 1 inativo` |
| `GET /admin/analytics` | HTTP 200 |
| `POST /functions/v1/hubspot-sync` | HTTP 403 (função viva, rejeitando requisição sem JWT — comportamento correto) |
| `GET /rest/v1/` | HTTP 200 |

Classificação honesta:

- **Validado:** pgTAP em banco limpo; hydrate; teste 052 pós-hydrate; os três
  processos locais no ar.
- **Não validado:** sincronização HubSpot/OMIE ponta a ponta. Depende de
  credenciais que não existem mais neste ambiente (ver Riscos).

## Riscos e limitações

### Credenciais de integração perdidas

O `supabase db reset` que executei apagou `public.managed_integrations` (0 linhas).
Os segredos ficavam no Vault do Supabase local e **não são recuperáveis**. Eu não
acessei, não li e não reproduzi nenhum deles.

Ação necessária pelo Product Owner: reinserir as credenciais em
**Configurações → Integrações**. Só depois disso a sincronização real pode ser
validada ponta a ponta.

Eu não avisei antes de executar o reset. O aviso era devido.

### Colisão hydrate × pgTAP não corrigida

Continua valendo a regra operacional: **rodar a suíte pgTAP exige banco sem
hidratação**. Sequência correta:

```
npm run supabase:db:reset
npx supabase test db --local      # suíte verde
npm run local:qa:hydrate          # ambiente utilizável
```

Corrigir de verdade exige separar os namespaces de fixture (UUIDs distintos para
hydrate e pgTAP, ou schema de teste isolado). É uma decisão de arquitetura de
testes, não um patch, e por isso não foi feita sem escopo aprovado.

### `vw_admin_managed_integrations`

Permanece com DML completo para o papel `authenticated`, sem cobertura por
nenhuma migration de hardening. Risco aberto, já registrado em ciclo anterior.

## Decisões pendentes

1. Separar os namespaces de fixture entre hydrate e pgTAP (escopo a aprovar).
2. Fechar o DML de `vw_admin_managed_integrations`.
3. Reinserir credenciais HubSpot/OMIE e validar sincronização real.

## Segundo ciclo — falso negativo na sincronização e 403 em Configurações

Após o cadastro das credenciais pelo Product Owner, a sincronização **passou a
funcionar**, mas a interface continuava reportando erro. Duas causas distintas.

### A sincronização concluía e a interface dizia que falhou

Evidência em `hubspot_sync_runs`:

| status | started_at (UTC) | finished_at (UTC) | duração |
| --- | --- | --- | --- |
| success | 15:16:00 | 15:19:44 | 3m44s |
| success | 15:15:35 | 15:16:00 | 25s |
| success | 15:14:37 | 15:15:34 | 57s |
| error | 15:13:17 | 15:13:17 | credencial ausente (antes do cadastro) |

O frontend dispara três etapas sequenciais e síncronas (`companies`,
`commercial`, `cs`) e espera cada uma terminar. O total observado passou de cinco
minutos. O gateway encerra a conexão muito antes (502/504), a Edge Function
continua rodando e conclui, mas o cliente já tratou a desconexão como falha.

Resultado: **status errado sobre uma execução bem-sucedida**. Pior que a demora,
porque induz o operador a disparar de novo e criar execuções concorrentes.

Correção em `apps/web/src/features/analytics/analytics-api.ts`: 502, 503, 504 e
queda de conexão deixam de ser tratados como falha de negócio. O cliente passa a
acompanhar a execução já iniciada pelo read model existente
(`vw_analytics_dashboard_sync_status`), com filtro por marca de tempo do disparo
para não confundir com execuções anteriores, e só reporta erro quando o próprio
registro diz `status = 'error'`.

Não criei contrato novo nem alterei a Edge Function. O relógio de acompanhamento
é de 10 minutos; ao expirar, a mensagem orienta explicitamente a **não** disparar
de novo.

### HTTP 403 em `ticket_categories`

Erro meu no manifesto de release. Publiquei a seção `categorias` mapeada em
`screenKey: 'knowledge'` por causa do nome genérico, mas a seção gerencia
`ticket_categories` — parâmetro do módulo de Suporte, que não está publicado.
A RLS negava corretamente; a tela é que não devia estar perguntando.

Duas correções:

- `release-surface.mjs`: `categorias` sai da lista de seções publicadas.
- `SettingsPage.tsx`: a carga de categorias passa a ser condicionada à
  visibilidade da seção, em vez de disparar junto com todo o resto.

### O HTTP 400 em `/auth/v1/token`

Quatro tentativas de login recusadas antes de uma bem-sucedida. Comportamento
esperado de senha incorreta, não defeito.

### Validações do segundo ciclo

| Validação | Resultado |
| --- | --- |
| `npm run web:typecheck` | exit 0 |
| `npm run web:build` | exit 0 — `built in 12.45s` |
| `node --test tests/scripts/release-surface.test.mjs` | 27/27 `pass`, exit 0 |
| `node --test tests/scripts/*.test.mjs` | 194 testes, 187 `pass`, 6 `fail` |

As 6 falhas são as mesmas já registradas como pré-existentes (asserções de string
sobre conteúdo removido de `AnalyticsCeoPage.tsx` por modificação herdada do
worktree). A contagem não mudou, portanto este ciclo não introduziu regressão.

**Não validado:** o novo caminho de acompanhamento não foi exercitado com um
timeout real de gateway. A lógica está coberta por tipos e build, não por teste
de integração.

## Próximo macro-lote recomendado

Refatoração das ferramentas do editor de artigo (vídeo, link e imagem ainda usam
`window.prompt()` nativo) e refatoração visual de Configurações. Ambos já estão
na fila e não dependem de credencial externa.

## Como subir o ambiente local

Três processos, nesta ordem:

```
npm run supabase:start          # Postgres, Auth, Storage, Kong
.tmp\start-functions.cmd        # Edge Functions  -> /functions/v1/*
.tmp\start-web.cmd              # frontend        -> http://127.0.0.1:4173
```

Omitir o segundo é o que produz os 503 nas integrações.
