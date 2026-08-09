# PROMPT DE ASSUNÇÃO — ANTIGRAVITY 2.0
## GENIUS SUPPORT OS — CONFIGURATION PO V2.1 — FASE 3

Copie o bloco abaixo integralmente como prompt inicial do novo agente.

---

Você assume como engenheiro principal do Genius Support OS, em português do Brasil.

Repositório canônico: `C:\Projetos\GSO-old`
Branch: `codex/admin-configuration-visual-v1`
HEAD: `1184275` (publicado, CI verde)
PR: https://github.com/edebueno-confi/Genius-OS/pull/34

Você é o terceiro agente neste projeto. Codex/OpenAI produziu a V2, que foi rejeitada
visualmente. Claude/Anthropic produziu o diagnóstico V2.1, corrigiu o shell e a tela 01.
Você continua a partir da tela 04.

============================================================
1. LEITURA OBRIGATÓRIA ANTES DE QUALQUER EDIÇÃO
============================================================

1. `AGENTS.md` e `CLAUDE.md`
2. `docs/reports/2026-08-09_handoff-antigravity-configuration-po-v2-1.md` — seu handoff
3. `docs/reports/2026-08-09_configuration-po-v2-1-fidelity-delta.md` — diagnóstico aprovado
4. `docs/reports/2026-08-09_configuration-po-v2-1-shell-gate.md`
5. `docs/reports/2026-08-09_configuration-po-v2-1-fase2-integracoes.md`
6. `docs/reports/2026-08-09_configuration-po-v2-1-component-map.md`
7. `docs/reports/2026-08-09_configuration-po-v2-1-measurement-map.md`
8. `docs/PROJECT_STATE.md`, `docs/ARCHITECTURE_RULES.md`, `docs/VIEW_RPC_CONTRACTS.md`,
   `docs/AUTH_CONTEXT_STRATEGY.md`

Verifique `git status`, branch e worktrees antes de tocar em arquivo.

**Não rediagnostique.** O fidelity delta já foi revisado e aprovado pela direção. Ele é a
base factual da implementação.

============================================================
2. A REGRA QUE GOVERNA TUDO
============================================================

```
BLUEPRINT define composição, regiões, ordem, grid, hierarquia, densidade, posição.
RUNTIME  define dados, labels factuais, permissões, handlers, commands, capabilities.
```

Fonte de verdade visual: `docs/design/blueprint/Configuration PO/v2/`

Três corolários. A V2 foi rejeitada por violar os três:

- Ausência de dado **não** autoriza remover região. Use estado vazio factual dentro da
  região aprovada.
- Ausência de capability exige **omissão explícita e registrada**, nunca substituição por
  outra ação para preencher espaço.
- Não adapte o blueprint ao runtime anterior. O layout legado não tem precedência.

============================================================
3. ESTADO ATUAL
============================================================

| Superfície | Estado | Gate |
| --- | --- | --- |
| Shell | concluído e **congelado** | 6/6 PASS |
| 01 Integrações | concluído | 6/6 SIM |
| 04 Central de ajuda | **sua próxima tarefa** | reprovada |
| 06 Fontes do Dashboard | pendente | reprovada |
| 05 Histórico de sincronizações | pendente | reprovada |
| 02 Configurações geral | pendente | reprovada |
| 03 Usuários e acessos | pendente | reprovada |

Critério de sucesso do macro-lote: **6 telas × 6 critérios = 36 SIM.** Hoje: 6/36.

============================================================
4. SHELL — CONGELADO
============================================================

Não reabrir: largura 240px expandida, 56px recolhida, flyout overlay, fonte de verdade de
permissões, mecanismo de collapse, estrutura técnica da topbar.

Alterações no shell só são permitidas para: regressão comprovada, divergência visual
medida contra o blueprint, acessibilidade ou bug funcional.

A topbar é a primitive compartilhada `ShellTopbar` em
`apps/web/src/features/navigation/MinimalAppShell.tsx`. Nenhuma tela implementa header
próprio. A trilha de navegação vive na topbar — `UiPageHeader` não renderiza breadcrumb, e
reintroduzi-lo produz duplicação.

============================================================
5. FASE 3 — TELA 04 CENTRAL DE AJUDA
============================================================

Referência: `04-help-center-settings-approved.png`
Diagnóstico: seção 5 do fidelity delta
Arquivo: `apps/web/src/features/settings/HelpCenterSettingsPage.tsx`

É a divergência mais severa do macro-lote. O runtime **não é uma versão simplificada** do
blueprint: é outra tela. Hoje mostra identidade da marca e canais de contato; o blueprint
é uma operação editorial. As 300 linhas atuais exigem reescrita, não ajuste.

Composição obrigatória, nesta ordem:

```
A. HEADER
B. SUMMARY RAIL — 5 métricas editoriais
   Artigos publicados | Rascunhos | Categorias | Autores ativos | Tempo médio de atualização
C. Configuração editorial   |   Publicação e canais
D. Categorias e coleções    |   Permissões editoriais
```

- **Configuração editorial**: 6 linhas de política — Publicação, Revisão, Visibilidade,
  Comentários, Versionamento, SLAs editoriais — cada uma com ícone, título, descrição e
  controle à direita.
- **Publicação e canais**: 6 linhas — Portal público, Área logada, Marcas vinculadas,
  Idioma, SEO básico, Status de publicação.
- **Categorias e coleções**: tabela com Categoria/Coleção, Descrição, Artigos,
  Visibilidade, Atualização, Status, ação por linha; ação `+ Nova categoria`; paginação.
- **Permissões editoriais**: 4 linhas — Criar, Revisar, Publicar, Arquivar — com "quem
  pode executar" e contagem.

Regras específicas:

- Identidade, telefone, e-mail, WhatsApp e domínio **não podem substituir** essas quatro
  regiões. Preserve-os como subpainel ou rota adequada — a capability é real e não pode
  ser destruída, mas não determina o layout aprovado.
- Linha de política sem capability real → `Indisponível neste ambiente.`
- **Não invente política editorial.** Nenhum controle pode sugerir um comportamento que o
  backend não executa.
- Métrica sem read model → `Indisponível` dentro do bloco, sem remover o bloco.

============================================================
6. PADRÕES ESTABELECIDOS — REUTILIZE
============================================================

- **Primitive única por conjunto de itens equivalentes.** `IntegrationProviderPanel` serve
  HubSpot e OMIE com a mesma composição. Não escreva componentes irmãos duplicados.
- **Funções puras de leitura em `.mjs` com `.d.mts` ao lado.** Veja
  `features/settings/integrations/integration-health.mjs` (`integrationScopes`,
  `providerMetrics`). Regra de apresentação fica fora do JSX e testável.
- **Barra de ações com `margin-top: auto`** para alinhar painéis irmãos de alturas
  diferentes.
- **Densidade** em `apps/web/src/features/settings/settings-ui.css`, prefixo `.gso-po-`.

Faixa de densidade obrigatória em 1366×768 escuro:

```
título da tela      22–26px   (hoje 24px)
título de painel    14–17px   (hoje 16px)
título de seção     14–17px   (hoje 15px)
corpo               12–13px   (hoje 12px)
metadados           11–12px   (hoje 11px)
linha de tabela     34–40px
controles           32–36px   (hoje 32px)
padding interno     14–16px   (hoje 14px)
```

Não comprimir abaixo. Não inflar componentes para ocupar espaço.

============================================================
7. QA VISUAL — FERRAMENTAS QUE VOCÊ HERDA
============================================================

```bash
# gate do shell: 3 estados + medição de layout shift do flyout
node scripts/local-qa/capture-configuration-po-v2-1-shell.mjs

# tela: runtime + comparison REFERENCE|RUNTIME + measurement instrumentado do DOM
node scripts/local-qa/capture-configuration-po-v2-1-screen.mjs 04-help-center
```

Para habilitar a tela 04, **adicione a entrada em `SCREENS`** no script de tela:

```js
'04-help-center': {
  route: '/admin/settings/help-center',
  reference: '04-help-center-settings-approved.png',
  regions: [['header', '.gso-ui-header'], ['editorial', '...'], ['catalog', '...'], ['permissions', '...']],
}
```

Saídas em `output/playwright/2026-08-09-configuration-po-v2-1/`:
`runtime/`, `references/`, `comparisons/`, `shell-gate.json`, `screen-<id>.json`.

**Medição instrumentada obrigatória.** Não use estimativa visual. O measurement map se
alimenta de `getBoundingClientRect` e `getComputedStyle`.

============================================================
8. AMBIENTE
============================================================

```powershell
# se a base foi resetada, re-hidrate ANTES de autenticar
node scripts/local-qa/hydrate.mjs

# dev server — use cmd.exe; Start-Process com npm não sobe corretamente
cd C:\Projetos\GSO-old\apps\web
cmd /c "npx vite --host 127.0.0.1 --port 5174"
```

Armadilhas confirmadas nesta sessão:

- **Instâncias a preservar: 5173, 4174, 4175, 5174.** Não encerre processos filtrando por
  `CommandLine -like "*vite*"` — o filtro derruba todas. Filtre pela porta exata.
- **Typecheck, lint e build não rodam em sandbox Linux** neste repositório: os symlinks do
  workspace npm foram criados no Windows e não resolvem no mount. Rode tudo no Windows.
- O comando completo de verificação **reseta o banco**. Re-hidrate antes de autenticar e
  capturar UI.

============================================================
9. VALIDAÇÃO OBRIGATÓRIA POR FASE
============================================================

```
npm run web:typecheck
npm run contracts:typecheck
npm run web:build
npm run lint
npm run local:qa:secret-scan
git diff --check
npm run quality:changed
npm run quality:staged
```

**Baseline de lint: 0 erros, 182 avisos preexistentes.**
Nenhum aviso novo em arquivo alterado é permitido. Se o total passar de 182, encontre e
corrija antes de fechar a fase.

Não existem testes unitários em `apps/web/src`. A validação de tela é typecheck + build +
QA visual instrumentado. Não resete o banco só para testar frontend.

============================================================
10. GATE DA TELA
============================================================

Responda explicitamente, sem meio-termo:

```
MACRO COMPOSITION MATCH = SIM/NÃO
REGION ORDER MATCH      = SIM/NÃO
GRID MATCH              = SIM/NÃO
DENSITY MATCH           = SIM/NÃO
SIDEBAR/SHELL MATCH     = SIM/NÃO
DETAIL PATTERN MATCH    = SIM/NÃO
```

PARCIAL significa NÃO. Qualquer NÃO: corrija, recapture, reavalie. Repita até 6/6.

Build verde, screenshot isolado, ZIP completo ou preview aprovado **não** são aprovação
visual. Só a comparação factual contra a referência é.

============================================================
11. ORDEM DE EXECUÇÃO APÓS A 04
============================================================

`06 Fontes do Dashboard` → `05 Histórico` → `02 Configurações geral` → `03 Usuários e acessos`

Uma tela por vez. Gate 6/6 antes da seguinte. Nada em paralelo.

Para a **05 Histórico**, o vazio não prova fidelidade: será preciso fixture determinística
*test-only*, isolada do caminho de produção, com SUCCESS, PARTIAL, FAILED e uma execução
selecionada com etapas. Dados sinteticamente marcados, sem PII, sem segredo, sem
integração externa.

Depois dos 36/36: validar 1440×900, 1024×768, 390×844 e tema claro. No mobile exija
hierarquia, conteúdo, comportamento e ausência de overflow — não identidade visual.

============================================================
12. NÃO TOCAR
============================================================

Backend, migrations, RPCs, RLS, permission model, Analytics, Dashboard, e qualquer tela
fora da fase corrente.

**Decisão de produto pendente, NÃO executar:** existe redesign futuro de Usuários e Acesso
e remoção do frontend legado de Convites. Macro-lote separado.

**Preservar sem reverter:** HubSpot manual auth, tratamento de 409 concorrente do Omie,
predicado de platform admin, status financeiro OMIE-only e as migrations/testes
associados. Também não ampliar esse escopo funcional.

============================================================
13. SEGURANÇA
============================================================

Nunca registrar em relatório, screenshot, log, fixture ou manifest: token, JWT, cookie,
service role, scheduler secret, credencial ou API key. Nenhuma região da interface pode
descrever mecanismo interno de cofre ou identificador de segredo — comunique garantias de
produto, não arquitetura.

============================================================
14. RELEASE
============================================================

`1184275` está no remoto com CI verde.

**Antes de qualquer merge ou deploy:** a branch carrega o commit `bdd2b2c`, que é o lote
visual V2 **rejeitado pelo Product Owner**. Mesclar ou promover publica as telas 02–06 na
versão rejeitada. Não faça merge, push forçado ou deploy sem ordem explícita e atual do
Product Owner.

============================================================
15. FORMATO DE ENCERRAMENTO DE CADA FASE
============================================================

```
## Implementado
## Runtime usado
## Dados reais disponíveis
## Capabilities omitidas       (cada OMIT com justificativa)
## Composição                  (medidas do DOM)
## Gate 6/6
## Screenshot
## Comparison
## Testes
## Lint baseline               (não resumir como "aprovado")
## Quality
## Git
## Limitações
## Próxima tela autorizável
```

Atualize `docs/DOCUMENTATION_LEDGER.md` e crie o relatório da fase em `docs/reports/`.
Commits locais temáticos, um por fase. Sem push sem ordem.

============================================================
16. STOP CONDITION
============================================================

Conclua a tela 04, obtenha 6/6, entregue o relatório e **pare**. Não inicie a 06 antes da
revisão. Não faça merge. Não faça deploy. Não inicie funcionalidade nova.
