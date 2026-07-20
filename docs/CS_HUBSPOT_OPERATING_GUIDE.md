# Operação de CS no HubSpot

## Objetivo desta mudança

O HubSpot passará a ser a fonte única de verdade operacional do Customer
Success e do atendimento. Isso elimina a necessidade de procurar o status atual
em várias abas, reduz divergências e permite que o painel gerencial use a mesma
informação que o time atualiza no dia a dia.

A planilha `CS Ops | Carteiras e Clusters -v2` é uma fonte temporária de
staging. Ela será usada para migrar os dados atuais, reconciliar campos que
ainda não existem no HubSpot e comprovar o corte. Depois do corte, a planilha
não deve continuar sendo atualizada como sistema paralelo.

## O que será migrado

Os dados de carteira e relacionamento serão associados à empresa correta no
HubSpot: CSM/responsável, MRR, cluster, modelo de atendimento, frequência de
contato, health, prioridade, status do contrato e evolução da migração V1 para
V2. Tickets já existentes no HubSpot continuam sendo a referência do histórico
de atendimento; a planilha não deve criar tickets duplicados.

Linhas sem correspondência segura, com ID inválido, nome duplicado ou aparência
de teste ficam em uma fila de exceções. Elas não são atribuídas por tentativa.

## Agente de atendimento

1. Abra ou crie o ticket no pipeline de atendimento correto do HubSpot.
2. Preencha assunto, descrição, prioridade, status e próxima ação.
3. Registre a comunicação no próprio ticket e mantenha o histórico no registro.
4. Antes de encerrar, confirme que o cliente/empresa associado é o correto.
5. Não atualize a planilha para “refletir” o atendimento; a atualização oficial
   é feita no HubSpot.

## CSM

1. Atualize a empresa do cliente, não uma cópia em planilha.
2. Mantenha carteira, responsável, MRR, cluster, health, prioridade e status de
   migração atualizados conforme a regra operacional aprovada.
3. Registre contatos, riscos, próximos passos e projetos no objeto/pipeline
   definido para a operação.
4. Se um valor migrado estiver incorreto, corrija o HubSpot e registre o motivo
   na atividade ou no campo de observação apropriado.
5. Para cliente não encontrado ou duplicado, abra uma exceção para o gerente de
   CS; não crie uma segunda empresa sem validação.

## Gerente de CS

O gerente acompanha cobertura de carteira, clientes em risco, MRR, migração,
contatos pendentes e qualidade dos dados no painel gerencial. Os filtros e
indicadores exibem a fonte, o período e a fórmula. Quando a cobertura estiver
incompleta, o painel deve mostrar “indisponível/sem cobertura”, nunca transformar
ausência em zero.

O gerente também aprova exceções de correspondência, define os responsáveis e
confirma o momento do corte da planilha. Alterações estruturais de pipeline ou
propriedades devem ser registradas no projeto antes de serem aplicadas.

## Como interpretar a origem dos dados

- **HubSpot**: tickets, status do atendimento, prioridade, responsáveis,
  pipelines, atividades e campos já preenchidos no CRM.
- **Planilha CS (staging)**: carteira, cluster, MRR, health, prioridade e
  migração enquanto esses campos são transferidos para propriedades oficiais.
- **Painel GSO**: read models do backend, com período, frescor, cobertura e
  origem preservados; ele não é uma fonte independente.

Cada métrica do painel possui o ícone de informação. Ao abrir, o usuário vê de
onde o valor veio, como é calculado e quais limitações de cobertura existem.

## Regras de qualidade

- Não duplicar empresa, ticket ou contato para contornar uma divergência.
- Não substituir dado de outro cliente por semelhança de nome.
- Não apagar histórico para corrigir uma importação; corrigir o registro e
  manter o relatório de migração.
- Toda carga deve ter arquivo, hash, data, mapeamento, contagem e rejeições.
- Segredos e credenciais ficam somente na configuração server-side.

## Transição e suporte

Durante a migração, o time receberá uma lista de exceções e uma amostra de
validação. Após o aceite do gerente, a planilha será congelada como evidência e
o HubSpot será o local obrigatório de trabalho. Dúvidas de uso vão para o
gerente de CS; divergências de cadastro entram na fila de qualidade; falhas de
integração são tratadas pelo administrador do GSO.
