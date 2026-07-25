# INTEGRATIONS-02 — Matriz de resolucao

| Achado INTEGRATIONS-01 | Severidade | Acao | Arquivos | Teste | Status | Limitacao |
|---|---|---|---|---|---|---|
| Dois runners OMIE | alta | Servico canonico compartilhado | `_shared/omie-sync-service.ts`, `omie-sync`, `analytics-integration-run` | Node focado; build | Corrigido | Sync real nao executado |
| Identidade `omie-row:<posicao>` | critica | ID oficial ou chave composta `omie-v3`; rejeicao explícita sem identidade | `_shared/omie.ts` | estabilidade, datas, valores, ausência posicional | Corrigido | Colisoes legadas requerem revisao |
| Snapshot parcial publicado | critica | staging + RPC defensiva de promoção atômica | migrations 20260725060007/20260725152837 | pgTAP 081 comportamental; reset | Corrigido | Sem volume produtivo |
| Ausencia virava recebido | critica | Promocao marca somente snapshot anterior como inativo | migration 20260725060007 | pgTAP 081; revisao SQL | Mitigado | Cancelamento externo exige contrato |
| Correlacao incompleta | alta | UUID gerado no scheduler e propagado | `analytics-scheduled-run`, servico OMIE | Node/runtime focado | Corrigido | Worker HubSpot existente mantido |
| Cursor HubSpot repetido | media | Guard de progresso | `_shared/hubspot.ts` | Node focado | Corrigido | Limites de Search ja existentes |
| Wrapper CS com gate indireto | alta | Wrapper explicita `can_read_analytics` | migration 20260725061345 | pgTAP 081 | Corrigido | Nao amplia acesso |
| Retries sem politica comum completa | media | Protecoes existentes preservadas | `_shared/hubspot.ts`, `_shared/omie.ts` | testes existentes | Mitigado | Jitter/deadline global ficam para lote seguinte |
| Escritas externas sem idempotencia total | critica | Nao simular; manter etapa separada e sem retry cego | runners existentes | revisao de fluxo | Bloqueado | Requer ledger/contrato externo |
| Tombstones/watermarks completos | alta | Nao inventar sem contrato HubSpot confirmado | HubSpot | auditoria | Bloqueado | Requer reconciliacao por objeto |
| Resposta OMIE vazia e colisao de identidade | alta | Abortam antes da promocao e preservam o snapshot anterior | `_shared/omie-sync-service.ts` | Node focado; revisao do fluxo | Corrigido | Requer observacao com volume produtivo |
| Falha HubSpot reportada como sucesso | alta | Marca a execucao como `partial` | `analytics-integration-run/index.ts` | teste de runtime; revisao do fluxo | Corrigido | Chamada externa nao executada |
| Rejeições silenciosas | alta | Contrato accepted/rejected/summary com motivos sanitizados | `_shared/omie.ts`, `omie-sync-service.ts` | Node comportamental | Corrigido | Sem payload produtivo |
| Persistência monolítica | média | Lotes sequenciais de 500 registros | `omie-sync-service.ts` | revisão de fluxo | Corrigido | Sem benchmark externo |
| RPC dependente do caller | crítica | Validações defensivas no banco e idempotência | `20260725152837_integrations_02_1_integrity_hardening.sql` | pgTAP comportamental | Corrigido | Migration remota não aplicada |
