# Fila de reconciliação da planilha CS Ops com HubSpot — 2026-07-19

## Escopo

Auditoria somente de leitura da aba `BD_Clientes` da planilha autenticada
`CS Ops | Carteiras e Clusters -v2` (`1qdn81NNFQoWLwIHHx8Q3sJMtv2ReUsYI0R-cnu6_65I`)
contra o cache local `public.hubspot_companies` do portal `20108050`.

Nenhuma célula da planilha, empresa HubSpot ou registro local foi alterado
neste lote.

## Fonte e campos lidos

- aba: `BD_Clientes`;
- intervalo de dados: linhas 5 a 610, 606 registros;
- chaves de reconciliação: `Hubspot_ID`, `CNPJ`, `Nome_Plataforma` e `Razao_Social`;
- contexto operacional: `Ativo`, `Status_Contrato`, `Valor_MRR`, `MRR_Mensal`,
  `Cluster_Final`, `Carteira_Final`, `Responsavel_Final`, `Health`,
  `Prioridade_CS` e `Observacoes_CS`;
- cache HubSpot observado: 10.161 empresas.

## Regra aplicada

1. HubSpot ID exato quando o ID informado existe no cache;
2. CNPJ normalizado quando há uma única empresa candidata;
3. nome/razão social normalizados quando há uma única candidata;
4. mais de uma candidata permanece ambígua;
5. ID informado que não existe é preservado como `ID histórico` e não é usado
   para criar duplicata; a linha tenta CNPJ/nome antes de entrar na fila de
   criação ou revisão.

## Resultado

| Classificação | Total | Ativos | Tratamento recomendado |
| --- | ---: | ---: | --- |
| HubSpot ID encontrado | 7 | 7 | Atualização idempotente pela planilha |
| ID histórico + CNPJ único | 69 | 69 | Atualizar candidata encontrada; registrar troca de chave |
| ID histórico + nome único | 26 | 25 | Atualizar candidata encontrada; registrar troca de chave |
| CNPJ único sem ID | 127 | 127 | Atualização idempotente pela planilha |
| Nome único sem ID | 78 | 73 | Atualizar candidata; manter baixa confiança relativa ao CNPJ |
| Ambígua por nome/CNPJ | 19 | 19 | Revisão humana antes de unificar ou atualizar |
| Sem correspondência | 280 | 273 | Fila de criação controlada, sem reutilizar ID histórico |
| **Total** | **606** | **593** | — |

Os 307 primeiros registros possuem uma candidata única pelo critério atual
(301 ativos). Isso é uma fila de atualização, não uma autorização técnica para
executar escrita sem ledger de lote, hash da origem, payload efetivo e resultado
por registro.

## Exemplos de exceção

- `Zinco (Grupo Morena Rosa)`: ID informado não encontrado e sem CNPJ; requer
  busca adicional ou criação controlada.
- `Avent (Philips)`: nome `Philips` aponta para duas empresas HubSpot.
- `Olympikus`: ID histórico não encontrado e o nome aponta para duas empresas.
- `DENOVO SHOES`: CNPJ aponta para duas empresas HubSpot.
- `Presentes Rodriguez`: ID histórico não encontrado e CNPJ aponta para duas
  empresas.

## Perfil operacional observado na fonte

- responsáveis: Rodolfo Turra 257, Mary Laurentino 187, Sirlei Cândido 131,
  Sem CSM dedicado 29 e 2 sem preenchimento;
- health: Verde 381, Vermelho 190, Amarelo 33 e 2 sem preenchimento;
- prioridades: P4 348, P1 193, P3 43 e P2 20;
- carteiras: Suporte por e-mail e chat 163, Mid Market 157, Small Business
  128, Pool CS 1 94, Sem carteira ativa 29, Estratégica 25 e Key Accounts 8.

## Próxima ação segura

1. materializar um lote de migração CS com procedência e resultado por linha;
2. aplicar a planilha como origem prioritária somente nos 307 matches únicos;
3. separar os 19 casos ambíguos para decisão no dashboard;
4. criar as 280 empresas sem correspondência apenas através de uma operação
   idempotente com confirmação e ledger;
5. depois da escrita, sincronizar novamente o cache HubSpot e revalidar
   duplicidade por CNPJ/nome.

## Carteira local do Genius Support OS

O banco local observado ainda tem 1 tenant, 0 assinaturas de produto e 0 linhas
na view `vw_cs_customer_portfolio`. Além disso, o catálogo local de produtos e
planos está vazio e os perfis de Mary, Sirlei e Rodolfo não estão materializados
como usuários locais. Portanto, não é seguro criar uma carteira local apenas com
nomes vindos da planilha. O próximo lote deve primeiro definir o produto After
Sale, os planos e o vínculo governado entre usuários locais e owners do HubSpot;
depois disso o seed poderá usar os matches auditados sem fabricar ownership.
