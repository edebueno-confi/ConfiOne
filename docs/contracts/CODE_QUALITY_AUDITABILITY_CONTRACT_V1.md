# Code Quality Auditability Contract V1

## Objetivo

Garantir que o código do Genius Support OS seja auditável por humanos, sustentável por equipe técnica e coerente com a arquitetura backend-first.

## MUST

- Código deve ser legível por humanos e ter responsabilidades únicas.
- Domínio, contratos e regras de negócio devem ficar separados da interface.
- Tipagem deve ser explícita nas fronteiras de dados.
- Erros devem ser tratados de forma explícita e observável.
- Efeitos colaterais devem ser nomeados e isolados.
- Componentes e funções devem ter tamanho e complexidade compatíveis com manutenção.
- Alterações devem ser incrementais, rastreáveis e reversíveis.
- Testes comportamentais devem cobrir contratos críticos.
- Commits devem ser objetivos e rastreáveis.
- Código novo deve respeitar RLS, tenancy, permissões e auditoria quando tocar dados.

## SHOULD

- Reutilizar contratos, hooks, componentes e helpers existentes.
- Preferir nomes de domínio claros a abstrações genéricas.
- Manter funções puras onde possível.
- Documentar tradeoffs em docs quando afetarem arquitetura ou operação.
- Escrever testes antes ou junto da correção quando o comportamento for crítico.

## MUST NOT

- Não criar abstração prematura.
- Não criar componente monolítico ou arquivo gigante sem justificativa.
- Não duplicar regra de negócio entre frontend e backend.
- Não fabricar dados, mocks ou fallbacks silenciosos quando houver fonte real.
- Não esconder falhas em `catch` genérico sem mensagem operacional.
- Não usar secrets, service role, tokens ou credenciais em frontend.
- Não alterar schema, policy ou dado crítico sem validação e estratégia de reversão.

## Critérios de aceite

- O diff é compreensível sem depender do histórico de chat.
- Responsabilidades dos arquivos alterados são claras.
- Tipos e contratos protegem entradas e saídas.
- Erros têm tratamento e mensagem adequada.
- Testes ou validação manual proporcional ao risco foram executados.
- Documentação foi atualizada quando houve mudança estrutural.

## Evidências obrigatórias

- Lista de arquivos alterados.
- Comandos de validação executados.
- Resultado de lint/typecheck/test/build quando aplicável.
- Justificativa para validações não executadas.
- Estado Git no fechamento.

## Condições de reprovação

- Código monolítico ou acoplado à UI sem contrato.
- Regra crítica apenas no frontend.
- Erro silencioso ou fallback enganoso.
- Dado sensível exposto.
- Ausência de validação objetiva em mudança relevante.
- Alteração ampla sem relação clara com o escopo.

## Processo de exceção

Exceções devem registrar:

- arquivo afetado;
- motivo;
- risco;
- compensação técnica;
- tarefa futura para correção.

## Automatização futura

- Limites de complexidade por arquivo/função.
- Detecção de secrets e service role.
- Checagem de regras locais duplicadas.
- Testes de contrato e permissão.
- Gate de documentação para mudanças estruturais.
