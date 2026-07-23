# Conflicts and Duplications

## Documentação histórica vs estado recente

Há documentos antigos que descrevem estados superados. `PROJECT_STATE.md` contém blocos recentes que devem prevalecer sobre pendências antigas, especialmente sobre OMIE, HubSpot e dashboard.

## Duplicações conceituais

- Clientes B2B aparecem em suporte e administração.
- Contas B2B, clientes, tenants e empresas HubSpot podem estar representando conceitos próximos, mas não idênticos.
- Dashboard executivo pode repetir métricas em cards e gráficos.
- Configurações de integração podem expor fallback de planilhas em excesso, embora direção futura seja API.
- Central pública e conhecimento admin usam o mesmo corpus, mas têm estados e permissões diferentes.

## Duplicações de navegação

- Conhecimento aparece como admin e central pública.
- Produto/engenharia/internal actions podem se sobrepor no fluxo de demanda.
- Build Journal e Product Docs podem ser úteis para governança, mas não para MVP operacional.

## Decisão necessária

Definir taxonomia oficial:

- Cliente B2B
- Conta
- Tenant
- Grupo econômico
- Entidade legal
- Empresa HubSpot
- Negócio
- Ticket
- Carteira CS

## Diário de Construção vs documentação canônica

O módulo `/admin/build-journal` existe como conteúdo auxiliar e está parcialmente implementado. Ele deve ser tratado como camada narrativa/editorial, não como fonte técnica oficial. A fonte oficial continua sendo a documentação canônica atual, os contratos de backend e o estado real do repositório.

### Inventário documental relacionado ao Diário

Pelo código atual, o Diário referencia documentos por duas frentes:

- conteúdo estático de jornada em `apps/web/src/features/build-journal/buildJournalContent.ts`;
- leitura governada via `vw_internal_documents_catalog` e `vw_internal_document_detail`, filtrada pela superfície `build-journal`.

Referências editoriais identificadas no conteúdo do Diário:

| Grupo | Documento/referência | Estado observado |
| --- | --- | --- |
| Visão e produto | `product`, `product-vision`, `roadmap-buildout-v3` | Atual/whitelisted |
| Arquitetura operacional | `architecture-rules` | Atual/whitelisted |
| Arquitetura operacional | Leituras e ações governadas | Sem slug/whitelist explícita |
| Segurança e permissões | `auth-context-strategy`, `project-state` | Atual/whitelisted |
| Suporte e operação | `support-workflow` | Atual/whitelisted |
| Knowledge e conteúdo | Knowledge Base Strategy | Sem slug/whitelist explícita |
| Knowledge e conteúdo | `documentation-ledger` | Atual/whitelisted |
| Portal do cliente | `roadmap-buildout-v3` | Atual/whitelisted, duplicado intencional |
| Portal do cliente | Customer Portal Specs | Sem slug/whitelist explícita |
| Engenharia | `engineering-workflow` | Atual/whitelisted |
| Design e experiência | `design`, `build-journal-screen-spec` | Atual/whitelisted, mas `build-journal-screen-spec` acumula histórico |
| Governança documental | `project-state`, `documentation-ledger`, `build-journal-strategy` | Atual/whitelisted, com duplicidade intencional |

### Conteúdo desatualizado ou com risco de leitura incorreta

- `docs/BUILD_JOURNAL_STRATEGY.md` e `docs/BUILD_JOURNAL_SCREEN_SPEC.md` acumulam decisões de fases anteriores. São úteis para rastreabilidade, mas precisam de classificação interna por trecho/fase antes de orientar novas implementações.
- `docs/GPT/*` contém histórico útil, mas não deve prevalecer sobre `docs/PROJECT_STATE.md`, `docs/ROADMAP_BUILDOUT_V3.md`, contratos reais ou este Context Pack.
- Seções antigas em documentos de estado que mencionam Product Docs/Build Journal como conteúdo apenas estático foram superadas pelos trechos mais recentes que registram consumo via `internal_documents` e views governadas.

### Conteúdo duplicado

- `roadmap-buildout-v3`, `project-state` e `documentation-ledger` aparecem em mais de uma categoria do Diário. Essa duplicidade é aceitável como curadoria editorial, desde que o documento original permaneça único.
- Product Docs e Build Journal usam o mesmo contrato de leitura documental, mas com papéis diferentes: Product Docs é leitor oficial; Build Journal é experiência guiada.

### Conteúdo hardcoded

O módulo ainda possui conteúdo editorial hardcoded em frontend:

- `buildJournalTabs`: nomes das abas.
- `buildJournalTimelinePhases`: fases, datas, descrições, status, documentos e ícones.
- `buildJournalRecentDeliveries`: entregas recentes.
- `buildJournalDocumentCategories`: categorias, resumos, papéis e referências documentais.
- `buildJournalPlaceholderPanels`: próximos passos.
- `buildJournalDefaultQuote`: citação de fechamento.
- textos estruturais em `BuildJournalPage.tsx`, `BuildJournalArchitecture.tsx`, `BuildJournalAI.tsx` e `BuildJournalDocuments.tsx`.

Esse hardcode é aceitável apenas como V1 editorial. A reconstrução futura deve mover entradas narrativas para contrato governado, mantendo links para Markdown original e status explícito por entrada.

### Conteúdo substituído ou potencialmente substituído

| Conteúdo | Situação |
| --- | --- |
| Trechos antigos que descrevem Product Docs/Build Journal como exclusivamente estáticos | Substituídos por trechos mais recentes que registram consumo via `internal_documents` e views governadas |
| Blueprint dark do Diário | Histórico de decisão visual; não é aprovação visual atual |
| Placeholders de `Documentos oficiais` e `Próximos passos` | Parcialmente substituídos pela leitura inline governada, mas ainda exigem classificação por status |
| Documentos em `docs/GPT/` | Histórico; não devem orientar implementação contra documentos canônicos recentes |
| Relatórios antigos de auditoria visual | Evidência histórica; devem ser comparados com a matriz visual V2 antes de uso |

### Documentos sem origem clara

- Leituras e ações governadas.
- Knowledge Base Strategy.
- Customer Portal Specs.

Essas referências precisam virar slugs reais, serem removidas da narrativa ou aparecerem explicitamente como pendentes/históricas.

### Páginas que podem apresentar informação substituída

- `/admin/build-journal`: pode apresentar marcos históricos como narrativa atual se não houver status por entrada.
- `/admin/product-docs`: depende do catálogo governado; se documentos antigos forem sincronizados sem classificação, podem parecer atuais.

### Conflitos entre Diário e documentação canônica

- O Diário comunica a jornada do produto e pode simplificar decisões. Ele não deve ser usado para decidir contrato técnico, RLS, integrações, taxonomia B2B/CS ou escopo de release.
- Próxima reconstrução deve exibir status visual por documento/entrada: atual, histórico ou substituído.

### Evidência resumida

- Referências editoriais relacionadas ao Diário: 18.
- Slugs únicos whitelisted/canônicos referenciados: 12.
- Referências atuais: 12 slugs únicos.
- Referências desatualizadas ou com histórico acumulado: 2 documentos de estratégia/spec do próprio Diário exigem leitura por fase.
- Referências duplicadas intencionais: 3 slugs usados em mais de um grupo.
- Referências sem classificação/slug explícito: 3.
- Grupos de conteúdo hardcoded identificados no frontend: 6 datasets principais mais textos estruturais nos componentes.
- Conteúdos substituídos/potencialmente substituídos: 5 classes.
- Recomendação: criar contrato de governança documental para classificar documentos e entradas do Diário antes de redesenhar a interface.

## Duplicidades intencionais vs dívida

### Intencionais por ora

- Central pública e Knowledge admin compartilham corpus, mas têm públicos e permissões diferentes.
- Portal do cliente e Central pública podem exibir conhecimento, mas com contextos de acesso diferentes.
- Dashboard e configurações de integrações aparecem em admin porque o dashboard ainda depende de operação manual/local de sync.

### Dívida ou ambiguidade

- `Clientes B2B`, `Contas B2B`, `tenants` e `hubspot_companies` ainda podem ser confundidos.
- `Carteira CS` e `Clientes B2B` têm layouts visualmente próximos apesar de finalidades diferentes.
- Dashboard repete algumas métricas em cards e gráficos sem sempre adicionar evolução/diagnóstico.
- Menu expõe módulos parcialmente maduros ao mesmo tempo, reforçando sensação de produto fragmentado.
