# QA local da Central de Clientes V1

- Task: `R2-CUSTOMER-CENTRAL-QA-2026-08-21`
- Base: `16faa01b`
- Ambiente: Vite local em `127.0.0.1:4174`, sem credenciais autorizadas
- Escopo: QA visual/funcional read-only contra `CENTRAL_CLIENTES_HOME_V1.png` e `CLIENTE_RESUMO_V1.png`

## Resultado executivo

O guard não autenticado foi comprovado localmente: a navegação para
`/admin/customer-central` respondeu HTTP 200 no shell e redirecionou para
`/login`. O workspace autenticado não foi comprovado, portanto não há base
para declarar PASS de renderização da Central, tabs, dados, tenant/RLS,
responsividade ou performance servida.

## Matriz de evidências

| Área | Evidência | Classificação |
| --- | --- | --- |
| Blueprint home | Inspeção visual de `CENTRAL_CLIENTES_HOME_V1.png`: navegação global, cabeçalho da Central, filtros, lista tabular e paginação | COMPROVADO como referência visual |
| Blueprint detalhe | Inspeção visual de `CLIENTE_RESUMO_V1.png`: breadcrumb, resumo da conta, tabs e blocos de contexto | COMPROVADO como referência visual |
| Rota e guard | Playwright local: GET `/admin/customer-central`, status 200, URL final `/login`, título Confi One, conteúdo de login | COMPROVADO para usuário não autenticado |
| Console e rede | Playwright: 0 erros de console e 0 request failures nessa navegação | COMPROVADO nesse cenário |
| Renderização autenticada | Sem credenciais autorizadas | NÃO COMPROVADO |
| Lista, detalhe e tabs | Fluxo depende de sessão e fontes autorizadas | NÃO COMPROVADO |
| Loading/error/empty | Existem fases no código e estados dedicados, mas não foram exercitados no browser | INFERIDO DO CÓDIGO, NÃO COMPROVADO EM RUNTIME |
| Fontes e tenant/RLS | Código usa APIs/read models administrativos existentes; não houve sessão autenticada nem consulta servida | FATO LOCAL DE CÓDIGO, INTEGRAÇÃO NÃO COMPROVADA |
| Responsividade | Blueprint é desktop; browser autenticado não disponível e não houve validação funcional de viewport | NÃO COMPROVADO |
| Performance | Build/testes podem ser medidos; não houve medição de latência, carga ou dados servidos | NÃO COMPROVADO |
| HubSpot/OMIE | Nenhuma chamada ou escrita externa executada | FORA DO ESCOPO / PRESERVADO |

## Comparação com implementação

O código local apresenta rota dedicada `customer-central` reutilizando
`TenantsPage`, cabeçalho da Central, busca/filtros, lista e detalhe com tabs
`Resumo`, `Conta B2B`, `Assinaturas`, `Usuários da conta`, `Status` e
`Atividade`. Esses fatos são leitura estática, não substituem QA autenticado.

Não foi possível confirmar fidelidade visual completa ao blueprint, estados
servidos, navegação entre tabs, isolamento tenant-aware, respostas RLS ou
fontes preenchidas. A ausência de credenciais é uma limitação ambiental, não
um resultado funcional positivo.

## Validações

- `node --test tests/scripts/customer-central-workspace.test.mjs`: PASS, 2/2.
- `npm run web:typecheck`: PASS.
- `npm run web:build`: PASS, 945 módulos transformados.
- `npm run lint`: PASS, 0 erros e 160 warnings legados.
- `npm run docs:validate`: PASS, 0 bloqueios; alertas documentais existentes registrados pelo comando.
- `npm run review:gates`: PASS, 0 regressões bloqueantes e 47 itens baseline resolvidos.
- `git diff --check`: PASS.
- Playwright local headless em `/admin/customer-central`: PASS no cenário não autenticado descrito acima.
- Não foram executadas chamadas externas, escritas, HubSpot/OMIE, produção ou migrations remotas.

## Limitações e próximos gates

Requer QA autenticado autorizado para validar conteúdo, tabs, estados, viewport,
console/rede durante carregamento de dados, tenant/RLS e performance. O próximo
passo é executar esse roteiro com uma identidade de teste aprovada, sem usar
secrets expostos nem dados de produção.
