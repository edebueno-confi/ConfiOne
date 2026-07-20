# Analytics — pipelines de CS Support e fila de reconciliação

Data: 2026-07-19  
Escopo: Dashboard Gerencial (`/admin/analytics`), HubSpot live somente leitura e cache local Supabase.

## Diagnóstico do volume de suporte

O painel local mostrava 12 tickets em julho porque a configuração local estava
ativa somente para o pipeline `1429283` (`CS | Neotrust`). Esse pipeline não é o
fluxo operacional principal do atendimento que foi investigado.

No catálogo live do portal HubSpot `20108050`, a atividade de Rodolfo Turra
(owner `298856506`) foi consultada com `createdate >= 2026-07-01`:

- 143 tickets criados no mês por Rodolfo;
- os 143 estão no pipeline `5034314` (`Criadouro de Tíquetes | Aftersale`);
- os exemplos recentes incluem origem `CHAT` e `EMAIL`;
- o catálogo live também expõe pipelines separados para WhatsApp, Suporte B2B
  e Fale Conosco.

O volume live do pipeline `5034314` no mês foi 246 tickets. O cache local ainda
estava defasado: possuía 739 tickets no pipeline legado, com último ticket em
16/07/2026, e nenhum registro local nos novos pipelines. Portanto, a correção
de configuração precisa ser seguida de uma sincronização concluída para que o
dashboard passe a refletir o HubSpot atual.

## Escopo de pipelines configurado

| Área | Pipeline | Situação |
|---|---|---|
| CS / Suporte | `5034314` — Criadouro de Tíquetes \| Aftersale | ativo; fluxo principal observado para Rodolfo |
| CS / Suporte | `95268403` — Confi \| Whatsapp | ativo; canal separado |
| CS / Suporte | `2013870` — Suporte B2B \| Confi | ativo |
| CS / Suporte | `23949674` — Fale conosco \| Confi | ativo |
| CS / Suporte | `53130860` — Atendimento \| Confi Analytics | ativo; sem volume no recorte consultado |
| CS / Suporte | `1429283` — CS \| Neotrust | inativo por padrão; mantido no catálogo para auditoria |

O suporte operacional existente não foi alterado. A mudança apenas amplia a
leitura do Dashboard e deixa os pipelines administráveis na nova aba
`Configuração` do Dashboard Gerencial.

## Alterações implementadas

- `analytics_source_config` agora suporta vários pipelines por domínio e possui
  RPC administrativo validado por `platform_admin`.
- O sincronizador registra `hubspot_owner_id` em `hubspot_tickets`.
- O snapshot de CS e a visão executiva consolidam tickets por pipeline, origem
  e responsável, além de expor o total criado no período.
- A fila de qualidade classifica cada título financeiro como `matched`,
  `unmatched` ou `ambiguous`, com contagem de candidatos e paginação server-side.
- A visão executiva permite buscar por cliente, CNPJ ou título e filtrar a fila
  por classificação. Candidatas exibem link direto para o registro HubSpot e
  ambíguas reutilizam a confirmação explícita de unificação já validada. Sem
  correspondência exibe o contexto da origem e um link para a lista de empresas,
  sem criar ou unir automaticamente.

## Interpretação dos números de qualidade

Os números `sem correspondência` e `ambiguidade` são contagens de títulos
financeiros importados no recorte, não contagens de clientes em atraso. Um
cliente pode possuir vários títulos. A fila detalhada permite revisar a origem,
ver candidatos e decidir caso a caso; a regra não escolhe um mestre por conta
própria.

## Próximo passo operacional

1. Abrir `/admin/analytics` como administrador.
2. Acessar `Configuração` para conferir os pipelines ativos.
3. Executar `Sincronizar HubSpot`.
4. Conferir em `CS / Suporte` o total criado, por origem, pipeline e responsável.
5. Usar a fila de reconciliação na `Visão executiva` para revisar e, somente após
   confirmação humana, unificar empresas ambíguas.

Nenhuma credencial foi exposta e nenhuma alteração operacional foi feita no
HubSpot neste ciclo.
