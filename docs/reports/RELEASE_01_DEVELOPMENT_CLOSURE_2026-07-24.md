# RELEASE-01 — Encerramento do desenvolvimento

## Escopo encerrado

- Central Pública de Ajuda e Dashboard Gerencial do piloto;
- migração completa da base Octadesk;
- recuperação, associação e renderização governada de assets;
- Hub público de Integrações e API;
- taxonomia, categorias, subcategorias, busca e navegação pública;
- permissões públicas e bloqueio de conteúdo não público;
- normalização editorial, responsividade, acessibilidade, testes e evidências;
- correção do CTA `Entrar no portal` para `/portal`.

## Bloco concluído

PILOT da Central Pública, KNOWLEDGE-01, KNOWLEDGE-01.1, TAXONOMY-01,
TAXONOMY-01.1, recuperação e associação de assets, normalização editorial,
busca, categorias, subcategorias, navegação, responsividade, acessibilidade e
gate técnico da RELEASE-01 estão concluídos no escopo de desenvolvimento.

## Situação da RELEASE-01

`PR criado — aguardando revisão, merge e deploy`

- PR: [#1](https://github.com/edebueno-confi/Genius-OS/pull/1)
- título: `Release: Dashboard Gerencial e Central de Ajuda Genius`
- branch base: `main`
- branch de origem: `codex/release-pilot-dashboard-help-center-v1`
- HEAD: `81d311983833a98332109f7168c9d931d815f5f1`
- autor: `edebueno-confi`

A release não está implantada nem totalmente encerrada: ainda depende de
aprovação do PR, merge, deploy e smoke em produção. Essas pendências não
reabrem KNOWLEDGE-01 ou TAXONOMY-01.

## Estado final

| Campo | Estado |
|---|---|
| Artigos | 75 |
| Visibilidade | 62 públicos; 13 não públicos |
| Assets | 128 total; 99 públicos aprovados; 29 pendentes |
| Taxonomia | final, com categorias e subcategorias |
| Testes | typechecks, build, pgTAP, testes Node e smoke aprovados |
| Workflow | `Supabase DB`, run `30121413042`, aprovado |
| Working tree | limpo no estado publicado da branch |
| Ahead/behind | 0/0 após o push documental |

## Pendências que não reabrem o bloco

- KNOWLEDGE-02 — gestão editorial e editor rico;
- revisão dos conteúdos restritos;
- 29 assets pendentes de revisão;
- drift da migration local;
- investigação do erro remoto `invalid input syntax for type uuid: "true"`;
- merge, deploy e smoke em produção.

## Próxima frente

`DASHBOARD-02 — Evolução do Dashboard Gerencial`

O discovery deverá tratar clareza dos indicadores, hierarquia, utilidade
operacional, filtros e períodos, comparação de resultados, ausência de dados,
permissões, responsividade e qualidade/origem dos dados. Nenhum código ou tela
de DASHBOARD-02 foi criado nesta branch.

## Riscos conhecidos

Os riscos de publicação são operacionais: revisão, merge, deploy e smoke em
produção. Conteúdo restrito e assets pendentes permanecem fora do escopo
público. O drift de migration e o erro remoto UUID/`true` permanecem no
backlog técnico.

## Evidências versionadas

- `docs/reports/KNOWLEDGE_01_CONSOLIDATED_CLOSURE_2026-07-24.md`;
- `docs/reports/KNOWLEDGE_01_1_INTEGRATIONS_API_AUDIT_2026-07-24.md`;
- `docs/reports/TAXONOMY_01_1_FINAL_2026-07-24.md`;
- `docs/reports/DASHBOARD_02_TRANSITION_2026-07-24.md`.
