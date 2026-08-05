# Catálogo de Métricas do Dashboard Gerencial — contrato para os conectores

> **Nota de vigência:** este catálogo contém o desenho histórico do rollout e
> referências de fallback de planilha. O contrato publicado em 2026-08-02 é
> API-only: HubSpot para Comercial/CS/Suporte e OMIE para Financeiro. Planilhas
> permanecem apenas como histórico, migração, auditoria e QA. Use o catálogo
> Delta corrente em `docs/reports/2026-08-02_dashboard-delta-final.md`.

Autor: Claude / Anthropic. Data: 2026-07-29.
Público-alvo: Codex/OpenAI, responsável por implementar os conectores read-only via API (HubSpot e OMIE) e os read-models/RPCs que alimentam o Dashboard Gerencial.
Objetivo: especificar **todas** as métricas do dashboard (4 abas: Resumo Gerencial, Financeiro/OMIE, Comercial/HubSpot, Suporte & Chat), com definição, fórmula, fonte, objeto/endpoint, campos necessários, janela de agregação e status de disponibilidade — para que o backend produza os números **sem inventar dado**.

> Referência visual: `docs/design/mockups/dashboard-mockup.html`. Regras de design: `docs/design/DESIGN_PLAN.md`.

---

## 0. Convenções obrigatórias (valem para todas as métricas)

- **Fonte da verdade é o backend.** O frontend só renderiza; nenhuma regra de negócio ou cálculo de métrica no cliente.
- **Read-only.** OMIE e HubSpot são lidos; escrita no HubSpot só pelo fluxo já existente (`hubspot-omie-property-sync`, com dry-run + ledger). Nenhuma métrica dispara escrita.
- **Multi-tenant / RLS.** Toda consulta respeita `company_id`/tenant e permissões. Nenhuma métrica cruza tenants.
- **Escala de percentual normalizada em UM ponto.** Padronizar: toda taxa é armazenada como fração `0..1` no read-model e formatada como `%` só na borda de apresentação. (Corrige o risco de erro 100x já mapeado em `analytics-model.ts`.)
- **Moeda e número:** BRL, formato pt-BR (`R$ 1.234,56`), `tabular-nums`. Datas em timezone `America/Sao_Paulo`.
- **Janela temporal:** todo card aceita o período global (Semana / Mês / Trimestre / Ano) e, quando houver comparação, o **delta** é contra o período anterior equivalente.
- **Dado ausente = "indisponível".** Se a fonte não fornece o campo, retornar `null` + flag `available:false` e o motivo. Nunca preencher com 0 mascarando ausência, nunca simular.
- **Proveniência por métrica (obrigatória no payload):** `source` (`omie` | `hubspot` | `hubspot_service` | `derived`), `last_sync_at`, `freshness_seconds`, `confidence` (ver §6).
- **Idempotência/frescor:** cada métrica carrega o `last_sync_at` da sua fonte; o dashboard mostra "atualizado há X" e alerta quando defasado.

---

## 1. Contratos de leitura por fonte

### 1.1 OMIE — Contas a Receber (financeiro)
- **Modo:** integração read-only; planilha é fallback temporário até a API estar ativa (comparar API × planilha após ativação e registrar divergências).
- **Endpoint base:** `POST https://app.omie.com.br/api/v1/financas/contareceber/` — método `ListarContasReceber` (paginado).
- **Credenciais:** `app_key` + `app_secret` server-side, lidas via `rpc_service_get_managed_integration_secret('omie')` (padrão já usado em `supabase/functions/omie-sync`). Nunca expor no cliente.
- **Campos por título (confirmar nomes exatos no retorno):**
  - `nCodTitulo` (id do título), `cNumTitulo` (número), `nCodCliente` / `cCPFCNPJCliente` (chave de reconciliação),
  - `nValorTitulo` (valor), `mValorAberto`/saldo em aberto do título,
  - `dDtVenc` (vencimento), `dDtRecebimento` (data de recebimento — **crítico** para DSO; confirmar disponibilidade),
  - `cStatus` (ex.: `ABERTO`, `RECEBIDO`, `ATRASADO`, `CANCELADO`), `cCodCateg` (categoria/centro de custo, pode vir vazio).
- **Snapshot canônico:** a coleta já promove um snapshot financeiro (`runOmieSnapshot` + `rpc_analytics_finance_company_rollup`) com `is_current`. As métricas financeiras devem ler do snapshot corrente, não da API em tempo de request.
- **Rollup por empresa já existente** (usar/estender): `saldo_aberto`, `saldo_vencido`, `titulos_abertos`, `atraso_medio_dias`, `situacao`.

### 1.2 HubSpot — Comercial (Deals)
- **Endpoint:** CRM v3 — `GET/POST /crm/v3/objects/deals` e `/crm/v3/objects/deals/search` (filtros por pipeline, dealstage, closedate). Batch/read por lotes de até 100.
- **Credencial:** Private App token via `rpc_service_get_managed_integration_secret('hubspot')` (padrão já usado). Fallback `HUBSPOT_PRIVATE_APP_TOKEN`.
- **Propriedades necessárias:** `amount`, `pipeline`, `dealstage`, `hs_is_closed`, `hs_is_closed_won`, `closedate`, `createdate`, `hs_deal_stage_probability`, `hubspot_owner_id`, `dealname`, `hs_lastmodifieddate`, `notes_last_updated` (parada/estagnação), `closed_lost_reason` (motivo de perda — confirmar propriedade).
- **Metadados:** ler os estágios e labels oficiais do pipeline via `/crm/v3/pipelines/deals` (preservar nome oficial; alias só interno).

### 1.3 HubSpot — Suporte (Tickets / Service)
- **Endpoint:** `/crm/v3/objects/tickets` + `/crm/v3/objects/tickets/search`; pipelines de ticket via `/crm/v3/pipelines/tickets`.
- **Preservar os pipelines de suporte hoje em uso** (não renomear; alias interno permitido).
- **Propriedades necessárias:** `hs_pipeline`, `hs_pipeline_stage`, `hs_ticket_priority`, `createdate`, `hs_ticket_category`, `source_type` (canal), `hs_lastcontacted`, `time_to_first_agent_reply_millis` (TMR), `hs_time_to_close` / `time_to_close` (TMA), `closed_date`, `hubspot_owner_id`.
- **CSAT/NPS:** via feedback submissions / survey (`hs_survey`... — **confirmar** propriedade/objeto disponível na conta antes de prometer o KPI).

### 1.4 Chat / Atendimento (Conversas)
- **Endpoint:** HubSpot Conversations (`/conversations/v3/conversations/threads`) para volume por canal e conversas ao vivo. Se o chat ao vivo do produto **não** for HubSpot, mapear a fonte real (tabela interna de atendimento) e declarar a origem.
- **Campos:** thread `status` (aberto/fechado), `channel`/`source` (chat, e-mail, whatsapp, telefone), `createdAt`, `latestMessageTimestamp`, `assignedTo`.
- **Nota:** se a conta não expõe Conversations API, marcar "Chats ativos" e "Volume por canal" como **indisponível** até habilitar.

---

## 2. Aba RESUMO GERENCIAL (rollup cross-domínio)

Visão de 1 tela para o executivo. Cada card é um **rollup** das abas de domínio (não recalcula — reusa o mesmo read-model).

| # | Métrica | Definição | Fórmula | Fonte | Janela | Status |
|---|---------|-----------|---------|-------|--------|--------|
| R1 | Saldo em aberto | Total a receber | Σ saldo_aberto (snapshot corrente) | OMIE | atual | Pronto (rollup existe) |
| R2 | Vencido (%) | Inadimplência da carteira | Σ saldo_vencido ÷ Σ saldo_aberto | OMIE | atual | Pronto |
| R3 | Receita nova ganha | Deals won no período | Σ amount onde `hs_is_closed_won` e `closedate ∈ período` | HubSpot | período | A implementar |
| R4 | Pipeline aberto | Valor em negociação | Σ amount onde `hs_is_closed=false` | HubSpot | atual | A implementar |
| R5 | Tickets abertos | Fila total ativa | count tickets com stage ≠ fechado | HubSpot Service | atual | A implementar |
| R6 | 1ª resposta (TMR) | Tempo médio de 1ª resposta | média `time_to_first_agent_reply` | HubSpot Service | período | Depende da propriedade |
| R7 | CSAT | Satisfação | média das respostas de satisfação | HubSpot survey | período | Confirmar disponibilidade |
| R8 | Cobertura CS | Saldo reconciliado com CRM | Σ saldo reconciliado ÷ Σ saldo_aberto | derived (OMIE×HubSpot) | atual | Depende de §5 |
| R9 | Saúde geral | Semáforo agregado (financeiro+comercial+suporte) | regra ponderada (ver nota) | derived | atual | Definir pesos |

Nota R9: semáforo derivado de limiares (ex.: vencido% > 40% → risco; TMR acima do SLA → atenção; conversão em queda → atenção). Pesos devem ser parametrizáveis, não hardcoded.

O Resumo também exibe **os 3 insights do Gênio** (um por domínio) — texto gerado a partir dos mesmos números (ver §7 insights).

---

## 3. Aba FINANCEIRO (OMIE)

### 3.1 KPIs base
| # | Métrica | Definição | Fórmula | Campos OMIE | Janela | Status |
|---|---------|-----------|---------|-------------|--------|--------|
| F1 | Saldo em aberto | Total a receber em aberto | Σ saldo em aberto dos títulos não recebidos | `mValorAberto`,`cStatus` | atual | Pronto |
| F2 | Vencido | Saldo vencido (R$ e % da carteira) | Σ saldo onde `dDtVenc < hoje` e não recebido; % = ÷ F1 | `dDtVenc`,`mValorAberto` | atual | Pronto |
| F3 | A vencer em 30 dias | Entrada prevista no mês | Σ saldo onde `hoje ≤ dDtVenc ≤ hoje+30` | `dDtVenc` | atual | Pronto |
| F4 | Atraso médio | Dias médios ponderados de atraso dos vencidos | Σ(dias_atraso × saldo) ÷ Σ saldo vencido | `dDtVenc` | atual | Pronto (`atraso_medio_dias`) |

### 3.2 KPIs novos (gestão)
| # | Métrica | Definição | Fórmula | Fonte | Status |
|---|---------|-----------|---------|-------|--------|
| F5 | Concentração de risco (Top 5) | Quanto do vencido está nos 5 maiores devedores | Σ vencido dos top 5 ÷ Σ vencido total | OMIE | A implementar (ordenar rollup) |
| F6 | Cobertura CS | % do saldo com empresa correspondente no HubSpot | Σ saldo reconciliado ÷ F1 | derived §5 | Depende de §5 |
| F7 | Vencido em risco | Vencido de clientes em churn ou sem CSM | Σ vencido onde status CS ∈ {churn, sem CS} | derived (OMIE×HubSpot) | Depende de §5 |
| F8 | Clientes inadimplentes | Nº de clientes com ≥1 título vencido | count distinto de clientes com vencido>0 | OMIE | A implementar |
| F9 | DSO (prazo médio de recebimento) | Dias médios entre emissão/venc. e recebimento | Σ(dDtRecebimento − dDtVenc) ponderado | OMIE | **Bloqueado**: requer `dDtRecebimento` confirmado |
| F10 | Variação MoM do saldo | Tendência do saldo em aberto mês a mês | (saldo_mês − saldo_mês_anterior) ÷ anterior | OMIE (snapshots) | **Pendente**: acumular histórico de snapshots |

### 3.3 Blocos
- **Previsibilidade de recebíveis:** Σ saldo a vencer agrupado por mês de `dDtVenc` (próximos 4 meses). Fonte OMIE.
- **Inadimplência por faixa (aging):** buckets 1-30 / 31-60 / 61-90 / 90+ dias por `hoje − dDtVenc`; para cada faixa: contagem de títulos + Σ saldo.
- **Maiores devedores:** top N clientes por saldo em aberto, com `nome` + `CNPJ` (do OMIE).
- **Financeiro × CS:** saldo e vencido agrupados por status CS do cliente (ver §5); linhas: Cliente ativo / Sem status CS / Grupo econômico / Churn.

---

## 4. Aba COMERCIAL (HubSpot — Deals)

### 4.1 KPIs base
| # | Métrica | Definição | Fórmula | Propriedades | Janela | Status |
|---|---------|-----------|---------|--------------|--------|--------|
| C1 | Receita nova ganha | Valor de deals ganhos no período | Σ `amount` onde `hs_is_closed_won` e `closedate ∈ período` | `amount`,`hs_is_closed_won`,`closedate` | período | A implementar |
| C2 | Pipeline aberto | Valor em negociação | Σ `amount` onde `hs_is_closed=false` | `amount`,`hs_is_closed` | atual | A implementar |
| C3 | Taxa de conversão | Ganhos ÷ fechados no período | count won ÷ (won + lost) no período | `hs_is_closed_won`,`hs_is_closed`,`closedate` | período | A implementar |
| C4 | Ciclo médio de vendas | Dias médios criação→fechamento (won) | média(`closedate` − `createdate`) para won | `createdate`,`closedate` | período | A implementar |

### 4.2 KPIs novos (gestão)
| # | Métrica | Definição | Fórmula | Status |
|---|---------|-----------|---------|--------|
| C5 | Deals ganhos | Nº de deals won no período | count won | A implementar |
| C6 | Ticket médio | Valor médio do deal ganho | C1 ÷ C5 | A implementar |
| C7 | Em risco de perda | Valor de deals abertos parados > 30 dias | Σ `amount` (abertos, `hs_lastmodifieddate` > 30d) | A implementar (confirmar campo de estagnação) |
| C8 | Previsão de fechamento (ponderada) | Pipeline ponderado pela probabilidade da etapa | Σ (`amount` × `hs_deal_stage_probability`) dos abertos | A implementar |

### 4.3 Blocos
- **Funil por etapa:** por `dealstage` (labels oficiais do pipeline): count de deals abertos + Σ `amount`.
- **Pipeline por responsável:** por `hubspot_owner_id` (resolver nome via `/crm/v3/owners`): count + Σ `amount` aberto; destacar "Não atribuído".
- **(Opcional) Motivos de perda:** por `closed_lost_reason` (se a propriedade existir) — contagem e valor perdido.

---

## 5. Reconciliação OMIE × HubSpot (base de F6/F7 e do bloco Financeiro × CS)

- **Chave primária:** CNPJ (`cCPFCNPJCliente` do OMIE ↔ propriedade de CNPJ da company no HubSpot). Normalizar (só dígitos) antes de casar.
- **Prioridade da planilha CS:** durante a migração, respeitar a prioridade definida para os dados da planilha (staging/enriquecimento) sobre inferências.
- **Registrar por empresa:** `match` (id HubSpot), `sem_correspondencia`, `ambiguo` (múltiplos CNPJs / matriz×filial×grupo econômico). **Não fazer merge automático sem evidência.**
- **Diferenciar** duplicidade real de matriz/filial/grupo econômico (mesmo grupo, CNPJs distintos não é duplicata).
- **Saídas para o dashboard:** total reconciliado (R$), total sem cadastro (R$), cobertura (%), contagem de ambíguos — todos com link para revisão.
- **Status CS do cliente** (para o bloco Financeiro × CS) vem da company no HubSpot (propriedade de lifecycle/health/CS status — confirmar nome). Sem essa propriedade → "Sem status CS".

---

## 6. Suporte & Chat (HubSpot Service + Conversas)

### 6.1 KPIs base
| # | Métrica | Definição | Fórmula | Propriedades | Status |
|---|---------|-----------|---------|--------------|--------|
| S1 | Tickets abertos | Fila total ativa | count tickets com stage ≠ fechado | `hs_pipeline_stage` | A implementar |
| S2 | 1ª resposta (TMR) | Tempo médio até 1ª resposta do agente | média `time_to_first_agent_reply_millis` | idem | Depende da propriedade |
| S3 | Resolução (TMA) | Tempo médio até fechar | média `time_to_close` (fechados no período) | `time_to_close`,`closed_date` | A implementar |
| S4 | CSAT | Satisfação no período | média das respostas de satisfação | survey/feedback | Confirmar disponibilidade |

### 6.2 KPIs novos (gestão)
| # | Métrica | Definição | Fórmula | Status |
|---|---------|-----------|---------|--------|
| S5 | Backlog fora do SLA | Tickets abertos com tempo em fila > SLA | count(abertos, idade > SLA por prioridade) | A implementar (definir SLA por prioridade) |
| S6 | Resolução no 1º contato (FCR) | % resolvidos sem reabertura/2º toque | resolvidos_1contato ÷ resolvidos | Depende de sinal de reabertura |
| S7 | Resolvidos no mês | Vazão da operação | count fechados no período | A implementar |
| S8 | Chats ativos | Conversas de chat ao vivo agora | count threads chat com status aberto | Depende de Conversations API |

### 6.3 Blocos
- **Fila por prioridade:** por `hs_ticket_priority`: count de abertos + idade do mais antigo.
- **SLA por faixa:** distribuição dos abertos por faixa de tempo em fila vs SLA (dentro / atenção / estourado).
- **Volume por canal:** por `source_type`/channel (chat, e-mail, whatsapp, telefone): contagem no período.
- **Top motivos de contato:** por `hs_ticket_category` (se existir).

---

## 7. Selo de origem, frescor e confiança (payload de cada bloco)

Cada bloco/métrica retorna metadados para os selos do dashboard:
- `source`: `omie` | `hubspot` | `hubspot_service` | `conversations` | `derived`.
- `mode`: `api_live` | `planilha_fallback` (financeiro) — e, para HubSpot, o pipeline oficial usado.
- `last_sync_at` + `freshness_seconds` → badge "atualizado há X"; alerta se acima do limite.
- `confidence` (para métricas derivadas): incluir cobertura da reconciliação (casados/total), nº de "sem correspondência" e ambíguos.
- `available` + `unavailable_reason` quando a fonte não fornece o dado (renderizar "indisponível").

**Insights do Gênio (IA):** texto curto por aba gerado a partir **dos mesmos números** (sem nova fonte), destacando o achado acionável (ex.: concentração de vencido em contas sem CSM; deals parados; TMR acima do SLA). Nunca afirmar dado que não esteja no read-model.

---

## 8. Dependências e pendências (o que confirmar antes de prometer o KPI)

| Item | Impacta | Ação para o Codex |
|------|---------|-------------------|
| `dDtRecebimento` no retorno OMIE | F9 (DSO) | Confirmar campo; se ausente, marcar DSO indisponível |
| Histórico de snapshots financeiros | F10 (MoM) | Persistir snapshots datados; MoM só após ≥2 períodos |
| Propriedade CNPJ na company HubSpot | §5, F6, F7 | Confirmar nome exato e preenchimento |
| Propriedade de status CS/health | Financeiro×CS, F7 | Confirmar; sem ela → "Sem status CS" |
| `time_to_first_agent_reply` / TMA | S2, S3 | Confirmar disponibilidade por pipeline |
| CSAT/survey | S4, R7 | Confirmar objeto de feedback na conta |
| Conversations API habilitada | S8, Volume por canal | Se off, marcar indisponível |
| `closed_lost_reason` | Bloco motivos de perda | Opcional; confirmar existência |
| SLA por prioridade | S5 | Definir tabela de SLA (parametrizável, não hardcoded) |

---

## 9. Contrato de resposta sugerido (read-model / RPC)

Sugestão de shape único por domínio (o frontend consome só isto):

```json
{
  "period": { "granularity": "month", "start": "2026-07-01", "end": "2026-07-31", "compare_to": "2026-06" },
  "kpis": [
    {
      "id": "F2",
      "label": "Vencido",
      "value": 368300.0,
      "unit": "BRL",
      "rate": 0.491,
      "delta": { "value": 0.042, "direction": "up", "tone": "danger" },
      "tone": "danger",
      "formula": "Σ saldo vencido ÷ saldo em aberto",
      "source": "omie",
      "mode": "api_live",
      "last_sync_at": "2026-07-29T13:54:00-03:00",
      "freshness_seconds": 360,
      "available": true,
      "confidence": { "reconciliation_coverage": 0.79, "unmatched": 51, "ambiguous": 6 }
    }
  ],
  "blocks": [
    { "id": "aging", "type": "table", "source": "omie", "rows": [ /* … */ ], "available": true }
  ],
  "insight": { "text": "3 clientes concentram 41% do vencido e estão sem CSM.", "source": "derived" }
}
```

Regras do contrato: `rate` sempre `0..1`; `tone ∈ {success,warning,danger,neutral}`; `available:false` sempre acompanhado de `unavailable_reason`; nada de número sem `source` e `last_sync_at`.

---

## 10. Ordem de implementação recomendada

1. **Financeiro/OMIE** (maior parte já existe no snapshot): F1–F4, aging, previsibilidade, maiores devedores → depois F5, F8.
2. **Reconciliação §5** (CNPJ) → habilita F6, F7 e Financeiro×CS.
3. **Comercial/HubSpot Deals:** C1–C6, funil, pipeline por owner → depois C7, C8.
4. **Suporte/HubSpot Service:** S1, S3, S7, fila por prioridade → depois S2/S4/S5/S6 conforme propriedades confirmadas.
5. **Chat/Conversas:** volume por canal, S8 (se API habilitada).
6. **Resumo Gerencial:** rollups R1–R9 reusando os read-models acima (sem recálculo).

Cada etapa entrega: contrato JSON + fonte declarada + selo de frescor/confiança + tratamento de "indisponível". Sem push a produção nem escrita em massa no HubSpot sem dry-run e confirmação.
