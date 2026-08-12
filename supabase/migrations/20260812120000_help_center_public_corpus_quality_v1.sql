-- Correção editorial auditável do corpus público Genius Returns.
-- A fonte da correção é o texto UTF-8 da exportação Octadesk já versionada no repositório.
-- Nenhum artigo é despublicado; somente o resumo corrompido e placeholders são reparados.

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
        body_md = replace(
          replace(
            body_md,
            'Consulte a FAQ (inserir link da FAQ) para aprender a configurar as permissões.',
            'Se o teste gerar erro, revise as permissões exigidas pela plataforma e tente novamente.'
          ),
          'Consulte a FAQ (inserir link da FAQ) para um passo a passo sobre como obter o API Token e configurar as permissões.',
          'Consulte a documentação oficial da plataforma para gerar o API Token e configurar as permissões antes de testar a integração.'
        ),
        current_revision_number = current_revision_number + 1,
        updated_at = timezone('utc', now())
    where id = v_article.id;

    perform app_private.capture_knowledge_revision(
      v_article.id,
      null,
      'Correção editorial UTF-8 e remoção de placeholders públicos'
    );

    update public.knowledge_article_editorial_drafts
    set summary = 'Para atualizar os dados de integração, siga os passos abaixo e valide as permissões da plataforma antes de salvar.',
        body_md = replace(
          replace(
            body_md,
            'Consulte a FAQ (inserir link da FAQ) para aprender a configurar as permissões.',
            'Se o teste gerar erro, revise as permissões exigidas pela plataforma e tente novamente.'
          ),
          'Consulte a FAQ (inserir link da FAQ) para um passo a passo sobre como obter o API Token e configurar as permissões.',
          'Consulte a documentação oficial da plataforma para gerar o API Token e configurar as permissões antes de testar a integração.'
        ),
        updated_at = timezone('utc', now())
    where article_id = v_article.id;
  end loop;
end;
$$;

commit;
