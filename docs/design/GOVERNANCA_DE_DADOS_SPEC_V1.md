# Especificação — "Fontes do Dashboard" → "Governança de dados"

Documento de execução para agente de código. Escrito em 2026-08-11 contra
`main @ 10a6fd6`.

Arquivo principal: `apps/web/src/features/settings/DashboardSourcesSettingsPage.tsx`
(521 linhas). Rota atual: `/admin/settings/dashboard-sources`.

---

## 1. Por que este lote existe

O operador do produto olhou a tela e perguntou: **"qual é o objetivo dessa
página?"** — a pergunta é o diagnóstico. A tela hoje empilha, num único scroll
vertical, cinco trabalhos diferentes:

| # | Região | Trabalho de fato |
|---|---|---|
| 1 | `UiPageHeader` + ações | disparar atualização |
| 2 | `UiMetricRow` (4 indicadores) | resumo — **quase todo fabricado** |
| 3 | "Fontes ativas" | saúde das fontes externas |
| 4 | "Aguardando classificação" | taxonomia de pipelines |
| 5 | "Atualização automática" | agendamento |
| 6 | "Pipelines usados por área" | taxonomia de pipelines |
| 7 | `<PipelineRoleSettings />` | taxonomia de pipelines |
| 8 | "Leitura da fila" → `<StageMappingSettings />` | taxonomia de etapas |
| 9 | "Conciliação de empresas" → `<CompanyReconciliationPanel />` | identidade HubSpot↔OMIE |
| 10 | `<UiHintBand />` | ajuda |

Saúde de fonte, taxonomia, agendamento e conciliação de identidade são
responsabilidades distintas, com públicos e frequências de uso distintos. Estão
todas coladas.

### Decisões já tomadas pelo Product Owner

Estas **não estão em aberto**. Não reabrir:

1. **A página passa a se chamar "Governança de dados".** O nome "Fontes do
   Dashboard" descreve um dos blocos, não o conjunto. O objetivo real da tela é
   governar de onde vem o dado do Dashboard Gerencial, como ele é classificado
   e como identidades são conciliadas.
2. **A conciliação de empresas vira aba própria e fica mais robusta.** Citação
   do PO: *"conciliação de empresa tem que ser algo um pouco mais robusto e
   talvez numa aba separada"*.
3. A classificação de pipelines por área e por operação (Confi, Aftersale,
   Neotrust, Confi Analytics) **já foi entregue** na migração
   `20260810200000_analytics_pipeline_classification_by_brand_v1.sql`. Este lote
   **não** mexe na classificação em si — só na forma de apresentá-la.

---

## 2. Estrutura alvo

Quatro abas, no padrão já usado em `/admin/access` (parâmetro `?tab=` na URL,
com validador de tipo — ver `isTab()` em
`apps/web/src/features/access/InternalControlPlanePage.tsx`).

```
Governança de dados
├── ?tab=sources        Fontes            (regiões 3 e 5 atuais)
├── ?tab=pipelines      Pipelines         (regiões 4, 6 e 7 atuais)
├── ?tab=stages         Etapas            (região 8 atual)
└── ?tab=reconciliation Conciliação       (região 9 atual, reconstruída)
```

Regras de navegação:

- `?tab` ausente ou inválido → `sources`.
- A rota `/admin/settings/dashboard-sources` **permanece funcionando** (é o que
  está na sidebar e no `SETTINGS_ROUTES` do `SettingsPage.tsx`). Não crie rota
  nova nem quebre o link existente.
- Atualize o rótulo visível para "Governança de dados" em:
  - `apps/web/src/features/navigation/minimal-navigation.ts`
    (`id: 'admin-settings-dashboard-sources'`, hoje `label: 'Fontes do Dashboard'`)
  - `apps/web/src/features/settings/SettingsPage.tsx` — entrada `dashboard-fontes`
    no array `GROUPS` e no card correspondente de `OVERVIEW_MODULES`
  - o `title` do `UiPageHeader` da própria página
- **Não** renomeie a rota, o `sectionId` `dashboard-fontes`, o id de navegação,
  nem nomes de tabela/RPC. O identificador técnico continua como está; muda só
  o rótulo visível. Renomear infraestrutura exige autorização explícita.

As ações do cabeçalho ("Reler estado", "Atualizar painel completo") continuam no
`UiPageHeader`, acima das abas — valem para a página inteira.

---

## 3. Dados fabricados a remover (obrigatório)

O `UiMetricRow` das linhas ~287-306 é quase todo inventado. Este projeto acabou
de passar por um lote inteiro de remoção de dado fabricado; não deixe estes
para trás.

```tsx
// ATUAL — linha ~288 em diante
<UiMetric label="Fontes ativas"            value={`${activeCount || 3} de 5`} sub="3 de 5 configuradas" />
<UiMetric label="Domínios cobertos"        value="3 de 5"                      sub="3 de 5 com dados" />
<UiMetric label="Pendências de mapeamento" value={pendingCount || 2}           sub="2 fontes aguardando integração" />
<UiMetric label="Última atualização"       value="Hoje, 08:45"                 sub="Automática" />
```

Problemas, um a um:

- `activeCount || 3` — quando a leitura real devolve `0`, o operador vê `3`.
  `0` é um estado legítimo e informativo; o fallback o esconde.
- `"3 de 5"` em "Domínios cobertos" é literal puro. Não há leitura por trás.
- `pendingCount || 2` — mesmo defeito do primeiro.
- `"Hoje, 08:45"` — **carimbo de data inventado**. É o pior dos quatro: parece
  informação operacional confiável e não é.
- Todos os `sub` são literais.

Substituição exigida:

| Indicador | Origem real |
|---|---|
| Fontes ativas | contar `sourcePills` com estado publicado válido; sem fallback |
| Pipelines ativos / catálogo | `rows.filter(r => r.isActive).length` de `rows.length` — o PO pediu explicitamente as **duas** contagens no mesmo indicador (ver `SETTINGS_BLUEPRINT_V4_REFACTOR_SPEC.md`, §4.5: *"17 pipelines ativos de 35 no catálogo"*) |
| Aguardando classificação | `pendingRows.length`; sem fallback |
| Última atualização | `formatDate()` sobre o `lastSuccessAt` mais recente entre as fontes; `Indisponível` quando não houver |

Sem dado real → `Indisponível`. Nunca um número plausível.

Rode a varredura existente depois de mexer:
`node scripts/local-qa/verify-mock-removal-and-layout-v1.mjs` — adicione
`'Hoje, 08:45'`, `'3 de 5'` e `'2 fontes aguardando integração'` ao array
`FORBIDDEN` e inclua `/admin/settings/dashboard-sources` no array `SCREENS`.

---

## 4. Aba Conciliação — o coração do lote

### 4.1 Estado atual

`apps/web/src/features/settings/CompanyReconciliationPanel.tsx` — 66 linhas,
JSX em linhas únicas de várias centenas de colunas. Funciona, a lógica de
decisão está correta e auditada, mas:

- **Não usa o design system de Configurações.** Todo o componente é
  `--minimal-*`; o resto da tela é `gso-ui` / `--one-*`. Destoa visualmente.
- **Paginação ignorada.** O contrato aceita `p_limit`/`p_offset`; o cliente
  chama fixo `{ p_limit: 100, p_offset: 0 }`. Acima de 100 identidades, o
  operador não alcança o resto.
- **Sem busca e sem filtro.** Achar uma empresa específica na lista lateral é
  rolagem manual.
- **Sem ordenação.** Não dá para priorizar por saldo em aberto, que é o
  critério óbvio de importância.
- Altura fixa `max-h-[28rem]` na lista, dentro de uma página que já rola.

### 4.2 Contrato disponível — use, não crie

Já existe backend completo. **Não escreva migração nova para esta aba.**

```
rpc_analytics_company_reconciliation_queue(p_limit int, p_offset int) -> {
  summary: { total, confirmed, pending },
  items: [{
    source_key, source_name, source_trade_name, source_tax_id,
    title_count, total_balance, status: 'pending' | 'confirmed',
    candidates: [{ company_id, company_name, tax_id, score,
                   reason, decision: 'suggested'|'confirmed'|'discarded' }]
  }]
}

rpc_admin_decide_company_reconciliation(
  p_source_key, p_source_name, p_source_tax_id,
  p_company_id, p_decision: 'confirmed'|'discarded', p_evidence
)

rpc_admin_revoke_company_reconciliation(p_source_key, p_evidence)
```

Cliente em `apps/web/src/features/settings/company-reconciliation-api.ts`.

Se busca e ordenação server-side exigirem parâmetros novos no
`rpc_analytics_company_reconciliation_queue`, aí sim crie migração nova
(timestamp posterior a `20260810220000`), **adicionando parâmetros com
`default`** para não quebrar a assinatura existente. Nunca edite migração já
aplicada.

### 4.3 O que "mais robusto" significa aqui

1. **Aba própria**, com o layout mestre-detalhe em três colunas preservado
   (lista → comparação → decisão). A estrutura de três colunas está certa; o
   problema é o entorno.
2. **Faixa de indicadores** no topo da aba, com o `summary` que a RPC já
   devolve: total de identidades, confirmadas, pendentes. Dado real, já
   disponível, hoje escondido numa linha de texto pequena.
3. **Busca** por razão social, nome fantasia e CNPJ.
4. **Filtro de situação**: todas / pendentes / confirmadas.
5. **Ordenação** por saldo em aberto (padrão, decrescente) e por nome.
6. **Paginação real**, consumindo `p_limit`/`p_offset`. Se o total passar do
   limite da página, o operador precisa alcançar o resto.
7. **Migrar para o design system de Configurações**: `UiCard`, `UiTable`,
   `UiBadge`, `UiField`, `UiButton`, `UiMetricRow`, `UiEmptyState`,
   `UiSearchField`, `UiToolbar` — todos em `features/settings/ui/`. Trocar os
   `--minimal-*` por `--one-*`/`gso-ui`.
8. **Quebrar o JSX em linhas legíveis.** As linhas de 400+ colunas do arquivo
   atual são dívida de manutenção.

### 4.4 O que preservar sem negociação

- **Evidência continua obrigatória** para confirmar, descartar e desfazer. O
  texto da tela — *"Sugestão não é vínculo"* — é a regra de produto, não
  decoração.
- A decisão **não escreve no HubSpot nem na OMIE**. Se alguém propuser
  gravação na origem, isso é outro lote e exige autorização.
- Autoria e data da decisão continuam auditadas pelo backend.
- Não pré-selecionar automaticamente uma candidata como "confirmada" só porque
  o score é alto. A confirmação é ato humano deliberado.

---

## 5. Abas Fontes, Pipelines e Etapas

Estas são **redistribuição, não redesenho**. O conteúdo já funciona; o trabalho
é movê-lo para a aba certa e limpar o excesso de aninhamento.

**Fontes** — tabela "Fontes ativas" + card "Atualização automática".

**Pipelines** — "Aguardando classificação" + "Pipelines usados por área" +
`<PipelineRoleSettings />`. Hoje o catálogo está dentro de um `<details>` que
contém outro `<details>` por área: dois níveis de disclosure sobre uma tabela.
Com a aba dedicada, o espaço vertical deixa de ser escasso — **remova o
`<details>` externo** e deixe os grupos por área diretamente visíveis. O filtro
de área existente sobe para uma `UiToolbar` no topo da aba.

**Etapas** — `<StageMappingSettings />`, com o texto explicativo que já existe.

O `<UiHintBand>` sobre "A classificar" pertence à aba Pipelines, não ao rodapé
da página inteira.

---

## 6. Restrições

- Não altere `analytics_source_config`, a classificação de pipelines, nem a
  migração `20260810200000`.
- Não invente indicador, contagem, data ou percentual. Sem origem →
  `Indisponível`.
- Não crie um segundo design system. Estenda `features/settings/ui/`.
- Não remova capacidade existente. Toda ação que hoje funciona — atualizar
  fonte, salvar agenda, classificar pipeline, mapear etapa, decidir
  conciliação — continua funcionando.
- Não mexa em RLS, permissões ou `can_edit`. O gate `canEdit` que já existe
  continua governando quem altera.
- Preserve `dark` e `light`. QA visual nos dois.
- Trabalhe em branch própria a partir de `main` e abra PR. `main` é protegida e
  exige o check `verify-database`; push direto retorna `GH006`.

---

## 7. Validação obrigatória

```bash
npm run lint
npm run web:typecheck
npm run contracts:typecheck
npm run web:build
npm run local:qa:secret-scan
node scripts/local-qa/verify-mock-removal-and-layout-v1.mjs
```

O harness de QA já existe e mede largura real e contraste, além de varrer
strings fabricadas. Estenda-o com a rota desta tela e com as quatro abas.

Viewports: **1920x1080 e 1366x768**, nos dois temas. Atenção: `.gso-ui-split`
colapsa em coluna única no media query de `max-width: 1366px` — medir só em
1366 esconde o comportamento de duas colunas. Isso já mordeu neste projeto.

Um PNG por aba/estado/tema, arquivos separados (regra 23 do projeto). Não
monte contact sheet a menos que seja pedido.

---

## 8. Formato da resposta

1. Arquivos alterados e criados.
2. Estrutura de abas entregue, com as URLs.
3. Antes e depois dos quatro indicadores, mostrando a origem real de cada um.
4. O que a aba Conciliação ganhou, item a item da seção 4.3.
5. Migração criada, se houver, e por quê.
6. Saída dos seis comandos de validação.
7. Lista dos PNGs, com a leitura visual de cada um — não só "capturei".
8. Link do PR e resultado do `verify-database`.
9. Capacidade removida ou alterada, se houver alguma.
10. Pendências e decisões que ficaram em aberto.
