create extension if not exists pgtap with schema extensions;

begin;

select plan(9);

select is(
  (select public from storage.buckets where id = 'profile-avatars'),
  true,
  'bucket de foto de perfil existe'
);

select is(
  (select file_size_limit from storage.buckets where id = 'profile-avatars'),
  2097152::bigint,
  'limite de tamanho da foto e validado no servidor pelo bucket'
);

select is(
  (
    select allowed_mime_types
    from storage.buckets
    where id = 'profile-avatars'
  ),
  array['image/png', 'image/jpeg', 'image/webp']::text[],
  'tipo de imagem permitido e validado no servidor pelo bucket'
);

-- Escrita, sobrescrita e remocao so podem alcancar o proprio arquivo. A prova
-- e a expressao da policy, nao a interface.
select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_avatars_self_insert'
      and roles = array['authenticated']::name[]
      and with_check like '%foldername%'
      and with_check like '%current_user_id%'
  ),
  1,
  'insert no bucket de foto exige que a pasta seja o proprio usuario'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_avatars_self_update'
      and roles = array['authenticated']::name[]
      and qual like '%current_user_id%'
      and with_check like '%current_user_id%'
  ),
  1,
  'update no bucket de foto exige que a pasta seja o proprio usuario'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_avatars_self_delete'
      and roles = array['authenticated']::name[]
      and qual like '%current_user_id%'
  ),
  1,
  'delete no bucket de foto exige que a pasta seja o proprio usuario'
);

-- A auto-edicao de perfil ja era contrato: este lote depende dela e por isso a
-- reafirma. UPDATE em `profiles` so alcanca a propria linha.
select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_update_self_safe_fields_only'
      and roles = array['authenticated']::name[]
      and qual like '%current_user_id%'
      and with_check like '%current_user_id%'
  ),
  1,
  'update de profiles continua restrito ao proprio usuario'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_update_self_or_platform_admin'
  ),
  0,
  'a policy antiga que permitia editar o perfil de terceiros nao voltou'
);

-- O gatilho que bloqueia campos administrados continua armado.
select has_trigger(
  'public',
  'profiles',
  'profiles_prevent_sensitive_changes',
  'gatilho que bloqueia email, is_active e id continua ativo em profiles'
);

select * from finish();

rollback;
