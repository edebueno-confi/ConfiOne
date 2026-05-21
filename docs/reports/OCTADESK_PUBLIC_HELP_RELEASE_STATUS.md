# Octadesk Public Help Release Status

Data: `2026-05-21`

## Resultado

- Artigos avaliados: `58`.
- Artigos Octadesk no Knowledge runtime: `54`.
- Artigos Octadesk publicados nesta fase: `43`.
- Artigos Octadesk `published/public`: `43`.
- Artigos Octadesk bloqueados por risco critico automatico: `11`.
- Artigos Octadesk expostos nas views publicas: `43`.
- Total atual em `/help/genius`: `49` artigos (`43` Octadesk migrados + `6` seed/manuais).
- Advisories Octadesk: `43 reviewed/public/public` e `11 pending/restricted/restricted`.

## Distribuicao runtime

| Status | Visibility | Total |
| --- | --- | ---: |
| published | public | 43 |
| draft | restricted | 11 |

## Publicacao

A premissa de produto foi ajustada em 2026-05-21: o corpus Octadesk passa a ser tratado como base publica legada aprovada para migracao, salvo bloqueio tecnico critico automatico. A publicacao foi executada localmente via gate editorial existente, com:

- normalizacao textual minima;
- preservacao de `source_path` e `source_hash`;
- categorias reais usadas pelos artigos promovidas para `public` via RPC administrativa existente;
- advisories dos publicados marcados como `reviewed` com nota de migracao legada;
- artigos aptos promovidos para `published/public` por `rpc_admin_publish_knowledge_article_v2`.

Nota de auditoria aplicada:

> Publicacao migrada da Central de Ajuda Octadesk existente para a Central Genius.

## Bloqueios

Os `11` artigos bloqueados permaneceram `draft/restricted` por risco critico automatico:

- `Como criar um usuario`
- `Erro "Não Autorizado" ao Gerar Código de postagem`
- `Erro de autorização ao acessar pedidos na Vtex`
- `Erros na integração do contrato do Correios`
- `Habilitar a API de Logística Reversa do Correios`
- `Intalação e integração Nuvemshop`
- `Integração e configuração com os Correios`
- `Permissões Shopify`
- `Permissões TrayCorp`
- `Permissões Vtex`
- `Regras de Cadastro  e configurações de Sellers( Estorno e Logística)`

Motivos principais: token, senha explicita, permissao tecnica, integracao tecnica, contrato Correios, erro de autorizacao ou criacao de usuario administrativo.

## Estado da Central Publica

`/help/genius` passou a expor o corpus migrado aprovado automaticamente:

- lista publica: `43` artigos Octadesk;
- detalhe publico: `43` artigos Octadesk;
- busca publica validada com termo `Reenviar`;
- amostra de artigos bloqueados validada com `0` exposicao publica.

## Validacao

- Queries SQL confirmaram `43 published/public` e `11 draft/restricted`.
- `vw_public_knowledge_articles_list` retornou `43` artigos Octadesk.
- `vw_public_knowledge_article_detail` retornou `43` artigos Octadesk.
- `rpc_public_search_knowledge_articles('genius', 'Reenviar', 20)` retornou resultado Octadesk.
- `/help/genius`, `/help/genius/articles` e detalhe de artigo publicado responderam `200`.
- QA browser validou home, lista, detalhe e busca publica.

## Proxima onda

1. Revisar os `11` bloqueados por risco critico.
2. Definir se algum deles pode ganhar versao publica sem token, permissao tecnica, contrato ou instrucao sensivel.
3. Manter bloqueados enquanto nao houver saneamento editorial especifico.
