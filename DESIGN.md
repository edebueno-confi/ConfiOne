# DESIGN.md

## Contrato visual
O Design System V3 e o contrato visual canonico do Genius Support OS. Este arquivo existe para alimentar o Impeccable com contexto do projeto; ele complementa, mas nao substitui, as fontes oficiais em `docs/`.

## Hierarquia de decisao visual
1. Blueprint PNG aprovado da tela.
2. Screen spec da tela em `docs/design/screens/*.md`.
3. `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`.
4. Contratos reais de dados, views, RPCs e permissoes.
5. Implementacao antiga.

Para este projeto, blueprint PNG maior que screen spec; screen spec maior que Design System V3; Design System V3 maior que contratos reais de UI; implementacao antiga nunca justifica regressao visual ou comportamento falso. O Impeccable complementa essa hierarquia, nao a substitui.

## Cena de uso
Operadores internos de suporte, CS e platform admin usam o cockpit durante o expediente em monitores desktop, alternando entre filas, tickets, clientes, governanca e auditoria. A interface precisa ser clara, densa e confiavel em light mode, com dark mode secundario quando aplicavel.

## Tema
- Light mode e principal.
- Dark mode e secundario.
- Cockpits administrativos devem parecer operacionais, nao decorativos.
- Superficies publicas podem rolar naturalmente; cockpits internos nao devem ter scroll global.

## Layout e scroll
- Cockpits internos usam sidebar fixa, topbar estavel, coluna central dominante e rail direito quando necessario.
- `body/page` nao deve rolar verticalmente nas telas operacionais.
- Scroll deve ficar no componente certo: lista, tabela, thread ou rail.
- Scroll horizontal e proibido.
- A tela deve validar bem em viewport real, reportando `window.innerWidth`, `window.innerHeight`, scroll global e containers com scroll interno.

## Densidade e estrutura
- Densidade operacional, sem inflar cards para preencher espaco.
- Listas e tabelas devem ser densas, selecionaveis e rastreaveis.
- Rails devem explicar contexto e proximas acoes sem virar modal ou painel generico.
- Estados vazios, loading, erro e indisponivel devem manter shell e layout.

## Copy de interface
- PT-BR claro.
- Sem termos tecnicos crus quando houver linguagem operacional melhor.
- Nao mostrar stack trace, role crua, RPC, RLS, Supabase ou payload tecnico na UI.
- Acoes bloqueadas devem ter copy honesta: indisponivel por falta de contrato, permissao ou regra backend.

## Cores, componentes e tom visual
- Seguir tokens e componentes existentes do Design System V3.
- Evitar dashboard generico, grid monotono de cards e metricas sem fonte real.
- Estados sensiveis devem ter destaque moderado, sem alarmismo.
- Status, papeis e severidades devem usar pills consistentes.
- Navegacao e rails devem preservar a sensacao de cockpit B2B tecnico.

## Regras especificas para Admin Access
- Tela comunica governanca e seguranca, nao cadastro.
- Mostrar usuarios, roles, memberships, tenants, convites, status e ultima atualizacao.
- Nao ocultar usuario sem tenant.
- Acoes perigosas ou sem contrato devem ficar desabilitadas ou ocultas com explicacao clara.
- Linha selecionada e rail direito devem deixar evidente quem tem acesso a que.

## Regras especificas para Admin System
- Tela comunica observabilidade administrativa segura.
- Exibir apenas eventos, checks e summaries reais vindos do backend.
- Nao criar status verde artificial sem fonte real.
- Nao expor metadata bruta, before/after state bruto, logs sensiveis ou payloads.
- Rail de detalhe deve mostrar servico, severidade, timestamp, impacto e contexto sanitizado.

## Fontes oficiais usadas
- `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`
- `docs/design/screens/ADMIN_ACCESS.md`
- `docs/design/screens/ADMIN_ACCESS_BLUEPRINT_SPEC.md`
- `docs/design/screens/ADMIN_SYSTEM.md`
- `docs/design/screens/ACCESS_DENIED_AND_STATES.md`
- `docs/ROADMAP_BUILDOUT_V3.md`
- `docs/ARCHITECTURE_RULES.md`
- `docs/AUTH_CONTEXT_STRATEGY.md`
- `docs/PROJECT_STATE.md`
