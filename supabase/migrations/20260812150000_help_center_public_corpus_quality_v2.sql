-- Correção incremental do artigo público de integração.
-- A migration anterior já possui o mesmo identificador no remoto; esta versão
-- aplica o saneamento por forward-fix sem reescrever histórico.

begin;

do $$
declare
  v_article public.knowledge_articles;
begin
  for v_article in
    select ka.*
    from public.knowledge_articles as ka
    join public.knowledge_spaces as ks
      on ks.id = ka.knowledge_space_id
    where ks.slug = 'genius'
      and ka.slug = 'como-atualizar-os-dados-de-integracao-do-e-commerce'
      and ka.status = 'published'
      and ka.visibility = 'public'
  loop
    update public.knowledge_articles
    set summary = 'Para atualizar os dados de integração, siga os passos abaixo e valide as permissões da plataforma antes de salvar.',
        body_md = regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                body_md,
                '^COMO ATUALIZAR OS DADOS DE INTEGRA' || chr(65533) || chr(65533) || 'O DO E-COMMERCE[[:space:]]+Para atualizar os dados de integra' || chr(65533) || chr(65533) || 'o, siga os passos abaixo:[[:space:]]+Acesse o painel administrativo da sua loja\.[[:space:]]*',
                '',
                'i'
              ),
              'INTEGRA' || chr(65533) || chr(65533) || 'O',
              'INTEGRAÇÃO',
              'g'
            ),
            'integra' || chr(65533) || chr(65533) || 'o',
            'integração',
            'g'
          ),
          'Consulte a FAQ \(inserir link da FAQ\) para aprender a configurar as permiss[^.]*\.',
          'Se o teste gerar erro, revise as permissões exigidas pela plataforma e tente novamente.',
          'gi'
        ),
        body_md = regexp_replace(
          body_md,
          'Consulte a FAQ \(inserir link da FAQ\) para um passo a passo sobre como obter o API Token e configurar as permiss[^.]*\.',
          'Consulte a documentação oficial da plataforma para gerar o API Token e configurar as permissões antes de testar a integração.',
          'gi'
        ),
        current_revision_number = current_revision_number + 1,
        updated_at = timezone('utc', now())
    where id = v_article.id;

    perform app_private.capture_knowledge_revision(
      v_article.id,
      null,
      'Forward-fix editorial UTF-8, duplicidade de lead e placeholders públicos'
    );

    update public.knowledge_article_editorial_drafts
    set summary = 'Para atualizar os dados de integração, siga os passos abaixo e valide as permissões da plataforma antes de salvar.',
        body_md = regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                body_md,
                '^COMO ATUALIZAR OS DADOS DE INTEGRA' || chr(65533) || chr(65533) || 'O DO E-COMMERCE[[:space:]]+Para atualizar os dados de integra' || chr(65533) || chr(65533) || 'o, siga os passos abaixo:[[:space:]]+Acesse o painel administrativo da sua loja\.[[:space:]]*',
                '',
                'i'
              ),
              'INTEGRA' || chr(65533) || chr(65533) || 'O',
              'INTEGRAÇÃO',
              'g'
            ),
            'integra' || chr(65533) || chr(65533) || 'o',
            'integração',
            'g'
          ),
          'Consulte a FAQ \(inserir link da FAQ\) para aprender a configurar as permiss[^.]*\.',
          'Se o teste gerar erro, revise as permissões exigidas pela plataforma e tente novamente.',
          'gi'
        ),
        body_md = regexp_replace(
          body_md,
          'Consulte a FAQ \(inserir link da FAQ\) para um passo a passo sobre como obter o API Token e configurar as permiss[^.]*\.',
          'Consulte a documentação oficial da plataforma para gerar o API Token e configurar as permissões antes de testar a integração.',
          'gi'
        ),
        updated_at = timezone('utc', now())
    where article_id = v_article.id;
  end loop;
end;
$$;

commit;
