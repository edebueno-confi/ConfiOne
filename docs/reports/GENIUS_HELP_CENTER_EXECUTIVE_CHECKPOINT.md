# Genius Help Center Executive Checkpoint

Data: `2026-05-20`

## 1. Resumo executivo

A Central de Ajuda Genius esta operacional e segura no estado atual.

Pronto:
- `/help/genius` esta funcional como superficie publica.
- A Central Publica exibe os `6` artigos seed/manuais ja publicados.
- O corpus Octadesk foi avaliado, importado parcialmente e organizado no Admin Knowledge.
- `/admin/knowledge` esta validado como fila diaria de curadoria.
- Os artigos Octadesk importados estao separados entre `review/internal`, `draft/internal` e `draft/restricted`.
- Nao ha vazamento dos artigos Octadesk em `/help/genius`.

Bloqueado:
- Publicacao publica dos artigos Octadesk.
- Promocao automatica de artigos internos ou restritos.
- Uso publico de artigos com assets nao revisados.
- Publicacao sem advisory revisado e checklist humano real.

Depende de revisao humana:
- Revisao de assets.
- Revisao de corpo final.
- Confirmacao de categoria publica.
- Preenchimento de checklist humano.
- Marcacao de advisory como `reviewed`.
- Publicacao via gate existente.

Estado real da Central Publica:
- Publica e navegavel.
- Contem apenas os `6` artigos seed/manuais.
- Nao contem artigos Octadesk.

## 2. Estado do corpus Octadesk

| Item | Total |
| --- | ---: |
| Artigos avaliados | `58` |
| Artigos importados/processados no Knowledge | `54` |
| Artigos em `review/internal` | `4` |
| Artigos em `draft/internal` | `24` |
| Artigos em `draft/restricted` | `26` |
| Advisories pendentes | `54` |
| Artigos Octadesk publicados | `0` |
| Artigos Octadesk publicos | `0` |
| Vazamento em `/help/genius` | `0` |

Artigos bloqueados:
- `26` artigos estao `draft/restricted`.
- `4` artigos ficaram fora do runtime importado por obsolescencia ou duplicidade.
- Nenhum artigo restrito deve ser promovido para publico sem nova revisao humana e tecnica.

## 3. Estado operacional

Admin Knowledge:
- funciona como fila principal de curadoria;
- permite localizar artigos por status, visibilidade, origem legado/manual e curadoria;
- permite ver itens em `review/internal`, `draft/internal` e `draft/restricted`;
- exibe sinais de advisory, status, visibilidade e origem;
- permite abrir, editar, submeter para review e publicar apenas via gate existente.

Public Help:
- funciona como superficie publica segura;
- exibe apenas conteudo publicado e publico;
- nao expõe drafts, reviews internos ou restritos;
- segue sem artigos Octadesk.

Diferencas operacionais:
- Conteudo publico: publicado, seguro, visivel em `/help/genius`.
- Conteudo interno: util para suporte, CS ou admin, mas nao visivel ao cliente.
- Conteudo restrito: material sensivel ou tecnico que nao deve ser usado publicamente.

Uso imediato pelo time:
- Suporte/CS/Admin ja podem consultar o corpus importado no Admin Knowledge.
- A Onda 0 pode ser trabalhada como fila de revisao humana.
- Artigos restritos devem permanecer bloqueados para publico.

## 4. Risco e governanca

Nao publicar os `54` automaticamente porque:
- `54` advisories ainda estao `pending`;
- nao ha checklist humano real completo;
- muitos artigos dependem de assets nao revisados;
- parte do corpus contem sinais de integracao, permissao, estorno, PIX, Correios, endpoints, erros internos ou operacao sensivel;
- publicar sem revisao pode expor instrucao interna, fluxo obsoleto ou dado operacional indevido.

Risco de assets:
- prints podem conter informacao sensivel;
- imagens podem estar desatualizadas;
- assets podem depender de UI legada;
- artigo publico deve funcionar mesmo sem asset sensivel.

Risco de conteudo tecnico/operacional:
- integracoes e permissoes podem expor passos sensiveis;
- estorno e PIX exigem cuidado operacional e financeiro;
- Correios e erros internos podem expor detalhes de contrato, endpoint ou troubleshooting interno;
- conteudo de suporte interno nao deve ser confundido com orientacao publica.

Travas corretas:
- advisory `pending` impede publicacao responsavel;
- checklist humano evita promocao artificial;
- visibilidade `restricted` bloqueia conteudo sensivel;
- Public Help renderiza apenas o que passa pelo contrato publico.

## 5. Proxima acao minima

Menor proxima acao humana para publicar a primeira onda:

1. Escolher `1` ou `2` artigos da Onda 0.
2. Revisar assets e remover qualquer dependencia insegura.
3. Revisar o corpo final em linguagem Genius B2B.
4. Confirmar categoria publica.
5. Preencher checklist humano real no Admin Knowledge.
6. Marcar advisory como `reviewed` quando apropriado.
7. Publicar via gate existente.
8. Validar `/help/genius`, `/help/genius/articles`, busca publica e detalhe do artigo.

## 6. Plano recomendado

Semana 1:
- publicar `1` ou `2` artigos seguros da Onda 0;
- validar busca, categoria, detalhe e ausencia de vazamento.

Semana 2:
- revisar os demais artigos da Onda 0;
- decidir se permanecem internos ou viram publicos.

Semana 3:
- selecionar candidatos da Onda 2 para reescrita publica;
- priorizar artigos com menor risco operacional e menor dependencia de assets.

Backlog continuo:
- manter `draft/restricted` bloqueado;
- consolidar duplicados;
- arquivar ou reescrever obsoletos;
- revisar assets antes de qualquer onda publica.

## 7. O que nao fazer

- Nao publicar em massa.
- Nao tornar `restricted` publico.
- Nao publicar artigo com asset nao revisado.
- Nao ignorar advisory.
- Nao pular checklist humano.
- Nao usar HTML legado como fonte publica.
- Nao publicar conteudo com credenciais, tokens, endpoints, logs, payloads ou instrucao operacional interna.

## 8. Proximo prompt recomendado

```text
Codex, selecione 1 artigo da Onda 0 da Central de Ajuda Genius para preparar publicacao controlada.

Escopo:
- nao publicar automaticamente;
- revisar source_path/source_hash, advisory, checklist e assets;
- propor versao publica final em markdown;
- validar que nao ha credenciais, logs, payloads, endpoints sensiveis, instrucao interna ou dependencia de asset inseguro;
- manter status/visibility sem mudanca publica ate aprovacao humana;
- gerar relatorio de decisao com recomendacao: publicar, manter interno ou revisar mais.

Nao fazer:
- nao marcar advisory como reviewed;
- nao preencher checklist humano;
- nao publicar;
- nao alterar frontend;
- nao criar migration/RPC/view/RLS.
```
