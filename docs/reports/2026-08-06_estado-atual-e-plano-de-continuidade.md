# Estado atual e plano de continuidade — 2026-08-06

Relatório de entendimento produzido na retomada do trabalho em conta nova.
Nenhum arquivo de aplicação foi alterado nesta leitura.

## 1. Onde o repositório está

- Checkout: `C:\Projetos\GSO-old`, worktree único, limpo exceto pelos itens da seção 2.
- Branch: `codex/react-router-v8-migration-20260804`, **42 commits à frente de `main`**, sem push e sem merge.
- HEAD: `50f8f71 feat(access): concluir criacao direta e autoatendimento` (06/08/2026 01:03).
- Remotos configurados:
  - `origin` → `https://github.com/edebueno-confi/Central-Confi.git`
  - `genius-os` → `https://github.com/edebueno-confi/Genius-OS.git`

### Últimos commits relevantes

| Commit | Conteúdo |
| --- | --- |
| `50f8f71` | Criação direta de usuário + autoatendimento (perfil, avatar, senha) |
| `e99a526` | Criar usuário direto no painel e correção da navegação de `/admin/access` |
| `de859df` | Claim de `service_role` na entrega de convite |
| `d73697e` | RPC de ciclo restrita ao `service_role` |
| `18237ac` | Tradução de falhas de sincronização |
| `4cbc8e1` | Camada visual de Configurações concluída (último estado com QA visual) |
| `0de83de` | WIP da camada visual (interrompido por limite de tokens) |

## 2. O que está fora do Git agora

**Modificado, não commitado** — correção real, ainda sem validação registrada:

- `apps/web/src/features/account/PasswordChangeGate.tsx` — passa a exigir a senha atual antes de trocar.
- `apps/web/src/features/account/account-api.ts` — `refreshAuthClaims(newPassword?)`. Trocar a senha pela Admin API invalida o refresh token corrente; a renovação voltava 400. A nova versão reautentica com a senha recém-definida para o Auth emitir sessão válida com os claims novos.

**Não rastreado:**

- `supabase/migrations/20260806150000_omie_promotion_timeout_hardening.sql` — evita que a promoção do snapshot OMIE regrave todos os títulos a cada execução (dois `UPDATE` em tabela com auditoria por linha estourava `statement_timeout`). Adiciona `statement_timeout = 120s` e `pg_advisory_xact_lock`.
- `docs/reports/2026-08-06_invite-smtp-delivery-diagnosis.md` — já é referenciado por `docs/PROJECT_STATE.md`, que está commitado.

## 3. O que já foi entregue da última frente

A frente de `/admin/access` está concluída em `e99a526` + `50f8f71`:

- **Causa raiz da navegação sumindo:** a tela usava o mesmo container como casco e como área de rolagem. A faixa de abas tinha `overflow-x-auto`; pelo CSS Overflow, quando um eixo deixa de ser `visible` o outro também deixa, o `min-height: auto` resolveu para 0 e o flex esmagou a faixa. Medido: 8 px visíveis de 36 px de conteúdo na aba Convites em 1366×625 e 390×844. Corrigido com `.gso-ui-shell` / `.gso-ui-shell-chrome` / `.gso-ui-shell-body`.
- **Convite aposentado como caminho de criação.** Aba virou histórico somente leitura; nenhum dado apagado.
- **Criação direta** por `supabase/functions/internal-access-user-create`, idempotente por e-mail, com compensação de conta órfã e sem migration nova.
- **Senha temporária** gerada no servidor e exibida uma única vez na tela, com troca obrigatória no primeiro acesso — inclusive na redefinição administrativa (`resetAdminInternalUserPassword`). **Não depende de SMTP.**
- **Autoatendimento** em `/meu-perfil`: `MyProfilePage`, `AccountSelfShell`, upload/remoção de avatar (`20260806120000_profile_avatars_self_service_v1.sql` + testes pgTAP), troca de senha própria via `account-self-password`.
- **Dois erros antigos corrigidos:** "Último acesso" nunca foi último login (era `updated_at` do contexto) e virou "Contexto atualizado" com "Indisponível"; e um filtro escondia da lista todo usuário sem área.

Ou seja: as três decisões que ficaram com você já foram respondidas por você e implementadas — não usar e-mail, criar e resetar senha pelo painel, e o usuário editar os próprios dados com foto.

## 4. Pendências abertas, por ordem de risco

### Bloqueio operacional

1. **Sincronismo OMIE e HubSpot em HTTP 503.** Não é credencial. As funções `omie-sync`, `hubspot-sync` e `analytics-sequential-sync` não respondem no ambiente remoto. É verificação de publicação no backend.
2. **Vazamento técnico na interface.** A mensagem de erro exibe "Edge Function" e "HTTP 503" ao usuário, contra a regra de linguagem do produto.
3. **Migration OMIE não commitada nem confirmada.** Não sei se `20260806150000` já foi aplicada no remoto.

### Qualidade visual

4. **Banner de erro do Gênio ocupa altura demais**, empurra a página e quebra a densidade FullHD sem rolagem.
5. **Revisão geral de todos os ambientes visíveis** antes do deploy — nunca executada.
6. **Auditoria visual do lote `0de83de`/`4cbc8e1`** nunca foi feita: compila, mas o design não foi verificado em tela.

### Governança

7. **Duas identidades de teste** `qa.direct-user-*@genius.local` no banco local, aguardando sua autorização para remoção.
8. **Push e destino do repositório** — ver seção 5.
9. **`/design:ux-copy` e `/operations:runbook`** não executados.
10. Branch com 42 commits sem merge em `main`.

## 5. Sobre o remoto — o ponto que ficou confuso

O repositório local tem **dois** remotos apontando para repositórios diferentes no GitHub:

- `origin` → **Central-Confi** — é o remoto padrão. Todo `git push` sem argumento vai para cá.
- `genius-os` → **Genius-OS** — é o repositório que você pediu para atualizar.

O nome `origin` não significa "o certo", é só o apelido do remoto criado primeiro. Quando você pediu "atualize o GitHub Genius-OS", o comando correto seria `git push genius-os`, não `git push`. Antes de qualquer publicação preciso que você confirme:

- Qual dos dois é o repositório canônico do projeto hoje.
- Se o outro deve ser removido, mantido como espelho, ou mantido como histórico congelado.
- Se o push vai para a branch atual ou para `main` depois de merge.

Não vou publicar em nenhum dos dois sem essa definição.

## 6. Plano proposto para os próximos lotes

**Lote A — fechar o que está solto (baixo risco, sem decisão sua)**

1. Validar a correção não commitada de troca de senha: lint, typechecks, build, secret scan, teste de contrato de autoatendimento e QA real no navegador.
2. Commitar essa correção, a migration OMIE e o relatório de SMTP, com registro em `PROJECT_STATE` e no ledger.

**Lote B — sincronismo (destrava o dashboard)**

3. Diagnosticar por que `omie-sync`, `hubspot-sync` e `analytics-sequential-sync` retornam 503 no remoto. Confirmar publicação, segredos e status de cada função. Sem redeploy sem sua autorização.
4. Corrigir a copy de erro para linguagem de produto, sem "Edge Function", "HTTP" ou nome de função. Cobrir com teste do formatador.

**Lote C — densidade e revisão visual**

5. Recompor o banner do Gênio como faixa compacta, dentro das regras de densidade FullHD.
6. Auditoria visual real de todas as telas publicadas, em 1920×1080 e 1366×768, temas claro e escuro, com evidência por rota. Corrigir o que a auditoria apontar.

**Lote D — governança**

7. Runbook operacional e revisão de copy.
8. Decisão de remoto, merge e push.

## 7. O que preciso de você antes de começar

1. Confirmar o remoto canônico (seção 5).
2. Autorizar ou negar a remoção das duas identidades de teste no banco local.
3. Confirmar se a migration `20260806150000` já foi aplicada no Supabase remoto pelo Codex.
4. Confirmar por qual lote começo — a recomendação é A, seguido de B.
