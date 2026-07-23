# Auditoria de UX, navegação, segurança e higiene do repositório

Data: 2026-07-22  
Checkout: `C:\Projetos\GSO-old`  
Branch: `codex/repository-cleanup-consolidation-20260721`  
Escopo: lote local de auditoria solicitado para continuidade do Genius Support OS.

## Resultado executivo

O repositório não apresentou assinaturas de segredos rastreados no escopo
varrido, nem sinks perigosos no frontend além de usos controlados do editor de
artigos e da exportação visual. A exportação de relatório foi corrigida neste
lote para não usar `document.write`; o relatório continua sendo gerado em uma
janela isolada por `Blob` URL e imprime somente o documento dedicado.

As rotas principais continuam organizadas por gates e permissões reais. A rota
administrativa sem sessão redireciona para o login preservando `redirectTo`.
O menu do shell desktop e o menu móvel usam o mesmo construtor de navegação,
reduzindo divergência de permissões e labels.

## Evidências atuais

### Central pública de ajuda

- Screenshot aceito: `output/playwright/gso-qa-help-audit-20260722.png`.
- Rota: `/help/genius/articles`.
- Resultado: título, busca, filtro de categoria, breadcrumb, lista de artigos,
  navegação e estado de contato foram renderizados sem tela vazia ou erro de
  aplicação.
- O scroll global é esperado em uma superfície documental pública: viewport
  929x1037, `scrollHeight` 3424, `clientHeight` 1037, sem overflow horizontal.

### Gate administrativo

- Screenshot aceito: `output/playwright/gso-qa-admin-auth-audit-20260722.png`.
- Rota solicitada: `/admin/analytics` sem sessão.
- Resultado: redirecionamento para `/login?redirectTo=%2Fadmin%2Fanalytics`,
  formulário acessível por labels e controle de tema disponível.
- QA autenticado do Dashboard permanece registrado nos relatórios anteriores;
  a fixture local de `dashboard_viewer` não foi reprovisionada neste lote porque
  o processo local do Supabase CLI falhou com `spawnSync ... UNKNOWN` antes de
  criar a sessão.

## Correção implementada

### Exportação visual sem `document.write`

Arquivo: `apps/web/src/features/analytics/analytics-export.ts`

- removida a escrita direta no documento da janela auxiliar;
- o relatório é criado como `Blob` HTML isolado;
- a janela navega para a URL temporária, aguarda `load`, imprime e fecha após
  `afterprint`;
- a URL temporária é revogada depois de uma janela de segurança de 60 segundos;
- valores continuam escapados antes de entrarem no HTML do relatório.

Teste de regressão: `tests/scripts/analytics-export-security.test.mjs`.

### Atalho administrativo removido do suporte

Arquivo: `apps/web/src/features/home/HomePage.tsx`

- removido o link para `/admin/settings` da página inicial do suporte;
- a navegação administrativa continua disponível somente pelo shell e pelo
  contexto de permissões correspondente;
- o teste `minimal-navigation.test.mjs` garante que o atalho protegido não
  seja reintroduzido acidentalmente.

## Achados e próximos ciclos

1. **Contato público sem configuração local**: a Central mostra honestamente
   “Canais de contato indisponíveis no momento” quando `support_contacts` está
   vazio. Próximo ciclo: configurar os contatos pela superfície administrativa
   e cobrir o estado com teste de contrato, sem hard-code no frontend.
2. **Editor rico**: os usos restantes de `innerHTML` ficam concentrados no
   editor e recebem HTML gerado por parser próprio com escape de texto, URLs
   limitadas a `https`/`mailto`, IDs de vídeo validados e assets assinados.
   Próximo ciclo: adicionar teste de conteúdo malicioso para garantir que a
   política não regresse.
3. **Higiene da raiz**: o scanner `repository:check-root` continua sendo o
   gate. `output/` e o bundle do mascote foram mantidos como artefatos locais
   classificados, sem exclusão automática de evidência ou referência visual.
4. **Sincronizações**: os riscos de lease não atômico, cursor por escopo e
   primeira carga autenticada continuam no backlog técnico. Não foram alterados
   neste lote para evitar ampliar o contrato sem um teste de concorrência e uma
   estratégia de reversão.
5. **Navegação**: o construtor único de menu deve continuar sendo a fonte da
   visibilidade do shell; qualquer nova rota deve nascer com gate, label,
   permissão e teste de acesso correspondentes.

## Achados de arquitetura de navegação

Os pontos abaixo foram confirmados por inspeção estática e permanecem como
próximo lote, sem alteração neste ciclo:

- `SupportGate` valida sessão, mas não bloqueia o shell por capacidade antes da
  montagem das páginas. A autorização efetiva ocorre depois, nas superfícies e
  no backend. Criar um `WorkspaceGate` compartilhado exige alinhar o contrato
  de capabilities antes de mudar o comportamento.
- `minimal-navigation.ts` usa o pathname como fallback para exibir alguns
  grupos. Isso pode deixar o menu visível antes da confirmação do escopo, ainda
  que não conceda autorização no backend. Separar `canSee` de `isActive` é o
  hardening recomendado.
- O wildcard e o logo ainda partem de `/admin` ou `/`; o fallback deve usar
  `getDefaultInternalLandingRoute` para usuários de suporte, CS e viewer.
- `/support/clientes` e `/support/customers` representam experiências com o
  mesmo nome. Escolher uma rota canônica e manter a outra apenas como redirect
  legado reduz ambiguidade.
- A matriz de permissões de `dashboard_viewer` aparece em mais de um arquivo.
  Um manifesto declarativo de rotas e capabilities deve ser criado antes de
  ampliar o número de papéis.
- O contexto de autorização não se atualiza automaticamente quando o papel é
  revogado em outra sessão. Um refresh por foco/TTL, com invalidação após
  alterações administrativas, é a evolução recomendada.

## Limites

Esta auditoria foi local. Não houve push, deploy, migration remota, alteração de
secret, sincronização externa ou mutação no HubSpot/OMIE.
