# REPOSITORY_STRUCTURE.md

## Objetivo

Definir a estrutura canônica do repositório para manter separação entre produto,
documentação, blueprint de backend e material legado.

## Estrutura atual esperada

```text
C:\Projetos\Genius-Support-OS
|   package.json
|   README.md
|   .gitignore
|
+---.skills
|   \---genius-cockpit-ui-blueprint
|
+---.github
|   \---ISSUE_TEMPLATE
|
+---apps
|   \---web
|
+---docs
|   +---design
|   +---GPT   (auxiliar transitório, não canônico)
|   +---knowledge
|   +---reports
|   \---superpowers
|
+---packages
|   +---contracts
|   \---tooling
|
+---raw_knowledge
|
+---scripts
|
+---supabase
|   \---blueprints
|
\---tests
    +---contracts
    +---database
    \---e2e
```

## Regra adicional para a raiz

A raiz do repositório é reservada para entradas canônicas e diretórios estruturais.

Permitido na raiz:

- arquivos de entrada do repositório como `README.md`, `package.json`, `.gitignore`, `.env.example`, `PRODUCT.md` e `DESIGN.md`;
- diretórios canônicos como `apps/`, `docs/`, `packages/`, `scripts/`, `supabase/`, `tests/`, `raw_knowledge/`, `.github/` e `.skills/`;
- diretórios temporários explicitamente ignorados, como `.tmp/`, `.playwright-mcp/` e `/.tmp-*`, quando usados como scratch local.

Não permitido na raiz como estado normal:

- screenshots soltos de QA, blueprint ou validação;
- dumps `json/md/html` de execução local;
- logs `*.log`, `*.out`, `*.err` fora das regras de ignore;
- artefatos ambíguos sem destino claro.

Detalhamento operacional, naming, retenção e quarentena: `docs/ROOT_ARTIFACT_HYGIENE_POLICY.md`.

## Responsabilidades por pasta

- `.github/`
  - templates e automações leves de colaboração;
  - nunca deve carregar regra de produto.
- `.skills/`
  - skills locais versionadas para orientar execuções recorrentes do Codex dentro do repositório;
  - pode conter `SKILL.md` e referências auxiliares, mas não deve carregar código de produto ou contrato runtime.
- `apps/web/`
  - futura aplicação React;
  - permanece bloqueada até backend, auth, RLS e contratos estáveis.
- `docs/`
  - fonte oficial de documentação viva;
  - `docs/reports/` centraliza relatórios versionados de auditoria e operação;
  - `docs/design/` concentra blueprints e especificações visuais aprovadas;
  - `docs/GPT/` é área auxiliar transitória e não canônica, sujeita a consolidação/arquivamento;
  - `PROJECT_STATE.md` representa o estado real.
- `scripts/`
  - automações utilitárias e wrappers operacionais versionados;
  - não deve virar depósito de saídas temporárias.
- `packages/contracts/`
  - DTOs, schemas e contratos compartilhados;
  - sem regra de negócio executável.
- `packages/tooling/`
  - tooling, convenções e configs compartilhadas.
- `raw_knowledge/`
  - material bruto legado;
  - não pode ser tratado como base de produto pronta.
- `supabase/blueprints/`
  - desenho pré-migration;
  - serve para consolidação antes da geração de migrations oficiais.
- `supabase/migrations/`
  - só deve nascer após `supabase init`;
  - passa a ser a fonte oficial versionada do banco.
- `tests/database/`
  - RLS, auth context, triggers, audit logs e invariantes.
- `tests/contracts/`
  - compatibilidade de payloads e read models.
- `tests/e2e/`
  - fluxos ponta a ponta, somente após contratos estáveis.

## Regras estruturais

- Não criar UI antes de migrations oficiais, auth e RLS mínimas.
- Não espalhar regra crítica entre frontend e scripts soltos.
- Não usar `raw_knowledge/` como verdade canônica sem curadoria.
- Não tratar `supabase/blueprints/` como substituto de migrations oficiais.
- Não manter árvore espelho de documentação canônica em área paralela; material auxiliar deve usar manifesto/sync controlado ou bucket próprio.
- Não misturar skill local com feature runtime, contrato backend ou documentação operacional da aplicação.
