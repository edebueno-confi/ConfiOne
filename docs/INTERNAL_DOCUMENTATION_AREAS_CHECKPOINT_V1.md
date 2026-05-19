# INTERNAL_DOCUMENTATION_AREAS_CHECKPOINT_V1.md

## Objetivo
Consolidar o checkpoint documental final das duas áreas internas de documentação já implementadas no Admin Console:

- `/admin/build-journal`
- `/admin/product-docs`

O objetivo deste checkpoint é registrar a fronteira entre as duas superfícies, o modelo atual de acesso, a política de exposição de conteúdo e os critérios de evolução futura, sem criar produto novo, backend novo ou contrato novo.

Atualização de 2026-05-16: a fase `Build Journal Experience Upgrade V1` manteve essa fronteira e melhorou a experiência das duas áreas sem mudar o modelo estrutural. `/admin/build-journal` passou a operar como leitura guiada com índice sticky, seções âncora e melhor clareza editorial. `/admin/product-docs` ganhou `Por onde começar`, trilhas de leitura e copy mais explícita sobre whitelist e fonte oficial controlada. Nenhum backend novo, migration, RPC, tabela, parser dinâmico, busca backend ou permissão granular nova foi criado.

Adendo de direção registrado: a próxima rodada deve aproximar `build-journal` e `product-docs` dos markdowns-fonte reais usados na construção do produto, mas sempre sob whitelist explícita e curadoria. O objetivo não é abrir o repositório, e sim expor uma leitura aprofundada, controlada e organizada dos documentos aprovados que sustentam arquitetura, decisões, andamento e conclusão dos blocos do sistema.

Atualização de 2026-05-17: `/admin/build-journal` recebeu a aba interna `Arquitetura`, implementada como tela estática versionada e sanitizada dentro do módulo Diário de Construção. A tela apresenta a arquitetura por camadas, princípios, boundaries entre domínios, fluxo de dados, segurança e tecnologias principais, sem criar backend, migration, RPC, view, RLS, Supabase contract, parser dinâmico ou permissão nova.

Atualização de 2026-05-17: `/admin/build-journal` recebeu também a aba interna `IA na Construção`, implementada como tela estática versionada e sanitizada. A tela documenta como IA apoia raciocínio, execução e documentação, deixando explícito que IA é assistente, não source of truth, e que qualquer uso futuro no produto depende de governança, curadoria, citação e auditoria.

Atualização de 2026-05-17: o lote `Build Journal Structural Cleanup V1` removeu dívida estrutural do frontend do Diário de Construção. A navegação interna foi padronizada em `BuildJournalSectionTabs`, o rodapé/citação em `BuildJournalQuoteFooter`, as abas `Arquitetura` e `IA na Construção` deixaram de ter placeholders mortos no painel simples, e `buildJournalContent.ts` voltou a ser a fonte central enxuta para tabs, timeline, entregas recentes, placeholders e copy compartilhada. `Documentos oficiais` e `Próximos passos` continuam placeholders estáticos até existirem telas próprias aprovadas. Nenhum backend, migration, RPC, view, RLS, tabela, Supabase contract ou permissão nova foi criado.

Atualização de 2026-05-18: `/admin/product-docs` e a aba `Documentos oficiais` de `/admin/build-journal` passaram a consumir a fonte real governada de documentos internos oficiais, via `vw_internal_documents_catalog` e `vw_internal_document_detail`. O corpo exibido vem de `body_md_sanitized` versionado no banco; `productDocsContent.ts` deixou de conter corpos markdown hardcoded e permanece apenas como metadados/trilhas de leitura. O Diário mantém camada narrativa e CTA para Product Docs, sem leitura runtime de filesystem, sem segunda whitelist, sem parser concorrente e sem backend novo neste lote.
## Diferença entre as duas áreas

### Diário de Construção
`/admin/build-journal` existe para explicar o processo de criação do Genius Support OS:

- visão do produto;
- narrativa de construção por fases;
- decisões arquiteturais;
- workflow Humano + ChatGPT + Codex;
- limites atuais;
- próximos passos.

É uma superfície narrativa e explicativa. Seu foco é processo, método, contexto e decisão.

### Documentos do Produto
`/admin/product-docs` existe para expor uma fonte oficial controlada de leitura:

- visão;
- arquitetura;
- segurança;
- operação;
- design;
- governança;
- documentos ligados ao próprio Diário de Construção.

É uma superfície de consulta documental controlada. Seu foco é fonte oficial, whitelist, leitura interna e referência versionada.

## Rotas implementadas
- `/admin/build-journal`
- `/admin/product-docs`

Ambas ficam dentro do bloco `/admin` e usam o gate administrativo existente do Admin Console.

Dentro de `/admin/build-journal`, a navegação por abas é local à tela. `Visão geral`, `Linha do tempo`, `Arquitetura`, `IA na Construção` e `Documentos oficiais` são superfícies estáticas implementadas do Diário de Construção. `Próximos passos` permanece placeholder frontend honesto, sem ação fake e sem contrato backend próprio, até haver evolução aprovada.

A aba `Documentos oficiais` pode abrir documentos whitelisted inline para preservar continuidade de leitura. Essa leitura inline reutiliza o mesmo reader e a mesma fonte real de `/admin/product-docs`, não amplia a whitelist e mantém CTA secundário para o leitor oficial.

## Modelo de acesso atual
- acesso protegido pelo `AdminGate` existente;
- sem auth paralela;
- sem permissão fake decidida apenas no frontend;
- sem abertura para portal cliente ou superfícies públicas.

## Limitação atual de permissão granular
As duas áreas usam o gate administrativo consolidado do Admin Console. Ainda não existe permissão granular dedicada para:

- `build-journal`
- `product-docs`

Enquanto não existir contrato backend próprio para granularidade documental, a autorização permanece limitada ao boundary administrativo atual.

## Política de exposição documental
As áreas internas documentais devem expor apenas conteúdo:

- versionado no repositório;
- coerente com a documentação oficial;
- compatível com leitura interna ampla;
- útil para entendimento de produto, arquitetura, operação, segurança e governança.

Não devem virar:

- explorador genérico de arquivos;
- dump de markdown sem curadoria;
- auditoria crua;
- índice de secrets;
- vitrine com promessa de feature inexistente.

## Política de sanitização
O conteúdo exposto deve permanecer sanitizado. A UI documental não pode mostrar:

- secrets;
- tokens;
- credenciais;
- e-mails reais;
- nomes reais de clientes;
- tickets reais;
- payloads crus;
- logs crus;
- stack traces completos;
- headers;
- cookies;
- JWTs;
- refresh tokens;
- URLs assinadas;
- paths internos sensíveis de storage;
- metadata bruta de auditoria;
- `before_state` ou `after_state` bruto;
- instruções de bypass de RLS, policy, grants ou permissões.

Quando houver omissão editorial necessária, usar:

```text
[conteúdo interno restrito omitido]
```

## Documentos expostos em `/admin/product-docs`
A whitelist atual é explícita e limitada a:

- `PRODUCT.md`
- `DESIGN.md`
- `docs/PRODUCT_VISION.md`
- `docs/ARCHITECTURE_RULES.md`
- `docs/AUTH_CONTEXT_STRATEGY.md`
- `docs/ROADMAP_BUILDOUT_V3.md`
- `docs/PROJECT_STATE.md`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/SUPPORT_WORKFLOW.md`
- `docs/ENGINEERING_WORKFLOW.md`
- `docs/BUILD_JOURNAL_STRATEGY.md`
- `docs/BUILD_JOURNAL_SCREEN_SPEC.md`

Nenhum documento fora dessa whitelist deve aparecer na V1.

## Riscos restantes
- ausência de permissão granular específica para cada área documental;
- necessidade de curadoria contínua para evitar expansão indevida da whitelist;
- risco de expor detalhe operacional desnecessário se novos documentos entrarem sem revisão editorial;
- necessidade de processo formal de sanitização antes de adicionar prints ao Diário de Construção;
- qualquer evolução para conteúdo dinâmico, comentários, anexos, histórico ou busca backend depende de contrato futuro.

## Critérios para incluir novos documentos no futuro
Um novo documento só deve entrar em `/admin/product-docs` quando:

- tiver valor documental claro para visão, arquitetura, segurança, operação, design ou governança;
- estiver versionado e estável o suficiente para leitura interna;
- passar revisão de sensibilidade;
- não expuser dados reais nem detalhe operacional desnecessário;
- for incluído explicitamente na whitelist;
- tiver registro correspondente em `PROJECT_STATE.md` e `DOCUMENTATION_LEDGER.md` quando a mudança alterar a superfície interna.

## Critérios para adicionar prints futuros no Diário de Construção
Um print só deve aparecer em `/admin/build-journal` quando:

- representar tela real já existente ou blueprint explicitamente identificado como blueprint;
- estiver sanitizado;
- não mostrar dados reais;
- não expuser e-mails reais, tickets reais, nomes reais, payloads, logs, URLs assinadas, paths internos ou segredos;
- tiver função explicativa real, e não decorativa;
- estiver alinhado com a narrativa documental da tela.

## Próximos passos recomendados
- definir, em contrato futuro, se as áreas documentais precisarão de permissão granular própria;
- formalizar checklist editorial para entrada de novos documentos na whitelist;
- formalizar checklist de sanitização para prints futuros do Diário de Construção;
- manter `PROJECT_STATE.md` e `DOCUMENTATION_LEDGER.md` como checkpoints obrigatórios sempre que a superfície documental interna mudar;
- evitar qualquer evolução dinâmica sem contrato backend explícito e teste de autorização correspondente.
