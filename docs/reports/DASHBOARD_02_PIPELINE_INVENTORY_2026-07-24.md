# DASHBOARD-02 — Inventário local de pipelines HubSpot

Auditoria somente leitura da configuração local em 24/07/2026. Nenhum pipeline
foi removido, renomeado ou alterado no HubSpot.

| Domínio | Tipo | Pipeline ID | Nome local | Ativo |
| --- | --- | --- | --- | --- |
| Comercial | deal | 892833861 | Piloto Aftersale | sim |
| Comercial | deal | 5051729 | Pre-POC | Aftersale | sim |
| Comercial | deal | 5038166 | Hunting - Parcerias MKT | Aftersale | sim |
| Comercial | deal | 918743098 | Carteira CS | sim |
| Comercial | deal | 10888352 | Renovacao Contratual | sim |
| Comercial | deal | 727372071 | Pipe de Vendas | sim |
| Comercial | deal | 11065107 | Black Friday - Hora Hora | sim |
| Comercial | deal | 890074168 | Gerenciamento Faturamento | sim |
| Comercial | deal | 5014418 | Aquisicao | Aftersale | sim |
| Comercial | deal | 5038168 | Expansao - Retracao | Aftersale | sim |
| Comercial | deal | 5014421 | Retencao de Churn | Aftersale | sim |
| CS | ticket | 53130860 | Atendimento | Confi Analytics | sim |
| CS | ticket | 95268403 | Confi | Whatsapp | sim |
| CS | ticket | 5034314 | Criadouro de Tíquetes | Aftersale | sim |
| CS | ticket | 23949674 | Fale conosco | Confi | sim |
| CS | ticket | 1429283 | Suporte | sim |
| CS | ticket | 2013870 | Suporte B2B | Confi | sim |

## Achados e limites

- Há 17 pipelines ativos no read model local: 11 de deals e 6 de tickets.
- A reconciliação local é idempotente por objeto, pipeline e estágio, mas o
  cache não registra tombstone por pipeline/objeto ausente em uma carga completa.
- A execução mantém um watermark global por lote; não existe correlação comum
  entre todos os runs HubSpot e OMIE. Isso permanece backlog de observabilidade.
- A fonte oficial de labels e mudanças de pipeline continua sendo o HubSpot;
  esta tabela é inventário do cache local, não autorização para chamadas externas.
