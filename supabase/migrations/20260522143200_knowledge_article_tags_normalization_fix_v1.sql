create or replace function app_private.normalize_knowledge_article_tags(p_tags text[] default '{}'::text[])
returns text[]
language sql
stable
set search_path = ''
as $$
  with raw_tags as (
    select unnest(coalesce(p_tags, '{}'::text[])) as raw_tag
  ),
  normalized as (
    select
      btrim(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              translate(
                lower(btrim(raw_tag)),
                'áàãâäéèêëíìîïóòõôöúùûüçñ',
                'aaaaaeeeeiiiiooooouuuucn'
              ),
              '[^a-z0-9 -]',
              '',
              'g'
            ),
            '\s+',
            '-',
            'g'
          ),
          '-+',
          '-',
          'g'
        ),
        '-'
      ) as tag
    from raw_tags
  ),
  safe_tags as (
    select distinct tag
    from normalized
    where tag ~ '^[a-z0-9][a-z0-9-]{0,31}$'
    order by tag
    limit 11
  )
  select coalesce(array_agg(tag order by tag), '{}'::text[])
  from safe_tags;
$$;

revoke all on function app_private.normalize_knowledge_article_tags(text[]) from public, anon, authenticated, service_role;
