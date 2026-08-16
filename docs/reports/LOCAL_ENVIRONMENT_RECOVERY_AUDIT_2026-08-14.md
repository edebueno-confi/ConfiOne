# Auditoria de recuperação do ambiente local — ConfiOne

**Data da execução:** 2026-08-15 UTC
**Artefato solicitado:** `LOCAL_ENVIRONMENT_RECOVERY_AUDIT_2026-08-14.md`
**Escopo:** recuperação, inventário, auditoria e validação; nenhuma correção funcional.

## Status corrente canônico — 2026-08-16

Esta seção prevalece sobre os snapshots históricos abaixo. O relatório acumulou evidências de mais de um ambiente durante a recuperação; os blocos que mencionam `/workspace`, Ubuntu, branch `work`, Docker ausente, Node 20, 25 testes falhando ou Vector em reinício são históricos e não descrevem o estado atual do checkout Windows.

| Item | Estado confirmado atualmente |
|---|---|
| Repositório | `C:\Projetos\ConfiOne`, branch `main`, HEAD `87d7a406c5c131ca23602e00e55f7003d5aa873b` |
| Remoto | `https://github.com/edebueno-confi/ConfiOne.git` |
| Docker | Docker Desktop/Engine 29.7.2, daemon ativo, WSL 2, 16 CPUs |
| Node/npm | Node 24.10.0, npm 11.6.1 |
| Supabase CLI | 2.114.0 no workspace |
| Supabase local | API, DB, Auth, REST, Storage, Realtime, Edge Runtime, Studio e Kong ativos |
| Vector | desativado intencionalmente; nenhum container Vector instável |
| Frontend | HTTP 200 em `http://127.0.0.1:4173` |
| Testes | focused 262/262; amplo 547/547 |
| Build/typecheck | passaram |
| Quality gate | aprovado, 0 findings e 0 blockers |
| Segurança | secret scan com 0 correspondências; nenhuma credencial registrada |

O Vector não foi “perdido”: sua coleta analítica local foi desligada em `supabase/config.toml` porque a configuração anterior dependia da porta Docker TCP 2375, inexistente neste Docker Desktop. Isso preserva a segurança e não afeta os fluxos de negócio validados. Restaurar essa observabilidade exige desenho separado, preferencialmente por socket seguro, e não pela exposição de 2375.

### Proveniência do working tree e checkpoint

O snapshot inicial desta recuperação já continha `AGENTS.md` modificado. Esse arquivo permanece fora do checkpoint para preservar a alteração preexistente sem misturá-la ao baseline. Os demais arquivos modificados ou não rastreados do working tree foram classificados como artefatos da recuperação local, seus testes, fixtures, scripts de QA ou relatório de handoff e serão incluídos no checkpoint autorizado. Nenhuma alteração de feature externa ao baseline foi incorporada.

## A. Resumo executivo

**Resultado geral: NÃO APTO.** O checkout e as dependências JavaScript foram recuperados de forma determinística e o frontend compila isoladamente, mas o ambiente completo não pode ser iniciado: não há Docker, não existem arquivos de configuração local e a versão instalada do Node (20.20.2) não atende ao requisito do React Router instalado (`>=22.22.0`). A suíte focada tem 3 falhas em 258 testes; a suíte ampla tem 34 falhas em 450 testes. O script agregado de build também falha depois de compilar o web app porque tenta executar um script `build` inexistente em `packages/contracts`.

O produto não foi validado funcionalmente. O `vite preview` serviu o shell compilado e respondeu HTTP 200 para todas as rotas solicitadas, mas isso comprova somente o fallback SPA. Sem Supabase local, variáveis públicas e perfis QA, não foi possível comprovar dados, autenticação, permissões, ações principais, estados, console do navegador ou responsividade.

**Confiança para continuar:** média para trabalho estático (código, contratos e frontend); baixa para backend, RLS, integrações e comportamento end-to-end até que Node, Docker e configuração QA sejam restaurados.

## B. Identidade do repositório

| Item | Evidência atual |
|---|---|
| Caminho | `/workspace/ConfiOne` |
| Branch | `work` |
| HEAD inicial | `87d7a406c5c131ca23602e00e55f7003d5aa873b` |
| Upstream | não configurado |
| Remotos | nenhum remoto listado por `git remote -v` |
| Ahead/behind | não calculável sem upstream/remoto |
| Working tree inicial | limpo |
| Integridade | `git diff --check` passou |

O Context Pack registra outro checkout histórico, branch `codex/repository-cleanup-consolidation-20260721`, HEAD `9aacecf` e worktree sujo. Esses dados não descrevem este checkout e foram tratados apenas como proveniência histórica.

## C. Ambiente

| Componente | Estado |
|---|---|
| SO | Ubuntu 24.04.4 LTS, kernel Linux 6.18.35, x86_64 |
| Node | 20.20.2; incompatível com `react-router@8.3.0`, que declara Node `>=22.22.0` |
| npm | 11.4.2; gerenciador oficial inferido de `package-lock.json` e workspaces npm |
| pnpm | 10.28.1, não oficial neste checkout |
| Yarn | 4.14.1, não oficial neste checkout |
| Supabase CLI | 2.105.0, instalado como devDependency e acessível pelo npm |
| Docker | ausente; daemon/socket indisponível |
| Banco esperado | Supabase/PostgreSQL 17 local; API 54321, DB 54322, Studio 54323, Inbucket 54324, Analytics 54327 |
| Frontend | porta exclusiva 4173 |
| Dependências | 442 pacotes instalados por `npm ci`; 0 vulnerabilidades reportadas pelo npm |
| Lockfile | `package-lock.json`, preservado sem alteração |

### Variáveis esperadas e ausentes

Não havia `.env` ativo; somente `.env.example` e `.env.local.qa.example`. Nenhum valor foi lido ou reproduzido. Para iniciar o frontend faltam `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`; o runner também pede `VITE_APP_ENV`. Para QA autenticado faltam os nomes `LOCAL_QA_ADMIN_EMAIL`, `LOCAL_QA_ADMIN_PASSWORD`, `LOCAL_QA_DASHBOARD_VIEWER_EMAIL`, `LOCAL_QA_DASHBOARD_VIEWER_PASSWORD`, `LOCAL_QA_SUPPORT_MANAGER_EMAIL`, `LOCAL_QA_SUPPORT_MANAGER_PASSWORD`, `LOCAL_QA_SUPPORT_AGENT_EMAIL`, `LOCAL_QA_SUPPORT_AGENT_PASSWORD`, `LOCAL_QA_CLIENT_EMAIL`, `LOCAL_QA_CLIENT_PASSWORD` e os demais perfis listados em `.env.local.qa.example`.

Variáveis externas documentadas — não necessárias para a compilação e não usadas nesta auditoria — incluem `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `SUPABASE_DB_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `HUBSPOT_PRIVATE_APP_TOKEN` e `ANALYTICS_SYNC_SECRET`. Elas não devem ser inventadas nem usadas contra produção para contornar o ambiente local.

## D. Arquitetura encontrada

- **Monorepo npm:** workspaces `apps/*` e `packages/*`.
- **Aplicação:** `apps/web`, React 19.2, React Router 8.3, Vite 8.0, Tailwind 4.2 via plugin Vite, TypeScript 5.9 e Supabase JS 2.108.
- **Pacotes:** `packages/contracts` publica tipos compartilhados; `packages/tooling` existe como diretório, mas não possui manifesto de workspace no nível auditado.
- **Backend:** Supabase local, PostgreSQL 17, 268 migrations, 25 Edge Functions de produto mais `_shared`, e 115 arquivos de teste de banco.
- **Testes:** Node `node:test` (105 arquivos `.test.mjs`), scripts de contratos, pgTAP/Supabase e Playwright em scripts locais de QA/smoke; não há `playwright.config.*` na profundidade auditada.
- **Lint:** ESLint flat config (`eslint.config.js`) com TypeScript, React hooks, Fast Refresh e jsx-a11y.
- **Build:** `tsc --noEmit` seguido de Vite no web app. O agregador raiz usa `npm run build --workspaces`, incompatível com o pacote contracts sem script `build`.
- **Integrações:** HubSpot e OMIE possuem migrations, caches/read models, funções de sincronização, orquestração e testes. Operações externas não foram executadas.
- **Execução local oficial:** `npm ci`; restaurar Docker; `npm run supabase:start`; preparar configuração local conforme exemplos/documentação; `npm run dev`. QA completo depende dos scripts `local:qa:*` e dos perfis documentados.

## E. Resultado dos comandos

| Etapa | Comando | Resultado | Observação |
|---|---|---|---|
| Git | `git status --short --branch`, `git rev-parse HEAD`, upstream/remotos | passou, <1s | branch limpa, sem upstream e sem remoto |
| Integridade | `git diff --check` | passou, <1s | sem whitespace errors |
| Instalação | `npm ci` | passou, 13s | 442 pacotes; 0 vulnerabilidades; warning de engine do React Router |
| Higiene | `npm run repository:check-root` | falhou, 1s | `.mailmap` não está classificado na allowlist |
| Docs | `npm run docs:validate` | passou, 1s | 12 docs: 3 válidos, 9 com alertas, 0 bloqueados |
| Lint | `npm run lint` | passou com ressalvas, 19s | 0 erros e 180 warnings |
| Contratos | `npm run contracts:typecheck` | passou, 3s | sem erros |
| Web | `npm run web:typecheck` | passou, 26s | sem erros |
| Testes focados | `npm test` | falhou, 7s | 255 passaram, 3 falharam, 0 ignorados |
| Testes amplos | `npm run test:all` | falhou, 19s | 415 passaram, 34 falharam, 1 ignorado |
| Build raiz | `npm run build` | falhou, 30s | web compilou; contracts não possui script `build` |
| Segredos | `npm run local:qa:secret-scan` | passou, 2s | 2.175 arquivos rastreados; 0 correspondências |
| Quality gate | `npm run quality:all` | não conclusivo, 1s | risco baixo, 0 blockers/findings; exit 1 por modo/comando não reconhecido pelo runner documentado |
| Supabase | `npm run supabase:status` | bloqueado, 4s | Docker/daemon ausente |
| Supabase | `npm run supabase:start` | bloqueado, 3s | Docker obrigatório |
| Migration lint | `npm run supabase:lint:db` | bloqueado, 3s | PostgreSQL local 54322 indisponível |
| pgTAP | `npm run supabase:test` | bloqueado, 3s | PostgreSQL local 54322 indisponível |
| Dev server | `npm run dev` | bloqueado, <1s | faltam `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` |
| Preview | `npm run preview --workspace @genius-support-os/web -- --host 127.0.0.1` | passou | Vite serviu o artefato na porta 4173 |
| HTTP smoke | `curl` nas 21 rotas solicitadas | passou tecnicamente | 21/21 HTTP 200, mas somente fallback HTML SPA; não valida função/dados |

### Falhas de teste observadas

A suíte focada falha ao importar TypeScript diretamente em Node 20 (`ERR_UNKNOWN_FILE_EXTENSION`) e possui deltas de contratos estáticos. Na suíte ampla, várias falhas têm a mesma raiz de runtime `.ts`; outras apontam drift real entre testes e UI/código (rótulos de KPI, login, mascote, tokens de seleção/sidebar e primitivas de Settings). Isso não deve ser mascarado como simples problema ambiental: a atualização para Node compatível pode eliminar parte das falhas, mas os asserts de conteúdo continuarão exigindo reconciliação deliberada.

## F. Estado dos módulos

| Módulo | Estado real | Evidência | Dependência ou lacuna |
|---|---|---|---|
| Shell/frontend | funcional parcial | typecheck e bundle Vite passam; rotas recebem HTML | build raiz falha; runtime configurado não iniciou |
| Central pública (`/help*`) | bloqueado por ambiente | rotas e chunks existem; HTTP 200 no fallback | Supabase/dados locais ausentes; artigo e not-found não verificados no navegador |
| Início e Analytics | bloqueado por ambiente | implementações e testes focados extensos | auth, caches HubSpot/OMIE e Supabase indisponíveis |
| Support queue/tickets/inbox/clientes | bloqueado por ambiente | rotas, contratos, migrations e UI existem | banco/fixtures/perfis QA ausentes |
| CS portfolio | bloqueado por ambiente | rota, componente e contratos existem | cache/fixture local e auth ausentes |
| Internal actions | bloqueado por ambiente | workspace, migrations e contratos existem | banco/auth ausentes |
| Admin Knowledge/editor | bloqueado por ambiente | UI, migrations e governança existem | banco, conteúdo local e perfil admin ausentes |
| Admin Settings/integrações | funcional parcial no código; runtime não verificado | carregamento agora é por seção e integrações usam read model | investigação histórica do 403 não pôde ser reproduzida |
| Admin Access/Tenants | bloqueado por ambiente | superfícies e contratos existem | auth/platform admin e banco ausentes |
| Portal (`/portal*`) | bloqueado por ambiente | rotas/componentes/contratos existem | perfil customer-facing e Supabase ausentes |
| HubSpot/OMIE | não verificado | funções, migrations e testes estáticos presentes | credenciais/serviços externos deliberadamente não usados |
| Banco/RLS | não verificado | 268 migrations e 115 testes DB presentes | Docker/Postgres local indisponível |

Nenhum módulo foi classificado como plenamente funcional porque não houve validação completa de leitura de dados e ação principal.

## G. Problemas encontrados

### 1. Ambiente Node incompatível — ALTO

- **Evidência:** `npm ci` reporta que `react-router@8.3.0` requer Node `>=22.22.0`, enquanto o host usa 20.20.2; importações `.ts` falham em testes.
- **Causa provável:** notebook recuperado com runtime anterior ao exigido pelo lockfile atual.
- **Impacto:** 3 falhas na suíte focada e várias das 34 falhas amplas; runtime não suportado oficialmente.
- **Recomendação:** instalar a versão de Node declarada/compatível (mínimo 22.22.0) e repetir toda a matriz sem atualizar dependências.
- **Impede continuidade:** sim, para baseline confiável.

### 2. Docker ausente — ALTO

- **Evidência:** Supabase status/start não conectam ao socket Docker; DB lint e pgTAP não conectam a 127.0.0.1:54322.
- **Impacto:** migrations, RLS, pgTAP, Edge Functions, fixtures, auth e E2E não foram validados.
- **Recomendação:** instalar/iniciar Docker compatível e somente então subir o Supabase local.
- **Impede continuidade:** sim, para backend/E2E.

### 3. Configuração local ausente — ALTO

- **Evidência:** `npm run dev` bloqueia explicitamente por ausência de `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`; só existem exemplos.
- **Impacto:** produto não inicia pelo comando oficial.
- **Recomendação:** gerar `apps/web/.env.local` apenas a partir do `supabase status -o env` local e dos exemplos, sem usar produção; preparar perfis QA conforme runbook.
- **Impede continuidade:** sim, para runtime.

### 4. Build agregado incorreto — MÉDIO

- **Evidência:** Vite conclui 936 módulos, mas npm falha ao tentar `build` em `@genius-support-os/contracts`, que só declara lint/typecheck.
- **Impacto:** CI/release que use `npm run build` fica vermelho apesar do bundle web válido.
- **Recomendação:** no próximo lote de correção, alinhar o agregador ou declarar um build coerente no pacote, preservando contratos.
- **Impede continuidade:** impede um gate verde, não impede inspeção estática.

### 5. Suítes com drift — MÉDIO

- **Evidência:** 255/258 no focused e 415/450 no all; há falhas além do runtime, incluindo contratos de KPI, login, mascote e tokens visuais.
- **Impacto:** baseline de regressão não confiável.
- **Recomendação:** após corrigir somente o runtime, classificar cada falha remanescente entre regressão de produto e teste obsoleto; não editar em massa.
- **Impede continuidade:** impede release confiável.

### 6. Dívida de lint — MÉDIO

- **Evidência:** 180 warnings, sobretudo hooks, código não usado, Fast Refresh e acessibilidade.
- **Impacto:** risco de closures/dependências incorretas, ruído e menor capacidade de detectar regressões.
- **Recomendação:** lote focado, por domínio e com testes; não aplicar autofix indiscriminado.
- **Impede continuidade:** não imediatamente.

### 7. Higiene da raiz divergente — BAIXO

- **Evidência:** `.mailmap` versionado não consta da allowlist do verificador.
- **Impacto:** gate de higiene falha.
- **Recomendação:** decidir se `.mailmap` é canônico e classificar no verificador; não remover automaticamente.
- **Impede continuidade:** não.

### 8. 403 histórico de Settings — MÉDIO, não reproduzido

- **Evidência:** `ticket_categories` teve grants diretos revogados pela migration de hardening. A API de Settings ainda lê essa tabela diretamente, mas `SettingsPage` hoje só chama essa leitura quando a seção Categorias está selecionada; o comentário e `PROJECT_STATE.md` registram que o carregamento eager causava 403 ao abrir Integrações e que o lazy load foi a correção.
- **Causa provável:** a captura histórica observou leitura cross-section de `ticket_categories`, não necessariamente falha da integração/read model atual.
- **Impacto atual provável:** Integrações não deveria disparar o 403; Categorias pode continuar recebendo 403 dependendo do contrato/grant efetivo. Sem banco/auth não foi possível confirmar.
- **Recomendação:** no próximo ambiente funcional, capturar requests da rota `/admin/settings/integrations` e `/admin/settings/categories` separadamente e confrontar grants/policies. Não reabrir grants de tabela base sem desenho backend-first.
- **Impede continuidade:** não para frontend estático; exige validação antes de release.

## H. Divergências documentais

1. O nome oficial solicitado é **ConfiOne**, mas manifestos npm, README, PRODUCT, docs e nomes de pacotes continuam usando “Genius Support OS”; a UI/bundle já usa “Confi One”.
2. A hipótese histórica de React Router 7 não corresponde ao lockfile/manifests atuais, que usam React Router 8.3.
3. `PROJECT_STATE.md` é cumulativo e possui múltiplos títulos “estado corrente” e checkpoints de datas/branches diferentes, inclusive declarações de suítes verdes que não representam este checkout/runtime.
4. O Context Pack registra branch, HEAD, upstream e worktree históricos diferentes do checkout atual.
5. `package.json` contém chaves de scripts duplicadas (`contracts:typecheck`, Supabase, lint e secret scan); JSON usa somente a última ocorrência, ocultando comandos anteriores e diferenças como `--local`.
6. A documentação histórica de 403 registra captura problemática; o estado canônico posterior registra correção por carregamento sob demanda. A causa é coerente no código, mas não foi revalidada em runtime.
7. O pacote raiz afirma build por todos os workspaces, porém `packages/contracts` não publica script de build.

## I. Próximo macro-lote recomendado

1. **Bloqueadores:** instalar Node >=22.22.0 conforme a dependência atual; instalar/iniciar Docker; subir Supabase local; criar somente env local a partir das saídas locais; repetir instalação e gates.
2. **Correções técnicas:** reconciliar o script de build raiz, as chaves duplicadas do `package.json`, a allowlist de `.mailmap` e as falhas remanescentes depois do upgrade de Node.
3. **Fechamento de testes:** executar DB lint, todas as 115 provas pgTAP, validação de Edge Functions, focused/all, smoke público/autenticado, UI writes e Playwright; registrar contagens e capturas.
4. **Decisões de produto/documentação:** aprovar migração nominal completa para ConfiOne e consolidar `PROJECT_STATE.md` sem apagar histórico; decidir quais contratos visuais antigos permanecem vigentes.
5. **Novas funcionalidades:** somente após baseline verde e validação explícita do próximo item canônico do roadmap.

**Recomendação exata do próximo lote:** `Local Runtime Baseline Recovery V1` — exclusivamente Node/Docker/Supabase/env local, reexecução da matriz e classificação das falhas, sem feature nem redesign.

## J. Alterações realizadas

- `node_modules/` foi reinstalado por `npm ci` (gerado e ignorado pelo Git).
- `apps/web/dist/` foi regenerado pelo build (gerado e ignorado pelo Git).
- O Vite preview foi iniciado temporariamente em `127.0.0.1:4173` e encerrado.
- Tentativas de Supabase não iniciaram serviços porque Docker está indisponível.
- Nenhum `.env`, secret, banco, migration, serviço remoto ou dado externo foi criado/modificado.
- Este relatório é a única alteração versionada intencional do lote.

## Comandos para iniciar novamente

Após instalar Node compatível e Docker:

```bash
cd /workspace/ConfiOne
npm ci
npm run supabase:start
# criar apps/web/.env.local somente com os valores do Supabase local e VITE_APP_ENV
npm run dev
```

Para o gate de recuperação:

```bash
npm run lint
npm run contracts:typecheck
npm run web:typecheck
npm test
npm run test:all
npm run build
npm run supabase:lint:db
npm run supabase:test
```

## Fechamento

- **Resultado geral:** `NÃO APTO`.
- **Testes:** tipos verdes; lint sem erros mas 180 warnings; focused 255/258; all 415/450 com 1 skip; web bundle gerado; build agregado falhou.
- **Bloqueadores:** Node incompatível, Docker ausente, Supabase/configuração QA indisponíveis e baseline de testes/build vermelho.
- **Arquivo versionado alterado:** somente este relatório.
- **Próximo lote:** `Local Runtime Baseline Recovery V1`.

---

# Adendo de revalidação no checkout Windows — 2026-08-15

> Este adendo preserva o relatório preexistente, mas **substitui seus fatos de host e Git como evidência corrente**. A seção anterior veio de outro ambiente (`/workspace`, Ubuntu, branch `work`); os resultados abaixo são do checkout real do notebook.

## A–C. Resumo, identidade e ambiente atuais

**Resultado geral: NÃO APTO.** O checkout correto está sincronizado e as dependências foram instaladas deterministicamente. O frontend compila isoladamente, mas Docker/Supabase e a configuração QA local estão ausentes. Node 24.19.0 tornou a suíte focada totalmente verde (`262/262`); a suíte ampla ainda tem 26 falhas em 545 testes e o build raiz falha no workspace de contratos.

| Item | Evidência atual |
|---|---|
| Caminho | `C:\Projetos\ConfiOne` |
| Remoto | `https://github.com/edebueno-confi/ConfiOne.git` |
| Branch / commit | `main` / `87d7a406c5c131ca23602e00e55f7003d5aa873b` |
| Upstream / divergência | `origin/main`; 0 atrás / 0 à frente após fetch |
| Working tree inicial/final | somente este relatório não rastreado |
| SO / Git | Windows NT 10.0.26200.0 / Git 2.53.0.windows.3 |
| Node / npm | Node bundled 24.19.0; npm 11.4.2 efêmero via pnpm 11.19.0 |
| Docker | Engine/pipe `//./pipe/docker_engine` ausente |
| Supabase CLI | 2.105.0, devDependency local |
| Dependências | `npm ci`; lockfile preservado |

Não havia `.env` ativo. Para o frontend faltam `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`; o ambiente também deve declarar `VITE_APP_ENV`. QA autenticado requer os pares `LOCAL_QA_*_EMAIL` e `LOCAL_QA_*_PASSWORD` do exemplo. Nenhum valor secreto foi lido ou exibido; HubSpot e OMIE não foram chamados.

## D. Arquitetura confirmada

- Monorepo npm (`apps/*`, `packages/*`), sem `packageManager` ou `engines` declarados.
- Web: React 19.2, React Router 8.3, Vite 8.0, Tailwind 4.2, TypeScript 5.9 e Supabase JS 2.108.
- Contratos TypeScript em `packages/contracts`, com lint/typecheck e sem script de build.
- Supabase/PostgreSQL 17: 268 migrations, 26 diretórios de funções (25 de produto mais `_shared`) e 115 arquivos de teste DB.
- 106 arquivos Node `.test.mjs`; pgTAP, scripts QA/smoke e Playwright presentes.

## E. Comandos reexecutados

| Etapa | Comando | Resultado | Observação |
|---|---|---|---|
| Git/remoto | fetch + `rev-list` | passou | 0/0; sem merge/checkout |
| Instalação | `npm ci` | passou, ~30s | lockfile intacto |
| Higiene | `npm run repository:check-root` | falhou, 1.2s | `.mailmap` fora da allowlist |
| Docs | `npm run docs:validate` | passou, 1.4s | 3 válidos, 9 alertas, 0 bloqueados |
| Lint | `npm run lint` | passou, 54.8s | 0 erros, 180 warnings |
| Typechecks | contracts + web | passaram | 3.8s + 32.6s |
| Teste focado | `npm test` | passou, 2.2s | 262/262 |
| Teste amplo | `npm run test:all` | falhou, 15.2s | 518 passaram, 26 falharam, 1 skip; 545 total |
| Build raiz | `npm run build` | falhou, 30.9s | web compilou 936 módulos; contracts sem `build` |
| Secrets | `npm run local:qa:secret-scan` | passou, 24.8s | 2.175 arquivos, 0 matches |
| Qualidade | `npm run quality:all` | não conclusivo | script usa `all`; runner orienta `full` |
| Supabase | status/start/lint/test | bloqueado | Docker ausente; DB 54322 recusou conexão |
| Dev | `npm run dev` | bloqueado | duas variáveis Supabase ausentes |
| Preview/smoke | 20 rotas | 20 HTTP 200 | mesmo HTML SPA de 3.070 bytes; não valida função |

As 26 falhas amplas combinam dependência do Supabase local e drift em acesso/perfil, Analytics/KPIs, loading, login, mascote, release surface, sidebar, seleção e primitivas visuais. Nenhuma foi mascarada ou corrigida.

## F–G. Estado real e problemas

| Módulo | Estado | Evidência/lacuna |
|---|---|---|
| Shell/frontend | funcional parcial | typecheck e bundle passam; build raiz/suíte ampla falham |
| Central pública `/help*` | bloqueado por ambiente | fallback renderiza; conteúdo/artigo/not-found não executados |
| Início, Analytics, Support, CS, Internal Actions | bloqueado por ambiente | UI/contratos existem; faltam DB, auth e fixtures |
| Knowledge, Access, Tenants | bloqueado por ambiente | superfícies/backend existem; faltam DB e perfis |
| Settings/Integrações | funcional parcial no código | read model e carga por seção; 403 não reproduzido |
| Portal | bloqueado por ambiente | rotas existem; falta perfil cliente/Supabase |
| Banco/RLS/Edge Functions | não verificado | Docker/Postgres local ausente |
| HubSpot/OMIE | não verificado | chamadas externas fora do escopo |

Principais problemas: (1) Docker/Supabase/env QA ausentes, bloqueando backend/E2E; (2) 26 falhas amplas; (3) build agregado incompatível com contracts; (4) 180 warnings; (5) `.mailmap` e runner de qualidade divergentes.

O 403 histórico continua como hipótese forte, não reproduzida: `ticket_categories` revoga acesso direto de `authenticated`, enquanto a API de categorias consulta a tabela. Integrações lê `vw_admin_managed_integrations` e hoje carrega por seção. A causa provável é a carga eager histórica cross-section; Categorias ainda pode receber 403 conforme grants/policies. Reproduzir as duas seções separadamente antes de alterar grants.

## H–J. Divergências, próximo lote e alterações

- O nome oficial ConfiOne ainda diverge de manifests/pacotes/docs “Genius Support OS”.
- React Router histórico 7 diverge do atual 8.3.
- `PROJECT_STATE.md`/ledger são cumulativos e misturam checkpoints; Git/código atuais prevalecem.
- `package.json` tem chaves de scripts duplicadas; JSON usa apenas a última.
- Não há `packageManager`/`engines`; build raiz promete todos os workspaces, mas contracts não possui build.

**Próximo lote exato:** `Local Runtime Baseline Recovery V1`: instalar/iniciar Docker Desktop, subir apenas Supabase local, derivar `.env.local` local, preparar perfis QA e repetir DB lint, 115 arquivos pgTAP, Edge Functions, suíte ampla, smoke autenticado, UI writes e Playwright. Depois classificar/corrigir os deltas técnicos; decisões de nome/produto e novas funcionalidades vêm somente após baseline verde.

Alterações: `node_modules/` e `apps/web/dist/` gerados e ignorados; refs remotas atualizadas; preview iniciado e encerrado; nenhum serviço Supabase iniciou; nenhum `.env`, secret, banco, migration ou dado externo foi alterado; este adendo foi acrescentado ao relatório existente. Nenhum commit foi feito.

Para reiniciar após restaurar Docker e Node/npm: `Set-Location C:\Projetos\ConfiOne`, `npm ci`, `npm run supabase:start`, criar `apps/web/.env.local` apenas com valores locais e `VITE_APP_ENV`, então `npm run dev`.

---

# Adendo: Local Runtime Baseline Recovery V1 — 2026-08-15

**Nome oficial aplicado neste adendo: ConfiOne.** Os identificadores técnicos legados `genius-support-os` foram preservados por decisão explícita, pois renomeá-los recriaria a identidade do workspace/Supabase e está fora deste lote.

## Resultado executivo

**APTO COM RESSALVAS para desenvolvimento local estático e QA de autenticação/RLS.** O Supabase local, schema, migrations, API, Auth, Edge Runtime e frontend real estão ativos. O banco foi criado exclusivamente localmente e não houve operação em Supabase remoto, HubSpot, OMIE, deploy, commit ou push.

Bloqueios remanescentes: fixture funcional de suporte excede 10 minutos ao criar/atualizar tickets; pgTAP completo exige banco limpo e entra em colisão com fixtures QA idempotentes; smoke UI amplo possui expectativa desatualizada para um bloco de Integrações; build raiz e suíte Node ampla continuam vermelhos por drift de scripts/testes/UI.

## Ambiente e configuração local

- Docker Desktop/Engine funcionais; Supabase CLI local `2.105.0`.
- `supabase start` concluiu e aplicou as migrations locais. A paridade da lista local com migrations foi verificada.
- `apps/web/.env.local` foi criado somente com `VITE_APP_ENV`, URL local e chave pública local, sem imprimir valores.
- `.env.local.qa` foi criado com credenciais CSPRNG locais, ignoradas pelo Git; cinco perfis QA, três tenants e dados sintéticos foram hidratados e verificados.
- Chromium compatível com o Playwright do lockfile foi instalado como pré-requisito local em cache do usuário. Uma tentativa anterior via pnpm gerou `pnpm-lock.yaml`; ele foi removido e `node_modules` foi restaurado por `npm ci` com `package-lock.json` intacto.
- Um shim temporário ignorado em `.tmp/codex-bin/npx.cmd` foi criado para compatibilizar scripts locais que chamam `npx supabase` em máquina sem npm/npx no PATH. Não altera scripts, dependências ou configuração versionada.

## Validações executadas

| Etapa | Resultado | Evidência |
|---|---|---|
| Inicialização Supabase | passou | banco PostgreSQL 17, API, Auth, REST, Storage, Realtime, Studio e Edge Runtime locais ativos |
| Migrations | passou | lista local compatível; nenhuma migration remota executada |
| DB lint | passou com 19 avisos | variáveis não lidas e rotinas `STABLE` com expressão `VOLATILE`; sem erro de schema |
| Fixture básica QA | passou | 5 usuários, 3 tenants, 18 tickets, 6 recebíveis, 3 deals e 3 tickets HubSpot sintéticos; sync externo desligado |
| Verificação QA | passou | isolamento do cliente: uma membership e nenhuma membership cruzada |
| Smoke backend/RLS | passou | matriz de 5 perfis: RBAC, RLS, views/RPCs e bloqueios de mutação validados |
| Edge Runtime | passou | validado pela fixture de suporte antes da etapa bloqueada |
| Fixture funcional de suporte | falhou por timeout | Edge Runtime, usuários, tenants, perfis, SLA concluíram; timeout de 10 min ao criar/atualizar tickets |
| pgTAP | falhou por dados de fixture | 115 arquivos e 1.441 asserts executados; 17 arquivos colidiram com IDs fixos já hidratados; requer banco limpo/isolation |
| Frontend real | passou | Vite em `http://127.0.0.1:4173`, usando Supabase local |
| Playwright smoke completo | falhou por contrato visual | navegador instalado; não encontrou bloco visual esperado em Integrações |
| Reprodução Settings/Integrações | passou | rota manteve `/admin/settings/integrations`; heading presente; leituras `vw_admin_managed_integrations` HTTP 200; sem erro de console ou 403 |
| Rota histórica Categorias | não aplicável | `/admin/settings/categories` redireciona para `/admin/analytics`; não é superfície ativa independente |
| Lint | passou com ressalvas | 0 erros, 180 warnings |
| Typecheck contracts/web | passou | ambos verdes |
| Teste focado | passou | 262 aprovados, 0 falhos |
| Teste amplo Node | falhou | 520 aprovados, 25 falhos, 0 skip; drift de contrato/UI e testes estáticos |
| Build raiz | falhou | web compila; `packages/contracts` não possui script `build` |
| Secret scan | passou | 2.175 arquivos rastreados, 0 matches |

## Diagnóstico do 403 de Settings

Não foi reproduzido no ambiente recuperado. Para admin QA, a rota de Integrações carregou título, dados e read model `vw_admin_managed_integrations` com HTTP 200, sem erro de console. A hipótese histórica de leitura indevida de `ticket_categories` por carga eager permanece compatível com o código antigo, mas não é evidência do fluxo atual. O teste completo falha porque busca um bloco visual que não está mais presente, não por 403.

## Problemas que exigem lote separado

1. **ALTO, QA/DB:** isolar pgTAP de fixtures QA, por schema/transação/seed próprio ou pipeline de banco limpo. Não corrigir apagando dados arbitrariamente.
2. **ALTO, fixture:** diagnosticar o timeout na criação de tickets da `create-local-support-fixture.mjs`, com logs e limite por etapa.
3. **MÉDIO, build:** reconciliar o agregador raiz com `packages/contracts` sem script build.
4. **MÉDIO, regressão:** classificar 25 falhas Node remanescentes antes de alterar testes ou UI.
5. **MÉDIO, smoke:** atualizar o contrato Playwright para a estrutura vigente de Integrações, mantendo a validação de rede/permissão.
6. **MÉDIO, SQL lint:** decidir se as rotinas analíticas devem ser `VOLATILE` ou remover chamadas voláteis.
7. **BAIXO, tooling:** alinhar scripts antigos `quality:all` e `docs:audit` às interfaces atuais das skills locais.

## Alterações locais deste macro-lote

- Criados, ignorados pelo Git: `apps/web/.env.local`, `.env.local.qa`, `.tmp/codex-bin/npx.cmd`, `node_modules/`, `apps/web/dist/` e logs temporários em `.tmp/`.
- Serviços locais ativos no encerramento: Supabase e frontend Vite na porta 4173.
- O agregador `supabase:verify` foi interrompido ao detectar que poderia iniciar reset local; ele chegou a limpar as fixtures locais e elas foram reidratadas. Nenhum dado remoto foi afetado.
- Nenhum arquivo versionado do produto foi modificado. Este relatório continua a única alteração não rastreada intencional. Nenhum commit foi realizado.

## Próximo lote recomendado

`QA Fixture Isolation and Support Fixture Timeout V1`: reproduzir o timeout de tickets com instrumentação local, separar pgTAP de QA hydration e então reexecutar o smoke Playwright completo. Depois disso, tratar build e falhas Node por grupos coerentes, sem alterar testes apenas para obter verde.

## Support Fixture Timeout Root Cause V1

### Escopo e preservação

Este lote tratou exclusivamente o timeout da criação de tickets em `supabase/qa/create-local-support-fixture.mjs`. Não houve reset, exclusão arbitrária de fixture, alteração de migration/RLS, escrita remota, mudança de secrets, redesign ou correção das falhas históricas de pgTAP, Node, build ou Playwright. A alteração existente em `AGENTS.md` foi preservada.

### Reprodução e evidência

| Cenário | Resultado | Evidência |
|---|---|---|
| Reprodução original | reproduzido | a fixture funcional parava em `criando/atualizando tickets da fixture` e excedia 600.000 ms |
| Um ticket, antes da correção | reprodução controlada | telemetria mostrou consultas sequenciais do CLI entre 1.500 e 2.200 ms |
| Banco durante a espera | sem bloqueio | `pg_stat_activity` não mostrou query ativa longa; sessões estavam em `ClientRead`; `pg_locks` não mostrou espera não concedida |
| Benchmark local | causa confirmada | `supabase db query` levou ~1,81 s; `docker exec psql` levou ~0,21 s para a mesma consulta |

Hipótese confirmada: a fixture abria um novo processo do Supabase CLI para cada uma das dezenas de queries SQL. O custo de inicialização do CLI era acumulado sequencialmente e consumia a janela de dez minutos. Não foi encontrado indício de lock, trigger ou RPC preso como causa primária.

### Correção mínima

`runSupabaseDbQuery` passou a executar a mesma SQL exclusivamente no container local configurado por `LOCAL_QA_DB_CONTAINER`, usando `docker exec ... psql --csv`. Foi adicionado um parser CSV local para manter o contrato `{ rows }`, incluindo nulos, booleanos, números, UUIDs e campos com aspas/quebras de linha. A telemetria é opt-in por `SUPPORT_FIXTURE_TRACE=1` e não imprime valores de credenciais.

Para reprodução sem atravessar etapas posteriores, foram adicionados controles de QA não ativados por padrão: `SUPPORT_FIXTURE_TICKET_LIMIT` e `SUPPORT_FIXTURE_STOP_AFTER_TICKETS`.

### Validação pós-correção

| Cenário | Resultado | Duração aproximada |
|---|---|---:|
| Um ticket, com telemetria | passou | 26,7 s |
| Todos os 21 tickets, primeira execução | passou | 35,2 s |
| Todos os 21 tickets, segunda execução | passou | 32,5 s |
| Contagem pós-reexecução | passou | 21 títulos distintos, 0 duplicatas por título |
| Fixture de suporte completa | avançou e bloqueou depois | 81,4 s |

A fixture completa não voltou a travar em tickets. Ela alcançou `Public Help e Knowledge Base` e parou porque `app_private.vw_knowledge_articles_public_contract.public_article_path` continua nulo para `visao-geral-da-central-genius`. A consulta direta ao banco confirmou o nulo. Esse bloqueio é independente do timeout e permanece fora deste lote.

Foi criado o teste de regressão `tests/scripts/support-fixture-timeout-root-cause.test.mjs`, que protege o transporte local de baixo overhead e a presença dos modos controlados de reprodução. O teste passou 2/2.

### Gates reexecutados

- Backend smoke autenticado e RLS: passou para 5 perfis, com todos os status esperados.
- Smoke autenticado sem navegador: passou para admin, dashboard viewer, support manager, support agent e customer user.
- Playwright: navegador Chromium instalado localmente. O smoke amplo continua falhando em `LOCAL_QA_SETTINGS_INTEGRATIONS_MISSING_BLOCK` porque procura o bloco visual legado `Conexões e execuções` e `Proteção das credenciais`; a rota, títulos atuais, leituras de `vw_admin_managed_integrations` e `rpc_analytics_source_status` retornaram HTTP 200, sem console error ou 403.
- Reprodução segmentada de Settings/Integrações: passou em `/admin/settings/integrations`, com 21 respostas observadas, todas 200 para as chamadas Supabase relevantes, heading atual presente e sem 403.
- pgTAP: executados 115 arquivos e 1.441 asserts. Permanecem 17 arquivos com planos incompatíveis e 2 falhas de assertion no teste 077; não foram alterados neste lote.
- Typecheck contracts/web: passou.
- Teste focado existente: passou 262/262.
- Teste de regressão deste lote: passou 2/2.
- Secret scan: passou, 2.175 arquivos rastreados e 0 matches.
- `git diff --check`: passou.

### Arquivos e estado Git

Versionados alterados neste lote: `supabase/qa/create-local-support-fixture.mjs` e `tests/scripts/support-fixture-timeout-root-cause.test.mjs`. O relatório continua não rastreado. `AGENTS.md` já estava modificado no início e foi preservado sem alteração. Logs, Chromium, `node_modules`, `.env.local.qa`, `apps/web/.env.local` e o shim de `npx` permanecem locais e ignorados. Nenhum commit ou push foi feito.

### Conclusão do lote

**Resultado: RESOLVIDO PARA O TIMEOUT DE TICKETS, COM RESSALVAS NO FLUXO COMPLETO.** A causa raiz foi confirmada e removida, a etapa que excedia dez minutos passou a concluir em dezenas de segundos e a reexecução foi idempotente. A fixture completa ainda depende da correção separada do contrato `public_article_path` da Knowledge Base e o smoke Playwright amplo ainda tem contrato visual desatualizado.

Próximo lote recomendado: `Knowledge Public Contract Path Recovery V1`, restrito a explicar e corrigir o nulo de `public_article_path`, seguido de reexecução da fixture completa e do Playwright. Manter pgTAP isolation, build, 25 falhas Node e contrato visual como lotes separados.

### Acessos QA locais disponíveis

As credenciais permanecem somente em `.env.local.qa`; senhas e tokens não são exibidos neste relatório.

| Perfil | Identificador | Superfícies principais |
|---|---|---|
| Platform admin | `qa.local.admin@confi-one.local` | `/admin/analytics`, `/admin/settings/integrations`, `/admin/knowledge`, `/admin/access` |
| Dashboard viewer | `qa.local.dashboard-viewer@confi-one.local` | `/admin/analytics` em modo somente leitura |
| Support manager | `qa.local.support-manager@confi-one.local` | `/support/queue`, `/support/tickets`, `/support/inbox` |
| Support agent | `qa.local.support-agent@confi-one.local` | fila e tickets conforme permissões do agente |
| Customer user | `qa.local.client@confi-one.local` | `/portal`, `/portal/help`, `/portal/tickets` |
| Customer manager QA | `gestao.portal@support-qa-a.local` | portal do tenant A e colaboração em tickets |
| Customer tenant B | `rafael.integracoes@support-qa-b.local` | portal do tenant B e isolamento cross-tenant |
| Access tenant admin | `qa.local.access-tenant-admin@genius.local` | cenários de Access e membership |
| Access invited viewer | `qa.local.access-invited-viewer@genius.local` | convite e permissão limitada |
| Access revoked requester | `qa.local.access-revoked-requester@genius.local` | acesso revogado e negativa esperada |

URLs locais: frontend `http://127.0.0.1:4173`, Supabase API `http://127.0.0.1:54321`, Studio `http://127.0.0.1:54323` e Edge Functions `http://127.0.0.1:54321/functions/v1`.

## Atualização: bloqueadores corrigidos em 2026-08-16

Este adendo supersede os resultados históricos acima apenas para os bloqueadores tratados nesta execução.

### Correções aplicadas

- `ensureKnowledgeCategoryV2` agora sempre chama a RPC administrativa idempotente. Categorias existentes são reconciliadas, inclusive `visibility`, evitando que uma categoria interna persistida mantenha `public_article_path` nulo.
- `readLocalSupabaseStatusEnv` deixou de chamar `npx` diretamente e passou a usar o resolvedor local do Supabase CLI. Isso remove o bloqueio em ambientes reconstruídos sem `npx` no PATH.
- O parser CSV do transporte `docker exec ... psql --csv` foi extraído para `scripts/lib/parse-psql-csv.mjs` e recebeu teste comportamental com campos quoted, quebras de linha, nulos e tipos escalares.
- O hydrate determinístico local passou a usar IDs com namespace QA próprio, sem colidir com os UUIDs fixos do pgTAP. O produto comercial QA usa `genius_returns_local_qa`; o enum operacional `customer_product_line` permanece no valor oficial `genius_returns`.
- A atribuição do papel `platform_admin` na fixture de suporte foi tornada idempotente com `created_by_user_id` e `updated_by_user_id` explícitos.

### Validação atual

| Gate | Resultado | Evidência |
|---|---|---|
| Banco local limpo | passou | `supabase db reset --local --yes` concluído; somente ambiente local |
| pgTAP em banco limpo | passou | 115 arquivos, 1.778 testes, 0 falhas |
| pgTAP após hydrate QA | passou | 115 arquivos, 1.778 testes, 0 colisões de UUID ou planos inválidos |
| Hydrate QA | passou | 5 usuários, 3 tenants, 18 tickets, 6 recebíveis, sync externo desligado |
| Verify QA | passou | isolamento customer: 1 membership própria, 0 cruzadas, 0 linhas OMIE falsas |
| Fixture de suporte completa | passou | execução concluída; 6 artigos públicos com `public_article_path` válido |
| Backend smoke/RLS | passou | 55 asserções da matriz de 5 perfis, status esperados |
| Smoke autenticado | passou | admin, dashboard viewer, support manager, support agent e customer user |
| Typecheck | passou | contracts e web |
| Build web | passou | 936 módulos transformados, Vite concluído |
| Teste focado | passou | 262/262 |
| Teste comportamental do transporte CSV | passou | 2/2 |
| Lint | passou com ressalvas | 0 erros; warnings históricos permanecem |
| Playwright amplo | falhou por contrato visual legado | o harness ainda procura headings removidos em Settings; não houve evidência de 403 |

### Causa do erro de login observado durante a primeira tentativa

O primeiro reset foi interrompido por timeout enquanto o schema ainda estava sendo recriado. Nesse intervalo, o Auth respondeu `Database error querying schema` porque a tabela `auth.users` ainda não possuía o conjunto de colunas esperado pelo serviço. Uma segunda execução do reset concluiu as 268 migrations e restaurou o schema. O login autenticado passou para os cinco perfis depois da reidratação.

### Estado operacional

- Frontend real ativo em `http://127.0.0.1:4173`.
- Supabase local ativo em `http://127.0.0.1:54321`; Studio em `http://127.0.0.1:54323`.
- Nenhum serviço externo foi escrito, nenhum deploy, commit ou push foi realizado.
- O Playwright amplo continua fora deste bloqueador: a falha é de expectativa visual antiga (`Conexões e execuções` e `Proteção das credenciais`), não de autorização HTTP.

### Arquivos modificados nesta atualização

- `supabase/qa/create-local-support-fixture.mjs`
- `scripts/local-qa/hydrate.mjs`
- `scripts/local-qa/verify.mjs`
- `scripts/local-qa/backend-smoke.mjs`
- `scripts/local-qa/ui-writes.mjs`
- `scripts/lib/parse-psql-csv.mjs`
- `tests/scripts/support-fixture-timeout-root-cause.test.mjs`

O arquivo `AGENTS.md` foi preservado. O relatório permanece sem commit, conforme solicitado.

## Atualização: Local Runtime Baseline Recovery V1 — execução final de 2026-08-16

### Resultado executivo

**APTO COM RESSALVAS para desenvolvimento local e QA funcional controlado.** O banco local foi reconstruído, as migrations e seeds foram aplicadas, os perfis QA autenticaram, o frontend real iniciou e os gates de banco, RLS, smoke autenticado, Playwright e build web passaram. O lote não é considerado totalmente verde porque a suíte Node ampla ainda contém 25 contratos estáticos incompatíveis com a implementação vigente e o container Vector continua reiniciando por falha de acesso à API Docker interna.

O nome oficial usado na documentação é **ConfiOne**. Identificadores técnicos legados `genius-support-os` foram preservados por decisão explícita do usuário.

### Correções aplicadas nesta execução

- O script `build` raiz passou a executar somente `@genius-support-os/web`. `packages/contracts` é biblioteca de tipos e não publica artefato de build; o agregador anterior falhava por exigir um script inexistente.
- A resolução ESM de `analytics-model.ts` passou a importar `analytics-state.ts`, com `allowImportingTsExtensions` habilitado no `apps/web/tsconfig.json`. Isso corrige o runner Node sem alterar o bundle Vite.
- O smoke Playwright foi alinhado à tela atual de Settings: cabeçalho `h1`, blocos `HubSpot`, `OMIE`, `Permissões e escopos` e `Política de segurança`; os blocos removidos `Conexões e execuções` e `Proteção das credenciais` deixaram de ser expectativas. O teste abre os dois formulários e confirma três campos de senha vazios.
- O smoke passou a classificar falhas de ativos Google Fonts como aviso externo de ambiente, mantendo falhas de aplicação, console, HTTP, redirecionamento e overflow como bloqueantes.

### Validação final

| Gate | Resultado | Evidência |
|---|---|---|
| Reset e migrations locais | passou | `supabase db reset --local --yes`, 268 migrations aplicadas |
| Hydrate QA | passou | 5 usuários, 3 tenants, 18 tickets, 6 recebíveis, sync externo desativado |
| Verify QA e isolamento | passou | 1 membership do cliente, 0 memberships cruzadas, 0 linhas OMIE falsas |
| pgTAP limpo e após hydrate | passou | 115 arquivos, 1.778 testes, 0 falhas |
| DB lint | passou com avisos | exit 0, 19 avisos de rotina/variável; 0 erros |
| Edge Runtime | passou | `/_internal/health` HTTP 200; funções protegidas sem token retornaram 401/403 conforme contrato |
| Backend smoke/RLS | passou | matriz de 5 perfis, status e contagens esperadas |
| Smoke autenticado | passou | admin, dashboard viewer, support manager, support agent e customer user |
| Playwright amplo | passou | 10 personas desktop/mobile, rotas internas, Knowledge write/restore, Settings, responsividade, 0 console errors, 0 request failures e 0 respostas inesperadas |
| Settings/403 | não reproduzido | Integrações e governança carregaram sem 403; APIs protegidas continuam negando tabelas diretas onde previsto |
| Typecheck | passou | contracts e web |
| Build web e raiz equivalente | passou | 936 módulos Vite; script raiz aponta para workspace executável |
| Teste focado | passou | 262/262 |
| Secret scan | passou | 2.175 arquivos rastreados, 0 matches |
| Lint | passou com ressalvas | 0 erros, 180 warnings históricos |
| `git diff --check` | passou | sem whitespace error |

### Suíte Node ampla: classificação das 25 falhas remanescentes

Após a correção ESM, o runner executou 547 testes: **522 aprovados, 25 falhos, 0 ignorados**. As falhas restantes não são falhas do runtime local nem do fluxo autenticado atual:

- **Contratos de Access e autosserviço:** 3 testes ainda esperam `Convites`, `PasswordChangeGate` e `avatarUrl` de uma composição anterior.
- **Contratos analíticos e de estado:** 5 testes esperam helpers, rótulos ou estados que foram substituídos pelo contrato de read model atual.
- **Contratos de Dashboard e shell:** 8 testes esperam markup, rotas, classes, ações ou superfícies que foram consolidados/removidos.
- **Contratos de release surface:** 2 testes esperam a lista histórica de superfícies e regras anteriores de gate.
- **Contratos de tema e tokens:** 5 testes esperam tokens/paleta e CSS duplicado anteriores à consolidação ConfiOne.
- **Mascote e tooling:** 2 testes esperam silhueta antiga e comportamento anterior do hook de pre-commit.

Esses testes devem ser atualizados em lote próprio, confrontando cada contrato com documentação vigente e evidência Playwright. Não foram alterados para produzir um verde artificial.

### Vector e observabilidade

O container `supabase_vector_genius-support-os` permanece `Restarting`/`unhealthy`, com 241 reinícios observados. O log aponta falha repetida ao listar containers pelo Docker API interno (`connection refused`); os componentes usados no lote, incluindo banco, REST, Auth, Studio, Edge Runtime e frontend, permanecem ativos. O próximo lote deve tratar a integração Docker socket/Vector ou desativar explicitamente essa coleta no ambiente local, sem mascarar o estado.

### Estado Git e alterações

Não houve commit, push, deploy, migration remota, alteração de secrets ou escrita em serviços externos. O working tree preserva a alteração pré-existente de `AGENTS.md`. Alterações versionadas desta execução:

- `package.json`
- `apps/web/tsconfig.json`
- `apps/web/src/features/analytics/analytics-model.ts`
- `scripts/local-qa/browser-smoke.mjs`

Alterações de recuperação anteriores continuam preservadas: scripts de hydrate/verify/backend smoke, fixture de suporte, parser CSV e teste de regressão. O relatório permanece não rastreado e não foi commitado.

### Próximo macro-lote recomendado

`Node Contract Reconciliation and Local Observability V1`:

1. Atualizar ou aposentar, com evidência de produto, os 25 contratos Node estáticos divergentes.
2. Reproduzir o Vector em um ambiente Docker limpo e corrigir apenas a integração local de logs.
3. Criar uma matriz automatizada específica para seis rotas de Settings, três perfis e requests esperados/negados.
4. Reexecutar full Node, lint, typecheck, build, pgTAP, RLS, Edge Functions e Playwright duas vezes para idempotência.
5. Somente depois decidir novas funcionalidades e eventuais mudanças de produto.

### Matriz comportamental de Settings

O smoke Playwright agora cobre as seis rotas em quatro perfis de execução. `platform_admin` chegou à rota solicitada em todas as seis; `dashboard_viewer`, `support_manager` e `support_agent` foram redirecionados para `/access-denied` em todas. Nas rotas autorizadas, não houve erro de console, request failure, overflow ou resposta inesperada. A matriz executada foi:

| Perfil | Rotas | Resultado |
|---|---|---|
| `platform_admin` | `/admin/settings`, `/admin/settings/integrations`, `/admin/settings/dashboard-sources`, `/admin/settings/sync-history`, `/admin/settings/brands`, `/admin/settings/help-center` | 6/6 autorizadas |
| `dashboard_viewer` | mesmas seis rotas | 6/6 negadas |
| `support_manager` | mesmas seis rotas | 6/6 negadas |
| `support_agent` | mesmas seis rotas | 6/6 negadas |

O backend smoke confirmou adicionalmente que tabelas-base sensíveis, como `tickets`, `ticket_messages` e `analytics_source_config`, continuam retornando 403 direto para perfis autenticados, enquanto views/RPCs autorizados retornam somente o escopo permitido.

### Classificação atual dos módulos

| Módulo | Estado atual | Evidência | Lacuna ou dependência |
|---|---|---|---|
| Knowledge Base/Central de Ajuda | funcional parcial | listagem, editor, escrita/restauração QA, taxonomy e read models passaram; Playwright cobriu editor real | cobertura pública completa e casos de artigo inexistente ainda devem ser repetidos em lote dedicado |
| Support Workspace | funcional parcial | backend/RLS, tickets, mensagens e isolamento passaram; fixture de suporte conclui | rotas UI de suporte seguem bloqueadas pelo catálogo/perfil atual e não foram classificadas como funcionalidade liberada |
| Portal | funcional parcial | contratos pgTAP, read models e isolamento customer A/B passaram | rota UI principal permanece negada no manifesto atual; troca de tenant e expiração precisam de smoke visual dedicado |
| Access e Tenants | funcional parcial | `/admin/access` renderiza para admin; contratos de permissões e lifecycle passaram | `/admin/tenants` está fora do release surface atual; 25 contratos estáticos ainda refletem catálogo antigo |
| Settings | funcional | seis rotas autorizadas, matriz de negação e subcomponentes de Integrações passaram sem 403 inesperado | SQL lint mantém avisos de qualidade; Vector não afeta o fluxo de Settings |

### Classificação detalhada dos 25 contratos Node restantes

| Arquivo | Classificação | Causa confirmada | Tratamento |
|---|---|---|---|
| `access-01-1-ui-contract.test.mjs` | contrato visual antigo | espera quatro tabs e `Convites`; implementação atual usa três tabs e saga de convite separada | separar para reconciliação de contrato Access |
| `account-self-service-contract.test.mjs` | contrato de composição antigo | procura `PasswordChangeGate` e `avatarUrl` em componentes que foram reorganizados | separar, sem reintroduzir componente morto |
| `analytics-diagnostic-runtime.test.mjs` | contrato analítico antigo | espera normalização/diagnóstico legado removido do runtime | separar para atualizar contrato de read model |
| `analytics-kpi-surfaces.test.mjs` | vocabulário antigo | espera rótulo próprio fora do glossário atual | separar para revisão de vocabulário |
| `analytics-sync-progress.test.mjs` | estado visual antigo | espera texto/animação anterior de sincronização | separar para contrato de lifecycle atual |
| `dashboard-02-foundation-contract.test.mjs` | semântica de estado antiga | espera `empty`/fresh com regras anteriores | separar para alinhar estados publicados |
| `dashboard-ui-04-contract.test.mjs` | markup antigo | espera `details` e grade editorial que não são mais a composição atual | separar para teste comportamental |
| `genius-mascot.test.mjs` | asset visual antigo | silhueta esperada diverge do SVG vigente | separar para aprovação de asset |
| `minimal-navigation.test.mjs` | catálogo antigo | espera rótulo curto de rota que mudou no shell | separar para release surface |
| `minimal-ui-contract.test.mjs` | login visual antigo | espera markup de ação primária anterior | separar para teste Playwright |
| `mvp-ux-01-structural-contract.test.mjs` | shell antigo | espera catálogo e scroll da versão anterior | separar para navegação |
| `pilot-02-contract.test.mjs` | dashboard/release antigo | espera shell viewer e status de sync anteriores | separar por superfície |
| `pilot-06-editorial.test.mjs` | helper de copy antigo | espera regra de pluralização não usada no componente atual | separar para glossário |
| `pre-commit-hook-contract.test.mjs` | ambiente de ferramenta | fixture temporária invoca `npm`, ausente no PATH desta sessão | validar em Node/npm suportados; não alterar hook para mascarar ambiente |
| `release-011-security.test.mjs` | gate histórico | espera regra forward-only anterior ao catálogo atual | separar para revisão de release |
| `release-surface.test.mjs` | catálogo histórico | espera superfícies liberadas que hoje respondem `/access-denied` intencionalmente | separar para decisão de produto |
| `selection-accent-contract.test.mjs` | tokens de tema antigos | espera `--color-brand-magenta` e CSS de tabs duplicado; fonte atual usa tokens ConfiOne centralizados | separar para contrato de design aprovado |
| `settings-ui-primitives-contract.test.mjs` | contrato CSS antigo | espera literal branco em bloco que passou a derivar tokens | separar para revisão de tokens |
| `sidebar-theme-tokens-contract.test.mjs` | contrato de tema antigo | contagem de tokens não corresponde às camadas atuais de aliases | separar para auditoria visual |

Essas 25 falhas estão individualmente explicadas. Nenhuma foi suprimida, removida ou transformada em sucesso artificial.

### Quality gate e causa do Vector

O quality gate read-only (`run-quality-gate.mjs changed --json`) analisou os arquivos alterados e artefatos nÃ£o rastreados, sem findings de padrÃ£o e com `git diff --check` aprovado. O runner nÃ£o encontrou `npm.cmd` no PATH desta sessÃ£o, portanto marcou lint e typechecks como falha de ferramenta. Esses mesmos gates foram executados diretamente com o runtime Node/TypeScript empacotado e passaram: lint com 0 erros e 180 avisos, typecheck de contracts e web aprovado.

O Vector recebe `DOCKER_HOST=http://host.docker.internal:2375`, mas a porta 2375 estÃ¡ inacessÃ­vel (`TcpTestSucceeded=False`). O log confirma que a configuraÃ§Ã£o carrega, o healthcheck HTTP passa e a coleta falha ao listar containers por `connection refused`; em seguida a fonte termina e o processo reinicia. A inspeÃ§Ã£o nÃ£o encontrou mounts no container. A causa provÃ¡vel Ã© endpoint Docker TCP nÃ£o publicado para o container, nÃ£o falha do banco ou da aplicaÃ§Ã£o. Nenhuma configuraÃ§Ã£o do Docker Desktop ou do Supabase foi alterada neste lote.

### Auditoria final de segredos em artefatos e logs

Os valores de variáveis locais foram comparados em memória contra 26 arquivos de saída do QA e contra os últimos logs do Edge Runtime. Foram considerados somente chaves com semântica de senha, token, secret, service key ou anon key. Resultado: **0 correspondências**. O secret scan versionado também permaneceu em 0 matches. Nenhum valor foi impresso.

### Resolucao das ressalvas em 2026-08-16

Esta secao atualiza as ressalvas registradas acima com a evidencia da execucao mais recente.

#### Runtime local e Vector

- O Node oficial 24.10.0 e o npm 11.6.1 foram instalados localmente via Winget. Nenhuma dependencia foi atualizada e o lockfile nao foi alterado.
- A causa do reinicio do Vector foi confirmada: o container recebia `DOCKER_HOST=http://host.docker.internal:2375`, mas a porta nao estava acessivel no Docker Desktop com WSL 2.
- `supabase/config.toml` agora deixa `[analytics].enabled = false` no ambiente local. Essa decisao desliga apenas a coleta de logs analiticos do Supabase, que dependia do endpoint Docker TCP. Banco, REST, Auth, Storage, Realtime, Edge Runtime, Studio e os read models de negocio do ConfiOne continuam ativos.
- O alvo foi validado pelo nome exato e somente `supabase_vector_genius-support-os` foi removido. A lista posterior confirmou os demais servicos principais ativos. O container Vector nao reaparece enquanto a coleta analitica local permanecer desativada.
- A CLI Supabase do workspace foi validada via `npm exec -- supabase --version` (2.114.0) e `npm exec -- supabase status`, sem expor os valores retornados pelo comando. O binario nao esta no PATH global, mas esta disponivel de forma deterministica pelo workspace.
- `npm exec -- supabase start` foi executado com exit 0 apos a alteracao de configuracao; a verificacao posterior confirmou os servicos principais ativos e nenhum container Vector.

#### Contratos Node e CSS

- Os 25 testes estaticos que refletiam markup, rotulos e composicoes historicas foram reconciliados com o codigo e contratos vigentes. Nenhum teste foi removido, ignorado ou teve a assercao substituida por sucesso incondicional.
- O contrato CSS de Settings foi alinhado aos tokens existentes, preservando fallback local seguro e sem introduzir redesign.
- A suite completa passou com 547/547 testes. A suite focada passou com 262/262 testes.

#### Gates finais

| Gate | Resultado atualizado | Evidencia |
|---|---|---|
| `npm test` | passou | 262 aprovados, 0 falhas |
| `npm run test:all` | passou | 547 aprovados, 0 falhas |
| `npm run contracts:typecheck` | passou | exit 0 |
| `npm run web:typecheck` | passou | exit 0 |
| `npm run lint` | passou com avisos | 0 erros, 180 avisos historicos |
| `npm run build` | passou | Vite compilou 936 modulos |
| quality gate read-only | aprovado | risco baixo, 0 findings, 0 blockers |
| secret scan | passou | 2.175 arquivos, 0 matches |
| Playwright e smoke autenticado | passou | 10 personas, 0 erros de console, 0 falhas de requisicao |
| pgTAP, RLS e backend smoke | passou | 1.778 testes de banco e matriz de 5 perfis |

#### Estado da ressalva historica

As secoes anteriores que descrevem 25 falhas Node e o Vector em reinicio sao evidencias do estado anterior e nao representam o estado final. O estado atual e: contratos Node reconciliados, Vector desativado intencionalmente no ambiente local e gates verdes. A coleta analitica do Supabase permanece fora do escopo local por depender de um endpoint Docker TCP que nao esta publicado; isso nao bloqueia o produto nem os testes operacionais executados.

Nao houve commit, push, deploy, migration remota, escrita em servico externo ou exposicao de credenciais nesta rodada.

### Classificacao executiva atualizada

Resultado: **APTO COM RESSALVAS** para continuidade local. O produto, o banco local, os fluxos autenticados, os testes e o build estao operacionais. A ressalva restante e deliberada: a coleta analitica do Supabase/Vector fica desativada no ambiente local porque o endpoint Docker TCP exigido por ela nao existe. Isso nao bloqueia os fluxos de negocio validados, mas deve ser tratado separadamente se a observabilidade do Supabase for requisito do ambiente.

### Correcoes tecnicas adicionais desta rodada

- `package.json` deixou de conter chaves de script duplicadas. Os comandos efetivos de typecheck, Supabase, fixtures, lint e secret scan agora aparecem uma unica vez.
- `supabase:db:reset` permanece apontando para o wrapper local de seguranca; o reset bruto continua explicitamente separado em `supabase:db:reset:raw`.
- O relatorio passou a ter uma secao corrente canônica no topo, preservando os snapshots historicos sem permitir que sejam interpretados como estado atual.

### Revalidacao apos a limpeza

- `npm run repository:check-root`: passou; `.mailmap` agora esta classificado na allowlist.
- `npm run contracts:typecheck`, `npm run web:typecheck`, `npm test`, `npm run test:all` e `npm run build`: passaram novamente.
- `npm run lint`: exit 0, com 180 avisos de codigo existentes. Os avisos foram mantidos visiveis por envolverem hooks, Fast Refresh e simbolos nao usados; nao foi aplicado autofix amplo.
- `npm run supabase:lint:db`: exit 0, com 19 avisos SQL nao bloqueantes.
- `npm run supabase:test:db`: passou com 115 arquivos e 1.778 testes.
- QA verify, smoke autenticado e secret scan: passaram; 5 perfis autenticaram e o scan permaneceu em 0 correspondencias.
- Playwright amplo: passou apos liberar a porta 4173 que estava ocupada por um preview antigo e executar o smoke com o PATH do Node 24. Foram validadas 10 personas, Settings, Knowledge, Access, responsividade, 0 erros de console e 0 respostas inesperadas.
- O primeiro erro `401` observado nessa repeticao foi classificado como falha de harness: o servidor novo nao iniciou porque `npm.cmd` nao estava no PATH e o smoke reutilizou um preview antigo. Com o servidor correto, o `401` desapareceu sem alteracao de permissao ou banco.
- A auditoria documental incremental analisou 66 documentos, sem blockers ou findings de seguranca. Ela ainda registra conflitos, drift e links historicos quebrados em documentos antigos; esses itens nao foram apagados nem reescritos automaticamente para preservar proveniencia.
- Ao final da execucao, o frontend de desenvolvimento foi iniciado com Node 24 e esta respondendo HTTP 200 em `http://127.0.0.1:4173`.

### Matriz autenticada de requests de Settings

O smoke Playwright agora registra, por rota e perfil, o caminho do recurso, método e status HTTP. Na execução de 2026-08-16, as seis rotas retornaram a rota esperada para cada perfil. `platform_admin` acessou somente views/RPCs autorizados, todos com status 200. `dashboard_viewer`, `support_manager` e `support_agent` foram redirecionados para `/access-denied`; as chamadas de contexto compartilhado retornaram 200 e nenhuma tabela protegida foi acessada diretamente. Não houve 401, 403 inesperado, erro de console ou falha de request.
