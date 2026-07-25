# INTEGRATIONS-02 — Matriz de resolução final

| Achado | Severidade | Tratamento | Validação | Status | Limitação |
|---|---|---|---|---|---|
| Dois runners OMIE | alta | Serviço canônico compartilhado | Node, build | Corrigido | Sync real não executado |
| Identidade posicional | crítica | ID oficial ou identidade composta `omie-v3` | Node, casos de formato e ordem | Corrigido | Colisões legadas exigem revisão |
| Snapshot parcial publicado | crítica | Staging e RPC defensiva de promoção atômica | pgTAP, reset local | Corrigido | Sem volume produtivo |
| Resposta vazia ambígua | alta | Total autoritativo obrigatório e classificação explícita | Node, fault HTTP 200, páginas vazias | Corrigido | Depende da qualidade do contrato OMIE |
| Contagem divergente | alta | Falha antes da promoção e preservação do snapshot | Node, pgTAP | Corrigido | Sem API externa |
| Cobertura misturada ao status | alta | Coluna `coverage` separada com métricas de ingestão e enriquecimento | pgTAP, Node | Corrigido | Observabilidade produtiva futura |
| Enriquecimento superestimado | alta | Match exige código e entrada no índice; `fieldsUpdated` separado | Node | Corrigido | Índice real não consultado |
| Colisão de identidade | crítica | Falha antes do staging, contador por motivo e sem promoção | Revisão de serviço | Corrigido | Requer monitoramento produtivo |
| Escritas críticas sem erro | alta | Erros Supabase verificados em atualização, staging e promoção | Typecheck, revisão | Corrigido | Falhas remotas não simuladas |
| Staging residual | alta | Limpeza server-side após falha e código de falha de cleanup | Revisão de fluxo | Corrigido | Falha de cleanup não forçada em DB |
| Cursor HubSpot repetido | média | Guard de progresso preservado | Node focado | Corrigido | Limites de Search existentes |
| Wrapper CS sem gate explícito | alta | `can_read_analytics()` no wrapper | pgTAP | Corrigido | Não amplia acesso |
| Writes externos sem idempotência total | crítica | Etapa separada, sem retry cego | Auditoria | Bloqueado | Requer ledger e contrato externo |
| Tombstones e watermarks | alta | Não inventados sem contrato confirmado | Auditoria | Bloqueado | Próximo lote |
