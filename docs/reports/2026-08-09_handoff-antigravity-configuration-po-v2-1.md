# Handoff — Configuration PO V2.1

**De:** Claude (Anthropic) · **Para:** Antigravity 2.0 · **Data:** 2026-08-09
**Branch:** `codex/admin-configuration-visual-v1` · **HEAD:** `65233eb` (pushed)
**PR:** https://github.com/edebueno-confi/Genius-OS/pull/34 — **CI verde**

---

## 1. Onde o trabalho está

O macro-lote V2.1 reproduz a composição aprovada de Configuration PO usando as
capabilities reais do runtime. **Duas de sete superfícies estão concluídas.**

| Superfície | Estado | Gate |
| --- | --- | --- |
| Shell (topbar, sidebar, flyout) | **concluído e congelado** | 6/6 PASS |
| 01 Integrações | **concluído** | 6/6 SIM |
| 04 Central de ajuda | pendente — **próxima** | reprovada |
| 06 Fontes do Dashboard | pendente | reprovada |
| 05 Histórico de sincronizações | pendente | reprovada |
| 02 Configurações geral | pendente | reprovada |
| 03 Usuários e acessos | pendente | reprovada |

Critério de sucesso do macro-lote: **6 telas × 6 critérios = 36 SIM.** Hoje: 6/36.

## 2. Leitura obrigatória, nesta ordem

1. `AGENTS.md`, `CLAUDE.md`
2. `docs/reports/2026-08-09_configuration-po-v2-1-fidelity-delta.md` — **o diagnóstico
   aprovado.** Contém a tabela região-a-região das seis telas. Não rediagnostique.
3. `docs/reports/2026-08-09_configuration-po-v2-1-shell-gate.md` — Fase 1
4. `docs/reports/2026-08-09_configuration-po-v2-1-fase2-integracoes.md` — Fase 2
5. `docs/reports/2026-08-09_configuration-po-v2-1-component-map.md` — REUSE/ADAPT/NEW/OMIT
6. `docs/reports/2026-08-09_configuration-po-v2-1-measurement-map.md` — medidas do DOM
7. `docs/reports/2026-08-09_handoff-claude-configuration-po-v2-1.md` — handoff do Codex

## 3. A regra que governa tudo

```
BLUEPRINT define composição, regiões, ordem, grid, hierarquia, densidade, posição.
RUNTIME  define dados, labels factuais, permissões, handlers, commands, capabilities.
```

Fonte de verdade visual: `docs/design/blueprint/Configuration PO/v2/`.

Três corolários que já custaram um lote inteiro (a V2 foi rejeitada por violá-los):

- **Ausência de dado não autoriza remover região.** Use estado vazio factual *dentro* da
  região aprovada.
- **Ausência de capability exige omissão explícita e registrada**, não substituição por
  outra ação para preencher espaço.
- **Não adapte o blueprint ao runtime anterior.** O layout legado não tem precedência.

## 4. Shell — CONGELADO

Não reabrir: largura 240/56, modelo de flyout overlay, fonte de verdade de permissões,
mecanismo de collapse, estrutura técnica da topbar. Alterações só para regressão
comprovada, divergência visual medida, acessibilidade ou bug funcional.

A topbar é a primitive compartilhada `ShellTopbar` em
`apps/web/src/features/navigation/MinimalAppShell.tsx`. **Nenhuma tela implementa header
próprio.** A trilha de navegação vive na topbar — `UiPageHeader` não renderiza mais
breadcrumb, e reintroduzi-lo produz duplicação.

## 5. Padrões estabelecidos na tela 01 — reutilize

- **Primitive única por par de itens equivalentes.** `IntegrationProviderPanel` serve
  HubSpot e OMIE. Não escreva dois componentes irmãos.
- **Funções puras de leitura em `.mjs` com `.d.mts` ao lado.** Veja
  `integrations/integration-health.mjs` (`integrationScopes`, `providerMetrics`). A regra
  de negócio de apresentação fica testável e fora do JSX.
- **Barra de ações com `margin-top: auto`** para alinhar painéis irmãos de alturas
  diferentes.
- **Densidade** em `settings-ui.css`, prefixo `.gso-po-`: título 24px, seção 15px, painel
  16px, corpo 12px, metadados 11px, controle 32px, padding 14px.

## 6. Ferramentas de QA que você herda

```bash
# gate do shell — 3 estados + medição de layout shift
node scripts/local-qa/capture-configuration-po-v2-1-shell.mjs

# tela: runtime + comparison REFERENCE|RUNTIME + measurement instrumentado
node scripts/local-qa/capture-configuration-po-v2-1-screen.mjs 01-integrations
```

Para a próxima tela, **adicione uma entrada em `SCREENS`** no script de tela
(`route`, `reference`, `regions`) — a instrumentação e o comparativo saem prontos.

Saídas em `output/playwright/2026-08-09-configuration-po-v2-1/`:
`runtime/`, `references/`, `comparisons/`, `shell-gate.json`, `screen-<id>.json`.

## 7. Como subir o ambiente

```powershell
# Supabase local já roda. Se a base foi resetada, re-hidrate ANTES de autenticar:
node scripts/local-qa/hydrate.mjs

# dev server (use cmd.exe; Start-Process com npm não sobe corretamente)
cd C:\Projetos\GSO-old\apps\web
cmd /c "npx vite --host 127.0.0.1 --port 5174"
```

**Instâncias a preservar:** 5173, 4174, 4175, 5174. Eu derrubei três delas com um filtro
de processo largo demais e tive de restaurá-las. **Não use `Get-Process node | where
CommandLine -like "*vite*"`** — filtre pela porta exata.

**Typecheck, lint e build não rodam em sandbox Linux** neste repositório: os symlinks do
workspace npm foram criados no Windows. Rode tudo no Windows.

## 8. Validação obrigatória por fase

```
npm run web:typecheck
npm run contracts:typecheck
npm run web:build
npm run lint            # baseline: 0 erros, 182 avisos
npm run local:qa:secret-scan
git diff --check
npm run quality:changed
npm run quality:staged
```

**Nenhum aviso novo em arquivo alterado é permitido.** Se o total passar de 182,
encontre e corrija — foi assim que peguei dois imports órfãos na tela 01.

Não existem testes unitários em `apps/web/src`. A validação de tela é typecheck + build +
QA visual instrumentado.

## 9. Próxima tela: 04 — Central de ajuda

A divergência mais severa do lote. O runtime **não é uma versão simplificada** do
blueprint: é outra tela. Hoje mostra identidade da marca e canais de contato; o blueprint
é uma operação editorial.

Composição obrigatória (seção 5 do fidelity delta, seção 12 do meta-prompt):

```
HEADER
SUMMARY RAIL (5 métricas editoriais)
Configuração editorial   |   Publicação e canais
Categorias e coleções    |   Permissões editoriais
```

- Identidade, telefone, e-mail, WhatsApp e domínio **não podem substituir** essas quatro
  regiões. Preserve-os como subpainel ou rota adequada.
- Linha de política sem capability real → `Indisponível neste ambiente.` Não invente
  política editorial.
- Arquivo: `apps/web/src/features/settings/HelpCenterSettingsPage.tsx` (300 linhas hoje;
  a composição aprovada exige reescrita, não ajuste).

Depois: **06 → 05 → 02 → 03**, uma por vez, cada uma com gate 6/6 antes da seguinte.

Para a **05 Histórico**, o vazio não prova fidelidade: será preciso fixture determinística
*test-only* com SUCCESS, PARTIAL, FAILED e uma execução selecionada com etapas. Dados
sinteticamente marcados, sem PII, sem segredo, fora do caminho de produção.

## 10. Não tocar

Backend, migrations, RPCs, RLS, permission model, Analytics, Dashboard. E as telas fora da
fase corrente.

**Decisão de produto pendente, NÃO executar agora:** existe redesign futuro de Usuários e
Acesso e remoção do frontend legado de Convites. Macro-lote separado.

## 11. Dívidas que deixo abertas

- `IntegrationProviderCard`, `IntegrationsSummary`, `IntegrationHealthRail`,
  `IntegrationSyncStatus`, `IntegrationSecuritySummary`, `SettingsBenefitsFooter` ficaram
  sem uso. Não apaguei: a remoção de arquivo é irreversível no diff e outras telas ainda
  não foram auditadas. Limpar no encerramento do macro-lote.
- Região "Eventos recentes" existe estruturalmente com estado vazio: não há read model de
  eventos publicado na superfície de Integrações. O componente já aceita `events` por prop
  quando o contrato existir.
- Viewports 1440/1024/390 e tema claro: só depois dos 36/36.
- Pacote ZIP final `configuration-po-v2-1-final-20260809.zip` com `references/`,
  `runtime/`, `comparisons/`, `screenshots/`, `reports/`, `manifest/` +
  `evidence-manifest.json` + `SHA256SUMS.txt`: **não montado.** Monte no encerramento.

## 12. Estado de release

`65233eb` está no remoto e o CI está **verde** (`verify-database` pass, Vercel pass).

**Atenção antes de qualquer merge ou deploy:** a branch carrega o commit `bdd2b2c`, que é
o lote visual V2 **rejeitado pelo Product Owner**. Mesclar ou promover agora publica as
telas 02–06 na versão rejeitada, junto com o shell e a tela 01 já aprovados. Confirme com
o Product Owner antes de qualquer promoção.

## 13. Commits desta sessão

```
65233eb docs(ui): registrar evidencias da fase 2 de integracoes
19381c2 refactor(integrations): reproduce approved configuration po composition
40f3b6c fix(shell): alinhar topbar e navegacao ao configuration po
718b988 fix(finance): publicar status exclusivo do Omie   (base, do Codex)
```

## 14. Correções funcionais a preservar

Não reverter: HubSpot manual auth, tratamento de 409 concorrente do Omie, predicado de
platform admin, status financeiro OMIE-only e as migrations/testes associados. Também não
ampliar esse escopo funcional.
