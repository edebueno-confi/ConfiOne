# Regras de qualidade

Use esta lista como mapa de investigação, não como checklist cego. Só reporte um achado quando houver evidência suficiente e contexto do contrato.

## Tipos e correção

- Procure `any`, casts inseguros, `as unknown as`, `@ts-ignore`, `@ts-expect-error` sem justificativa e non-null assertions sem garantia.
- Compare tipos locais com contratos compartilhados e respostas externas validadas.
- Verifique `null`/`undefined`, unions completas, estados impossíveis e parsing de payloads.

## Arquitetura

- Frontend renderiza views/read models e chama RPCs/commands reais; não inventa regra, métrica ou fallback de negócio.
- Procure acesso direto a tabelas onde há contrato de view/RPC, lógica de domínio em componentes, bypass de camadas, ciclos, imports cruzando domínios e fontes múltiplas de verdade.
- Diferencie repetição legítima de abstração prematura e duplicação perigosa.

## Manutenção

- Investigue responsabilidade, coesão, complexidade, aninhamento, efeitos colaterais, nomes vagos, branches impossíveis, magic strings/numbers, código morto e comentários divergentes.
- Não condene arquivo por linhas isoladamente; demonstre impacto na compreensão ou mudança segura.

## React e UX operacional

- Verifique hooks, estado derivado, closures, keys, promises, race conditions, unmount, loading, erro, vazio, retry, foco, teclado, semântica, contraste, responsividade e overflow.
- Verifique se cores/tipografia/layout usam tokens e design system. Mudança visual requer screenshot.
- Não proponha micro-otimização sem evidência de custo ou regressão.

## Async, observabilidade e integrações

- Procure promise ignorada, catch silencioso, erro convertido em vazio/zero, logs sensíveis, falta de correlação, retry sem limite, timeout sem distinção e jobs sem acompanhamento.
- Em HubSpot/OMIE e integrações, verifique idempotência, watermark, paginação, rate limit, backoff, lease, concorrência, staging, reconciliação, dry-run e auditoria.

## Segurança e dados

- Nunca exponha secrets. Audite autenticação, autorização server-side, tenant scope, RLS, grants, RPCs, SQL dinâmico, HTML não sanitizado, URLs inseguras, service role e auditoria administrativa.
- Em Supabase/Postgres, verifique RLS/policies por operação, funções `SECURITY DEFINER` com `set search_path = ''`, nomes qualificados, migrações auditáveis, índices críticos e contratos de retorno.
- Não execute migrations ou banco destrutivo por padrão.

## Testes, documentação e dependências

- Procure mudança sem teste, caminho feliz único, permissões/erros não testados, mocks que escondem regra, flakiness, ordem/data/credencial externa e testes desabilitados.
- Confira README/comandos, contratos públicos, RPCs/migrations, decisões arquiteturais e sincronidade com implementação. Histórico não prevalece sobre contrato real.
- Audite dependências não usadas/duplicadas/vulneráveis, pacote pesado, artefato rastreado, lockfile sem justificativa e comandos incompatíveis com Windows.
