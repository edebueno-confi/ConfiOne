# INTEGRATIONS-02.2 — Consistência semântica final

## Resultado

Status: hardening local concluído e validado; pronto para publicação e merge controlado após os gates remotos.

Decisão: APROVADO E MERGEADO somente após os checks da branch e da `main` permanecerem verdes.

## Resposta OMIE vazia

- `empty` é reservado para resposta estruturalmente válida com `total_de_registros = 0`, paginação coerente e ausência de fault ou erro de transporte.
- Resposta vazia sem total falha com `OMIE_EMPTY_RESPONSE_WITHOUT_AUTHORITATIVE_TOTAL`.
- Total positivo sem linhas falha com `OMIE_TOTAL_RECORDS_WITHOUT_ROWS`.
- Total conhecido diferente do acumulado falha com `OMIE_RECORD_COUNT_MISMATCH`.
- Página intermediária vazia falha com `OMIE_EMPTY_PAGE_BEFORE_END`.
- Fault funcional em HTTP 200 falha com `OMIE_FUNCTIONAL_FAULT`.
- Em todos os casos de falha, o snapshot anterior permanece preservado.

## Semântica dos estados e cobertura

O status do snapshot (`completed`, `partial`, `empty`, `failed` ou `abandoned`) permanece separado da cobertura de dados. Cada execução registra `coverage` com normalização, enriquecimento, recebidos, aceitos, rejeitados, enriquecidos, não correspondidos e erros. Um snapshot pode concluir a ingestão com enriquecimento parcial sem ser apresentado como sucesso integral.

## Enriquecimento

Um título só é contado como correspondido quando possui código de cliente e esse código encontra entrada no índice OMIE. `fieldsUpdated` mede campos realmente preenchidos; código ausente e código sem correspondência são contabilizados separadamente como não correspondidos. Nenhum registro sem código é promovido a correspondência.

## Colisões e staging

Identidades duplicadas `source_key + source_record_id` são detectadas antes do staging. A execução falha com `OMIE_IDENTITY_COLLISION`, registra `rejected_by_reason.identity_collision` e não promove o lote. Falhas durante persistência ou promoção tentam limpar o staging server-side; eventual falha de limpeza fica registrada como `OMIE_STAGING_CLEANUP_FAILED`.

## Integridade de escrita e promoção

As escritas críticas de encerramento, contagens, cobertura, staging e promoção verificam o erro retornado pelo Supabase. A RPC de promoção continua defensiva, forward-only, protegida por `service_role`, com lock/advisory lock, validação de identidade e contagens, limpeza do staging e idempotência para execuções concluídas. Estados parciais, falhos, vazios e abandonados não promovem.

## Identidade OMIE

Títulos usam `omie-v3`: ID oficial quando presente ou chave composta determinística com cliente, documento, parcela, tipo, vencimento, valor, código de integração e categoria. A posição da linha, página e ordem da API não participam da identidade. Registros sem campos estáveis são rejeitados explicitamente.

## Validações

- `npm run contracts:typecheck`: passou.
- `npm run web:typecheck`: passou.
- `npm run web:build`: passou.
- `npm run supabase:db:reset`: passou em banco local reconstruído do zero.
- `npm run supabase:test:db`: passou com 80 arquivos e 1.308 testes pgTAP.
- `npm run supabase:lint:db`: passou; somente avisos preexistentes de `v_actor`.
- `npm run supabase:verify`: passou com 80 arquivos e 1.308 testes pgTAP.
- Suite Node focada de analytics, HubSpot e OMIE: 25 testes comportamentais passaram.
- `npm run repository:check-root`: passou.
- `git diff --check`: passou.

Não foram executadas sincronizações reais, chamadas externas, migrações remotas, writes no HubSpot/OMIE ou uso de credenciais.

## Limitações e backlog

Idempotência de writes externos, tombstones e watermarks completos por objeto, rate limiting global, benchmark produtivo, drift da migration remota e validação contra volume real continuam fora deste lote. O pacote de revisão local contém somente documentação e metadados sintéticos, sem secrets ou dados operacionais reais.
