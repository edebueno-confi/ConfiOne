# Context Usage Rules

Este documento define como Codex, ChatGPT e Ede devem usar o Context Pack e a documentação do Genius Support OS sem transformar histórico antigo em fonte corrente.

## Ordem de precedência entre fontes

1. Contratos reais do backend, migrations, views, RPCs, policies, testes e código em execução.
2. Documentos canônicos atuais do projeto.
3. Context Pack mais recente aprovado.
4. Relatórios de auditoria recentes com evidência objetiva.
5. Diário de Construção e Product Docs como camada de leitura guiada.
6. Documentação histórica, relatórios antigos, `docs/GPT/`, prompts antigos e artefatos experimentais.
7. Histórico de chat, quando não estiver consolidado em documento.

Quando houver conflito, a fonte de maior precedência prevalece. Documentação histórica não pode ser usada como fonte principal quando houver documento canônico mais recente.

## Documentos canônicos

O conjunto mínimo canônico para direção do projeto é:

- `docs/PROJECT_STATE.md`
- `docs/README.md`
- `docs/ROADMAP_BUILDOUT_V3.md`
- `docs/OPERATIONAL_CONTROL_PLANE_V1.md`, quando a frente envolver Operational Control Plane
- `docs/GOAL_EXECUTION_PLAN.md`, quando a frente usar execução por goal
- `docs/CODEX_EXECUTION_RULES.md`
- `docs/VALIDATION_CHECKLIST.md`
- `docs/ARCHITECTURE_RULES.md`
- `docs/VIEW_RPC_CONTRACTS.md`
- `docs/AUTH_CONTEXT_STRATEGY.md`
- `docs/AI_GOVERNANCE.md`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`, quando houver UI/UX
- `docs/context-handoff/00_CONTEXT_PACK_INDEX.md` a `24_CONTEXT_USAGE_RULES.md`, quando a tarefa envolver retomada, handoff, auditoria ou decisão de macro-lote

`docs/GPT/`, `.worktrees/*`, `docs/ROADMAP.md`, `docs/IMPLEMENTATION_PLAN.md` e relatórios antigos podem ajudar na investigação, mas não são plano corrente se divergirem dos documentos acima.

## Documentos por tipo de tarefa

| Tipo de tarefa | Leitura mínima recomendada |
| --- | --- |
| Retomada geral ou handoff | `PROJECT_STATE.md`, `README.md`, `00_CONTEXT_PACK_INDEX.md`, `03_CURRENT_IMPLEMENTATION_STATE.md`, `18_PENDING_DECISIONS.md`, `20_PROPOSED_PHASED_BACKLOG.md`, `23_GIT_PROVENANCE.md`, este documento |
| Dashboard gerencial | `12_DASHBOARDS_AND_METRICS.md`, `11_INTEGRATIONS_HUBSPOT_OMIE.md`, `14_TECHNICAL_ARCHITECTURE.md`, `15_TESTS_AND_QUALITY.md`, `VIEW_RPC_CONTRACTS.md` |
| HubSpot/OMIE/integrações | `11_INTEGRATIONS_HUBSPOT_OMIE.md`, `10_SECURITY_AND_RLS.md`, `14_TECHNICAL_ARCHITECTURE.md`, `15_TESTS_AND_QUALITY.md`, migrations/functions relacionadas |
| UI/UX e responsividade | `13_UI_UX_CURRENT_STATE.md`, `22_UI_EVIDENCE_MATRIX.md`, `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`, screenshots atuais aplicáveis |
| Rotas e navegação | `05_INFORMATION_ARCHITECTURE.md`, `06_ROUTES_AND_NAVIGATION.md`, `08_PERSONAS_ROLES_AND_PERMISSIONS.md`, componentes de navegação reais |
| Autorização, perfis e áreas internas | `08_PERSONAS_ROLES_AND_PERMISSIONS.md`, `09_DATA_MODEL_AND_TENANCY.md`, `10_SECURITY_AND_RLS.md`, `AUTH_CONTEXT_STRATEGY.md`, `VIEW_RPC_CONTRACTS.md` |
| Banco, RLS ou backend | `09_DATA_MODEL_AND_TENANCY.md`, `10_SECURITY_AND_RLS.md`, `14_TECHNICAL_ARCHITECTURE.md`, `VIEW_RPC_CONTRACTS.md`, migrations/testes aplicáveis |
| Central de ajuda e conhecimento | `02_PRODUCT_VISION_AND_SCOPE.md`, `04_MODULE_INVENTORY.md`, `13_UI_UX_CURRENT_STATE.md`, `15_TESTS_AND_QUALITY.md`, documentação de Knowledge e Octadesk quando aplicável |
| Diário de Construção/Product Docs | Este documento, `17_CONFLICTS_AND_DUPLICATIONS.md`, `20_PROPOSED_PHASED_BACKLOG.md`, `21_REPOSITORY_MANIFEST.md`, `BUILD_JOURNAL_STRATEGY.md`, `BUILD_JOURNAL_SCREEN_SPEC.md`, contratos `internal_documents` |

## Regra de leitura mínima

Para evitar consumo desnecessário de tokens:

1. Leia primeiro os documentos indicados para o tipo de tarefa.
2. Use busca textual (`rg`) para localizar contratos, rotas e arquivos diretamente relacionados.
3. Abra apenas os arquivos que a busca indicar como relevantes.
4. Não carregue `docs/GPT/`, relatórios antigos ou screenshots históricos sem hipótese clara.
5. Se a tarefa envolver decisão estrutural, valide a hipótese no código e no banco antes de alterar documentação.

## Formato de relatório delta

Ao concluir macro-lote documental ou técnico, reporte:

```md
# Relatório Delta

## Escopo
- Objetivo:
- Fora do escopo:

## Alterações
- Arquivos/documentos:
- Código/backend:
- Dados/migrations:

## Evidências
- Validações executadas:
- Capturas/artefatos:
- Limitações:

## Decisões
- Mantidas:
- Novas:
- Pendentes:

## Próximo ciclo recomendado
- Prioridade:
- Critério de aceite:
```

## Quando refazer auditoria completa

Refaça uma auditoria completa quando ocorrer qualquer uma destas condições:

- mudança estrutural de navegação, shell, rotas ou arquitetura de informação;
- alteração de modelo de dados, RLS, permissões, tenants ou perfis;
- mudança em integrações HubSpot, OMIE, GitHub ou fontes operacionais;
- preparação para deploy real;
- divergência relevante entre comportamento observado, documentação e código;
- handoff entre agentes após macro-lote grande;
- suspeita de documentação histórica sendo usada como verdade atual;
- inclusão ou remoção de módulos do escopo MVP.

## Atualização do estado após macro-lote

Após cada macro-lote relevante:

1. Atualize `docs/PROJECT_STATE.md` com o estado real e limites.
2. Atualize `docs/plan.md` ou backlog vigente com executado, validado, pendente e bloqueado.
3. Atualize `docs/DOCUMENTATION_LEDGER.md` com resumo, arquivos tocados e validações.
4. Atualize o Context Pack apenas quando houver mudança que afete handoff, arquitetura, backlog ou evidência.
5. Se houver UI, atualize matriz/evidências visuais quando a tela observada mudar materialmente.
6. Se houver contrato backend, atualize documentação de views/RPCs e testes.

## Mudanças que exigem atualização documental

- novas rotas, módulos ou mudanças de navegação;
- mudança de fonte da verdade ou fallback de dados;
- criação, remoção ou alteração de tabelas, views, RPCs, policies, Edge Functions ou jobs;
- mudança em permissões, papéis, áreas internas, tenancy ou RLS;
- alteração de métricas, fórmulas ou origem de KPI;
- mudança de integrações, escopos, rate limit, scheduler ou observabilidade;
- alteração relevante de UX, design system ou padrão de componentes;
- decisão de produto que altere MVP, backlog ou fase;
- classificação de documento como atual, histórico, substituído, descartado, experimental ou obsoleto.

# Governança da documentação

## Hierarquia

1. Contratos e documentos canônicos atuais
2. Estado atual e decisões vigentes
3. Diário de Construção
4. Documentação histórica

## Regras

- O Diário não é fonte oficial de decisão técnica.
- Resumos devem apontar para os arquivos Markdown originais.
- Documentos substituídos devem permanecer identificados.
- Conteúdo histórico não pode orientar novas implementações.
- Toda mudança estrutural relevante deve atualizar a documentação canônica.
- O Diário deve ser revisado por marcos, não a cada commit.
- Product Docs é leitor governado de documentos internos; não é explorador de arquivos.
- O Diário é camada narrativa/editorial e deve permanecer dependente de contratos documentais governados.
- Arquivos sensíveis, secrets, credenciais, dumps privados e evidências com dado sensível não devem ser publicados em superfícies de leitura.

## Responsabilidades

### Codex

- Inspecionar o estado local antes de editar.
- Preservar worktree e mudanças alheias.
- Implementar e validar lotes locais com evidência.
- Atualizar documentação canônica quando comportamento, contratos ou decisões mudarem.
- Declarar limitações reais de validação.
- Não executar deploy, push, migration remota, secret change ou ação externa sensível sem autorização explícita.

### ChatGPT de direção

- Avaliar Context Packs e relatórios delta.
- Decidir prioridades, escopo de macro-lotes e critérios de aceite.
- Não substituir evidência local por histórico de conversa.
- Pedir nova auditoria quando houver divergência relevante ou troca de agente.

### Ede

- Aprovar decisões de produto, escopo MVP, uso de credenciais, deploys e operações externas sensíveis.
- Fornecer acessos e contexto de negócio quando necessário.
- Validar visualmente os fluxos críticos antes de release.
- Decidir quando documentos históricos podem ser arquivados, substituídos ou removidos.

## Diário de Construção e arquivo histórico

O Diário de Construção deve apresentar a história do produto em linguagem compreensível, com título, resumo editorial, fase, problema, decisão, impacto, participação da IA, documentos relacionados, link para Markdown original e status do conteúdo.

O arquivo histórico deve preservar rastreabilidade, mas cada item precisa ser classificado como:

- atual;
- histórico;
- substituído;
- descartado;
- experimental;
- obsoleto.

Documento antigo não pode continuar aparecendo como verdade atual apenas porque ainda existe no repositório.
