# Blueprint V4 — campos que não existem: implementar ou descartar — 2026-08-07

Mapeamento de todo campo, indicador e ação presente nos blueprints de Configurações
que hoje não tem origem real. Cada item traz o veredito e a evidência que sustenta.

## 1. Implementar — origem já existe no banco

Estes são baratos porque o dado já está gravado; falta só publicá-lo no read model.

| Campo do blueprint | Tela | Origem confirmada | Observação |
| --- | --- | --- | --- |
| **Último acesso** ("Hoje, 09:15") | Usuários | `auth.users.last_sign_in_at` existe; 3 usuários já têm valor | É o campo que a coluna antiga fingia ser. Exige expor por view `security definer`, porque vive no schema `auth`. Encerra de vez a mentira que renomeamos para "Contexto atualizado". |
| **Membro desde** ("12/03/2024") | Usuários | `profiles.created_at` existe | Trivial: entra no painel de detalhe. |
| **Foto do usuário** | Usuários | `profiles.avatar_url` existe desde `20260806120000` | Já implementado no autoatendimento; falta usar na tabela e no painel. |
| **Cobertura de áreas** (indicador) | Usuários | derivável de `vw_admin_access_internal_users` | Usuários com área ÷ total. Substitui o indicador inventado do blueprint. |

## 2. Implementar — vale o esforço, exige trabalho de backend

| Campo do blueprint | Tela | Justificativa | Custo |
| --- | --- | --- | --- |
| **Ver atividade recente** do usuário | Usuários | O schema `audit` já captura mudança de linha em `profiles`, `tenant_memberships`, `user_actor_contexts` e `internal_area_memberships`. Um feed por usuário é governança real, não enfeite. | Médio: view por ator + RLS. |
| **Exportar** histórico | Histórico | A tela já lê as execuções; exportar é o pedido óbvio de quem audita sincronização. Hoje o botão não existe justamente por falta de origem. | Baixo: geração cliente a partir do que já está em memória. |
| **Registros criados / atualizados** por execução | Histórico | A RPC de promoção OMIE já devolve `{staged, promoted}`. Publicar isso no read model dá ao operador a diferença entre "leu" e "mudou". | Médio: alinhar os dois provedores. |
| **Responsável** pela fonte | Fontes | As regras do projeto já mandam registrar owners e proveniência nas sincronizações. Saber quem responde por uma fonte parada tem valor operacional. | Médio: depende de haver owner de fato no HubSpot/OMIE. |

## 3. Descartar — sem origem e sem função no cockpit

Não entram na refatoração e não viram backlog.

| Campo do blueprint | Tela | Motivo |
| --- | --- | --- |
| Telefone, Localização | Usuários | Dado de RH. Não existe, não é usado para decidir nada na operação. |
| Times e grupos (`Vendas`, `Enterprise`, `+2`) | Usuários | Funcionalidade inteira que não existe. Virar chip decorativo seria inventar estrutura. |
| Percentual "85% do total" no indicador | Usuários | Percentual sobre base indefinida. Sem denominador real, é número solto. |
| Paleta de cores por marca | Marcas | Confirmar antes; se não houver coluna, sai. |
| Conteúdos vinculados (`24 fluxos`, `18 templates`, `6 bots`) | Marcas | Três funcionalidades inexistentes. |
| Chat ao vivo, WhatsApp como canais | Central de ajuda | Não há integração de canal. |
| Interruptores sem persistência (avaliação de artigos, artigos relacionados, tempo de leitura, comentários, busca semântica) | Central de ajuda | Auditar um a um. Interruptor que não grava é pior que ausência: promete e não cumpre. |
| "de 12 conectadas" e contagem de entidades por fonte | Fontes | Não existe conceito de fonte conectada mas inativa, nem contagem de entidades. |
| Sidebar: Fluxos e automações, Campos personalizados, Webhooks, Logs de auditoria, Segurança, Planos e assinaturas, Times e grupos, Canais, Templates de e-mail | Global | Telas que não existem. Item de menu que não leva a lugar nenhum é defeito, não roadmap. |
| "Convidar usuário" como ação primária | Usuários | Decisão do operador: o convite foi aposentado. Reproduzir seria reverter. |

## 4. Aderência visual — o que já está certo e o que muda

Auditoria de `settings-ui.css` contra os blueprints.

**Já coincide, não mexer:**

- `--ui-primary: #2563EB` e `--ui-accent: #7C3AED` são exatamente as cores que o
  próprio blueprint de Geral declara nos campos de cor primária e de destaque.
- `--ui-primary-soft: #EEF2FF` é o fundo do item ativo da barra lateral.
- Superfícies (`#F8F9FB` de fundo, `#FFFFFF` de cartão), traço `#E8EAF0` e raios
  8/12/16 px batem com o blueprint.
- Tipografia: `Instrument Sans` nos pesos 400/500/600/700, já carregada.
- Tons de estado: verde, âmbar e vermelho com fundo suave, como nos selos.

**Precisa mudar para ficar fiel:**

| Elemento | Hoje | Blueprint |
| --- | --- | --- |
| Título da página | `clamp(1.5rem, 2.2vw, 2rem)`, peso 600 | ~2.5 rem, peso 700, com o ornamento de brilho ao lado |
| Valor do indicador | 1.7 rem, peso 600 | ~1.9 rem, peso 700 |
| Bloco de ícone do indicador | tile discreto | quadrado 48 px, raio 12 px, fundo tonal por domínio |
| Título de seção | 1 rem sem ícone | 1.05 rem com bloco de ícone tonal à esquerda |
| Abas | texto | ícone + texto |
| Faixa de dica | banda neutra | fundo lilás suave, mascote à esquerda, ação à direita |

**Ícones:** o padrão do projeto é SVG inline, no traço da barra lateral, sem
dependência nova. Os blueprints usam ícones de traço uniforme com cantos
arredondados — compatível. Nenhuma biblioteca de ícone será adicionada.

**Mascote do Gênio:** aparece no campo de busca e na faixa de dica. Precisa de asset
próprio; hoje não existe no repositório. Enquanto não houver, a faixa usa apenas o
ornamento de brilho, sem mascote inventado.

## 5. Efeito na especificação do lote

Os itens da seção 1 entram nas telas correspondentes já nesta refatoração, porque o
dado existe. Os da seção 2 viram lote posterior. Os da seção 3 não são reproduzidos.
