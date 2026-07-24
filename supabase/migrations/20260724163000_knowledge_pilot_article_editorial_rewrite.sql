-- Piloto editorial: artigo "Como configurar o cálculo do estorno".
-- Conteúdo preservado; apenas reorganizado em estrutura mais clara.

begin;

update public.knowledge_articles
set
  summary = 'Aprenda a escolher o cálculo padrão ou proporcional e a confirmar a regra de estorno da sua operação.',
  body_md = $body$
## Como configurar o cálculo do estorno

Veja como escolher a regra de cálculo que será usada nos estornos da sua operação.

### Passo a passo

1. Acesse o painel Admin da plataforma.
2. No menu à esquerda, clique em **Configurações**.
3. Selecione **Ambiente** e, em seguida, **Estorno/Vale-Compra**.
4. Procure a funcionalidade **Regra para cálculo de estorno**.

### Escolha o tipo de cálculo

- **Cálculo padrão:** usa o valor total do pedido para calcular o estorno, independentemente do valor dos itens devolvidos.
- **Cálculo proporcional:** calcula o estorno de acordo com o valor dos itens devolvidos e a parte do pedido que foi devolvida.

Selecione a opção mais adequada à política de reembolso da sua operação e confirme.

![Tela da regra de cálculo de estorno](knowledge-asset:7744a208-5a63-414b-92bd-b7fe5c70032e)

:::callout info
Dica: antes de confirmar, revise a política de reembolso da sua operação. Assim, o cálculo escolhido ficará alinhado às regras que você oferece aos seus clientes.
:::
$body$,
  updated_at = timezone('utc', now())
where slug = 'como-configurar-o-calculo-do-estorno';

update public.knowledge_article_editorial_drafts as draft
set
  summary = article.summary,
  body_md = article.body_md,
  updated_at = timezone('utc', now())
from public.knowledge_articles as article
where draft.article_id = article.id
  and article.slug = 'como-configurar-o-calculo-do-estorno';

commit;
