-- TAXONOMY-01: reorganize the public knowledge tree without changing article
-- ids, slugs, content, assets, visibility or authorization contracts.
do $$
declare
  v_space uuid;
  v_operation uuid;
  v_sellers uuid;
  v_errors uuid;
  v_integrations_restricted uuid;
  v_general uuid;
  v_requests uuid;
  v_refunds uuid;
  v_catalog uuid;
  v_portal uuid;
  v_access uuid;
  v_request_ops uuid;
  v_reverse_logistics uuid;
  v_platforms uuid;
begin
  select id into v_space from public.knowledge_spaces where slug = 'genius';

  update public.knowledge_categories
  set name = 'Configuração da operação', slug = 'configuracao-da-operacao', parent_category_id = null
  where knowledge_space_id = v_space and slug in ('configurando-parametrizacao-geral','configuracao-da-operacao');

  update public.knowledge_categories
  set name = 'Sellers e lojas', slug = 'sellers-e-lojas', parent_category_id = null
  where knowledge_space_id = v_space and slug in ('sellers-e-lojafisica','sellers-e-lojas');

  update public.knowledge_categories
  set name = 'Solução de problemas', slug = 'solucao-de-problemas', parent_category_id = null
  where knowledge_space_id = v_space and slug in ('erros-e-pendencias','solucao-de-problemas');

  update public.knowledge_categories
  set name = 'Operação de trocas e devoluções', slug = 'operacao-de-trocas-e-devolucoes', parent_category_id = null
  where knowledge_space_id = v_space and slug in ('operacao-de-reversa','operacao-de-trocas-e-devolucoes');

  update public.knowledge_categories
  set name = 'Integrações de plataformas', slug = 'integracoes-de-plataformas', parent_category_id = null
  where knowledge_space_id = v_space and slug in ('integracao-e-atualizacao','integracoes-de-plataformas');

  update public.knowledge_categories
  set visibility = 'internal'
  where knowledge_space_id = v_space
    and slug in ('configuracoes', 'erros-comuns-e-solucoes');

  select id into v_operation from public.knowledge_categories
  where knowledge_space_id = v_space and slug = 'configuracao-da-operacao';
  select id into v_sellers from public.knowledge_categories
  where knowledge_space_id = v_space and slug = 'sellers-e-lojas';
  select id into v_errors from public.knowledge_categories
  where knowledge_space_id = v_space and slug = 'solucao-de-problemas';
  select id into v_integrations_restricted from public.knowledge_categories
  where knowledge_space_id = v_space and slug = 'integracoes-de-plataformas';

  insert into public.knowledge_categories (tenant_id, parent_category_id, visibility, name, slug, description, knowledge_space_id)
  select tenant_id, v_operation, 'public', 'Configurações gerais', 'configuracoes-gerais', 'Parâmetros gerais e comportamento padrão da operação.', v_space
  from public.knowledge_categories root
  where root.id = v_operation and not exists (select 1 from public.knowledge_categories c where c.knowledge_space_id=v_space and c.parent_category_id=v_operation and c.slug='configuracoes-gerais');
  select id into v_general from public.knowledge_categories where knowledge_space_id=v_space and parent_category_id=v_operation and slug='configuracoes-gerais';

  insert into public.knowledge_categories (tenant_id, parent_category_id, visibility, name, slug, description, knowledge_space_id)
  select tenant_id, v_operation, 'public', 'Solicitações e regras de devolução', 'solicitacoes-e-regras-de-devolucao', 'Regras que definem quando e como uma solicitação pode ser criada e conduzida.', v_space
  from public.knowledge_categories root
  where root.id = v_operation and not exists (select 1 from public.knowledge_categories c where c.knowledge_space_id=v_space and c.parent_category_id=v_operation and c.slug='solicitacoes-e-regras-de-devolucao');
  select id into v_requests from public.knowledge_categories where knowledge_space_id=v_space and parent_category_id=v_operation and slug='solicitacoes-e-regras-de-devolucao';

  insert into public.knowledge_categories (tenant_id, parent_category_id, visibility, name, slug, description, knowledge_space_id)
  select tenant_id, v_operation, 'public', 'Estornos e vale-compras', 'estornos-e-vale-compras', 'Configuração de reembolso, estorno automático e vale-compra.', v_space
  from public.knowledge_categories root
  where root.id = v_operation and not exists (select 1 from public.knowledge_categories c where c.knowledge_space_id=v_space and c.parent_category_id=v_operation and c.slug='estornos-e-vale-compras');
  select id into v_refunds from public.knowledge_categories where knowledge_space_id=v_space and parent_category_id=v_operation and slug='estornos-e-vale-compras';

  insert into public.knowledge_categories (tenant_id, parent_category_id, visibility, name, slug, description, knowledge_space_id)
  select tenant_id, v_operation, 'public', 'Cadastros, produtos e catálogo', 'cadastros-produtos-e-catalogo', 'Cadastros e regras que afetam produtos, motivos e catálogo.', v_space
  from public.knowledge_categories root
  where root.id = v_operation and not exists (select 1 from public.knowledge_categories c where c.knowledge_space_id=v_space and c.parent_category_id=v_operation and c.slug='cadastros-produtos-e-catalogo');
  select id into v_catalog from public.knowledge_categories where knowledge_space_id=v_space and parent_category_id=v_operation and slug='cadastros-produtos-e-catalogo';

  insert into public.knowledge_categories (tenant_id, parent_category_id, visibility, name, slug, description, knowledge_space_id)
  select tenant_id, v_operation, 'public', 'Portal e notificações', 'portal-e-notificacoes', 'Textos, comunicação e notificações apresentadas ao cliente.', v_space
  from public.knowledge_categories root
  where root.id = v_operation and not exists (select 1 from public.knowledge_categories c where c.knowledge_space_id=v_space and c.parent_category_id=v_operation and c.slug='portal-e-notificacoes');
  select id into v_portal from public.knowledge_categories where knowledge_space_id=v_space and parent_category_id=v_operation and slug='portal-e-notificacoes';

  insert into public.knowledge_categories (tenant_id, parent_category_id, visibility, name, slug, description, knowledge_space_id)
  select tenant_id, v_operation, 'public', 'Acessos e segurança', 'acessos-e-seguranca', 'Usuários, permissões e padrões de segurança da operação.', v_space
  from public.knowledge_categories root
  where root.id = v_operation and not exists (select 1 from public.knowledge_categories c where c.knowledge_space_id=v_space and c.parent_category_id=v_operation and c.slug='acessos-e-seguranca');
  select id into v_access from public.knowledge_categories where knowledge_space_id=v_space and parent_category_id=v_operation and slug='acessos-e-seguranca';

  insert into public.knowledge_categories (tenant_id, parent_category_id, visibility, name, slug, description, knowledge_space_id)
  select tenant_id, (select id from public.knowledge_categories where knowledge_space_id=v_space and slug='operacao-de-trocas-e-devolucoes'), 'public', 'Gestão de solicitações', 'gestao-de-solicitacoes', 'Acompanhamento, alterações e conclusão de solicitações.', v_space
  from public.knowledge_categories root
  where root.id = v_operation and not exists (select 1 from public.knowledge_categories c where c.knowledge_space_id=v_space and c.parent_category_id=(select id from public.knowledge_categories where knowledge_space_id=v_space and slug='operacao-de-trocas-e-devolucoes') and c.slug='gestao-de-solicitacoes');
  select id into v_request_ops from public.knowledge_categories where knowledge_space_id=v_space and slug='gestao-de-solicitacoes';

  insert into public.knowledge_categories (tenant_id, parent_category_id, visibility, name, slug, description, knowledge_space_id)
  select tenant_id, (select id from public.knowledge_categories where knowledge_space_id=v_space and slug='operacao-de-trocas-e-devolucoes'), 'public', 'Logística reversa', 'logistica-reversa', 'Postagem, coleta, prazos e acompanhamento da logística reversa.', v_space
  from public.knowledge_categories root
  where root.id = v_operation and not exists (select 1 from public.knowledge_categories c where c.knowledge_space_id=v_space and c.parent_category_id=(select id from public.knowledge_categories where knowledge_space_id=v_space and slug='operacao-de-trocas-e-devolucoes') and c.slug='logistica-reversa');
  select id into v_reverse_logistics from public.knowledge_categories where knowledge_space_id=v_space and slug='logistica-reversa';

  insert into public.knowledge_categories (tenant_id, parent_category_id, visibility, name, slug, description, knowledge_space_id)
  select tenant_id, v_integrations_restricted, 'internal', 'E-commerce e permissões', 'e-commerce-e-permissoes', 'Conteúdo técnico ainda restrito sobre plataformas e permissões.', v_space
  from public.knowledge_categories root
  where root.id = v_integrations_restricted and not exists (select 1 from public.knowledge_categories c where c.knowledge_space_id=v_space and c.parent_category_id=v_integrations_restricted and c.slug='e-commerce-e-permissoes');
  select id into v_platforms from public.knowledge_categories where knowledge_space_id=v_space and slug='e-commerce-e-permissoes';

  update public.knowledge_articles set category_id=v_refunds where slug in (
    'como-automatizar-o-pagamento-de-estorno-e-vale-compra','como-configurar-o-calculo-do-estorno','como-configurar-o-estorno-automatico-via-pix','como-configurar-o-vale-compras-retencao','configurando-as-formas-de-estorno','formas-de-estorno-por-motivo','limitando-o-valor-maximo-de-um-estorno','pedidos-pagos-com-vale-compras','politica-para-estorno-do-frete','valor-manual-para-estorno-automatico','como-realizar-alteracoes-em-um-vale-compra-pendente','posso-alterar-a-forma-de-reembolso-do-meu-consumidor');
  update public.knowledge_articles set category_id=v_catalog where slug in ('como-cadastrar-motivos-para-troca-ou-devolucao','como-configurar-o-blocklist','como-informar-a-sku-durantge-a-troca','criando-e-atualizando-o-cadastro','produtos-em-excecao','variacao-do-produto');
  update public.knowledge_articles set category_id=v_portal where slug in ('como-cadastrar-os-e-mails-para-notificacoes-automaticas','como-configurar-os-textos-do-front','reenviar-um-e-mail-ao-consumidor','posso-enviar-uma-notificacao-de-analise-ao-cliente');
  update public.knowledge_articles set category_id=v_access where slug in ('configurar-padroes-de-seguranca','como-criar-um-usuario');
  update public.knowledge_articles set category_id=v_general where slug in ('configurando-parametrizacao-geral','modo-sac','como-automatizar-a-conclusao-de-uma-solicitacao');
  update public.knowledge_articles set category_id=v_requests where slug in ('como-configurar-a-cor-exibida-nos-filtros-basicos-das-solicitacoes','como-cadastrar-motivos-para-troca-ou-devolucao','como-configurar-o-prazo-logistico-por-estado','fique-com-o-item','operacoes-permitidas-durante-a-criacao-de-sua-solicitacao','regra-de-excecao-para-motivos-nao-gerar-logistica-reversa','regra-para-segunda-solicitacao','regra-por-motivo');
  update public.knowledge_articles set category_id=v_request_ops where slug in ('como-alterar-ou-aprovar-os-produtos-de-uma-solicitacao','como-o-consumidor-solicita-uma-reversa','posso-alterar-o-e-mail-e-o-endereco-da-solicitacao','posso-alterar-o-status-de-uma-solicitacao','posso-filtrar-as-solicitacoes-de-reversas');
  update public.knowledge_articles set category_id=v_reverse_logistics where slug in ('acompanhar-solicitacoes-de-troca-e-devolucao','como-configurar-o-prazo-logistico-por-estado','interpretar-status-da-logistica-reversa','pendencia-de-logistica-reversa');
  update public.knowledge_articles set category_id=v_sellers where slug in ('como-cadastrar-lojas-fisicas','configuracao-de-sellers-permitidos','criar-lojas-virtuais','sellers-permitidos-para-criar-vale-compras','regras-de-cadastro-e-configuracoes-de-sellers-estorno-e-logistica');
  update public.knowledge_articles set category_id=v_errors where slug in ('erro-ao-tentar-realizar-o-estorno','erro-no-cep-ou-endereco-incorreto','pendencia-de-logistica-reversa','erro-nao-autorizado-ao-gerar-codigo-reverso-postagem','erro-de-autorizacao-ao-acessar-pedidos-na-vtex');
  update public.knowledge_articles set category_id=v_platforms where slug in ('como-atualizar-os-dados-de-integracao-do-e-commerce','erros-na-integracao-do-contrato-do-correios','habilitar-a-api-de-logistica-reversa-do-correios','intalacao-e-integracao-nuvemshop','integracao-e-configuracao-com-os-correios','permissoes-shopify','permissoes-tray','permissoes-vtex');

  update public.knowledge_categories set name='Configuração da operação' where id=v_operation;
  update public.knowledge_categories set name='Sellers e lojas' where id=v_sellers;
  update public.knowledge_categories set name='Solução de problemas' where id=v_errors;
  update public.knowledge_categories set name='Integrações de plataformas' where id=v_integrations_restricted;
  update public.knowledge_categories set name='Configurações gerais' where id=v_general;
  update public.knowledge_categories set name='Solicitações e regras de devolução' where id=v_requests;
  update public.knowledge_categories set name='Estornos e vale-compras' where id=v_refunds;
  update public.knowledge_categories set name='Cadastros, produtos e catálogo' where id=v_catalog;
  update public.knowledge_categories set name='Portal e notificações' where id=v_portal;
  update public.knowledge_categories set name='Acessos e segurança' where id=v_access;
  update public.knowledge_categories set name='Gestão de solicitações' where id=v_request_ops;
  update public.knowledge_categories set name='Logística reversa' where id=v_reverse_logistics;
  update public.knowledge_categories set name='E-commerce e permissões' where id=v_platforms;
end $$;
