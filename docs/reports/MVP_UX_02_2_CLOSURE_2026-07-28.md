# MVP-UX-02.2 — Fechamento crítico do Canvas Gerencial Gênio HD

## Escopo

Fechamento local da fundação do Canvas Gerencial Gênio HD na branch `codex/mvp-ux-01-structural-simplification`, sem push, PR, merge, deploy, sincronização externa ou alteração da Central de Ajuda.

## Entregas

- Read models de Acessos estabilizados para o runtime local PostgreSQL 17/PostgREST, preservando actor-bound capability checks, RLS, perfis, grants, auditoria e proteção do último administrador.
- Leitura autenticada de capabilities, overrides, perfis e catálogo de capacidades consolidada em RPCs JSONB, evitando a paginação de recordsets/views que provocava o crash do backend.
- Canvas analytics reorganizado com seis domínios, fonte/frescor, recorte temporal, filtros responsivos, estados honestos e navegação mobile.
- Panorama de integrações adicionado às Configurações usando apenas estado real disponível, sem dados operacionais fabricados.
- Teste de estabilidade repetiu consultas SQL e chamadas PostgREST autenticadas sem 5xx, recuperação do banco ou novo segfault.

## Validação local

- `npm run web:typecheck`: aprovado.
- `npm run contracts:typecheck`: aprovado.
- `npm run web:build`: aprovado.
- `npm run supabase:test:db`: aprovado após reset local, 88 arquivos e 1.422 testes.
- teste focado do Canvas HD e estabilidade de Access: aprovados.
- `npm run repository:check-root`: aprovado.
- `npm run local:qa:secret-scan`: aprovado, sem correspondências.
- O reset/reidratação executados foram exclusivamente locais; nenhum dado de HubSpot/OMIE foi fabricado ou sincronizado.

## Evidências

O pacote navegável final, com manifesto, screenshots, relatórios técnicos, validação de integridade e ZIP, é gerado fora do Git em `output/review-packages/` após o commit final desta frente.

## Estado e limites

Working tree limpo antes da inclusão deste fechamento; branch sem push. A recomendação de publicação permanece condicionada à inspeção do pacote visual final, à revisão do estado real vazio e à validação dos estados QA marcados explicitamente como `Dados de QA`.
