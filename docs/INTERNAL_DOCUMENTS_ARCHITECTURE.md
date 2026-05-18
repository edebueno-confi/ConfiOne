# Internal Documents Architecture V1

## Objetivo
Definir a arquitetura correta para documentos internos oficiais do Genius Support OS.

Esta arquitetura deve permitir que markdowns reais do repositório sejam sincronizados de forma controlada para o banco, sanitizados, versionados e expostos ao frontend por contratos reais.

Objetivos principais:

- expor documentos oficiais internos com governança, versionamento e segurança;
- substituir gradualmente corpos documentais hardcoded no frontend;
- preservar `/admin/product-docs` como leitor oficial controlado;
- preservar `/admin/build-journal` como camada narrativa de construção;
- impedir leitura arbitrária de arquivos do repositório em runtime;
- manter IA, busca semântica, backend dinâmico e publicação automática fora do escopo desta V1 documental.

## Contexto Atual
O estado atual validado é:

- `/admin/product-docs` lê documentos de `apps/web/src/features/product-docs/productDocsContent.ts`;
- `productDocsContent.ts` contém metadados e cópias manuais/sanitizadas dos corpos dos documentos;
- o runtime não lê os arquivos `.md` reais do repositório;
- não existe tabela, view, RPC, seed ou pipeline específico para documentos internos oficiais;
- não existe script de sincronização de `docs/*.md` para o banco;
- o reader inline do Build Journal melhora a experiência, mas ainda usa a mesma fonte estática do frontend;
- a arquitetura final deve ser: `.md` real whitelisted -> dry-run/sanitização -> banco versionado -> views/RPCs -> Product Docs e Build Journal.

## Fonte De Verdade
A fonte original de entrada deve ser o arquivo markdown real versionado no repositório.

Exemplos:

- `PRODUCT.md`
- `DESIGN.md`
- `docs/PRODUCT_VISION.md`
- `docs/ARCHITECTURE_RULES.md`
- `docs/AUTH_CONTEXT_STRATEGY.md`
- `docs/VIEW_RPC_CONTRACTS.md`
- `docs/PROJECT_STATE.md`
- `docs/DOCUMENTATION_LEDGER.md`

O banco não substitui o repositório como origem autoral. O banco armazena a versão sanitizada, versionada e autorizada para runtime.

Regras:

- frontend nunca lê filesystem;
- frontend nunca recebe path arbitrário;
- backend nunca sincroniza diretório inteiro;
- apenas documentos presentes na whitelist versionada podem entrar no pipeline;
- o conteúdo exibido no runtime deve vir do banco, não de cópia manual hardcoded no frontend;
- versões sanitizadas podem omitir trechos sensíveis com marcador explícito.

## Whitelist Versionada
A whitelist deve ser um artefato versionado no repositório.

Arquivo proposto:

```text
docs/internal-documents.whitelist.json
```

Cada entrada deve conter:

```json
{
  "slug": "architecture-rules",
  "source_path": "docs/ARCHITECTURE_RULES.md",
  "title": "Regras de Arquitetura",
  "category": "Arquitetura e segurança",
  "status": "published",
  "sensitivity": "restricted",
  "owner": "Produto/Engenharia",
  "surfaces": ["product-docs", "build-journal"],
  "allow_inline_reader": true,
  "description": "Define limites estruturais, backend como fonte da verdade e contratos de leitura/escrita."
}
```

Campos obrigatórios:

- `slug`: identificador estável usado por rotas, views e deep links;
- `source_path`: caminho relativo do arquivo `.md` real;
- `title`: título legível da UI;
- `category`: categoria editorial;
- `status`: estado de publicação do documento;
- `sensitivity`: classificação de exposição;
- `owner`: área responsável pela curadoria;
- `surfaces`: superfícies autorizadas a exibir o documento;
- `allow_inline_reader`: se pode abrir dentro de contexto narrativo, como Build Journal;
- `description`: resumo seguro para catálogo.

Estados sugeridos:

- `draft`: conhecido, mas não publicado;
- `published`: disponível no runtime;
- `archived`: histórico, não deve ser entrada principal;
- `blocked`: bloqueado por risco de segurança, sensibilidade ou pendência editorial.

Sensibilidades sugeridas:

- `internal`: uso interno padrão;
- `restricted`: conteúdo interno com trechos omitidos ou acesso mais restrito;
- `public_internal`: conteúdo interno de baixa sensibilidade, mas ainda não público;
- `blocked`: não deve ser exposto.

## Pipeline
O pipeline deve ser explícito, idempotente e auditável.

### 1. Dry-run
O dry-run deve:

- carregar `docs/internal-documents.whitelist.json`;
- validar que cada `source_path` existe;
- validar que cada arquivo possui extensão `.md`;
- bloquear paths absolutos, `..`, symlinks ou caminhos fora do repositório permitido;
- calcular hash do conteúdo original;
- mostrar quais documentos seriam criados, atualizados, arquivados ou ignorados;
- não gravar no banco;
- gerar relatório de riscos e pendências.

### 2. Validação
A validação deve falhar quando encontrar:

- documento fora da whitelist;
- path inexistente;
- arquivo não markdown;
- slug duplicado;
- source path duplicado;
- categoria ou sensibilidade desconhecida;
- conteúdo acima do limite definido;
- padrão sensível bloqueado.

### 3. Sanitização
A sanitização deve produzir `body_md_sanitized`.

Ela deve:

- preservar markdown seguro;
- remover ou substituir trechos sensíveis;
- inserir marcador explícito quando houver omissão;
- impedir HTML perigoso, scripts ou blocos inseguros;
- registrar o motivo da omissão em relatório de sync, não necessariamente no runtime.

Marcador recomendado:

```text
[conteúdo interno restrito omitido]
```

### 4. Hash
O pipeline deve calcular pelo menos:

- `source_hash`: hash do conteúdo original;
- opcionalmente `sanitized_hash`: hash do conteúdo sanitizado.

O sync deve criar nova versão apenas quando o hash relevante mudar ou quando metadados de publicação forem alterados.

### 5. Sync Idempotente
O sync deve:

- ser executado por script controlado, não pelo frontend;
- aceitar modo `--dry-run`;
- aceitar modo `--apply` apenas em ambiente autorizado;
- gravar somente documentos whitelisted;
- criar nova versão quando houver mudança;
- manter histórico de versões;
- nunca apagar fisicamente versão antiga por padrão.

### 6. Publicação E Arquivamento
A publicação deve ser explícita.

Regras:

- documento `draft` não aparece no catálogo público interno;
- documento `blocked` nunca aparece no runtime;
- documento `archived` pode aparecer somente se a UI tiver filtro/estado histórico;
- versão antiga permanece auditável;
- arquivamento deve ser lógico.

## Modelo De Banco Proposto
Esta V1 não cria migration. O modelo abaixo é conceitual para orientar fase futura.

### `internal_documents`
Representa a identidade lógica do documento.

Campos esperados:

- `id`
- `slug`
- `source_path`
- `title`
- `category`
- `status`
- `sensitivity`
- `owner`
- `surfaces`
- `allow_inline_reader`
- `description`
- `current_version_id`
- `created_at`
- `updated_at`

Restrições esperadas:

- `slug` único;
- `source_path` único;
- `status` enumerado;
- `sensitivity` enumerada;
- `source_path` nunca aceito por input do frontend;
- `current_version_id` deve apontar para versão existente e publicada quando aplicável.

### `internal_document_versions`
Representa cada versão sincronizada/sanitizada.

Campos esperados:

- `id`
- `document_id`
- `slug`
- `source_path`
- `source_hash`
- `sanitized_hash`
- `body_md_sanitized`
- `version`
- `status`
- `sensitivity`
- `sanitization_report`
- `published_at`
- `created_at`
- `updated_at`
- `synced_by`

Regras:

- versões são append-only por padrão;
- `body_md_sanitized` é o corpo autorizado para runtime;
- `source_hash` permite detectar drift entre repo e banco;
- `synced_by` identifica executor técnico ou service identity;
- `sanitization_report` não deve expor segredo; deve registrar apenas achados classificados.

## Contratos Futuros
As telas não devem consultar tabelas base diretamente.

### `vw_internal_documents_catalog`
Read model para listas e navegação.

Campos esperados:

- `slug`
- `title`
- `category`
- `status`
- `sensitivity`
- `owner`
- `surfaces`
- `allow_inline_reader`
- `description`
- `source_path`
- `version`
- `published_at`
- `updated_at`

Regras:

- retorna apenas documentos publicados e autorizados;
- filtra por superfície quando necessário;
- não expõe `body_md_sanitized`;
- não expõe relatório de sanitização completo.

### `vw_internal_document_detail`
Read model para leitura.

Campos esperados:

- `slug`
- `title`
- `category`
- `status`
- `sensitivity`
- `description`
- `source_path`
- `body_md_sanitized`
- `version`
- `source_hash`
- `published_at`
- `updated_at`

Regras:

- retorna apenas documentos publicados;
- respeita autorização administrativa;
- não aceita path arbitrário;
- usa `slug` como chave pública interna.

### RPC De Sync/Publicação Controlada
Uma RPC só deve existir se houver necessidade real de registrar publicação pelo banco.

Possíveis responsabilidades:

- registrar nova versão já sanitizada enviada pelo script;
- promover versão para atual;
- arquivar documento;
- bloquear documento.

Regras:

- não receber path arbitrário do frontend;
- não receber markdown de usuário final;
- não ser chamada pela UI comum;
- exigir service role ou papel administrativo específico;
- registrar auditoria;
- ter testes de grant e bloqueio.

## Segurança
O pipeline deve bloquear ou exigir omissão explícita para:

- secrets;
- tokens;
- chaves;
- senhas;
- e-mails reais;
- nomes reais de clientes quando não autorizados;
- payloads crus;
- URLs assinadas;
- paths sensíveis;
- logs crus;
- headers;
- cookies;
- JWTs;
- refresh tokens;
- storage paths internos;
- stack traces completos;
- `before_state` ou `after_state` brutos;
- instruções de bypass de RLS, grants, policies ou autenticação;
- prompts crus com contexto sensível.

O frontend deve renderizar apenas `body_md_sanitized`.

Nenhuma superfície deve exibir:

- markdown original bruto;
- relatório completo de sanitização;
- caminho interno sensível além de `source_path` whitelisted;
- detalhes que permitam reconstruir segredo, token, URL assinada ou payload operacional.

## Frontend Futuro
`/admin/product-docs` continua sendo o leitor oficial controlado.

Responsabilidades futuras:

- buscar catálogo em `vw_internal_documents_catalog`;
- abrir detalhe por `slug` em contrato real;
- manter busca local ou backend apenas se houver contrato específico;
- preservar deep link `?doc=<slug>`;
- mostrar status, sensibilidade, origem e versão;
- não conter corpos documentais hardcoded.

`/admin/build-journal`, aba `Documentos oficiais`, continua sendo camada narrativa.

Responsabilidades futuras:

- organizar documentos por papel na construção;
- explicar por que cada categoria existe;
- usar metadados narrativos próprios quando necessário;
- abrir reader embutido com o mesmo detalhe vindo do contrato real;
- oferecer CTA para `/admin/product-docs?doc=<slug>`;
- não duplicar `body_md_sanitized`;
- marcar documentos fora da whitelist como pendentes.

`productDocsContent.ts` deve deixar de conter corpo documental no futuro.

Caminhos possíveis:

- virar apenas fallback temporário de desenvolvimento;
- virar mapeamento mínimo de UI enquanto o contrato não estiver pronto;
- ser removido quando o frontend consumir contrato real com segurança.

## Fases Futuras
### V1 - Spec Documental
Entregável desta fase.

- criar `docs/INTERNAL_DOCUMENTS_ARCHITECTURE.md`;
- registrar arquitetura, riscos, fases e critérios;
- atualizar `PROJECT_STATE.md`;
- atualizar `DOCUMENTATION_LEDGER.md`;
- não criar backend, migration, Supabase, frontend ou script.

### V2 - Whitelist + Dry-run
Entregáveis:

- criar `docs/internal-documents.whitelist.json`;
- criar script dry-run;
- validar paths, slugs, status, sensitivity e duplicidade;
- gerar relatório sem gravar no banco;
- definir fixtures de documentos seguros para validação local.

Status em 2026-05-18:

- whitelist inicial criada com os 12 documentos já aceitos na V1 de Product Docs;
- script criado em `scripts/documentation/validate-internal-documents.mjs`;
- comando npm criado: `npm run documentation:validate:internal-docs`;
- dry-run valida existência, extensão `.md`, slug único, `source_path` único, path relativo seguro, symlink, hash SHA-256, tamanho e padrões sensíveis básicos;
- dry-run não sanitiza, não altera markdowns, não grava arquivo de saída e não escreve no banco;
- primeiro resultado: 12 documentos lidos, 5 válidos, 7 com alerta informativo e 0 bloqueados.

### V3 - Migration + RLS
Entregáveis:

- criar tabelas `internal_documents` e `internal_document_versions`;
- criar enums ou checks para status/sensitivity;
- criar RLS e grants;
- criar testes pgTAP;
- não conectar frontend ainda.

### V4 - Sync Script
Entregáveis:

- implementar sync idempotente;
- calcular hashes;
- gravar versões sanitizadas;
- suportar dry-run/apply;
- registrar relatório de publicação;
- validar bloqueios de segurança.

### V5 - Frontend Consumindo Contrato Real
Entregáveis:

- Product Docs consome catálogo/detalhe por contrato;
- Build Journal usa o mesmo detalhe real no reader embutido;
- deep links por slug continuam funcionando;
- estado pendente permanece honesto;
- sem duplicação de corpo documental.

### V6 - Remoção/Fallback Do Hardcoded Frontend
Entregáveis:

- remover corpos documentais de `productDocsContent.ts`;
- manter fallback apenas se aprovado e explicitamente marcado;
- atualizar docs de operação;
- validar que nenhum documento fora do contrato aparece.

## Critérios De Aceite
A arquitetura só deve ser considerada pronta quando:

- nenhum documento fora da whitelist aparece no runtime;
- banco armazena versão sanitizada e versionada;
- Product Docs e Build Journal usam a mesma fonte real;
- não existe leitor concorrente;
- frontend não lê filesystem;
- UI não aceita path arbitrário;
- RLS, grants e testes cobrem acesso administrativo;
- sync é idempotente e tem dry-run;
- documentos restritos têm omissão explícita;
- alterações relevantes são registradas em `PROJECT_STATE.md` e `DOCUMENTATION_LEDGER.md`.

## Fora De Escopo Desta Fase
Esta fase não implementa:

- migration;
- tabela;
- view;
- RPC;
- RLS;
- seed;
- script;
- alteração frontend;
- alteração Supabase;
- sync real;
- remoção do hardcoded atual;
- commit do reader inline como solução final.
