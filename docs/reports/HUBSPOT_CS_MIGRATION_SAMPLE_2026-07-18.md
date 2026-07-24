# Amostra de migracao CS para HubSpot - 2026-07-18

## Resultado

Foi executado um lote controlado autorizado pelo operador, limitado a empresas
com correspondencia unica por nome + CNPJ da planilha e propriedade existente
no HubSpot.

| Empresa | ID HubSpot | Campo | Antes | Depois | Resultado |
|---|---:|---|---:|---:|---|
| Agua De Coco | 19183376462 | `aftersale___mrr` | vazio | 600 | confirmado por leitura posterior |
| Boah | 19184473529 | `aftersale___mrr` | vazio | 149 | confirmado por leitura posterior |

O retorno do HubSpot informou 2 processados, 2 atualizados e 0 falhas. A
consulta posterior confirmou os dois valores. `Vinci Shoes` foi analisada, mas
foi omitida por ja possuir R$ 1.860,00, igual ao staging.

Nenhum ticket, pipeline ou empresa foi criado. O conector disponivel permite
ler e atualizar objetos existentes, mas nao expoe criacao de pipelines ou
propriedades; essa parte depende de uma chamada administrativa da API HubSpot
com credencial server-side configurada.

## Lote 2 - MRR seguro confirmado

Foi executado um segundo lote autorizado, limitado a empresas existentes no
HubSpot, com correspondencia exata por nome e propriedade `aftersale___mrr`
vazia antes da escrita.

| Empresa | ID HubSpot | Campo | Antes | Depois | Resultado |
|---|---:|---|---:|---:|---|
| Turimshop | 15686279718 | `aftersale___mrr` | vazio | 399 | confirmado por leitura posterior |
| Trapo Fino | 55165741144 | `aftersale___mrr` | vazio | 499 | confirmado por leitura posterior |
| Ton Age | 34494988078 | `aftersale___mrr` | vazio | 250 | confirmado por leitura posterior |
| Thugnine | 8449188774 | `aftersale___mrr` | vazio | 699 | confirmado por leitura posterior |
| Suprema Moda fitness | 19184501077 | `aftersale___mrr` | vazio | 399 | confirmado por leitura posterior |
| Shop Francesca | 9764021011 | `aftersale___mrr` | vazio | 1150 | confirmado por leitura posterior |

O retorno do HubSpot informou 6 processados, 6 atualizados e 0 falhas. A
consulta posterior confirmou os seis valores e nenhum ID ficou ausente.
Valores foram normalizados a partir do campo `Valor_MRR` da planilha CS Ops;
nenhum MRR nao vazio do HubSpot foi sobrescrito.

Este lote foi extraido da visualizacao filtrada da planilha, que exibiu 187 de
606 linhas. A migracao integral ainda exige a leitura das 606 linhas e novas
rodadas de conciliacao; conflitos, nomes variantes e correspondencias
ambiguas permanecem fora da escrita automatica.

## Lote 3 - carga em massa de MRR seguro

A aba completa `BD_Clientes` foi lida por conector autenticado, totalizando
606 linhas. Foram consideradas 327 empresas ativas com `Valor_MRR` maior que
zero.

O cruzamento com o HubSpot identificou 74 empresas com nome único e registro
existente cujo campo `aftersale___mrr` estava vazio. Esses registros foram
atualizados em 8 lotes de no máximo 10 objetos.

| Resultado | Quantidade |
|---|---:|
| Empresas elegíveis | 74 |
| Empresas atualizadas | 74 |
| Empresas conferidas por leitura posterior | 74 |
| Falhas | 0 |

Foram preservados sem alteração 80 valores já iguais, 54 conflitos de MRR,
34 correspondências ambíguas e 85 empresas sem correspondência segura. Os
conflitos não foram sobrescritos automaticamente, mesmo quando a planilha
apresentava valor diferente, para evitar perda de contexto operacional.

## Lote 4 - prioridade explícita da planilha

Após autorização ampla do operador, os 54 conflitos de MRR com identidade
segura foram atualizados para o valor da planilha CS Ops. A propriedade
atualizada permaneceu `aftersale___mrr`.

| Resultado | Quantidade |
|---|---:|
| Conflitos elegíveis atualizados | 54 |
| Conferidos por leitura posterior | 54 |
| Falhas | 0 |

Somando os lotes anteriores, 128 empresas foram efetivamente atualizadas e
154 ficaram com o valor já igual ao staging. Permanecem 34 correspondências
ambíguas e 85 sem correspondência; esses casos não foram escritos porque a
identidade do alvo não é segura. O próximo escopo de migração deve mapear os
demais campos da planilha para propriedades HubSpot antes de qualquer nova
carga.
