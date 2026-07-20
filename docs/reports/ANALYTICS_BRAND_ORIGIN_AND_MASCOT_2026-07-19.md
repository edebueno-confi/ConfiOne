# Analytics: origem estruturada, identidade visual e Gênio — 2026-07-19

## Decisão

O Dashboard Gerencial deve usar aliases internos para traduzir os pipelines do
HubSpot para a linguagem da operação. O ID do pipeline continua sendo a chave
de integração; o alias é apenas uma camada de apresentação e não altera o
HubSpot.

Além do alias, o cache agora guarda o `label` oficial retornado por
`GET /crm/v3/pipelines/{objectType}/{pipelineId}`. A configuração e o filtro
de CS mostram os dois valores lado a lado. Registros antigos exibem
`Aguardando sincronização` até a próxima sincronização bem-sucedida.

## Origem dos tickets

O snapshot atual materializa `source_type` dos tickets. A interface agora separa
quatro perguntas:

1. qual pipeline está sendo analisado;
2. qual evidência veio do HubSpot;
3. quais canais foram observados e em qual volume;
4. o que ainda não pode ser afirmado.

`CHAT`, `FORM`, `EMAIL`, `PHONE`, `BOT` e `WHATSAPP` são exibidos como canais
legíveis. Isso não prova o widget, o formulário específico, a URL, a caixa de
entrada ou o número de WhatsApp. Para isso, o adapter precisará capturar
metadados adicionais do ticket, caso estejam preenchidos no portal.

## Identidade visual

Foi feita leitura somente de fontes públicas do site oficial da Genius Returns.
Os tokens de destaque observados no CSS do site são azul `#1C326F`, rosa
`#E10098`, ciano `#6AD1E7`, apoio `#EBEFFB` e pêssego `#FFBC7D`. Eles foram
adicionados como aliases próprios (`--genius-site-*`) para novos elementos, sem
substituir de forma ampla os tokens já usados pelo Design System do GSO.

## Mascote

O Gênio existente em `/apps/web/public/brand-assets/genio.svg` foi preservado e
envolvido por `GeniusMascot`, com animação CSS leve, brilho e partículas. A
animação é desativada pelo comportamento global de redução de movimento do
navegador. Uma versão Lottie/Rive pode ser avaliada posteriormente se houver
necessidade de efeitos mais complexos.

## Backlog de exportação

Fica registrado como próximo item: exportar o recorte filtrado em PNG/PDF e
permitir compartilhamento por e-mail ou link seguro, sempre carregando filtros,
período, proveniência e data de atualização.
