# PUBLIC_HELP_CENTER_PUBLISH_RUNBOOK.md

## Objetivo
Definir o procedimento operacional seguro para curar, revisar e publicar artigos na Central Publica do Genius Support OS, incluindo migracao controlada de corpus legado publico aprovado, sem abrir risco de exposicao indevida.

## Escopo
- curadoria editorial de artigos da Knowledge Base
- validacao local controlada do fluxo `draft -> review -> published`
- exposicao publica tecnica B2B em `/help/:spaceSlug`
- rollback operacional por `archive`, nunca por mutacao silenciosa

## Regras duras
- nao publicar em massa quando a origem nao tiver decisao de produto explicita como base publica legada aprovada
- nao promover artigo por heuristica sem bloqueios tecnicos automaticos, rastreabilidade e gate editorial
- nao publicar `restricted`, `internal`, `obsolete` ou `duplicate`
- nao publicar HTML legado como corpo principal
- nao usar IA para decidir `visibility`, `status` ou readiness
- nao executar publish remoto sem evidencia local e sem checklist concluido
- nao assumir que `published` basta; o `knowledge_space` precisa estar `active`
- bloquear automaticamente qualquer artigo com credencial, token, senha, chave, `service_role`, header de autorizacao, JWT, URL assinada, payload sensivel, dado pessoal sensivel, instrucao interna, endpoint privado, conteudo quebrado/vazio ou duplicidade exata sem canonical
- nao republicar artigo Octadesk reprocessado enquanto os assets referenciados por `knowledge-asset:<id>` estiverem `pending` ou `blocked`

## Pre-requisitos para publicar
- `knowledge_space` alvo definido com clareza
- artigo em `draft` ou `review`, nunca sem trilha editorial
- advisory persistente sincronizado para o lote legado
- `platform_admin` ou perfil administrativo autorizado para operar as RPCs
- `title`, `summary` e `body_md` revisados manualmente ou normalizados por esteira aprovada para migracao de Central de Ajuda publica legada
- categoria final coerente com `visibility = public`
- ausencia de segredo, credencial, token, payload sensivel, endpoint interno, PIX, estorno, Correios sensivel ou permissao critica
- se o artigo tiver imagens, todos os assets usados no markdown devem estar `approved`, `public`, nao bloqueados e com alt/caption revisados quando aplicavel
- evidencias locais de que a Central Publica so expora o que for `published + public`

## Preparacao do ambiente local
1. Subir o stack local do Supabase.
2. Garantir readiness do ambiente.
3. Resetar o banco local para baseline conhecido.
4. Reidratar a fixture administrativa local.

Comandos oficiais:
```bash
npm run supabase:start
npm run supabase:wait:ready
npm run supabase:db:reset
npm run supabase:qa:local-admin-fixture
```

## Como importar drafts legado
1. Gerar ou atualizar o backlog oficial.
2. Executar `dry-run` do import.
3. Executar `apply` local controlado no `knowledge_space` correto.
4. Confirmar que todos os artigos entraram como `draft`.

Comandos oficiais:
```bash
npm run knowledge:curation:backlog
npm run knowledge:import:octadesk:local -- --space-slug genius
npm run knowledge:import:octadesk:local -- --apply --space-slug genius --actor-user-id <uuid>
```

Regras do import:
- exigir sempre `--space-slug` ou `--knowledge-space-id`
- status inicial sempre `draft`
- `visibility` inicial sempre conservadora
- preservar `source_path` e `source_hash`
- nunca publicar durante o import

## Como reprocessar artigos Octadesk com imagens
1. Executar dry-run usando o HTML local preservado.
2. Conferir markdown estruturado, imagens detectadas e warnings.
3. Aplicar somente no artigo alvo ou allowlist aprovada.
4. Manter o artigo como `review/internal` enquanto os assets ficam `pending`.
5. Revisar assets no Admin Knowledge antes de republicar.

Comandos:
```bash
node scripts/knowledge/reprocess-octadesk-article-assets.mjs --local --space-slug genius --title "Configuração de Sellers Permitidos"
node scripts/knowledge/reprocess-octadesk-article-assets.mjs --local --space-slug genius --title "Configuração de Sellers Permitidos" --apply
```

Regras dos assets:
- usar `content.local.html` como fonte estrutural e `content.txt` apenas como fallback
- copiar imagens para `knowledge-assets`; nunca depender da Octadesk em runtime
- renderizar no público apenas placeholders `knowledge-asset:<id>`
- manter assets como `pending` ate revisao administrativa

## Como operar por ondas com allowlist
1. Gerar o plano completo do corpus em `docs/reports/OCTADESK_FULL_PUBLIC_HELP_EXECUTION_PLAN.md`.
2. Usar `docs/reports/OCTADESK_IMPORT_ALL_DRAFTS_ALLOWLIST.json` para import local controlado.
3. Usar `docs/reports/OCTADESK_REVIEW_REQUIRED_ALLOWLIST.json` para orientar revisao humana.
4. Manter `docs/reports/OCTADESK_BLOCKED_ALLOWLIST.json` fora de publicacao publica.
5. Manter `docs/reports/OCTADESK_PUBLICATION_WAVE_1_ALLOWLIST.json` como historico da triagem conservadora; para migracao publica legada aprovada, usar o script de publicacao com bloqueios criticos automaticos.

Comandos oficiais da onda atual:
```bash
npm run knowledge:import:octadesk:local -- --space-slug genius --allowlist docs/reports/OCTADESK_IMPORT_ALL_DRAFTS_ALLOWLIST.json
npm run knowledge:import:octadesk:local -- --space-slug genius --allowlist docs/reports/OCTADESK_IMPORT_ALL_DRAFTS_ALLOWLIST.json --apply --actor-user-id <uuid>
npm run knowledge:review:advisories:local -- --space-slug genius --allowlist docs/reports/OCTADESK_IMPORT_ALL_DRAFTS_ALLOWLIST.json
npm run knowledge:review:advisories:local -- --space-slug genius --allowlist docs/reports/OCTADESK_IMPORT_ALL_DRAFTS_ALLOWLIST.json --apply --actor-user-id <uuid>
```

Resultado esperado antes de qualquer publicacao sem decisao de migracao publica:
- artigos Octadesk importados apenas como `draft` ou `review`;
- visibilidade nunca `public` por automacao;
- advisories em `pending`;
- views publicas retornando `0` para o corpus Octadesk nao aprovado.

Status da migracao publica em 2026-05-21:
- decisao de produto aplicada: corpus Octadesk tratado como Central de Ajuda publica legada aprovada para migracao, salvo bloqueio tecnico critico automatico.
- `54` artigos Octadesk foram reavaliados no Knowledge runtime.
- `43` artigos foram publicados como `published/public` via gate editorial existente.
- `11` artigos permaneceram `draft/restricted` por bloqueios criticos.
- `/help/genius` passou a expor `49` artigos no total: `43` migrados da Octadesk e `6` seed/manuais.
- a execucao ficou registrada em `docs/reports/OCTADESK_PUBLICATION_EXECUTION_REPORT.md` e `docs/reports/OCTADESK_PUBLIC_HELP_RELEASE_STATUS.md`.

Fila operacional vigente:
- `docs/reports/OCTADESK_PUBLICATION_WAVES.md` define as ondas de curadoria.
- `docs/reports/OCTADESK_WAVE_0_PUBLICATION_CHECKLIST.md` define o checklist humano dos 4 artigos em `review/internal`.
- `docs/reports/GENIUS_HELP_CENTER_READINESS_REPORT.md` consolida readiness, bloqueios e menor acao humana para publicacao.
- novos lotes que nao tenham origem publica legada aprovada continuam exigindo advisory, checklist e revisao humana antes de publicacao.
- para o corpus Octadesk ja migrado, esses documentos permanecem como historico e apoio a curadoria dos bloqueados; a baseline publica atual esta em `docs/reports/OCTADESK_PUBLICATION_EXECUTION_REPORT.md`.

## Distincao obrigatoria: legado ja publicado x novo conteudo

A decisao historica de migrar uma Central de Ajuda publica legada nao equivale a aprovacao atual de cada regra tecnica ou financeira do artigo. Para eliminar a ambiguidade do fluxo:

- **Novo artigo ou rewrite canonico:** temas com PIX, estorno, Correios, sellers, antifraude, permissao critica, integracao sensivel ou regra financeira continuam bloqueados ate revisao humana explicita e registro nominal.
- **Artigo legado ja `published/public`:** nao deve ser retirado automaticamente apenas pela ocorrencia de um termo. Ele precisa entrar em uma matriz nominal de excecao, com decisao de Produto e Suporte/CS (e Engenharia/governanca financeira quando aplicavel). Enquanto a decisao nao existir, o estado e `pendente de decisao`, nao `aprovado para novo publish`.
- **Risco tecnico critico:** credencial, token, segredo, endpoint privado, payload sensivel, permissao critica ou informacao pessoal continua sendo bloqueio automatico mesmo dentro da excecao legada.
- **Asset ausente:** referencia `knowledge-asset:<id>` sem linha/objeto publico correspondente e bloqueador de readiness. Esconder a imagem na UI nao corrige o corpus; e necessario reconciliar o asset ou remover a referencia antes de declarar o artigo pronto.
- **Canal de suporte:** o rodape so pode exibir e-mail, WhatsApp ou URL que exista em `brand_settings` e passe pelo resolver publico. Na ausencia de contato, exibir indisponibilidade honesta e abrir pendencia de configuracao; nunca fabricar canal no frontend.

O registro corrente desta excecao e a auditoria `docs/reports/PUBLIC_HELP_CENTER_GOVERNANCE_AUDIT_2026-08-12.md`, complementada pelo adendo em `docs/plan.md`.

## Como publicar corpus legado publico aprovado
Use este fluxo apenas quando houver decisao de produto explicita de que a origem era uma Central de Ajuda publica existente.

Comando oficial:
```bash
node scripts/knowledge/publish-octadesk-public-help.mjs --local --space-slug genius
node scripts/knowledge/publish-octadesk-public-help.mjs --local --space-slug genius --apply --actor-user-id <uuid>
```

Garantias do fluxo:
- dry-run por padrao;
- bloqueio de artigos com risco tecnico critico automatico;
- normalizacao minima em `body_md`, sem usar HTML legado como fonte publica;
- preservacao de `source_path` e `source_hash`;
- categorias promovidas por RPC administrativa existente quando necessario;
- publish por RPC editorial existente e gate backend;
- artigos bloqueados permanecem fora das views publicas.

## Como sincronizar advisories
1. Rodar primeiro o backlog versionado.
2. Sincronizar os advisories no mesmo `knowledge_space`.
3. Confirmar que nenhum review humano existente foi sobrescrito.

Comandos oficiais:
```bash
npm run knowledge:curation:backlog
npm run knowledge:review:advisories:local -- --space-slug genius
npm run knowledge:review:advisories:local -- --apply --space-slug genius --actor-user-id <uuid>
```

## Como identificar candidatos `public`
Filtros obrigatorios em `/admin/knowledge`:
- `suggested_classification = public`
- excluir artigos com `duplicate_group_key`
- excluir artigos com `risk_flags` sensiveis
- priorizar `draft`
- revisar `visibility` atual antes de qualquer promote

Sinais para rejeicao imediata de novo artigo ou rewrite:
- menciona credenciais, tokens ou chaves
- inclui endpoints, payloads ou detalhes internos de API
- aborda PIX, estorno, Correios, sellers, antifraude ou permissao critica
- depende de conhecimento interno do time para fazer sentido
- conserva linguagem legado/B2C inadequada para documentacao tecnica B2B

Observacao:
- a excecao legada vale apenas para artigos ja publicados e listados na matriz nominal de decisao; ela nao autoriza novo publish, rewrite ou promocao automatica.
- linguagem legada leve pode permanecer somente enquanto a decisao de excecao estiver pendente. Asset ausente nao e aceite como estado de readiness e exige reconciliacao.

## Como revisar `title`, `summary` e `body_md`
### Titulo
- deixar acionavel e objetivo
- usar verbo + objetivo + contexto
- evitar naming legado confuso

### Resumo
- explicar o resultado da leitura
- manter 1 a 2 frases
- nao repetir o titulo

### Corpo em Markdown
- reescrever em Markdown seguro
- abrir com contexto e quando usar
- listar passos reais
- explicitar validacao esperada
- adicionar limites, excecoes ou riscos
- remover referencias a HTML legado, scripts visuais antigos ou instrucoes incompletas

## Como validar `visibility` e `status`
### `visibility`
- `public` apenas para uso seguro da plataforma por cliente B2B ou usuario autorizado
- `internal` para playbook operacional ou conteudo ainda nao pronto
- `restricted` para qualquer item sensivel

### `status`
- `draft` para trabalho editorial em andamento
- `review` para leitura humana concluida e aguardando validacao final
- `published` apenas apos checklist completo e validacao publica
- `archived` para rollback ou retirada controlada

## Como ativar o `knowledge_space`
Pre-condicao:
- nunca ativar space sem readiness editorial minima
- garantir que os artigos publicados daquele space sao deliberados

Checklist de ativacao:
- branding publico minimo coerente
- categoria publica valida
- pelo menos um artigo `published + public` intencional
- confirmacao de que o space nao esta expondo legado indevido

Observacao:
- enquanto o `knowledge_space` estiver `draft`, os read models publicos devem continuar bloqueando a exposicao
- ativacao de `knowledge_space` e ato operacional separado de publish de artigo

## Como validar exposicao publica
Superficies minimas:
- `/help`
- `/help/:spaceSlug`
- `/help/:spaceSlug/articles`
- `/help/:spaceSlug/articles/:articleSlug`

Checklist:
1. rota responde sem `config-error`
2. o artigo publicado aparece na lista
3. a busca encontra o artigo publicado
4. o detalhe do artigo renderiza `body_md` em Markdown seguro
5. drafts e artigos nao publicos nao aparecem

Validacoes tecnicas recomendadas:
```bash
npm run contracts:typecheck
npm run web:typecheck
npm run web:build
npm run supabase:verify
```

## Checklist antes de publicar
- advisory sincronizado e consistente
- `suggested_classification = public`
- sem `risk_flags` bloqueantes
- `title` revisado
- `summary` revisado
- `body_md` revisado
- categoria final correta
- `visibility = public` validada manualmente
- nenhuma exposicao de segredo, endpoint interno ou operacao sensivel
- `review_status` persistido
- artigo promovido para `review`
- `knowledge_space` pronto para exposicao publica

## Checklist pos-publicacao
- artigo aparece em `vw_public_knowledge_articles_list`
- artigo aparece em `vw_public_knowledge_article_detail`
- busca publica retorna o artigo quando aplicavel
- Central Publica nao passou a expor outros artigos inadvertidamente
- registrar a fase ou lote no `DOCUMENTATION_LEDGER.md` quando houver mudanca relevante de baseline documental

## Criterios para rollback ou `archive`
Usar `archive` quando:
- o artigo publicado contem erro funcional relevante
- a visibilidade foi classificada de forma incorreta
- foi detectado dado sensivel apos publish
- a categoria publica ficou inadequada
- o fluxo do produto mudou e tornou o artigo obsoleto

Fluxo recomendado:
1. arquivar o artigo por RPC administrativa
2. registrar motivo em nota editorial interna
3. revisar backlog ou advisory se o erro vier da classificacao original
4. atualizar o ledger se houver impacto de baseline ou FAQ

## O que nunca deve ser publicado
- `restricted`
- `internal`
- `obsolete`
- `duplicate`
- HTML legado bruto
- instrucoes que dependam de credencial real
- detalhes tecnicos internos nao aprovados para a camada publica

## Evidencia minima esperada para publish real
- validacao local concluida
- checklist editorial concluido ou decisao de migracao publica legada registrada
- checklist publico concluido
- rastreabilidade documental atualizada
- decisao humana explicita de publish

## O que este runbook nao faz
- nao automatiza publish em lote sem decisao de produto explicita e bloqueios criticos automaticos
- nao substitui revisao humana
- nao autoriza deploy remoto
- nao transforma QA local em baseline de producao
