# Auditoria inicial — migração CS para HubSpot — 2026-07-18

## Evidências consultadas

- Portal HubSpot `20108050`, leitura autenticada pelo usuário conectado.
- Planilha `CS Ops | Carteiras e Clusters -v2`.
- Abas analisadas: `Dashboard_CS`, `BD_Clientes`, `Contato_Inicial_CS`, `Clusters`, `Dash_Data`, `Projetos`, `Projeto_Clientes` e `Tarefas_Projeto`.

## Estrutura encontrada na planilha

`BD_Clientes` possui campos de identidade, contrato, MRR, integração, status de migração, farol, cluster, carteira, responsável, modelo de atendimento, frequência de contato, health e prioridade.

`Contato_Inicial_CS` registra a primeira abordagem, meio, data, próximo contato, resultado e observações.

`Projetos`, `Projeto_Clientes` e `Tarefas_Projeto` formam um pequeno módulo de projetos/migração por cliente.

## Capacidade confirmada no HubSpot

- Objetos com leitura/escrita disponíveis: Company, Contact, Ticket e Deal.
- Licenças/seats reportados pela API: `service-enterprise`, `sales-pro`, `core` e `view-only`.
- Equipes relevantes existentes: `Suporte N1 | Aftersale`, `Suporte N2 | Aftersale`, `Onboarding | Aftersale`, `Head | Aftersale`, `Aftersale` e `QA | Aftersale`.
- Propriedades existentes relevantes: `aftersale___mrr`, `mrr___aftersale`, `tipo_de_mrr`, `cs_owner___aftersale`, `status_do_cliente___aftersale`, `responsavel_pela_operacao___aftersale` e `hs_ticket_priority`.

## Risco de identidade

Os valores `Hubspot_ID` observados na planilha não localizaram diretamente as empresas correspondentes em uma busca autenticada pontual. O cliente `Zinco`, por exemplo, foi localizado no portal com outro ID. Portanto, a migração não pode atualizar registros apenas pelo `Hubspot_ID` da planilha.

## Regra de migração aprovada para implementação

1. Resolver empresa por `Hubspot_ID` quando a correspondência for confirmada.
2. Fallback por CNPJ normalizado.
3. Fallback por nome normalizado somente quando houver correspondência única.
4. Linhas ambíguas entram em revisão, sem criação ou atualização automática.
5. Criar/atualizar primeiro propriedades de Company para carteira, cluster, MRR, health e migração.
6. Usar Ticket para atendimento e um objeto/pipeline específico para migração V1 → V2, evitando duplicar tickets.
7. Executar primeiro uma amostra controlada e gerar relatório de correspondência antes da carga completa.

## Estado

Este lote foi somente de descoberta e documentação. Nenhum registro, propriedade, objeto ou workflow foi alterado no HubSpot.

## Pré-matriz de correspondência

Leitura da planilha `BD_Clientes`: 606 linhas preenchidas no intervalo operacional consultado. Busca HubSpot: 10.000 de 10.162 empresas paginadas; 10 páginas precisam ser reconsultadas por erro transitório da ferramenta.

Na amostra paginada disponível:

- 7 clientes resolveram por `Hubspot_ID`.
- 68 resolveram por CNPJ único.
- 211 resolveram por nome único.
- 320 permaneceram sem correspondência segura ou ambíguos.
- 141 linhas tinham `Hubspot_ID` inválido/legado, mas parte delas pôde usar fallback.

Esses números são pré-carga, não autorização para atualização. A primeira carga proposta é somente para os registros resolvidos por chave confirmada, com propriedades já existentes no HubSpot quando possível (`aftersale___mrr`, `tipo_de_mrr`, `cs_owner___aftersale`, `status_do_cliente___aftersale`) e relatório de antes/depois por registro.
