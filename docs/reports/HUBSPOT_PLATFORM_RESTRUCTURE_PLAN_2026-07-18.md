# Reestruturação operacional do HubSpot - CS e Suporte - 2026-07-18

## Decisão de fronteira

O pipeline atual de Suporte/Tickets permanece a referência operacional da
equipe. Esta frente não altera tickets, pipeline, estágios, roteamento ou
permissões de atendimento.

CS será organizado por empresas, owners e visões salvas. Pipelines novos serão
criados somente para processos de CS, sem reutilizar o pipeline de Suporte.

## Auditoria da conta

- Portal: `20108050`.
- Company, Ticket, Contact e Deal possuem leitura e escrita pelo conector.
- A API de pipelines permite criar pipelines para Tickets em contas Service
  Hub, mas o conector disponível nesta sessão não expõe esse endpoint.
- A sessão visual do HubSpot não abriu a tela administrativa de pipelines; a
  criação precisa ser feita após autenticação administrativa no navegador ou
  com uma credencial/API que possua os escopos necessários.

## Indicadores encontrados

| Filtro operacional | Total observado |
|---|---:|
| Empresas com `cs_owner___aftersale` preenchido | 242 |
| Status contratual para revisão | 47 |
| Status de cliente não ativo/exceção | 213 |
| Empresas com MRR igual a zero (amostra completa retornada pela busca) | 45 |

Os totais são fotografia da consulta autenticada e devem ser recalculados na
criação das visões, pois os registros continuam mudando.

## Visões salvas propostas

### Para Sirlei Cândido

1. `CS | Sirlei | Carteira ativa`
   - `cs_owner___aftersale` = Sirlei Cândido.
   - `status_do_cliente___aftersale` = Cliente.
   - MRR maior que zero.
2. `CS | Sirlei | Risco e retenção`
   - Mesmo owner.
   - Status Churn ou Bloqueado, para tratamento de retenção.
3. `CS | Sirlei | Contrato para revisar`
   - Mesmo owner.
   - Status contratual Sem Contrato, Encerrado, Vencido ou ag assinatura.

### Para Mary Laurentino

1. `CS | Mary | Carteira ativa`
   - `cs_owner___aftersale` = Mary Laurentino.
   - `status_do_cliente___aftersale` = Cliente.
   - MRR maior que zero.
2. `CS | Mary | Risco e retenção`.
3. `CS | Mary | Contrato para revisar`.

### Visões gerenciais

- `CS | Sem CSM`: owner de CS vazio.
- `CS | Sem contrato`: status contratual Sem Contrato, Encerrado, Vencido ou
  ag assinatura.
- `CS | Churn e bloqueados`: status do cliente Churn ou Bloqueado.
- `CS | MRR zero`: MRR igual a zero, combinado com status e contrato para
  evitar tratar clientes de teste como carteira ativa.
- `CS | Carteira completa`: clientes ativos agrupados por CSM, contrato e MRR.

As visões devem ser compartilhadas com o time ou com todos conforme a
necessidade; a documentação atual do HubSpot suporta visibilidade privada, por
equipe ou global.

## Pipelines de CS propostos

### `CS | Onboarding e Migração`

1. A iniciar
2. Diagnóstico
3. Plano definido
4. Em execução
5. Aguardando cliente
6. Bloqueado
7. Concluído
8. Cancelado

### `CS | Gestão de Carteira`

1. Monitoramento
2. Contato programado
3. Plano de ação
4. Em risco
5. Recuperação
6. Concluído

Esses pipelines devem ser usados por tickets operacionais de CS, associados à
empresa. O pipeline atual de atendimento não deve receber migração, onboarding
ou gestão de carteira.

## Pendências administrativas

1. Criar os dois pipelines por UI administrativa ou API com escopo de
   pipelines/tickets.
2. Criar propriedades de Company para `cluster`, `carteira`, `health/farol`,
   `frequência de contato` e `status de migração`, caso a administração confirme
   que não existem equivalentes reutilizáveis.
3. Criar as visões salvas por usuário/equipe.
4. Revisar os 47 registros contratuais antes de qualquer arquivamento.
5. Criar um ledger para os 85 casos sem correspondência da planilha e decidir,
   caso a caso, quando criar novas empresas.

## Regra de limpeza

Nenhuma empresa deve ser apagada por MRR zero, ausência de CSM ou ausência de
contrato isoladamente. O registro pode possuir histórico de suporte, financeiro
ou relacionamento. A primeira ação é uma visão de revisão; arquivamento ou
exclusão só ocorre após validação do responsável e preservação do histórico.

## Fontes oficiais consultadas

- https://developers.hubspot.com/docs/api-reference/latest/crm/pipelines/guide
- https://developers.hubspot.com/docs/api-reference/latest/crm/pipelines/create-pipeline
- https://knowledge.hubspot.com/records/create-and-manage-saved-views
- https://knowledge.hubspot.com/object-settings/customize-records
