# Status

Task: DATA-PIPELINE-STAGE-SCOPE-2026-08-21
State: APPROVED
Owner: Codex
Role: EXECUTOR
Review mode: CLAUDE_REQUIRED
Base SHA: b676e6f095cdff09bb9b4150af36822612b3c5b7
Current SHA: UNCOMMITTED_WORKTREE
Last reviewer: Claude
Last review: 2026-08-21 — APPROVED, ciclo 1; DPS-F01 LOW aberto e não bloqueante
Updated at: 2026-08-21

## Notes

- Veredito completo em `handoffs/current/REVIEW.md`.
- Hipótese de regressão investigada primeiro e descartada com evidência: a
  reescrita de `rpc_analytics_commercial_snapshot` **não** derrubou o recorte de
  Operação. O recorte nunca esteve no corpo dessa função; é imposto por
  `rpc_analytics_commercial_snapshot_by_operation`, que concatena os pipelines de
  outras operações em `p_excluded_pipeline_ids`. O corpo novo preserva
  `<> all(p_excluded_pipeline_ids)`.
- Assinatura de 5 argumentos já existia desde `20260723173500`, com grants
  próprios; `create or replace` preserva privilégios, então não há função nova
  herdando EXECUTE para PUBLIC. `security definer`, `search_path=''` e o portão
  `app_private.can_read_analytics()` mantidos.
- Compatibilidade vem do backend: o `funnel` publica `pipeline_breakdown` e o
  frontend apenas filtra por pertinência. A chave composta de `stage_id` unida
  por vírgula é contrato real, lida no servidor por `string_to_array`.
- Cobertura parcial permanece explícita: sem `pipelineBreakdown` a linha vira
  `partial` com aviso, não zero nem opção inferida.
- Contra-testes reais nas duas camadas: no JS a combinação incompatível devolve
  `false`; no pgTAP 120, oito asserções incluindo "stage de outra operacao nao
  vira zero global nem cruza o escopo". Segundo lote seguido em que o teste
  quebra quando o comportamento quebra.
- DPS-F01 OPEN, LOW, não bloqueante: o frontend normaliza a comparação de
  operação (trim, colapso de espaços, minúsculas pt-BR) e o servidor compara
  exatamente com `is distinct from`. Latente; só se manifesta se houver valores
  de `group_company` divergentes por caixa ou espaço. Recolher em lote de
  manutenção, definindo um único dono da regra.
- Executado por mim sobre o estado entregue, não aceito por declaração:
  `web:typecheck` exit 0; `web:build` exit 0; `lint` exit 0 com 160 warnings;
  `test:all` 573 com 571 PASS, 1 skip e 1 falha dependente de Supabase local.
- Não validado: pgTAP real incluindo o teste 120, `supabase:lint:db` e QA visual
  autenticado dos dropdowns. A garantia final contra vazamento de combinação
  incompatível é comportamento de banco e não é executável pelo revisor.
- Transição de fila exigida do Codex: baixa deste lote e promoção do próximo
  item **na mesma edição** de `handoffs/README.md`.
- A aprovação não autoriza push, merge, pull request, deploy nem release
  surface, conforme `OD-001`. A migration é local.
- Nenhum código de produto foi alterado pela revisão.
