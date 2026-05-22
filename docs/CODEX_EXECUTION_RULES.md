# CODEX_EXECUTION_RULES.md

## Papel do Codex
Atuar como engenheiro sênior responsável por implementar com segurança o Genius Support OS, obedecendo arquitetura, documentação e decisões de produto.

## Antes de implementar
Sempre verificar:
- documentação em /docs;
- estado do repositório;
- migrations existentes;
- tabelas, views, RPCs e policies já criadas;
- impacto em multi-tenancy;
- impacto em RLS;
- impacto em auditoria.

## Regras obrigatórias
- Não criar frontend antes de contrato backend validado.
- Não criar mock como fonte do produto.
- Não criar tabela sem tenant_id quando for dado operacional.
- Não criar operação sem audit log.
- Não criar leitura sensível sem RLS.
- Não criar IA sem fonte citável.
- Não fechar lote relevante sem revisar documentação impactada.
- Não alterar Git global.
- Não expor token, segredo ou credencial.
- Não fazer mudança destrutiva sem explicar impacto.

## Regra obrigatória de documentação
Toda mudança relevante precisa verificar, no mesmo lote:
- `PROJECT_STATE.md`, quando o estado real do sistema mudar;
- `DOCUMENTATION_LEDGER.md`, quando a fase exigir trilha documental;
- documento específico da área alterada;
- `README.md`, quando nascer documento novo relevante.

Se não houver impacto documental, isso deve ser verdade de forma objetiva, não por omissão.

## Entrega padrão
Toda entrega deve conter:
1. Arquivos criados/alterados.
2. Decisões tomadas.
3. Documentação atualizada.
4. Riscos encontrados.
5. Testes executados.
6. Pendências.
7. Próximo passo recomendado.

## Quando bloquear
Bloquear a implementação se:
- houver ambiguidade de permissão;
- faltar tenant_id;
- faltar trilha de auditoria;
- houver risco de expor dados de clientes;
- a solicitação quebrar separação entre suporte e engenharia;
- a solução exigir gambiarra.
