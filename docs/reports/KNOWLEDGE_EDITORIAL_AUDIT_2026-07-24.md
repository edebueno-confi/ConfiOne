# Auditoria editorial da Central — 2026-07-24

## Escopo

Foram auditados 81 artigos locais da Central pública e interna, incluindo título,
resumo, corpo, UTF-8, estrutura de passos e presença de leads redundantes.

## Correções aplicadas

- 7 artigos com conteúdo legado corrompido foram recuperados da exportação
  local oficial `raw_knowledge/octadesk_export/latest/articles/**/article.json`.
- Títulos e resumos desses 7 artigos foram recuperados da mesma origem; o resumo
  passou a aceitar até 320 caracteres.
- A camada pública já normaliza headings em caixa alta, título repetido e a
  introdução redundante de artigos de Configurações sem alterar o significado.
- O mapeamento visual da home recebeu ícones específicos para operação, solução
  de problemas e sellers/lojas.

## Resultado da auditoria

| Indicador | Resultado |
| --- | ---: |
| Artigos analisados | 81 |
| Artigos recuperados da fonte original | 7 |
| Artigos com resumo acima do limite legado | 12 |
| Novo limite de resumo | 320 caracteres |
| Conteúdo com marcador de substituição após recuperação | 0 |
| Associação fictícia de imagem criada | 0 |

## Limite conhecido

A revisão semântica humana de tom, clareza e domínio de todos os artigos não é
substituída por normalização automática. Os artigos que ainda exigirem reescrita
de linguagem devem seguir para revisão editorial humana no próximo lote, sem
alterar instruções operacionais sem fonte.
