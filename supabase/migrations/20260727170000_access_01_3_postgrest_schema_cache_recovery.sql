-- ACCESS-01.3: solicita a recarga do catalogo do PostgREST depois do
-- control plane de acesso. A migration nao altera dados, grants ou policies;
-- apenas evita que views forward-only recem-publicadas permaneçam ausentes
-- do schema cache do gateway autenticado.
notify pgrst, 'reload schema';
