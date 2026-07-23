# AI Core Readiness Contract V1

## Objetivo

Definir quando o Genius Support OS pode declarar, exibir ou operar capacidades de IA sem criar promessa falsa, risco operacional ou decisão automatizada indevida.

## MUST

- IA deve ser assistente operacional, nunca fonte oficial de verdade.
- Toda resposta de IA que usar conhecimento interno deve indicar fontes ou evidências.
- Toda ação customer-facing sugerida por IA deve exigir revisão humana antes do envio.
- Prompts, ferramentas e outputs devem respeitar tenancy, permissões e RLS.
- Dados sensíveis devem ser minimizados, sanitizados e auditáveis.
- Falhas de IA devem ter fallback claro e não bloquear operação crítica.
- A interface deve diferenciar sugestão, diagnóstico, automação e ação executada.

## SHOULD

- Usar IA primeiro em apoio interno: sumarização, triagem, busca, sugestão e revisão.
- Registrar participação da IA em ações relevantes.
- Permitir feedback humano sobre qualidade da sugestão.
- Usar limites de escopo por área, perfil e cliente.

## MUST NOT

- Não chamar busca, resumo ou triagem de "inteligente" sem contrato funcional.
- Não executar alteração de dados, envio externo ou decisão de permissão sem revisão humana.
- Não misturar dados cross-tenant em contexto de IA.
- Não usar IA para contornar ausência de contrato backend.
- Não armazenar prompts com secrets ou dados sensíveis desnecessários.

## Critérios de aceite

- Existe contrato explícito para entrada, processamento, saída e auditoria.
- A fonte de dados é definida e autorizada.
- O usuário entende se o resultado é sugestão ou ação.
- Há estado de erro e fallback.
- Há trilha de auditoria quando a IA influencia decisão operacional.

## Evidências obrigatórias

- Spec do fluxo de IA.
- Lista de fontes usadas.
- Testes de permissão e isolamento.
- Exemplos de sucesso, erro e sem dados.
- Registro de revisão humana quando aplicável.

## Condições de reprovação

- IA aparece como decisora.
- A tela promete inteligência sem implementação validada.
- Output usa dados sem fonte ou sem permissão.
- Falha de IA impede ação manual.
- Não há auditoria para sugestão usada em operação.

## Processo de exceção

Qualquer exceção precisa de aprovação do Ede e registro em documentação canônica, com risco, mitigação e prazo de remoção.

## Automatização futura

- Testes de isolamento por tenant.
- Auditoria de strings que prometem IA sem feature flag.
- Logs estruturados de sugestões e aceite humano.
- Validação de fontes citadas.
