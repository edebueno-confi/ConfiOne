# Genius Help Center Readiness Report

Data: `2026-05-20`

## 1. O que ja esta pronto

- Central Publica `/help/genius` funcional com 6 artigos seed/manuais.
- Admin Knowledge operacional como fila editorial.
- Corpus Octadesk importado para curadoria sem exposicao publica.
- Advisories sincronizados para todos os 54 artigos importados.
- Relatorios de ondas, checklist e backlog interno criados.

## 2. O que ja esta importado

- `54` artigos Octadesk no Knowledge runtime.
- Distribuicao: `4 review/internal`, `24 draft/internal`, `26 draft/restricted`.
- `source_path` e `source_hash` preservados.

## 3. O que ja esta publico

- Apenas os `6` artigos seed/manuais.
- `0` artigos Octadesk publicados ou publicos.

## 4. O que esta interno

- `4` artigos em `review/internal` na Onda 0.
- `24` artigos em `draft/internal` na Onda 2 para suporte/CS/admin.

## 5. O que esta restrito

- `26` artigos em `draft/restricted`, bloqueados para publico por risco tecnico, integracao, permissao, estorno, PIX, Correios, erro interno, endpoint ou operacao sensivel.

## 6. O que impede publicacao em massa

- `54` advisories ainda estao `pending`.
- Nao ha checklist humano real completo.
- Assets ainda nao foram revisados/removidos.
- Parte do corpus contem sinais de risco operacional ou tecnico.

## 7. Menor acao humana para publicar a primeira onda

1. Abrir os 4 artigos da Onda 0 em `/admin/knowledge`.
2. Revisar corpo, resumo, categoria e links.
3. Revisar ou remover assets.
4. Persistir checklist humano real.
5. Marcar advisory como `reviewed` quando apropriado.
6. Alterar visibilidade para `public` somente se o conteudo estiver seguro.
7. Publicar por RPC/acao editorial existente e validar `/help/genius`.

## 8. Potencial de publicacao

- Revisao leve: `4` artigos da Onda 0, desde que assets/checklist/advisory sejam aprovados por humano.
- Revisao pesada: `24` artigos internos, por conterem linguagem operacional ou flags que exigem decisao.
- Permanecer restrito/interno: `26` restritos e `4` obsoletos/duplicados.

## 9. Plano da proxima semana

- Dia 1: revisar assets e checklist dos 4 artigos da Onda 0.
- Dia 2: publicar 1 artigo piloto se gate permitir e QA publico passar.
- Dia 3: revisar os demais 3 artigos da Onda 0.
- Dia 4: selecionar 5 artigos internos de menor risco para reescrita.
- Dia 5: consolidar aprendizados, atualizar runbook e planejar Onda 1 real.
