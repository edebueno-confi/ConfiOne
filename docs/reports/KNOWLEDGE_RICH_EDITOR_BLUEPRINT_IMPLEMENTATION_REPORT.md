# Knowledge Rich Editor Blueprint Implementation Report

Data: 2026-05-22

## Escopo

Refatoracao local do editor dedicado de artigos da Knowledge Base em:

- `/admin/knowledge/new`
- `/admin/knowledge/:articleId/edit`

O objetivo foi aproximar a tela do blueprint aprovado de authoring: coluna editorial compacta a esquerda, editor visual amplo a direita, sem preview separado obrigatorio, sem textarea Markdown como experiencia principal e sem botoes de salvar duplicados.

## Auditoria de travas

Travas encontradas:

- O formulario usava composicao de cockpit com `h-full`, `min-h-0` e `overflow-hidden`, prendendo o artigo em altura artificial.
- O editor tinha rodape fixo com CTA duplicado de salvar/publicar, criando ambiguidade operacional.
- A coluna esquerda misturava configuracoes, checklist, midia e informacoes, aumentando altura e causando corte em viewports menores.
- A toolbar tinha controles duplicados de bloco e poucos controles ricos para authoring.
- O renderer publico nao entendia todos os blocos que o editor precisava serializar.

Decisao:

- A correcao ficou confinada ao Knowledge Editor.
- Nenhum componente global foi alterado.
- Nenhuma regra de backend, RLS, permissao, visibilidade ou publicacao foi flexibilizada.

## Excecao de authoring

O editor de Knowledge e uma tela de authoring/documentacao. Diferente de cockpits operacionais, ele pode permitir rolagem natural do artigo, com coluna editorial sticky/compacta e toolbar sticky. Essa excecao e local ao editor.

## Implementacao

- Header ficou com CTA unico de `Salvar alteracoes`.
- Publicacao/revisao permanecem no fluxo editorial governado por RPC.
- Coluna esquerda foi compactada e removeu o card fixo de midia/anexos.
- Tags foram expostas visualmente na coluna, mas sem persistencia backend completa porque nao ha contrato de tags no read model/RPC atual.
- Editor ganhou toolbar com dropdown de bloco, cor de texto, marca-texto e menu de insercao.
- Blocos visuais suportados pelo editor: Nota, Importante, Alerta, Cuidado, Leia tambem, divisor, imagem governada e YouTube governado.
- Imagem e YouTube continuam serializados como markdown governado, com tamanho persistido.
- Public Help passou a entender `danger`, `divider`, `related`, cor controlada e marca-texto controlado.

## Limites conhecidos

- Tags ainda exigem contrato backend proprio para persistencia real.
- `Leia tambem` ainda usa referencia por slug governado no corpo; a busca modal de candidatos reais deve ser contratada em lote dedicado.
- O editor visual continua implementacao propria baseada em `contentEditable` e markdown governado. Nao foi adicionada biblioteca TipTap/Lexical neste lote para evitar troca de arquitetura e lockfile sem contrato completo de blocos.

## Validacoes

- `npm run web:typecheck`
- `npm run web:build`
- `npm run contracts:typecheck`
- QA local em `/admin/knowledge/:articleId/edit`
- QA local em `/help/genius`
- QA local em `/help/genius/articles/qa-novo-artigo-manual-codex`
