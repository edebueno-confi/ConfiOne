# Handoff — Recharts 3 e reconciliação da suíte ampla

## Resumo

- Data: 2026-08-11
- Branch observada: `codex/governanca-dados-tabs`
- HEAD observado antes do commit deste lote: `a992f05`
- Migração concluída: `recharts` `2.15.4` → `3.10.1`
- Suíte focada da migração: 21/21 testes aprovados
- Suíte ampla atual: 531 testes, 492 aprovados, 39 falhos
- As 39 falhas não apontam para os componentes Recharts e não devem ser usadas para reabrir esta migração.

## Decisão operacional

As falhas da suíte ampla não foram mascaradas nem removidas. O comando `npm test` valida o lote focado de Analytics/Recharts; `npm run test:all` permanece disponível como diagnóstico até a reconciliação dos contratos abaixo.

Isso permite validar a migração sem declarar o monorepo inteiro verde. Antes de push ou deploy, o agente responsável deve decidir, por grupo, se o teste está desatualizado, se o código precisa ser corrigido ou se o contrato atual precisa de decisão humana.

## Por que o total não é um bloqueio Recharts

Os testes falhos são principalmente contratos estáticos que leem arquivos e procuram textos, imports, tokens ou estruturas específicas. Eles podem falhar quando:

1. o comportamento foi mantido, mas a implementação foi reorganizada;
2. o contrato atual foi alterado por uma decisão de produto;
3. o teste preserva uma expectativa histórica;
4. existe uma regressão real que exige validação do domínio.

Nenhuma das falhas envolve `Tooltip`, `Legend`, `XAxis`, `YAxis`, `CartesianGrid`, `ResponsiveContainer`, `Cell`, `ReferenceLine`, hooks internos ou APIs removidas do Recharts 3.

## Grupos para a próxima sessão

### 1. Access, autenticação e release surface — reconciliação obrigatória

Falhas: `1`, `12`, `16`, `281`, `373`, `374`, `375`, `419`, `444`, `471`.

Principais divergências:

- `access-01-1-ui-contract.test.mjs` ainda exige a aba `Convites`, enquanto o estado canônico atual registra a remoção de `Convites / Histórico` e a tela expõe `Usuários`, `Estrutura` e `Perfis`.
- Outros testes esperam o fluxo antigo de `PasswordChangeGate`, nomes antigos de avatar/menu, `react-router-dom` ou trechos literais anteriores do guard de rotas.
- Os testes de `dashboard_viewer` e release procuram formas textuais antigas, embora o código atual normalize pathname/query e use o catálogo de release vigente.

Classificação: forte candidato a teste legado ou stale test. Não reintroduzir Convites, `react-router-dom` ou fluxos antigos apenas para satisfazer regex. Atualizar os testes depois de confirmar a precedência em `PROJECT_STATE.md`, contratos de Access e release surface.

### 2. HubSpot e contratos de integração — não ignorar em release de integração

Falhas: `4`, `57`, `80`, `82`, `83`, `84`, `92`, `93`, `94`, `118`.

Principais contratos protegidos:

- normalização de arrays opcionais do diagnóstico;
- propriedades nativas de datas de tickets e negócios;
- `closed_date` para tickets e `closedate` para negócios;
- `notes_last_contacted` para última interação de empresa;
- conversão segura de duração inválida/negativa;
- ingestão somente leitura;
- limites de batch de associações e histórico;
- propriedade de estágio correta por objeto;
- traduções dos códigos de cobertura parcial.

Classificação: não são bloqueios Recharts. Também não devem ser ignorados se o lote alterar o sincronizador HubSpot. O próximo agente deve comparar cada expectativa com o runner, workers, migrations e read models reais; depois atualizar o teste ou corrigir o código conforme o contrato vigente. Não fazer migration remota nem sincronização externa como parte dessa reconciliação sem autorização.

### 3. Analytics e read models — reconciliação de contrato

Falhas: `65`, `73`, `212`, `284`, `285`, `290`, `421`, `422`, `428`.

Esses testes verificam separação de fontes, estados `fresh`/`unavailable`, carregamento, histórico de sincronização, semântica de KPIs, taxonomia da home e pluralização. Parte deles pode refletir mudança legítima de contrato; outra parte pode apontar regressão. A revisão deve começar pelo read model/backend e só depois ajustar a UI ou o teste.

### 4. UI, marca e contratos visuais — reconciliação separada

Falhas: `63`, `303`, `312`, `334`, `368`, `480`, `482`, `483`, `526`, `528`.

São expectativas exatas sobre classes, SVG, ícones, links, labels e tokens Confi One. O contrato visual canônico atual tem precedência sobre snapshots ou regex históricos. Corrigir apenas com comparação ao blueprint/contrato visual vigente e QA visual; não misturar com a migração Recharts.

## Falha especial do harness

O teste `4` (`analytics-commercial-kpi-details.test.mjs`) também expõe uma limitação do harness: ele tenta importar módulos TypeScript/ESM da aplicação diretamente pelo Node, sem o pipeline do Vite/TypeScript. Isso deve ser corrigido no executor do teste ou convertido para um contrato testável sem import inválido; não deve ser resolvido removendo o teste.

## Critério para fechar a reconciliação

Antes de push/deploy, a próxima sessão deve:

1. executar `npm run test:all` e registrar a contagem;
2. separar testes stale de regressões reais;
3. corrigir ou atualizar os contratos por grupo, nunca por regex indiscriminada;
4. executar novamente typecheck, lint, build e QA das superfícies alteradas;
5. confirmar que HubSpot continua read-only, autorizado, idempotente e sem vazamento de credenciais;
6. revisar o diff seletivo, pois há sessões paralelas alterando Settings;
7. somente então avaliar push/deploy com autorização própria.

## Arquivos Recharts já validados

- `apps/web/src/features/analytics/charts/AnalyticsCharts.tsx`
- `apps/web/src/features/analytics/charts/AnalyticsTrendCharts.tsx`
- `tests/scripts/analytics-trend-charts.test.mjs`
- `tests/scripts/analytics-timeseries-contract.test.mjs`

## Validação deste handoff

- `npm test`: 21/21 aprovado.
- `npm run web:typecheck`: aprovado.
- `npm run contracts:typecheck`: aprovado.
- `npm run lint`: aprovado, 0 erros e 193 avisos preexistentes.
- `npm run web:build`: aprovado.
- `npm run quality:changed`: aprovado, 0 findings.
- `npm audit --audit-level=high`: 0 vulnerabilidades.
- QA local das subabas: 18 combinações, 0 achados; dataset local sem dados suficientes para desenhar barras reais.
- `npm run test:all`: 492 aprovados e 39 falhos; falhas registradas acima.

## Estado Git e paralelismo

Este documento não autoriza staging amplo. O lote Recharts deve ser commitado somente com seus arquivos explícitos. Alterações em Settings e seus testes, pertencentes a outras sessões, devem permanecer fora deste commit e ser reconciliadas pelos respectivos agentes.
