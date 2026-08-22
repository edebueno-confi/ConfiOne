-- A policy de leitura de Customer Operations chama esta função em nome de authenticated.
-- O hardening anterior removeu EXECUTE do papel, fazendo a policy falhar com 42501.
-- A função apenas avalia o papel ativo do usuário e não concede leitura por si só.
grant execute on function app_private.can_read_customer_operations() to authenticated;
