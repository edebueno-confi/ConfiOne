# Integração API OMIE (Contas a Receber) — 2026-07-20

Agente: Claude / Anthropic
Ambiente validado: Supabase local (dev). Nenhuma credencial exposta; segredo só no Vault local.

## Credenciais e permissões

- App Key/App Secret do OMIE criados pelo usuário (admin OMIE) e colados no
  Vault via Configurações → Integrações (dois campos separados; valor nunca
  transita pelo agente). Armazenados por `rpc_admin_upsert_managed_integration`
  em `vault`; a UI vê apenas `has_credentials`.
- Escopo: read-only na prática. A App Key do OMIE é por aplicativo/conta (sem
  escopo granular no ListarContasReceber); o sistema só invoca chamadas de
  leitura (`ListarContasReceber`, `ListarClientesResumido`).

## Endpoints e contrato (validado empiricamente)

- `financas/contareceber/` `ListarContasReceber`: param `{ pagina,
  registros_por_pagina, apenas_importado_api:'N' }`; lista em
  `conta_receber_cadastro`. O contrato anterior no repositório era fictício
  (`nPagina`/`nRegPorPagina`/`lista_contas_receber`) e foi corrigido.
- `geral/clientes/` `ListarClientesResumido`: param `{ pagina,
  registros_por_pagina }` (sem `apenas_importados_api`, que quebra
  `clientes_list_request`); lista em `clientes_cadastro_resumido` com
  `codigo_cliente`, `razao_social`, `nome_fantasia`, `cnpj_cpf`.

## Campos importados e mapeamento

- Do título: `codigo_lancamento_omie` (id), `valor_documento` (net),
  `status_titulo`, `data_vencimento`/`data_emissao`/`data_previsao`,
  `numero_documento`, `codigo_categoria`, `codigo_cliente_fornecedor`.
- Saldo/recebido derivados do status (a API não retorna valor pago): RECEBIDO →
  recebido=valor, saldo=0; CANCELADO → saldo=0; ATRASADO/VENCE HOJE/A VENCER →
  saldo=valor.
- Enriquecimento: nome/CNPJ do cliente por `ListarClientesResumido`, join
  `codigo_cliente_fornecedor = codigo_cliente`.
- Persistência idempotente em `analytics_finance_receivables`
  (`onConflict source_key,source_record_id`), execução registrada em
  `analytics_finance_sync_runs`.

## Métricas do cockpit (backend)

`rpc_analytics_finance_snapshot` (fonte ativa = API; planilha fallback, sem dupla
contagem): posição da carteira (aberto/vencido/%/atraso médio), previsibilidade
(a vencer 30/60/90 e por mês de vencimento), aging por faixa de dias, situação,
categorias, maiores devedores e cruzamento financeiro × CS/HubSpot por CNPJ
(matched/unmatched e por status de cliente).

## Reconciliação com CS/HubSpot

Carteira em aberto cruzada com `hubspot_companies` por CNPJ normalizado
(`regexp_replace('[^0-9]')`), atribuindo saldo/vencido por `client_status` e
medindo cobertura (reconciliado x sem empresa no HubSpot).

## Fallback da planilha

A planilha do OMIE permanece como fonte de fallback e o histórico de importações
sai do painel para a aba Logs. Quando só a planilha está disponível, métricas
exclusivas da API exibem aviso.

## Validações executadas (local)

- Sync real read-only: 3.433 títulos aceitos; enriquecimento 3.433/3.433 com
  nome/CNPJ.
- Números conferidos: saldo em aberto R$ 750.553,79; vencido R$ 368.300,23
  (49,1%); recebido R$ 2.806.626,15; atraso médio 221 dias.
- Cruzamento CS: reconciliado R$ 636.615,80; sem empresa no HubSpot R$ 113.937,99.
- `node --test` adapter OMIE: 8/8.
- `web:typecheck` e `web:build`: verdes (mantém aviso conhecido de chunk).
- Erro do OMIE agora expõe `faultstring`; retry não re-tenta HTTP 500 (evita o
  "consumo redundante" Client-6).

## Divergências e limites

- `ListarContasReceber` não traz valor pago nem CNPJ do cliente; resolvido por
  derivação de status e por enriquecimento via clientes.
- Centro de custo (`distribuicao`) veio vazio na base; exibir como indisponível
  até haver dado.
- Comparação formal API x planilha não é mais objetivo do ciclo (a API passou a
  ser fonte de verdade; planilha é apenas fallback).

## Pendências / próximo ciclo

- Rollout visual das abas Comercial e CS ao padrão do cockpit (ver
  `docs/DASHBOARD_GERENCIAL_UX_SPEC_V1.md`).
- Consolidar históricos (planilha/sync) na aba Logs.
- Teste pgTAP dedicado do `rpc_analytics_finance_snapshot` (cockpit) e execução
  da suíte `supabase test db`.
- Ativação/validação em ambiente remoto quando autorizado (gates de deploy).
