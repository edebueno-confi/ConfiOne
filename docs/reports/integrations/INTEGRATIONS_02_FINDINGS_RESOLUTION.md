# INTEGRATIONS-02 — Matriz de resolucao

| Achado INTEGRATIONS-01 | Severidade | Acao | Arquivos | Teste | Status | Limitacao |
|---|---|---|---|---|---|---|
| Dois runners OMIE | alta | Servico canonico compartilhado | `_shared/omie-sync-service.ts`, `omie-sync`, `analytics-integration-run` | Node focado; build | Corrigido | Sync real nao executado |
| Identidade `omie-row:<posicao>` | critica | ID oficial ou chave composta `omie-v2`; rejeicao sem identidade | `_shared/omie.ts` | estabilidade, ausencia posicional | Corrigido | Colisoes legadas requerem revisao |
| Snapshot parcial publicado | critica | staging + RPC de promocao atomica | migration 20260725060007 | pgTAP 081; reset | Corrigido | Sem volume produtivo |
| Ausencia virava recebido | critica | Promocao marca somente snapshot anterior como inativo | migration 20260725060007 | pgTAP 081; revisao SQL | Mitigado | Cancelamento externo exige contrato |
| Correlacao incompleta | alta | UUID gerado no scheduler e propagado | `analytics-scheduled-run`, servico OMIE | Node/runtime focado | Corrigido | Worker HubSpot existente mantido |
| Cursor HubSpot repetido | media | Guard de progresso | `_shared/hubspot.ts` | Node focado | Corrigido | Limites de Search ja existentes |
| Wrapper CS com gate indireto | alta | Wrapper explicita `can_read_analytics` | migration 20260725061345 | pgTAP 081 | Corrigido | Nao amplia acesso |
| Retries sem politica comum completa | media | Protecoes existentes preservadas | `_shared/hubspot.ts`, `_shared/omie.ts` | testes existentes | Mitigado | Jitter/deadline global ficam para lote seguinte |
| Escritas externas sem idempotencia total | critica | Nao simular; manter etapa separada e sem retry cego | runners existentes | revisao de fluxo | Bloqueado | Requer ledger/contrato externo |
| Tombstones/watermarks completos | alta | Nao inventar sem contrato HubSpot confirmado | HubSpot | auditoria | Bloqueado | Requer reconciliacao por objeto |
