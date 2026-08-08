-- Dashboard: limita o custo de memória dos read models que materializam
-- conjuntos amplos. O PostgREST usa work_mem global de 2 MB; isso fazia as
-- CTEs de Suporte e do Snapshot Executivo derramarem para disco e deixava as
-- RPCs vulneráveis ao statement_timeout de 8 s.
--
-- Os valores foram medidos no banco remoto com EXPLAIN (ANALYZE, BUFFERS):
--   - Suporte: 16 MB elimina o spill do conjunto de tickets.
--   - Snapshot executivo: 64 MB elimina o spill da reconciliação financeira.
--
-- ALTER FUNCTION preserva corpo, ownership, grants e dependências. A GUC é
-- restaurada ao sair de cada função, sem elevar o consumo global do PostgREST.

alter function public.rpc_analytics_support_kpis_v2(date, date, text, text)
  set work_mem to '16MB';

alter function public.rpc_analytics_ceo_snapshot(date, date)
  set work_mem to '64MB';
