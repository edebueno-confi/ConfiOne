# Backlog executável — Macro-lote Analytics 0.4+

Fonte canônica: `C:\Projetos\GSO-old`. Cada lote abaixo é independente e só
começa após sua especificação, plano, implementação, validação e documentação.
Nenhum lote autoriza push, deploy, sync remoto, uso de secret ou escrita em
HubSpot/OMIE.

## Lote 1 — Financeiro OMIE-only

- Objetivo: publicar recebíveis atuais somente da API OMIE.
- Escopo: estados, filtros, aging, reconciliação e fonte de verdade da RPC.
- Fora: planilhas como fallback, sync remoto e alteração de credenciais.
- Contratos: `rpc_analytics_finance_snapshot`, `rpc_analytics_finance_unmatched_clients`, `rpc_analytics_finance_source_status`.
- Banco: migration OMIE-only + pgTAP de origem, grants, RLS e estados.
- Frontend: estados honestos, CTA somente para OMIE/Configurações e sem dado simulado.
- Testes: contrato, typecheck, build, cenários `not_configured/error/empty/stale/fresh`, QA visual.
- Segurança: `SECURITY DEFINER`, `search_path` fixo, tenant, auditoria, sem anon.
- Aceite: zero planilha publicada e indisponibilidade demonstrada quando não há OMIE atual.
- Dependências: ambiente OMIE autorizado para validação real posterior.

## Lote 2 — Matching HubSpot ↔ OMIE

- Objetivo: análise read-only de candidatos e fila humana governada.
- Escopo: normalização, sinais, score analítico versionado, classificação e integridade.
- Fora: merge automático, update externo, threshold sem amostra revisada.
- Contratos: `rpc_analytics_company_candidates`, fila/reconciliação e grupo econômico.
- Banco: ledger append-only, estados de revisão, uniqueness e pgTAP cross-tenant.
- Frontend: filtros e evidências; sem decisão local nem aplicação automática.
- Testes: fixtures de CNPJ exato/raiz, nome, duplicidade, ambiguidade e rejeição.
- Segurança: mascaramento de PII no relatório, RLS, permissão e auditoria.
- Aceite: dry-run repetível, agregado sem vazamento e rollback lógico definido.
- Dependências: carga OMIE atual e amostra humana autorizada.

## Lote 3 — Comercial drill-down

- Objetivo: navegar do agregado a Deals individuais com filtros server-side.
- Escopo: paginação, ordenação, Deal↔Company e helper de link HubSpot validado.
- Fora: escrita em Deals/Companies e chamadas HubSpot no carregamento da tela.
- Contratos: view/RPC paginada com `deal_id`, pipeline, stage, owner, amount, moeda, datas, qualidade e associação.
- Banco: migration somente após auditoria do read model atual.
- Frontend: tabela/estado vazio/erro, link apenas quando portal+ID são válidos.
- Testes: paginação, ordenação determinística, nulos, associação múltipla, tenant/RLS, QA 1440/1024.
- Segurança: limites de página, permissão Analytics, sem URL inventada.
- Aceite: nenhum detalhe montado a partir de card e ausência claramente indisponível.
- Dependências: catálogo/pipeline e política de associação Deal↔Company.

## Lote 4 — Tickets e SLA

- Objetivo: completar o catálogo de tickets sem misturar Conversas ou CS.
- Escopo: SLA de primeira resposta/encerramento, canais, backlog e satisfação quando a fonte existir.
- Fora: usar ticket como health score ou sincronizar escopo não autorizado.
- Contratos: read model ticket versionado, campos SLA, `source_type`, qualidade e frescor.
- Banco: views/RPC e fixtures de status desconhecido, SLA ausente e associação nula.
- Frontend: filtros, cards, tooltips de denominador e estados honestos.
- Testes: fórmula/denominador, períodos, RLS, overflow e screenshots.
- Segurança: tenant, escopo HubSpot, retenção e auditoria.
- Aceite: status desconhecido não encerra ticket e ausência não vira zero.
- Dependências: política SLA e dados sincronizados válidos.

## Lote 5 — Conversas/Chat

- Objetivo: avaliar e, se autorizado, ingerir inbox/thread/mensagem como domínio separado.
- Escopo: API/escopos/plano, cursor, deduplicação, canais, atores, SLA e satisfação.
- Fora: misturar thread com ticket sem associação oficial ou expor conteúdo bruto.
- Contratos: `tenant_id`, portal/inbox/channel/thread/message, actor/direction/status, cursor, qualidade e retenção.
- Banco: staging idempotente + read model/RPC; pgTAP de isolamento.
- Frontend: somente após fonte real e estado de disponibilidade.
- Testes: paginação, dedup, correlação opcional, permissões, vazio/erro/fresh.
- Segurança: mínimo privilégio, minimização/retensão de conteúdo, auditoria.
- Aceite: fonte/escopo confirmados e métricas separadas de Tickets.
- Dependências: portal, plano, escopos e aprovação de custo/uso de API.

## Lote 6 — Customer Success

- Objetivo: publicar carteira, cobertura, cadência, risco e health score próprios.
- Escopo: catálogo de 12 métricas, read model, score explicável e revisão humana.
- Fora: snapshot executivo, tickets, Deals ou OMIE como proxy; regra no React.
- Contratos: carteira/owner, componentes, score/version/frescor/qualidade e estados.
- Banco: views/RPC, histórico, auditoria, RLS e pgTAP.
- Frontend: estados loading/empty/unavailable/fresh, explicações e sem simulação.
- Testes: denominadores, nulos, tenant/RLS, health score e QA visual.
- Segurança: permissão CS, isolamento, revisão humana e sem ação externa automática.
- Aceite: cada métrica tem origem, fórmula, período, owner e evidência.
- Dependências: decisão de carteira, origem de atividades, onboarding e health.

## Lote 7 — Auditoria e observabilidade Analytics

- Objetivo: fechar rastreabilidade de fontes, frescor, execução e qualidade.
- Escopo: `source_status`, sync runs, correlation IDs, logs, alertas internos e ledger documental.
- Fora: scheduler remoto, secrets, deploy e alterações de produção sem autorização.
- Contratos: estado/frescor/observed_at, run_id, correlation_id, erro sanitizado e métricas de volume.
- Banco: views/RPC read-only, retenção e índices; sem reset destrutivo.
- Frontend: Configurações/diagnóstico com mensagens operacionais e sem token.
- Testes: falha de fonte, stale, duplicidade, permissão, secret scan, smoke e visual.
- Segurança: sem payload sensível em logs, tenant/RLS e acesso administrativo mínimo.
- Aceite: toda métrica publicada aponta fonte, timestamp, run e qualidade.
- Dependências: lotes 1–6 e credenciais apenas no ambiente autorizado.

## Gate comum de cada lote

Especificação → plano → implementação pequena → typecheck/lint/testes de
contrato/pgTAP quando disponível → build → secret scan → QA autenticado real
para UI → documentação persistida → commit separado → relatório com limitações.
