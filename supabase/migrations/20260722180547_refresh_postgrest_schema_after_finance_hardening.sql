-- O runtime REST pode iniciar antes de uma migration que adiciona colunas ao
-- read model financeiro. Recarregar explicitamente o cache evita que a API
-- rejeite `is_current` embora a coluna já exista no PostgreSQL.
notify pgrst, 'reload schema';
