# INTEGRATIONS-02.1 — Bloqueadores de integridade corrigidos

## Resultado

Status: implementacao local concluida para os achados tecnicamente solucionaveis sem credenciais ou chamadas externas.

Decisao: APROVADO PARA REVISAO, condicionado ao PR #4 e aos checks do HEAD final.

## Arquitetura final

- `runOmieSnapshot` e o servico canonico compartilhado por `omie-sync` e `analytics-integration-run`.
- `analytics-scheduled-run` gera e propaga um `correlation_id` UUID para todos os workers.
- O snapshot financeiro grava em staging e promove por RPC `SECURITY DEFINER` em uma unidade transacional.
- O HubSpot permanece read-only para coleta; a etapa OMIE -> propriedades HubSpot continua separada e reexecutavel.

## Identidade e snapshot OMIE

- Titulos usam `omie-v3` com ID oficial ou chave composta deterministica.
- A posicao da linha, pagina e ordem da API nao participam da identidade.
- Registros sem campos estaveis suficientes sao rejeitados explicitamente com motivo sanitizado.
- `analytics_finance_receivables_staging` possui RLS habilitada, sem grants para anon/authenticated, e a RPC valida o conteúdo por si mesma.
- `rpc_service_promote_omie_snapshot(uuid)` valida run, staging, source key, identidade, contagens, duplicidade e idempotência antes de alterar o snapshot.
- Resposta OMIE vazia, colisão de identidade e falha de lote preservam o snapshot anterior.
- Identidades legadas permanecem rastreadas como `legacy`; migracao automatica de colisoes nao foi inventada.

## Correlacao, concorrencia e seguranca

- Cada run OMIE recebe `correlation_id`; o indice unico parcial existente continua impedindo concorrencia.
- Runs antigos sao encerrados como falha antes de nova tentativa.
- O wrapper publico `rpc_analytics_cs_snapshot` declara explicitamente `app_private.can_read_analytics()` antes de delegar ao implementacao legado.
- O RPC de promocao e executavel somente por `service_role`.
- A implementacao interna do snapshot CS nao e executavel por `authenticated`; o wrapper autorizado retorna o objeto vazio contratual sem `can_read_analytics()`.
- Falhas da etapa HubSpot deixam a execucao como `partial`, nunca como sucesso falso.
- Runs distinguem `processing`, `completed`, `partial`, `empty`, `failed` e `abandoned`.
- Nenhuma credencial, token, payload produtivo ou chamada real foi usada.

## HubSpot

- Cursores repetidos ou sem progresso falham com diagnostico sanitizado.
- A estrategia existente de particionamento de tickets acima de 10.000 resultados foi preservada.
- Deals continuam full sync quando a incrementalidade nao foi comprovada pelo contrato atual.
- Reconciliações/tombstones de todos os objetos e idempotencia completa de escritas externas permanecem backlog por dependerem de contrato de negocio e reconciliacao externa segura.

## Migrations

- `20260725060007_integrations_02_finance_snapshot_hardening.sql`: identidade versionada, staging, RLS e promocao atomica.
- `20260725061345_integrations_02_cs_snapshot_explicit_gate.sql`: gate explicito do wrapper CS.
- Ambas sao forward-only e foram aplicadas em reset local do zero.
- Nenhuma migration foi aplicada remotamente.

## Testes e limitacoes

- Typechecks, build, verify, lint DB e teste pgTAP focado passam.
- A suite completa chegou a falhar em uma execucao imediatamente apos o reset por incompatibilidade revelada pelo gate CS; o contrato foi ajustado para preservar a resposta JSON vazia existente. `npm run supabase:verify` foi executado novamente e passou com 80 arquivos e 1.297 testes.
- A suite Node focada de HubSpot/OMIE passa com 17 testes comportamentais.
- O teste pgTAP focado de integridade passa com 19 testes comportamentais.
- A suite DB completa passa com 80 arquivos e 1.307 testes.
- Nao houve sincronizacao real, benchmark produtivo ou teste contra APIs externas.

## Pendencias bloqueadas

- Publicacao e sincronização real requerem credenciais administradas e gate operacional fora deste lote.
- Idempotencia de writes externos, merge ambiguo, tombstones completos, watermarks por objeto e rate limiting administrativo exigem contratos runtime adicionais e nao foram simulados como se estivessem concluidos.
