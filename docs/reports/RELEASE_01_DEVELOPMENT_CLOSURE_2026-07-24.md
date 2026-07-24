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

PILOT da Central Pública, KNOWLEDGE-01, KNOWLEDGE-01.1, TAXONOMY-01, TAXONOMY-01.1, recuperação/associação de assets, normalização editorial, busca/categorias/subcategorias/navegação, responsividade/acessibilidade e gate técnico da RELEASE-01 estão concluídos no escopo de desenvolvimento. Nenhum desses lotes permanece em andamento ou aguardando revisão de desenvolvimento.

## Situação da RELEASE-01

`PR criado — aguardando revisão, merge e deploy`.

A release não está implantada nem totalmente encerrada: ainda depende de aprovação do PR, merge, deploy e smoke em produção. Essas pendências não reabrem KNOWLEDGE-01 ou TAXONOMY-01.

## Estado final

| Campo | Estado |
|---|---|
| Branch | `codex/release-pilot-dashboard-help-center-v1` |
| HEAD | `dc10e66` |
| PR | pendente de criação neste registro inicial |
| Artigos | 75 |
| Visibilidade | 62 `published/public`; 13 não públicos |
| Assets | 128 total; 99 aprovados/públicos; 29 pendentes |
| Taxonomia | final, 2 níveis, sem públicos sem categoria |
| Testes | typechecks, build, pgTAP 9/9, testes editoriais 8/8 e smoke público aprovados |
| Working tree | limpo |
| Ahead/behind | 0/0 contra `origin/codex/release-pilot-dashboard-help-center-v1` |

## Pendências que não reabrem o bloco

- `KNOWLEDGE-02` — gestão editorial e editor rico;
- revisão dos conteúdos restritos;
- 29 assets pendentes de revisão;
- drift da migration local;
- investigação do erro remoto `invalid input syntax for type uuid: "true"`;
- merge, deploy e smoke em produção.

## Próxima frente

`DASHBOARD-02 — Evolução do Dashboard Gerencial`.

O próximo ciclo deverá iniciar discovery próprio sobre clareza dos indicadores, hierarquia, utilidade operacional, filtros/períodos, comparação de resultados, ausência de dados, permissões, responsividade e qualidade/origem dos dados. Nenhum código, tela ou implementação desta frente foi criado na branch da RELEASE-01.

## Riscos conhecidos

O principal risco de publicação é operacional: o ambiente remoto ainda exige revisão, merge, deploy e smoke em produção. Conteúdo restrito e assets pendentes permanecem fora do escopo público. O drift de migration e o erro remoto UUID/`true` continuam isolados no backlog técnico.

## Evidências

Relatórios principais: `docs/reports/TAXONOMY_01_1_FINAL_2026-07-24.md`, `docs/reports/KNOWLEDGE_01_CONSOLIDATED_CLOSURE_2026-07-24.md` e `docs/reports/KNOWLEDGE_01_1_INTEGRATIONS_API_AUDIT_2026-07-24.md`. Evidências visuais finais estão em `output/playwright/taxonomy-011-*.png`.
