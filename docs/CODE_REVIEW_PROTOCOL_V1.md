# CODE_REVIEW_PROTOCOL_V1.md

Protocolo de revisão de código do ConfiOne com dois agentes: um agente **implementador**
(hoje o Codex) e um agente **revisor** (hoje o Claude). O objetivo é que nenhum lote entre
no produto sem passar por um crivo objetivo, reprodutível e auditável por humano.

Este documento é contrato de processo. Ele não substitui `AGENTS.md`,
`docs/ARCHITECTURE_RULES.md`, `docs/CODEX_EXECUTION_RULES.md`,
`docs/VALIDATION_CHECKLIST.md` nem `docs/DOCUMENTATION_UPDATE_POLICY.md`; ele organiza a
sequência em que essas regras são verificadas.

## 1. Papéis

| Papel | Responsabilidade | Pode escrever em |
| --- | --- | --- |
| Implementador (Codex) | Entender o problema, implementar o lote, escrever/atualizar testes, rodar as validações, atualizar a documentação impactada e publicar o pedido de revisão | Todo o repositório, dentro do escopo autorizado |
| Revisor (Claude) | Auditar o lote contra contratos, segurança, cobertura e documentação; emitir veredito; propor correção mínima | `.review/`, `docs/` e correções explicitamente autorizadas |
| Product owner (Ede) | Autorizar escopo, publicação, release surface, commit, push, deploy e qualquer operação destrutiva | Tudo |

Regra dura: **o revisor não publica, não faz merge, não faz push, não aplica migration
remota e não altera secret**. Se a correção exigir mais que um ajuste mínimo dentro do
lote autorizado, o revisor devolve o achado ao implementador.

## 2. Fluxo de um lote

```text
Codex implementa
   ↓
Codex atualiza handoffs/current/IMPLEMENTATION.md
   ↓
Codex roda npm run review:gates quando aplicável
   ↓
Opcionalmente, Codex publica .review/inbox/<lote>.json como pacote técnico
   ↓
Claude audita e escreve handoffs/current/REVIEW.md
   ↓
Opcionalmente, Claude escreve .review/verdicts/<lote>.md alinhado ao REVIEW.md
   ↓
Ede decide commit / publicação
```

### 2.0 Handoff persistente

Além dos artefatos automatizados em .review/, cada lote corrente usa os arquivos
em handoffs/current/: TASK.md, IMPLEMENTATION.md, REVIEW.md e STATUS.md.

Para o fluxo corrente de handoff, os únicos resultados válidos em REVIEW.md são
APPROVED, REQUEST_CHANGES e BLOCKED. Vereditos históricos em `.review/verdicts/`
podem manter vocabulário legado, mas não representam o estado corrente. O estado
corrente é o de `handoffs/current/STATUS.md`, e o pedido corrente é o de
`handoffs/current/IMPLEMENTATION.md`.

Claude não altera código de produto durante review. Codex não pode autodeclarar
APPROVED. Não há edição concorrente na mesma working tree.

### 2.1 Pedido de revisão

O implementador pode publicar um JSON em `.review/inbox/` quando o quality gate for
aplicável. Esse arquivo é complemento técnico e não substitui o pedido canônico em
`handoffs/current/IMPLEMENTATION.md`. Campos:

```json
{
  "lote": "support-feedback-restore-v1",
  "autor": "codex",
  "data": "2026-08-19",
  "escopo": "Restaurar mensagens de erro descartadas em SupportWorkspacePage",
  "arquivos": ["apps/web/src/features/support/SupportWorkspacePage.tsx"],
  "objetivo": "Erro de anexo, Knowledge e handoff volta a ser visível ao operador",
  "fora_de_escopo": ["publicação do Support no release surface"],
  "contratos_tocados": [],
  "validacoes": [
    { "comando": "npm run web:typecheck", "resultado": "ok" },
    { "comando": "npm run test", "resultado": "ok" },
    { "comando": "npm run review:gates", "resultado": "0 regressões" }
  ],
  "evidencias": ["output/local-qa/…"],
  "riscos": ["…"],
  "pendencias": ["…"]
}
```

`IMPLEMENTATION.md` sem `validacoes` reais é devolvido sem revisão técnica: o revisor
não substitui a execução das validações pelo implementador. Se o inbox for gerado,
ele também deve conter somente validações realmente executadas.

### 2.2 Pacote de revisão

`npm run review:context` gera `.review/context/<timestamp>.md` com:

- branch, HEAD, base comparada e estado do worktree;
- arquivos tocados classificados por frente (Support, Central de Clientes, Customer
  Operations, HubSpot local, Analytics, Autenticação, Navegação/release surface,
  Contratos, Backend, QA, Documentação);
- objetos de banco criados ou alterados pelo lote, cada um marcado com **pgTAP: sim/NÃO**;
- resultado dos quality gates;
- `git diff --stat` do worktree e, quando pedido, contra a base.

O pacote é artefato gerado e não versionado.

## 3. Quality gates

`npm run review:gates` executa `scripts/review/quality-gates.mjs`. O gate é **somente
leitura** sobre o produto e compara o estado atual com `.review/baseline.json`.

Ele falha apenas quando aparece um achado **novo** em gate de severidade `blocker` ou
`major`. Débito histórico fica congelado no baseline e é reduzido por lote autorizado.
Isso é deliberado: um gate que reprova o repositório inteiro no primeiro dia é
desligado pela equipe no segundo.

| Gate | Severidade | O que detecta |
| --- | --- | --- |
| `RLS_WITHOUT_POLICY` | blocker | Tabela com RLS habilitada, sem policy e sem declaração de deny-all intencional em `.review/rls-deny-all-allowlist.json` |
| `SECRET_IN_UNTRACKED` | blocker | Padrão de segredo em arquivo não rastreado (o `local:qa:secret-scan` oficial varre apenas arquivos rastreados) |
| `DOC_BROKEN_LINK` | major | Link relativo de markdown que não resolve em arquivo existente |
| `NPM_SCRIPT_MISSING` | major | Script do `package.json` apontando para `.mjs` inexistente |
| `PGTAP_MISSING_RPC` | major | RPC pública sem nenhuma menção em `supabase/tests` |
| `PGTAP_MISSING_VIEW` | major | View pública sem nenhuma menção em `supabase/tests` |
| `FRONT_DISCARDED_STATE` | major | `const [, setX] = useState(...)`: estado escrito e nunca lido, padrão típico de feedback de erro que deixou de ser renderizado |
| `EMPTY_CATCH` | major | `catch {}` sem tratamento nem comentário, em produto ou QA |
| `PGTAP_POSITIONAL_ASSERT` | major | Asserção pgTAP dependente da posição em array jsonb, frágil na presença de dados reais |
| `QA_MAGIC_COUNT` | major | Smoke acoplado a contagem literal de dados locais |
| `SURFACE_PENDING_UI` | info | Objeto backend sem consumidor no repositório |
| `DOC_OVERSIZE` | info | Documento markdown acima de 120KB |

### 3.1 `SURFACE_PENDING_UI` não é código morto

O ConfiOne tem domínios **deliberadamente backend-only**, aguardando UI ou release
surface — Customer Operations V1 é o caso explícito. Um objeto listado neste gate
significa apenas: *nada no repositório consome isto hoje*. A decisão correta é humana e
tem três saídas legítimas:

1. publicar a UI/rota correspondente;
2. registrar no roadmap como funcionalidade pronta aguardando ativação;
3. aposentar, com decisão registrada.

**Nenhuma delas é remover objeto de banco por iniciativa do revisor.**

### 3.2 Limites do gate

O gate usa análise textual, não execução. Consequências que o revisor deve declarar:

- chamada dinâmica de RPC (nome montado em runtime) aparece como sem consumidor;
- menção de um objeto em pgTAP não prova que o comportamento está coberto, apenas que o
  nome aparece — a leitura do teste continua sendo trabalho do revisor;
- `DOC_BROKEN_LINK` ignora esquemas como `knowledge-asset:` e `http:`, por serem
  referências simbólicas e não caminhos de arquivo;
- ausência de achado nunca é evidência de qualidade; é ausência de sinal.

## 4. Severidade dos achados de revisão

O veredito corrente classifica cada achado com a escala canônica:

| Nível | Definição | Efeito |
| --- | --- | --- |
| `CRITICAL` | Segurança, RLS, isolamento de tenant, auditoria ausente, dado fabricado, falha silenciosa, negação de acesso invisível, segredo exposto, escrita externa não autorizada | Lote não avança |
| `HIGH` | Contrato divergente do backend, regra de negócio no frontend, teste enfraquecido, cobertura ausente em comportamento novo, documentação afirmando o que o código não faz | Lote avança só com decisão do Ede |
| `MEDIUM` | Duplicação, nomenclatura, estado morto, dívida localizada sem impacto de comportamento | Registrar e agendar |
| `LOW` | Estilo e preferência | Opcional |
| `INFO` | Observação sem ação obrigatória | Informativo |

Artefatos históricos podem usar `BLOCKER`, `MAJOR`, `MINOR` e `NIT`. O mapa de
equivalência é `BLOCKER → CRITICAL`, `MAJOR → HIGH`, `MINOR → MEDIUM`, `NIT → LOW`
e `INFO → INFO`. Para vereditos históricos, o mapa operacional é `APROVADO →
APPROVED`, `APROVADO_COM_RESSALVAS → REQUEST_CHANGES` enquanto houver ressalvas ou
findings abertos, e `BLOQUEADO → BLOCKED`. O veredito do ciclo 0 permanece histórico
e não classifica o worktree atual; essa classificação é `OWNER_DECISION_REQUIRED`
na decisão D-01. Nenhum baseline ou veredito histórico é reescrito.

Classificação de lacuna segue `docs/CUSTOMER_OPERATIONS_MIGRATION_DOMAIN_V1.md` e o
vocabulário já adotado no projeto: `BACKEND_CAPABILITY_REQUIRED`,
`PRODUCT_OWNER_DECISION_REQUIRED`, `FRONTEND_FIX_REQUIRED`.

## 5. Checklist de revisão por camada

O revisor percorre, na ordem, apenas o que o lote tocou.

### Banco e contratos

- objeto novo tem RLS coerente com o dado que guarda;
- tabela operacional tem escopo de tenant explícito;
- policy existe, ou o deny-all é intencional e declarado;
- função `security definer` tem `set search_path` e ACL mínima;
- `grant` novo não amplia superfície além da fronteira declarada de escrita;
- ação administrativa é auditável;
- pgTAP cobre autorização, isolamento e a regra que o lote introduziu, não só a
  existência do objeto;
- migration é idempotente quando o projeto exige e não contradiz migration anterior da
  mesma sequência.

### Frontend

- nenhuma regra de negócio, SLA, permissão ou elegibilidade derivada no cliente;
- read model/RPC real como fonte, sem mock;
- dado ausente aparece como `Indisponível`, nunca simulado;
- estados de loading, vazio, erro, permissão negada e dado parcial existem e são
  visíveis;
- erro relevante não é engolido: sem `catch` vazio, sem estado escrito e nunca lido;
- rota nova respeita release surface e permissão efetiva.

### QA e testes

- comportamento novo tem teste que falharia sem a mudança;
- nenhuma asserção foi enfraquecida para o teste passar;
- smoke não depende de posição em array, contagem literal de dados ou fixture não
  idempotente;
- evidência anexada é reprodutível.

### Documentação

Conforme `docs/DOCUMENTATION_UPDATE_POLICY.md`, e com a política de sanitização vigente:

- documento **desatualizado** é atualizado no lote;
- documento **depreciado** é arquivado com cabeçalho de status, nunca apagado;
- funcionalidade **desenvolvida e não publicada** é preservada e registrada em
  `docs/ROADMAP_BUILDOUT_V3.md` como pronta aguardando ativação;
- `PROJECT_STATE.md`, o documento da área, o `DOCUMENTATION_LEDGER.md` e o
  `docs/README.md` são revisados quando o impacto real exigir.

## 6. Veredito

O revisor escreve `handoffs/current/REVIEW.md` com:

1. veredito (`APPROVED`, `REQUEST_CHANGES`, `BLOCKED`);
2. o que foi efetivamente verificado, com comando e resultado;
3. achados por severidade, cada um com arquivo, linha e cenário de falha concreto;
4. o que **não** foi verificado, explicitamente;
5. próximo passo recomendado.

`.review/state.json` guarda somente metadados de automação, como último HEAD varrido,
contagem de entradas e último heartbeat. Ele não guarda lote, commit revisado,
estado de review ou veredito.

## 7. Cadência

O revisor opera por ciclos de verificação. Em cada ciclo:

1. lê o handoff corrente e o estado do Git;
2. consulta `.review/inbox/` somente quando o pacote técnico opcional existir;
3. sem lote novo e sem mudança de HEAD ou worktree, encerra o ciclo sem custo;
4. com lote novo, gera o pacote se aplicável, revisa, publica o veredito no handoff
   e atualiza somente os metadados de automação.

A cadência é uma decisão operacional do Ede e não faz parte do contrato deste documento.

## 8. Proibições permanentes do revisor

- commit, push, merge, rebase, reset, clean, checkout destrutivo;
- deploy, migration remota, alteração de secret;
- escrita em HubSpot, OMIE/OME, After Sale V1, Boss, Genius ou After Sale V2;
- remoção de migration, RPC, view, policy, teste ou documento;
- alteração de release surface;
- declarar lote concluído sem evidência de execução.
