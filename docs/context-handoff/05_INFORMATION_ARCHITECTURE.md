# Information Architecture

## Superfícies atuais

1. Pública: `/help`, `/help/:spaceSlug`, artigos e lista de artigos.
2. Portal cliente: `/portal`, tickets e ajuda autenticada.
3. Interna operacional: `/inicio`, `/support/*`, `/cs/portfolio`, `/internal-actions`, `/engineering`.
4. Inteligência/gestão: `/admin/analytics`, `/admin/visao-geral`.
5. Administração: `/admin/settings`, `/admin/tenants`, `/admin/customer-portal`, `/admin/internal-areas`, `/admin/access`, `/admin/system`, `/admin/knowledge`, `/admin/product-docs`, `/admin/build-journal`.

## Problemas de arquitetura da informação

- O menu mistura rotinas de trabalho, administração, conhecimento, documentação e diário de construção.
- Alguns nomes ainda são técnicos ou ambíguos para operação real, como `Contas B2B`, `Sistema` e `Produto`.
- Há sobreposição entre clientes B2B em suporte, contas B2B em admin e carteira CS.
- O modelo final de empresa, entidade legal, grupo econômico, negócio, ticket e carteira ainda precisa de contrato de produto.

## Direção recomendada

- Separar "Minha rotina", "Gestão/Inteligência" e "Administração".
- Exibir menu por papel e área real do usuário.
- Remover do MVP inicial as superfícies que não estiverem necessárias para Dashboard + Central.
- Preservar módulos existentes, mas não publicá-los como completos sem validação.
