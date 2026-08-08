-- A redefinicao do Snapshot executivo na conciliacao manual preserva o contrato
-- de dados, mas CREATE OR REPLACE nao conserva a configuracao de work_mem.
-- Reaplica o hardening limitado a esta funcao para manter a rota autenticada
-- abaixo do statement_timeout sem alterar a memoria global do PostgREST.

alter function public.rpc_analytics_ceo_snapshot(date, date)
  set work_mem to '64MB';
