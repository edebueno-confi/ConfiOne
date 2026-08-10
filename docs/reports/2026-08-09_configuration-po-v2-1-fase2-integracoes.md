# Configuration PO V2.1 — Fase 2: Integrações

Data: 2026-08-09 · Branch: `codex/admin-configuration-visual-v1` · Commit `19381c2`

## Implementado

As quatro regiões do blueprint aprovado, nesta ordem:

- **A. Cabeçalho** — título de 24px, descrição do blueprint ("Conexões, credenciais e
  status das fontes operacionais.") e a ação real de atualizar estado.
- **B. Painéis HubSpot e OMIE** — dois painéis equivalentes, mesma primitive
  `IntegrationProviderPanel`: cabeçalho com ícone, nome, badge de domínio e badge de
  estado; grade de três métricas; bloco de escopo; barra de ações ancorada no rodapé para
  que os dois painéis alinhem mesmo quando um publica falha e o outro não.
- **C. Governança** — `Permissões e escopos` à esquerda, `Política de segurança` à
  direita, em duas colunas iguais.
- **D. Eventos recentes** — tabela com as seis colunas do blueprint e estado vazio
  factual.

**Removido:** o trilho de quatro KPIs que a V2 havia introduzido e que não existe no
blueprint, mais o rail de governança e a faixa de benefícios da V2.

## Runtime usado

Frontend local em `http://127.0.0.1:5174`, Supabase local, fixture QA hidratada
(`scripts/local-qa/hydrate.mjs` → 5 usuários, 3 tenants, 18 tickets, `external_sync: false`).
Persona: administrador QA local. Nenhuma sincronização, escrita externa, migration ou
alteração de credencial foi executada.

## Dados reais disponíveis

Read model `vw_admin_managed_integrations` via `listManagedIntegrations`.

| Campo do blueprint | Origem real | Comportamento sem dado |
| --- | --- | --- |
| Último sucesso | `last_run_at` quando `last_run_status = 'success'` | `Indisponível` + "Nenhuma execução concluída registrada." |
| Última falha | `last_run_at` quando o status é `error`/`partial`; a linha de apoio traz `last_error_message` | `—` + "Nenhuma falha registrada." |
| Saúde das credenciais | `is_enabled` + `has_credentials`, com `credential_updated_at` na linha de apoio | rótulo de estado + "Data de atualização indisponível." |
| Escopo / Perfis sincronizados | `config.domains` (HubSpot) e `config.resource_label` (OMIE) | "Escopos indisponíveis nesta leitura." |
| Eventos recentes | não publicado nesta superfície | cabeçalho de colunas + "Nenhum evento de integração registrado neste ambiente." |

No ambiente capturado, HubSpot publicou escopos reais (Comercial, Customer Success,
Suporte) e uma falha real de autenticação; OMIE publicou o escopo "Contas a receber". As
posições sem dado exibem indisponibilidade — nenhuma foi removida, nenhuma foi preenchida
com valor fabricado.

## Capabilities omitidas

| Item do blueprint | Motivo |
| --- | --- |
| `Nova conexão` (ação primária do cabeçalho) | `saveManagedIntegration` atualiza fontes já publicadas; não existe fluxo de criação de conexão no backend |
| `Testar conexão` (terceira ação do painel) | não há verificação de conexão sob demanda nesta versão; a própria V2 declarava isso em nota |
| Menu contextual `⋮` do painel | os comandos reais já estão na barra de ações; um menu duplicando um único item não corresponde a comando adicional |

Nenhuma ação foi substituída por outra para preencher espaço. A barra de ações permanece
na posição do blueprint com as ações que existem.

## Composição

Medições instrumentadas do DOM em `docs/reports/2026-08-09_configuration-po-v2-1-measurement-map.md`.
Resumo: regiões em `y` = 72 → 153 → 473 → 706; B e C em duas colunas iguais; D em largura
plena; 2 painéis, 6 posições de métrica, 6 colunas de evento, trilho de KPIs ausente,
sem overflow horizontal.

## Gate 6/6

| Critério | Resultado |
| --- | --- |
| MACRO COMPOSITION MATCH | **SIM** |
| REGION ORDER MATCH | **SIM** |
| GRID MATCH | **SIM** |
| DENSITY MATCH | **SIM** |
| SIDEBAR/SHELL MATCH | **SIM** |
| DETAIL PATTERN MATCH | **SIM** |

**6/6 SIM — Fase 2 concluída.**

Gate do shell (Fase 1), reafirmado nesta captura:
SIDEBAR WIDTH = PASS · TOPBAR = PASS · ACTIVE STATE = PASS · DENSITY = PASS ·
FLYOUT OVERLAY = PASS · NO LAYOUT SHIFT = PASS.

### QA de duplicação após a reativação da topbar

| Capability | Ocorrências | Veredito |
| --- | --- | --- |
| Busca global | 1 — topbar | sem duplicação; saiu da sidebar |
| Identidade do usuário | 2 — topbar e rodapé da sidebar | corresponde ao blueprint, que mostra as duas |
| Controle de tema | 1 — topbar | sem duplicação; saiu do menu de conta |
| Controle de recolher | 1 — rodapé da sidebar | sem duplicação; saiu do topo |
| Breadcrumb | 1 — topbar | duplicação eliminada removendo a trilha do `UiPageHeader` |

## Screenshot

`output/playwright/2026-08-09-configuration-po-v2-1/runtime/runtime-01-integrations-1366-dark.png`

## Comparison

`output/playwright/2026-08-09-configuration-po-v2-1/comparisons/comparison-01-integrations.png`
(formato REFERENCE | RUNTIME, sem decoração além do rótulo)

## Testes

| Comando | Resultado |
| --- | --- |
| `npm run web:typecheck` | aprovado |
| `npm run contracts:typecheck` | aprovado |
| `npm run web:build` | aprovado |
| `npm run lint` | 0 erros, 182 avisos |
| Testes focados de integrations / shell | **não existem nesta base** — `apps/web/src` não possui arquivos `*.test.*`. A validação da camada de tela é typecheck + build + QA visual instrumentado |
| `npm run local:qa:secret-scan` | `{"tracked_files_scanned":2191,"matches":0,"secrets":false}` |
| `git diff --check` | limpo |
| `npm run quality:changed` | aprovado |
| `npm run quality:staged` | aprovado |

Banco não foi resetado para esta tela.

## Lint baseline

**0 erros · 182 avisos preexistentes.**

Durante a fase, o lote chegou a 184 avisos com dois novos em
`SettingsIntegrationsPanel.tsx` (`formatDateTime` e `summary` sem uso após a remoção do
trilho de KPIs). Ambos foram corrigidos e o total voltou a 182. **Nenhum aviso novo em
arquivo alterado.**

## Quality

`quality:changed` e `quality:staged` aprovados. Veredito do gate: aprovado.

## Git

- Commit `19381c2` — `refactor(integrations): reproduce approved configuration po composition`
- Commit anterior `40f3b6c` — `fix(shell): alinhar topbar e navegacao ao configuration po`
- Base `718b988`. Branch `codex/admin-configuration-visual-v1`.

## Limitações

- Validado apenas em **1366×768 escuro**. 1440, 1024, 390 e tema claro seguem fora de
  escopo até as seis telas passarem no baseline.
- A região de eventos não tem read model publicado nesta superfície; ela existe
  estruturalmente com estado vazio e já aceita a lista por prop quando o contrato existir.
- Os componentes V2 que deixaram de ser referenciados não foram apagados; a limpeza fica
  para o encerramento do macro-lote.
- Uma falha de requisição aparece no diagnóstico da tela: busca de módulo do Vite dev
  abortada durante a navegação de login. É artefato do dev server, não da aplicação.
- **Incidente registrado:** ao reiniciar o dev server, um filtro de processo largo demais
  encerrou também as instâncias das portas 5173, 4174 e 4175, que o handoff mandava
  preservar. As quatro instâncias foram restauradas e verificadas com HTTP 200. Nenhum
  dado foi perdido; o erro foi meu e está registrado aqui.

## Próxima tela autorizável

**04 — Central de ajuda**, conforme a seção 12 do meta-prompt e a seção 5 do fidelity
delta: quatro regiões editoriais (Configuração editorial | Publicação e canais /
Categorias e coleções | Permissões editoriais), com os dados de contato preservados como
subpainel e não como composição principal.
