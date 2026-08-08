-- CAMPOS CUSTOMIZADOS DE FECHAMENTO
--
-- A operação levantou a hipótese: "é quase impossível estar em débito tantos
-- dias, a equipe não deixaria tanto atendimento aberto assim; deve haver campo
-- customizado". A hipótese se confirmou.
--
--   tipo_de_fechamento | Fale conosco | Confi   1.247 preenchidos
--   data_de_passgem para Concluído | B2B          51 preenchidos
--
-- "Fale conosco | Confi" é justamente o pipeline com 1.443 na fila e 1.117
-- parados. Os números são da mesma ordem: **a equipe registra o desfecho no
-- campo e nem sempre move a etapa**, e o painel, lendo só a etapa, via como
-- aberto o que já tinha sido concluído.
--
-- Esta migration apenas guarda os valores. Nenhuma regra é aplicada.
--
-- Tratar "Solicitação concluída" como encerramento seria inventar regra de
-- negócio a partir de texto livre — o mesmo erro que já custou três lotes neste
-- projeto. O que fica é a evidência disponível para uma decisão registrada, do
-- mesmo jeito que o papel do pipeline e o cruzamento de etapas.

alter table public.hubspot_tickets
  add column if not exists closure_type text,
  add column if not exists closure_marked_at timestamptz,
  add column if not exists resolution_note text;

comment on column public.hubspot_tickets.closure_type is
  'Tipo de fechamento registrado em campo customizado. Guardado sem interpretacao: a etapa continua sendo a fonte do estado aberto ou fechado ate que exista decisao em contrario.';
comment on column public.hubspot_tickets.closure_marked_at is
  'Data de passagem para concluido, em campo customizado.';
