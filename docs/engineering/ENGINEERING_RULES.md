# ConfiOne, regras de engenharia

## Escopo

Estas regras consolidam convenções verificáveis no repositório. Regras específicas
de segurança, arquitetura, produto, documentação e revisão mantêm precedência em
seus documentos próprios.

## Implementação

- trabalhar em lotes pequenos, coesos, rastreáveis e limitados ao escopo;
- auditar equivalentes antes de criar tabela, view, RPC, policy, Edge Function ou
  contrato;
- manter TypeScript e contratos compartilhados alinhados;
- não mover regra de negócio para o frontend;
- não substituir dados reais por mocks;
- não atualizar dependências sem necessidade comprovada;
- preservar compatibilidade quando o contrato existente exigir;
- documentar decisões e limitações em fontes persistentes.

## Validação oficial

Usar os scripts existentes e registrar resultado real:

    npm run lint
    npm run contracts:typecheck
    npm run web:typecheck
    npm run build
    npm run web:build
    npm run test
    npm run test:all
    npm run docs:validate
    npm run supabase:lint:db
    npm run supabase:test:db
    npm run review:gates

Escolher a validação proporcional ao lote. Não declarar testes aprovados sem
execução. Diferenciar compilação, página renderizada, fluxo funcional, integração
real, comportamento inferido e bloqueio de ambiente.

## Banco e migrations

- migrations devem ser versionadas e idempotentes quando o contrato exigir;
- antes de alterar banco, auditar migrations, views, RPCs, policies e testes
  equivalentes;
- confirmar que o alvo é local antes de reset, seed, fixture ou escrita;
- migration remota, reset destrutivo e alteração de produção exigem aprovação
  humana explícita;
- toda operação sensível deve considerar RLS, tenant, auditoria, isolamento e
  rollback operacional.

## Erros e observabilidade

- não usar catch vazio para esconder falhas;
- erros relevantes devem ser visíveis ao operador ou registrados de forma
  sanitizada;
- logs não podem conter secrets, tokens, cookies, JWTs ou dados sensíveis;
- smoke tests devem falhar quando o fluxo principal falhar;
- não tratar HTTP 200 isolado como validação funcional.

## Dependências e compatibilidade

- preservar o lockfile;
- evitar mudanças de dependência fora do lote;
- avaliar impacto em build, runtime, CI, browser e contratos;
- preservar APIs e dados existentes quando não houver decisão explícita de quebra;
- registrar migração ou compatibilidade quando uma quebra for necessária.

## Documentação

Quando o comportamento real mudar, revisar PROJECT_STATE.md,
DOCUMENTATION_LEDGER.md, o documento da área e docs/README.md conforme
docs/DOCUMENTATION_UPDATE_POLICY.md.

## Colaboração

Codex implementa e documenta. Claude revisa e decide formalmente. Codex não
autodeclara aprovação. Claude não altera código de produto durante revisão.

UNRESOLVED — requires project owner decision: política de merge e promoção entre
branches não determinada apenas pelos arquivos de CI presentes.
