# Auditoria de segurança e performance das integrações — 2026-07-21

## Correções aplicadas

- ACL da RPC legada `rpc_analytics_ceo_snapshot_legacy` fechada para
  `anon`/`authenticated`; `service_role` permanece para chamadas internas.
- `omie-sync` e `analytics-integration-run` declarados com `verify_jwt = false`
  para permitir o fluxo secret-only do scheduler, cuja autorização continua
  dentro da função.
- Teste pgTAP 069 adicionado para impedir regressão da ACL.

## Riscos priorizados para o próximo ciclo

- aquisição de lease não é atômica entre funções concorrentes;
- o cursor HubSpot ainda é global e pode cruzar fases fora de ordem;
- histórico, snapshot e reconciliação do Dashboard podem disparar consultas
  pesadas simultaneamente;
- Deals, tickets e stages não possuem reconciliação explícita de arquivamento;
- CORS amplo e segredo compartilhado permanecem hardening futuro, dependentes de
  inventário de consumidores e procedimento de rotação.

## Controles verificados

- nenhum token foi exposto no frontend;
- RLS e grants das tabelas analíticas principais permanecem presentes;
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilidades;
- `npm run supabase:test:db`: 69 arquivos, 1.199 testes, PASS;
- nenhum scheduler remoto, deploy, push ou write externo foi executado.
