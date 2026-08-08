-- Foto do profissional: bucket proprio para a auto-edicao de perfil.
--
-- Por que um bucket novo: `knowledge-public-assets` e governado por
-- `app_private.can_manage_knowledge_base()` e amarrado a
-- `knowledge_article_assets`. Um avatar nao e asset editorial e a pessoa comum
-- nao administra a base de conhecimento, entao reusar aquele bucket exigiria
-- afrouxar as policies dele. Bucket separado mantem cada gate no seu escopo.
--
-- Por que publico: `public.profiles.avatar_url` ja e uma URL de texto,
-- consumida direto em `<img src>` pela sidebar, pelo menu do usuario e pelos
-- read models administrativos (`vw_admin_access_internal_users.avatar_url`).
-- URL assinada exigiria renovacao por linha de lista. O caminho do objeto e
-- prefixado pelo id do usuario, que nao e dado publico, e o conteudo e uma
-- foto de identificacao profissional. O tradeoff esta registrado no relatorio
-- do lote.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Autorizacao no banco, nao na interface: a primeira pasta do caminho precisa
-- ser exatamente o id do usuario autenticado. Ninguem escreve, sobrescreve ou
-- apaga o arquivo de outra pessoa, mesmo chamando a API de Storage direto.
--
-- O SELECT tambem e restrito a propria pasta, e nao e decoracao: o Storage faz
-- `insert ... on conflict do update ... returning *`, e o Postgres exige que as
-- policies de SELECT aceitem a linha nova quando o comando tem RETURNING. Sem
-- esta policy o upload falha com 42501 mesmo com o WITH CHECK correto. A
-- leitura publica da foto nao passa por aqui: o bucket e publico e a imagem e
-- servida pela URL, fora da RLS.
drop policy if exists profile_avatars_self_select on storage.objects;
create policy profile_avatars_self_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = app_private.current_user_id()::text
);

drop policy if exists profile_avatars_self_insert on storage.objects;
create policy profile_avatars_self_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = app_private.current_user_id()::text
);

drop policy if exists profile_avatars_self_update on storage.objects;
create policy profile_avatars_self_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = app_private.current_user_id()::text
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = app_private.current_user_id()::text
);

drop policy if exists profile_avatars_self_delete on storage.objects;
create policy profile_avatars_self_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = app_private.current_user_id()::text
);
