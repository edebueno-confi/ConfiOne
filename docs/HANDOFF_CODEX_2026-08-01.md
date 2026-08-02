# Passagem do projeto para o Codex — Genius Support OS

Data: 2026-08-01
Agente que entrega: Claude/Anthropic
Agente que assume: Codex/OpenAI
Product Owner: Ede Bueno

Este documento é a fonte de entrada para quem assume o projeto. Ele não substitui
os documentos canônicos; ele diz **em que estado o projeto está agora**, o que foi
feito, o que está quebrado, o que é sujeira e o que fazer primeiro.

Leia este arquivo inteiro antes de escrever qualquer linha de código.

---

# 1. O que é o produto

**Genius Support OS** é uma plataforma operacional SaaS interna da Confi. Ela
centraliza a operação de suporte, Customer Success, produto e engenharia em um
lugar só.

Superfícies previstas no produto completo:

- Dashboard gerencial (CEO, Comercial, CS, Suporte, Financeiro)
- Central pública de ajuda
- Gestão de conhecimento (autoria, revisão editorial, publicação)
- Suporte: filas, tickets, conversas
- Clientes B2B e carteiras de Customer Success
- Portal do cliente
- Administração de usuários, áreas, funções e permissões
- Acionamentos entre suporte, CS, produto e engenharia
- Integrações HubSpot e OMIE

**O que o produto não é:** não é um CRM genérico, não é um ERP e não é uma coleção
de telas isoladas. O critério de qualidade é organizar fluxo operacional real,
contexto, responsabilidade e acompanhamento.

O assistente e mascote se chama **Gênio**, sempre com inicial maiúscula.
Exemplos de copy: "Pergunte ao Gênio", "O Gênio está consultando a documentação".

---

# 2. Objetivo do primeiro deploy

O sistema completo **permanece no código**. Módulos incompletos não são excluídos
nem reconstruídos: eles ficam no repositório, ocultos da navegação e bloqueados
por rota, permissão e manifesto de release, e são liberados por fase depois de
validados.

O primeiro release publica exatamente **três telas internas**:

| Tela | Rota | Por quê |
| --- | --- | --- |
| Dashboard gerencial | `/admin/analytics` | superfície mais madura |
| Conhecimento | `/admin/knowledge` (+ `/new`, `/:id/edit`) | alimenta a Central de Ajuda |
| Configurações | `/admin/settings` | apenas o necessário para as duas acima |

Mais a **Central pública de ajuda** em `/help/genius`, que nunca é restringida
pelo manifesto — a proteção dela é do gate, não do release.

Tudo o mais (Suporte, CS, Engenharia, Acionamentos, Portal do cliente) está
oculto **para todos os perfis, inclusive `platform_admin`**. Ser administrador não
pode fazer um módulo inacabado reaparecer nesta fase.

---

# 3. Como a ocultação funciona — leia antes de mexer em rota

Existe **um manifesto central** e nada duplica a lista de rotas:

```
apps/web/src/app/release-surface.mjs   (+ release-surface.d.mts)
```

Ele é a fonte da verdade para: construção da navegação, acesso por URL direta,
destino pós-login, redirects técnicos, domínios do Dashboard, seções de
Configurações e os testes de superfície.

Convenção do repositório: lógica compartilhada entre o app Vite/TypeScript e as
suítes `node --test` mora em `.mjs` com declaração `.d.mts`. Node ESM não resolve
import de `.ts` sem extensão. **Não converta esses arquivos para `.ts`.**

## Ordem de validação, nesta sequência

1. **Superfície de release** — `ReleaseSurfaceGate.tsx`
2. **Permissão de perfil** — `InternalScreenKey` × `PlatformRole`
3. **Gate de rota**
4. **Renderização da página**

Ocultar item de menu **não** é bloquear funcionalidade. Rota não liberada precisa
de gate real. Backend é a fonte da verdade; frontend não pode ser a única
barreira de autorização.

## Como religar um módulo

Duas formas, ambas sem tocar em lista espalhada:

- Ambiente inteiro: `VITE_RELEASE_SURFACE=full` restaura o sistema completo.
- Módulo específico: acrescente a rota e a `screenKey` em `FIRST_RELEASE_ROUTES`
  e `FIRST_RELEASE_SCREEN_KEYS`. O teste `release-surface.test.mjs` valida a
  coerência interna do manifesto e falha se uma rota apontar para tela não
  publicada.

## Seções de Configurações

`FIRST_RELEASE_SETTINGS_SECTIONS` publica seção por seção, cada uma com a
`screenKey` que o perfil precisa ter. Configurações passa a mostrar só o que o
usuário pode operar, em vez de listar todos os parâmetros do sistema.

⚠️ **`categorias` está fora de propósito.** Apesar do nome, a seção gerencia
`ticket_categories` — parâmetro do módulo de Suporte, que não está publicado.
Publicá-la fazia a tela consultar uma tabela que a RLS nega (HTTP 403). Não
recoloque sem publicar Suporte junto.

---

# 4. Estado do Git — leia com atenção, aqui está o maior risco

```
Checkout canônico : C:\Projetos\GSO-old
Branch            : claude/release-surface-visual-audit-20260731
HEAD              : 56c2c9d023bff8f5c2e4e1609662f35647251bf3
Base do ramo      : 68884bf (igual ao `main` local)
Commits do ciclo  : 9, todos locais
Upstream          : NÃO CONFIGURADO — nada foi enviado para o remoto
Árvore de trabalho: limpa, exceto package-lock.json (ver §8)
```

## Os 9 commits deste ciclo

```
56c2c9d docs: passagem do projeto para o Codex
bf363bf chore(integrations): preservar ajustes de escopo e watermark do HubSpot
3f7503e refactor(settings): exibir apenas o que o perfil pode operar
ab47abb fix(knowledge): romper o deadlock de publicacao e refatorar o editor
b55aa88 feat(navigation): busca global "Pergunte ao Genio" no header
9392d66 refactor(analytics): separar Suporte de Customer Success e padronizar filtros
c206877 feat(release): manifesto central da superficie do primeiro release
1e1dbf1 fix(local-qa): centralizar normalizacao do helper de SQL
ac43d09 chore(repo): ignorar pacotes de evidencia e artefatos de agente
```

Cada mensagem explica o porquê da mudança, não apenas o quê. Política de
trailers verificada: `node scripts/ci/check-commit-trailers.mjs` → exit 0, nenhum
trailer de coautoria não autorizado.

**Nada foi enviado para o remoto.** `git push` é decisão do Product Owner.

## Um `index.lock` órfão bloqueava o repositório

Havia um `.git/index.lock` de 30/07 20:19, com 0 bytes, sem nenhum `git.exe` em
execução. Bloqueava qualquer operação de índice. Confirmei que era órfão pela
idade, pelo tamanho e pela ausência de processo antes de removê-lo. Se o sintoma
"Another git process seems to be running" voltar, verifique nessa ordem: processo
ativo, idade do lock, tamanho.

## A base está 74 commits atrás de origin/main

```
git rev-list --left-right --count origin/main...HEAD
74      0
```

Setenta e quatro commits existem em `origin/main` e **não** existem nesta branch.
O `main` local também está `behind 74`. Todo o trabalho deste ciclo foi construído
sobre uma base velha.

**Esta é a primeira decisão que o Codex precisa tomar, antes de qualquer código.**
Opções:

1. Rebase/merge desta branch sobre `origin/main` atualizado e resolver conflitos.
2. Reaplicar as mudanças sobre uma branch nova criada de `origin/main`.

Não presuma que a pasta mais recente, a branch chamada `main` ou uma pasta
chamada `release` é a fonte canônica sem comprovar por histórico Git.

## Worktrees ativos no início da auditoria

Dez worktrees vivos, nove deles com trabalho do Codex:

```
C:/Projetos/GSO-old                  68884bf  claude/release-surface-visual-audit-20260731  ← este
C:/Projetos/GSO-dashboard-03         de2413f  codex/dashboard-03-cs-control-and-visual-audit
C:/Projetos/GSO-dashboard-03-main    092ab8c  (detached HEAD)
C:/Projetos/GSO-integrations-03      c5dc216  codex/integrations-03-production-fixes
C:/Projetos/GSO-integrations-03-1    7bc4cd6  codex/integrations-03-1-cs-source-fix
C:/Projetos/GSO-integrations-03-3    0c5e264  codex/integrations-03-3-authenticated-diagnostic
C:/Projetos/GSO-integrations-03-main 84f66f6  (detached HEAD)
C:/Projetos/GSO-integrations-04      0444bda  codex/settings-integrations-dashboard-clarity
C:/Projetos/GSO-release-02-3         9ebd101  codex/release-02-production
C:/Projetos/GSO-release-02-6         7a6afc2  codex/release-02-security-hardening-followup
```

### Estado após a reorganização

Em 2026-08-01, as nove cópias acima foram movidas para a Lixeira a partir de
`C:\Projetos\BKP`, e o checkout intermediário `C:\Projetos\GSO-consolidation-01`
também foi descartado. Os commits foram preservados antes da remoção em
`refs/archive/gso-git-cleanup/`. O único worktree ativo agora é
`C:\Projetos\GSO-old`, na branch local `main`, alinhada ao conteúdo consolidado
com `origin/main` como ancestral.

As listas abaixo registram o estado histórico anterior e não representam
worktrees ou branches operacionais atuais.

Duas branches **sem cópia remota** — perda irreversível se apagadas:

- `codex/settings-integrations-dashboard-clarity` (worktree `GSO-integrations-04`)
- `codex/ux-ui-rebuild-v2-discovery`
- `codex/repository-provenance-hardening`

Três branches com commits locais ainda não publicados:

- `codex/integrations-04-async-cs-runner` — ahead 7
- `codex/mvp-operational-completion-goal` — ahead 3
- `codex/access-01-3-auth-context-recovery` — ahead 1

**Não execute** `git worktree remove`, `git branch -D`, `git reset --hard`,
`git clean -fdx` ou `git checkout --` amplo sem confirmar com o Product Owner.

## Stash preservado

```
stash@{0}: On codex/release-pilot-dashboard-help-center-v1:
           preservado: editorial hydration local antes do PR RELEASE-01
```

Nunca foi aplicado nem descartado nesta sessão. Continua intacto.

---

# 5. O que foi feito neste ciclo

## 5.1 Manifesto de superfície de release (novo)

`apps/web/src/app/release-surface.mjs` + `.d.mts` + `ReleaseSurfaceGate.tsx`.
Verificado no navegador: 20 de 20 rotas proibidas bloqueadas para
`platform_admin`. Coberto por `tests/scripts/release-surface.test.mjs` — 27
testes, todos passando.

## 5.2 Correção do helper de QA local

`scripts/local-qa/sql.mjs` ganhou `normalizeQueryResult`. O Supabase CLI 2.105.0
passou a devolver array puro em vez de `{rows}`, e havia **quatro implementações
duplicadas** da mesma normalização, todas quebradas. Agora é uma só, central, com
erro explícito (`LOCAL_QA_SQL_OUTPUT_UNPARSEABLE`) em vez de falha silenciosa.
Regressão coberta por `tests/scripts/local-qa-sql-normalization.test.mjs`.

## 5.3 Dashboard

- Aba **Geral** perdeu o filtro por domínio (a visão é geral; o filtro era
  contradição). Removido da tela e da lógica.
- A antiga aba "CS / Suporte" foi dividida. Todo o conteúdo era de tickets, então
  foi para **Suporte** (`AnalyticsSupportPage.tsx`).
- **Customer Success** (`AnalyticsCustomerSuccessPage.tsx`) declara honestamente
  que não tem indicadores. `vw_cs_customer_portfolio` existe mas pertence ao
  módulo de Carteira CS, não publicado. Recusei derivar métrica de CS a partir de
  ticket: seria métrica inventada. **Não preencha essa tela com dado simulado.**
- Abas Comercial, Suporte e Financeiro ganharam `AnalyticsPipelineFilter.tsx`.

## 5.4 Busca global "Pergunte ao Gênio"

`GeniusGlobalSearch.tsx` + `genius-search-sources.mjs`/`.d.mts`. Atalho
Ctrl/Cmd+K, sugestões adaptadas ao contexto, três fontes (navegação, seções de
Configurações, artigos). Usa `createPortal` para `document.body` — um ancestral
com `overflow-hidden` recortava o dropdown e engolia o clique.

## 5.5 Editor de artigo — refatorado, não remendado

O Product Owner rejeitou explicitamente o remendo: *"Refatoração e você está
fazendo polimento tentando consertar. Não quero conserto, quero refatoração."*

O que mudou de fato: grade de duas colunas substituída por **canvas de página
inteira** (`max-w-[900px]` centralizado) com as propriedades em **slide-over**
(~50% da largura no desktop), fechável por Esc. `metadataCollapsed` virou
`propertiesOpen`.

## 5.6 O deadlock de publicação — corrigido no banco

Bug real e reprodutível: artigo publicado com visibilidade alterada para Público
entrava em loop. "Salve o rascunho antes de publicar" → salvava → "publicar" →
voltava para a mesma mensagem.

Causa: dependência circular. Artigo publicado salva em
`knowledge_article_editorial_drafts`, não na linha canônica de
`knowledge_articles`. Mas a RPC de evidência validava a linha do artigo, que
continuava com a visibilidade antiga.

Correção — duas migrations novas, aplicadas só em local:

```
supabase/migrations/20260801030000_knowledge_publish_gate_editorial_draft_visibility_v1.sql
supabase/migrations/20260801030100_knowledge_publication_evidence_effective_visibility_v1.sql
```

Introduzem `app_private.effective_knowledge_publish_visibility(uuid)`, que lê a
visibilidade do rascunho editorial quando existe e cai para a do artigo quando
não existe. O gate de publicação pública continua exigindo evidência humana
revisada — **não foi afrouxado**.

Convenção obrigatória do projeto, cobrada por pgTAP: função `SECURITY DEFINER`
usa `set search_path = ''` com nomes totalmente qualificados. Eu errei isso na
primeira tentativa (usei `public, pg_temp`) e a suíte pegou.

Teste ponta a ponta em artigo novo: banco confirmou `published/public/rev 4` com
advisory `reviewed` e revisor registrado.

## 5.7 Configurações

Abas Configuração e Logs do Dashboard migraram para Configurações
(`dashboard-fontes`, `dashboard-historico`). Filtro por `canOpenSettingsSection`.
Deep link via `sessionStorage['genius.settings-section']`.

## 5.8 Ambiente local e sincronização — o ciclo mais delicado

Três problemas com o mesmo sintoma aparente. Detalhe completo em
`docs/reports/2026-08-01_ambiente_local_pgtap_e_sync_hubspot.md`. Resumo:

1. **Edge Functions nunca subiram.** `supabase start` não inclui o runtime de
   functions. Sem `supabase functions serve`, todo `/functions/v1/*` dá 503.
2. **`local:qa:hydrate` ativava pipelines fictícios** em
   `analytics_source_config`. Essa tabela instrui a sincronização real sobre o que
   buscar no HubSpot, então ela ia buscar `qa-local-commercial` e levava 404.
   Corrigido: entram inativos, e o `on conflict` não reativa.
3. **Falso negativo na sincronização.** A sincronização conclui em mais de cinco
   minutos; o gateway corta antes (502/504); a Edge Function termina com sucesso;
   o cliente já tinha declarado falha. A interface afirmava erro sobre execução
   bem-sucedida. Corrigido em `analytics-api.ts`: 502/503/504 e queda de conexão
   passam a acompanhar a execução pelo read model
   `vw_analytics_dashboard_sync_status`, filtrando por marca de tempo do disparo.

---

# 6. Bugs e pendências que o Codex precisa resolver

Ordenados por impacto.

## 6.1 pgTAP e hydrate são mutuamente exclusivos — não corrigido

`local:qa:hydrate` insere tenants com o **mesmo UUID fixo** que as fixtures pgTAP:

```
ERROR: duplicate key value violates unique constraint "tenants_pkey"
DETAIL: Key (id)=(11111111-1111-4111-8111-111111111111) already exists.
```

A transação aborta e o arquivo morre inteiro (`Bad plan. You planned N tests but
ran 0`). **17 arquivos** de teste afetados.

Prova de que é o hydrate e não o código:

| Estado do banco | pgTAP |
| --- | --- |
| `db reset` apenas | `Result: PASS`, exit 0, 82 arquivos |
| `db reset` + `hydrate` | `Result: FAIL`, 17 arquivos abortam |

Regra operacional atual: **rodar pgTAP antes de hidratar.**

```
npm run supabase:db:reset
npx supabase test db --local      # suíte verde
npm run local:qa:hydrate          # ambiente utilizável
```

Correção de verdade exige separar namespaces de fixture (UUIDs distintos, ou
schema de teste isolado). É decisão de arquitetura de testes, não patch. Não fiz
sem escopo aprovado. **Recomendo como primeiro macro-lote.**

## 6.2 Seis testes `node --test` falhando — pré-existentes

`node --test "tests/scripts/*.test.mjs"` → 194 testes, 187 pass, **6 fail**:

```
not ok 40  - visão executiva separa desempenho de posição atual
not ok 41  - ranking de pipelines é determinístico e limitado a cinco
not ok 42  - exceções distinguem qualidade de dados e risco operacional
not ok 43  - dashboard_viewer recebe somente conteúdo autorizado
not ok 137 - Dashboard Gerencial distribui cinco KPIs em grade 3 + 2 a partir de 1024px
not ok 145 - contadores quantitativos usam regra compartilhada de singular e plural
```

São asserções de string sobre conteúdo de `AnalyticsCeoPage.tsx` que uma
modificação herdada do worktree removeu. Provei que são pré-existentes: a string
`Pipelines de atendimento prioritários` existe em HEAD e não existe no worktree.
A contagem não mudou durante meus ciclos, portanto não houve regressão nova.

Decisão pendente: atualizar as asserções ou restaurar o conteúdo. Precisa de
decisão de produto sobre o que a visão executiva deve mostrar.

## 6.3 `vw_admin_managed_integrations` com DML completo para `authenticated`

Risco de segurança aberto. A view permite DML completo ao papel `authenticated` e
**não é coberta por nenhuma migration de hardening**. Não foi corrigido em nenhum
ciclo. Deve entrar no próximo lote de segurança.

## 6.4 Ferramentas do editor ainda usam `window.prompt()`

Inserir vídeo, link e imagem chamam o prompt nativo do navegador. Não há tela,
validação, pré-visualização nem biblioteca de assets. Também falta busca de
artigo para o bloco "Leia também". Pendência já aprovada pelo Product Owner.

## 6.5 Refatoração visual de Configurações

Aprovada e não feita. Pedido: visual moderno, tech, clean. Hoje a tela ainda tem
aparência de painel de parâmetros.

## 6.6 Tela de Conhecimento

O rail direito de 300px comprime a tabela `table-fixed`; o `colgroup` reserva só
76px para "Ação". Pendências: coluna única, remover a coluna vazia "Consumo",
unificar Status + Visibilidade, tornar a coluna de ação fixa.

## 6.7 Menores

- `refreshAdvisory`: erro de rede é apresentado como "falta evidência". Confunde
  indisponibilidade com reprovação.
- Canvas do editor sem placeholder em artigo novo.
- Decisão pendente: segregação autor ≠ revisor.
- `validateDraft` exige título ≥8, resumo ≥12, categoria e corpo ≥80 caracteres.
  Não está claro na interface.

---

# 7. Credenciais e ambiente

## Credenciais de integração foram perdidas por minha causa

O `supabase db reset` que executei apagou `public.managed_integrations`. Os
segredos ficavam no Vault do Supabase local e **não são recuperáveis**. Eu não
acessei, não li e não reproduzi nenhum deles.

O Product Owner já recadastrou em **Configurações → Integrações** e a
sincronização voltou a funcionar. Se o banco local for resetado de novo, isso se
repete. **Avise antes de resetar.**

## Subir o ambiente — três processos, nesta ordem

```
npm run supabase:start          # Postgres, Auth, Storage, Kong
.tmp\start-functions.cmd        # Edge Functions -> /functions/v1/*
.tmp\start-web.cmd              # frontend       -> http://127.0.0.1:4173
```

Omitir o segundo é exatamente o que produz 503 nas integrações.

## Armadilha de ambiente no Windows

`npm ci` não instalava devDependencies porque `NODE_ENV=production` e
`npm config omit=dev` estavam ativos. Contorno:

```
set NODE_ENV=development&& npm ci --include=dev
```

Sem espaço antes de `&&` — o `cmd` inclui o espaço no valor da variável.

## Segurança — restrição permanente

Nunca exponha, leia ou reproduza: arquivos `.env`, tokens, secrets, senhas,
cookies, JWTs, service role keys, credenciais ou dumps privados. Nunca altere
secrets, migrations remotas, schedules ou dados de produção sem autorização
explícita do Product Owner.

---

# 8. Sujeira do repositório

Estes diretórios eram rastreáveis e agora estão no `.gitignore`. São insumo de
investigação, não fonte da verdade — o que importa está destilado em
`docs/reports/`.

| Caminho | O que é |
| --- | --- |
| `output/` | 16 pacotes de evidência, capturas, zips e logs de auditoria |
| `.superdesign/` | artefatos de ferramenta de design |
| `.agents/` | skills locais de agente |

Também corrigi um espaço em branco à direita em `AnalyticsCeoPage.tsx:94` que
fazia `git diff --check` falhar.

`package-lock.json` continua marcado como modificado, mas **não tem alteração de
conteúdo**: `git diff --numstat` retorna vazio e `git update-index --refresh` não
consegue assentar o registro. É diferença de metadado, provavelmente filtro de
fim de linha. Deixei intocado de propósito — alterar o `package-lock.json` está
fora do escopo autorizado, e é a única entrada suja restante na árvore.

**Não altere o `package-lock.json`.**

---

# 9. Validações — o que está provado e o que não está

| Validação | Resultado |
| --- | --- |
| `npm run web:typecheck` | exit 0 |
| `npm run web:build` | exit 0, `built in 12.45s` |
| `node --test tests/scripts/release-surface.test.mjs` | 27/27 pass |
| `node --test "tests/scripts/*.test.mjs"` | 194 testes, 187 pass, 6 fail (§6.2) |
| `npx supabase test db --local` (banco limpo) | `Result: PASS`, exit 0, 82 arquivos |
| `npx supabase test db --local` (pós-hydrate) | FAIL, 17 arquivos abortam (§6.1) |
| `052_analytics_hubspot_pipe_alignment.sql` pós-hydrate | PASS, exit 0 |
| `npm run local:qa:secret-scan` | exit 0, limpo |
| `node scripts/ci/check-commit-trailers.mjs` | exit 0, 9 commits analisados |
| `git diff --check` | limpo após a correção |
| Rotas proibidas para `platform_admin` | 20/20 bloqueadas, verificado no navegador |
| Publicação de artigo ponta a ponta | `published/public/rev 4`, advisory `reviewed` |

**Não validado:**

- Sincronização HubSpot/OMIE ponta a ponta em ambiente com credencial estável.
- O novo caminho de acompanhamento de timeout não foi exercitado com timeout real
  de gateway. Está coberto por tipos e build, não por teste de integração.
- Nada foi testado em ambiente remoto. As duas migrations novas nunca saíram do
  local.

Diferencie sempre: **validado**, **parcialmente validado**, **não validado**,
**dependente de credencial ou ambiente externo**. Não declare sucesso sem
evidência objetiva.

---

# 10. O que fazer primeiro — ordem recomendada

**Lote 0 — reconciliar a base. Bloqueia todo o resto.**
Decidir e executar a estratégia para os 74 commits de diferença com
`origin/main` (§4). Não escreva código novo antes disso: qualquer coisa
construída sobre esta base herda o mesmo problema.

**Lote 1 — separar namespaces de fixture (§6.1).**
Enquanto pgTAP e hydrate colidem, não existe suíte confiável em ambiente
utilizável. É a alavanca de maior efeito.

**Lote 2 — decidir os 6 testes da visão executiva (§6.2).**
Precisa de decisão de produto, não só de código.

**Lote 3 — fechar `vw_admin_managed_integrations` (§6.3).**
Risco de segurança conhecido e sem cobertura.

**Lote 4 — ferramentas do editor (§6.4) e refatoração de Configurações (§6.5).**
Já aprovados, não dependem de credencial externa.

**Lote 5 — tela de Conhecimento (§6.6).**

---

# 11. Como trabalhar neste projeto

## Metodologia

Spec-Driven Development. Toda demanda vira especificação, plano executável,
implementação, validação e documentação persistida no repositório. Antes de
alterar código: entenda o problema operacional, inspecione o estado real do
repositório, localize contratos e componentes existentes, verifique se a
funcionalidade já existe total ou parcialmente.

Trabalhe em macro-lotes com objetivo, escopo, fora de escopo, riscos, critérios
de aceite e evidências esperadas definidos. Não interrompa para autorização
intermediária quando o escopo já estiver aprovado e o risco controlado.
Interrompa diante de bloqueio real: decisão de produto não definida, risco de
perda de trabalho, alteração de dados ou RLS não autorizada, necessidade de
credencial, operação externa sensível, ou impossibilidade de validar.

## Leitura obrigatória antes de alterar

```
AGENTS.md
docs/PROJECT_STATE.md
docs/ARCHITECTURE_RULES.md
docs/VIEW_RPC_CONTRACTS.md
docs/AUTH_CONTEXT_STRATEGY.md
docs/CODEX_EXECUTION_RULES.md
docs/VALIDATION_CHECKLIST.md
docs/DOCUMENTATION_LEDGER.md
docs/plan.md
docs/spec.md
docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md   (se houver alteração visual)
```

Use busca textual em vez de ler tudo. Leia só o que se relaciona à tarefa.

## Precedência de fontes

1. Código executável, migrations, views, RPCs, policies, testes, contratos reais
2. Documentos canônicos atuais
3. Context Pack mais recente
4. Auditorias recentes com evidência objetiva
5. Diário de Construção e Product Docs — camada narrativa
6. Documentação histórica, prompts antigos, artefatos experimentais

Documentação histórica **não** prevalece sobre comportamento atual. O Diário de
Construção **não** é fonte oficial de decisão técnica.

## Regras que não se negociam

- Backend é a fonte da verdade. Frontend não inventa regra de negócio nem dado.
- Dado ausente é exibido como **indisponível**, nunca simulado. Esta regra já
  determinou o desenho de `AnalyticsCustomerSuccessPage.tsx` — respeite-a.
- Toda operação respeita tenant, RLS, permissão, auditoria e isolamento.
- `platform_admin` não elimina auditoria.
- Não crie tabela, view, RPC, Edge Function ou policy nova sem auditar
  equivalentes existentes.
- Não misture fixture, mock, cache local e dado produtivo sem identificação clara.
- Toda interface usa tokens semânticos. Superfície pública usa tema claro fixo.
  Sistema interno oferece claro e escuro, com contraste validado nos dois.
- Alteração visual não se considera concluída por typecheck ou build. Exija
  captura real: desktop, largura intermediária, mobile, claro, escuro, loading,
  vazio, erro, sucesso, antes e depois.

## Encerramento de cada ciclo

Informe objetivamente: arquivos alterados, o que foi implementado, decisões
tomadas, comandos executados, testes que passaram, evidências produzidas,
limitações que permanecem, decisões pendentes, status do Git e próximo lote
recomendado.

---

# 12. Papéis

- **Codex/OpenAI** — assume investigação, planejamento e implementação autorizada.
- **Ede Bueno** — Product Owner. Aprova escopo de produto, módulos publicados,
  alterações sensíveis, acesso a credenciais, operações externas, migrations
  remotas, deploy, descarte ou consolidação de código, e decisões de negócio.

Quando uma missão terminar, reporte o resultado e pare. Não inicie o próximo
macro-lote automaticamente.

---

# 13. Erros que eu cometi — não repita

Registro honesto, porque cada um custou tempo:

1. **Rodei `supabase db reset` sem avisar antes.** Destruí as credenciais de
   HubSpot e OMIE do Product Owner. O aviso era devido e eu não dei. Avise
   **sempre** antes de operação destrutiva, mesmo em ambiente local.

2. **Publiquei a seção `categorias` no manifesto por causa do nome.** Assumi que
   eram categorias de conhecimento; são categorias de ticket, de um módulo
   oculto. Resultado: HTTP 403 em produção local. Verifique o que a seção
   realmente lê, não o que o rótulo sugere.

3. **Reativei 35 pipelines de uma vez para corrigir um.** Dezenove pipelines de CS
   estavam inativos de propósito e o pgTAP exige exatamente seis ativos. Corrigi
   depois, mas a correção ampla foi pior que o problema.

4. **Usei `search_path = public, pg_temp` em `SECURITY DEFINER`.** O padrão do
   projeto é `search_path = ''` com nomes qualificados, e a suíte pegou. Leia a
   convenção antes de escrever migration.

5. **Tentei remendar o editor quando o pedido era refatorar.** O Product Owner
   foi direto: *"Não quero conserto, quero refatoração."* Quando o pedido é
   estrutural, mude estrutura.

6. **Escrevi backtick dentro de template literal** em `hydrate.mjs`, quebrando o
   parse do arquivo. Comentário em SQL dentro de template JS não pode usar
   backtick.

---

# 14. Como conectar o Codex

Para o Product Owner executar.

## Passo 1 — apontar o Codex para o checkout correto

```
C:\Projetos\GSO-old
```

Não use outra pasta de `C:\Projetos`. As demais são worktrees de branches
específicas do Codex, com HEAD diferente, e algumas em `detached HEAD`.

## Passo 2 — confirmar que o ambiente sobe

```
npm run supabase:start
.tmp\start-functions.cmd
.tmp\start-web.cmd
```

Se as integrações derem 503, o segundo processo não subiu.

## Passo 3 — prompt de abertura do Codex

Cole exatamente isto na primeira mensagem:

---

Você assume o desenvolvimento do **Genius Support OS**, um SaaS operacional
interno da Confi. O checkout correto é `C:\Projetos\GSO-old`. Não use outra pasta
sem comprovar por histórico Git que é a fonte canônica.

**Antes de escrever qualquer linha de código, leia integralmente:**

1. `docs/HANDOFF_CODEX_2026-08-01.md` — passagem do projeto, estado atual, bugs
   abertos, sujeira e ordem recomendada de execução
2. `CLAUDE.md` e `AGENTS.md` — regras de execução
3. `docs/PROJECT_STATE.md`, `docs/ARCHITECTURE_RULES.md`,
   `docs/VIEW_RPC_CONTRACTS.md`, `docs/AUTH_CONTEXT_STRATEGY.md`
4. `docs/reports/2026-08-01_ambiente_local_pgtap_e_sync_hubspot.md` — último ciclo

**Sua primeira tarefa é de diagnóstico, não de implementação.**

A branch atual `claude/release-surface-visual-audit-20260731` está **74 commits
atrás de `origin/main`**, tem 9 commits locais não publicados e nenhum upstream
configurado. Existem 10 worktrees ativos, 3 branches sem cópia remota e 3 com
commits locais não publicados. Há um stash preservado.

Faça o seguinte e **pare para reportar antes de executar qualquer alteração**:

1. Inspecione `git status`, branch, HEAD, upstream, `git worktree list`,
   `git branch -vv`, `git stash list` e a contagem
   `git rev-list --left-right --count origin/main...HEAD`.
2. Compare o conteúdo real dos 74 commits de `origin/main` com os 9 commits
   locais desta branch. Identifique sobreposições e conflitos prováveis.
3. Recomende uma estratégia de reconciliação: rebase, merge, ou reaplicação sobre
   branch nova criada de `origin/main`. Justifique com evidência.
4. Liste explicitamente o que se perde em cada opção.

**Não execute** `git reset`, `git clean`, `git stash drop`, `git checkout --`
amplo, `git worktree remove`, `git branch -D`, `git push`, rebase, merge ou
cherry-pick sem autorização explícita do Product Owner. Preserve o trabalho
existente e o trabalho do outro agente.

**Regras que valem para todo o projeto:**

- Backend, banco, views, RPCs e read models são a fonte da verdade. O frontend não
  inventa regra de negócio nem dado.
- Dado ausente é exibido como **indisponível**, nunca simulado.
- Toda operação respeita tenant, RLS, permissão, auditoria e isolamento.
- Nunca exponha `.env`, tokens, secrets, senhas, cookies, JWTs ou service role
  keys.
- Não declare tarefa concluída sem evidência objetiva. Diferencie validado,
  parcialmente validado, não validado e dependente de credencial externa.
- Alteração visual exige captura real das superfícies alteradas, não só typecheck.
- Metodologia Spec-Driven Development: especificação, plano, implementação,
  validação e documentação persistida no repositório.

Responda em português do Brasil. Seja técnico, direto e objetivo. Ao encerrar um
ciclo, informe arquivos alterados, o que foi implementado, decisões, comandos
executados, testes que passaram, evidências, limitações, pendências, status do Git
e próximo lote recomendado. Depois **pare** — não inicie o lote seguinte
automaticamente.

---

## Passo 4 — decidir sobre o push

Os 9 commits deste ciclo estão apenas locais. Publicar ou não é sua decisão.
Recomendo **não publicar antes** da reconciliação com `origin/main`: enviar uma
branch construída sobre base 74 commits atrás só transfere o problema para o
remoto.

---

Fim da passagem. O estado está descrito, as pendências estão nomeadas, e o
primeiro lote está identificado: reconciliar a base Git antes de qualquer código.
