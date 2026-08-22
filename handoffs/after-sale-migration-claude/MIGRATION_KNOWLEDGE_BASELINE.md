# MIGRATION KNOWLEDGE BASELINE

**Repositório investigado:** `C:\Projetos\ConfiOne`
**Data:** 2026-08-21
**Método:** leitura exploratória do repositório (via shell no dispositivo do usuário, somente leitura) + leitura das centrais de ajuda públicas de After Sale V1 e V2 + busca web sobre Genius Returns e a aquisição pela Confi. Nenhum sistema externo (Genius Returns, After Sale V1, After Sale V2, Boss) foi acessado, nenhuma alteração foi feita em nenhum lugar.
**Status:** aprendizado consolidado. Nenhuma migração foi executada nesta etapa.

---

## 1. O que eu entendi

**Genius Returns** é uma startup brasileira de automação de logística reversa (trocas/devoluções) para e-commerce, com painel administrativo próprio para lojistas configurarem motivos, integrações de transportadora (Correios via CWS), regras de estorno (financeiro vs. vale-compra) e um mecanismo de bloqueio de cliente (BlockList). Ela foi **adquirida pela Confi em 22/03/2026** por um aporte de R$ 12 milhões, para somar capacidade de IA ao pós-venda (FATO, corroborado por reportagem da Exame e pela documentação interna do repositório).

**After Sale** é o produto irmão — faz a mesma coisa (logística reversa/trocas/devoluções), já pertencia à Confi antes da aquisição da Genius, e é a plataforma mais madura das duas: tem central de ajuda pública extensa, um time de atendimento já estruturado (via HubSpot) e um painel administrativo em duas gerações vivas simultaneamente — **V1** (`admin.troquefacil.com.br`) e **V2** (`admin-v2.troquefacil.com.br`). Historicamente, o produto se chamava **Send4** e foi adquirido pela ClearSale em fev/2020, passando a se chamar "aftersale"/"After Sale" (FATO externo, via Crunchbase/Baguete/IPNews). Não ficou totalmente claro nesta pesquisa se "Confi" e "ClearSale" são a mesma organização, uma sucessora, ou uma relação diferente — ver Lacuna 1.

**Boss** (`boss.send4.com.br`) é um sistema auxiliar herdado da era Send4, usado apenas para consultar liberações/entitlements antigos — nunca é origem nem destino de dados de migração.

**Relação entre elas:** Genius Returns e After Sale eram concorrentes diretos (mesma proposta de valor) e viraram, com a aquisição, duas marcas de uma mesma empresa (Confi). A decisão de negócio documentada é consolidar os clientes das duas plataformas legadas (After Sale V1 e Genius Returns) na plataforma mais nova, **After Sale V2**, aposentando as demais como sistemas de clientes ativos.

**Objetivo da migração:** para cada cliente que hoje usa After Sale V1 ou Genius Returns, extrair sua configuração efetivamente usada (não a documentação, não os defaults, não as liberações comerciais) e recriá-la equivalente na After Sale V2, com aprovação humana antes de qualquer gravação, e validação após cada gravação — sem nunca declarar sucesso por uma tela abrir ou por um HTTP 200.

**Uma confusão de nomenclatura importante que resolvi nesta investigação:** o **repositório que você me pediu para explorar (ConfiOne) não é a Genius Returns, nem a After Sale.** É um **terceiro produto**, uma ferramenta interna ("Genius Support OS", depois renomeada ConfiOne) que a Confi está construindo para dar suporte/atendimento unificado às DUAS marcas (Genius e After Sale) — substituindo o atendimento hoje feito por grupos de WhatsApp (para a Genius) e o uso informal do HubSpot (para a After Sale). O nome "Genius" aparece nesse repositório em pelo menos três sentidos diferentes e não relacionados entre si, e qualquer leitura futura do repositório precisa distingui-los (ver seção 11, item sobre nomenclatura).

---

## 2. Como a migração funciona

O processo, tal como documentado (mas ainda não executado de ponta a ponta para nenhum cliente, ver seção 6), é:

```
confirmar identidade, perfil e escopo (cliente/loja/produto)
  -> descobrir e extrair a origem, sem alterar nada nela
  -> classificar cada evidência por proveniência (tela/DOM/exportação/central de ajuda/hipótese)
  -> montar o de-para por parâmetro, com um destino ou uma justificativa de ausência
  -> obter aprovação humana explícita
  -> gravar somente no destino V2 autorizado
  -> recarregar e validar cada alteração persistida
  -> documentar resultado, divergências e pendências, por cliente
```

O princípio central é o mesmo nas duas frentes: **a origem (V1 ou Genius) é a fonte de verdade da configuração real do cliente**; o destino (V2) começa com valores padrão que não podem ser confundidos com "já migrado"; e uma liberação comercial (Boss, ou um "recurso disponível" na origem) nunca é prova de uso real.

Existe hoje, no backend do ConfiOne, um domínio de dados que **registra e rastreia** esse processo (origem, loja, snapshot de inventário, observações por funcionalidade, projeto de migração, avaliação de elegibilidade, aprovação, lote, execução, validação) — mas ele é puramente local: não há nenhum código, em lugar nenhum do repositório, que efetivamente leia a Genius Returns/After Sale V1 ou grave na After Sale V2. A extração e a gravação de verdade têm que ser feitas manualmente (hoje) por um humano ou por um agente com acesso de navegador autenticado, e o resultado dessa extração é o que alimentaria esse domínio de rastreio. Isso está detalhado na seção 8.

---

## 3. Genius → After Sale V2

Esta frente **ainda não começou** operacionalmente — está bloqueada por dois pré-requisitos que só um humano pode resolver:

1. **Uma sessão de ensino ao vivo.** Ninguém (nenhum agente) sabe hoje como logar na Genius Returns, como selecionar/confirmar um cliente, como navegar pela configuração, nem como distinguir tela de leitura de tela de alteração. Isso precisa ser demonstrado por um responsável humano antes de qualquer ação.
2. **O endereço da Central de Ajuda da Genius.** Não está registrado em nenhum lugar do repositório. Uma busca por documentação pública da Genius Returns (feita nesta investigação) não encontrou nenhuma central de ajuda ou documentação técnica pública — apenas o site institucional/marketing (`geniusreturns.com.br`) e um portal white-label de uma marca específica (`front.geniusreturns.com.br`). Isso reforça que essa central provavelmente exige login/é privada, e não deve ser adivinhada.

O que sabemos hoje sobre o domínio funcional da Genius Returns vem de uma fonte indireta: um export da base de conhecimento pública da Genius (feito via OctaDesk, hoje reaproveitado dentro do ConfiOne como conteúdo da Central de Ajuda pública `/help/genius`). Esse corpus (55 artigos) descreve, do ponto de vista do CLIENTE FINAL da Genius (lojista), conceitos como: cadastro/integração de e-commerce (VTEX, Shopify, Tray, Nuvemshop), integração com Correios via "Portal Meu Correios" + token CWS de 40 caracteres, motivos de troca/devolução com regras por motivo, formas de estorno (financeiro vs. vale-compra, com regra de precedência configurável), política de estorno de frete, e uma regra de "BlockList" automática quando o item é marcado como "NÃO DEVOLVIDO". Isso é conhecimento de produto real, mas **não é evidência de configuração de nenhum cliente específico** — serve só para entender o vocabulário e as opções que existem na Genius, exatamente como uma central de ajuda deveria ser usada (ajuda a interpretar, não prova uso).

Importante: nada nesse corpus menciona Oracle, `B2CMN` ou termos parecidos — esses termos, que aparecem nos handoffs de migração, pertencem à integração ERP específica de clientes **After Sale V1** (Melissa/Melissa App), não à Genius. Não presuma que a Genius tenha integração Oracle.

Quando a frente Genius começar de fato, o de-para não pode reaproveitar automaticamente o de-para já usado para Melissa/Melissa App (regra explícita e repetida em pelo menos quatro documentos do repositório) — cada campo precisa ter seu significado confirmado ao vivo na Genius.

---

## 4. V1 → V2

Esta frente **já tem um caso de referência (Melissa/Melissa App)** e uma segunda origem real de clientes (importação HubSpot), mas nenhuma configuração de cliente foi de fato migrada dentro deste repositório — os artefatos de migração que existem vivem fora dele.

- **Melissa** foi tratada como o primeiro cliente migrado (referência/precedente), com uma planilha e um relatório de migração — mas ambos vivem apenas numa pasta do Google Drive, fora deste repositório; não há cópia local, e uma busca por `outputs/aftersale-migracao-canonica.md`/`.xlsx` no repositório não encontrou nada.
- **Melissa App** é a tarefa em andamento no momento em que os handoffs foram escritos (18/08/2026), seguindo o mesmo método usado para Melissa, mas sem nenhum artefato de extração salvo localmente ainda.
- Os números históricos citados (17 status Oracle, 66 motivos — 4 públicos/62 administrativos, 47 regras V2 por e-commerce, sites Oracle `B2CMN`/`B2CMNApp`) são tratados pelos próprios autores do handoff como **referência para conferência**, não como fato atual — precisam ser reextraídos ao vivo antes de qualquer gravação.
- Em paralelo, em 16/08/2026, houve uma importação real (local, sem escrita externa) de **264 empresas do HubSpot marcadas como clientes After Sale** para a tabela de rastreio `customer_account_sources` (247 confirmadas, 17 inativas) — isso populou um diretório de clientes, mas não extraiu nem migrou a configuração de nenhuma loja.
- **Descoberta nova desta investigação, ainda não explorada:** a própria central de ajuda pública da After Sale V2 tem uma seção chamada **"Migração V1 → V2"** (vista na navegação/breadcrumb do artigo consultado, em `atendimento.tgroup.com.br/baseaftersale/`). Isso é uma fonte potencialmente valiosa — o próprio fabricante documentando o que muda entre as versões — que ainda não foi lida. Recomendo isso como primeiro passo da próxima sessão, antes de qualquer extração ao vivo.

O fluxo operacional documentado para V1→V2 é detalhado (confirmar loja no seletor da V1 e da V2 por nome E identificador, nunca só pela URL; extrair por DOM preferencialmente; tratar o marcador "-30 dias" da V1 como "visível somente no painel administrativo" e não como prazo negativo; editar motivo existente em vez de duplicar; usar exclusivamente o modelo oficial de CSV da V2 para lojas) — está pronto para ser seguido assim que um cliente/loja for escolhido para retomar.

---

## 5. Mapa de equivalência

Esta é a matriz consolidada a partir da documentação de planejamento (handoffs) e da central de ajuda pública V1/V2. Ainda não existe, em nenhum lugar, um de-para *confirmado ao vivo* para um cliente real — o que segue é o mapa conceitual/estrutural que orienta a extração, não um resultado de migração.

| Origem | After Sale V2 | Transformação necessária | Evidência | Confiança |
|---|---|---|---|---|
| Parâmetro ativo (V1) | Campo equivalente na V2 | Aplicar e validar após recarregar | `RUNBOOK_MIGRACAO.md`, `DEPAR_EVIDENCIAS.md` | Alta (regra clara, ainda não testada ao vivo) |
| Motivo público (V1) | Motivo de troca/devolução (V2) | Reutilizar cadastro existente, nunca duplicar | `PROMPT_CLAUDE_MELISSA_APP.md` | Alta |
| Motivo administrativo com marcador "-30 dias" (V1) | Motivo com prazo em branco + "Exibir motivo apenas no painel administrativo" (V2) | Reinterpretação de visibilidade, não de prazo | `AFTER_SALE_V1_V2_GENIUS_MIGRATION_HANDOFF.md:137-143` | Alta (regra explícita e repetida em 4 documentos) |
| E-mail com evento correspondente (V1) | Modelo/evento equivalente (V2) | Migrar assunto, corpo HTML, preservar tags válidas (`{{company_name}}` etc.) | `RUNBOOK_MIGRACAO.md` | Média (nunca testado ao vivo) |
| E-mail sem destino (V1) | Sem equivalente | Registrar como "Não suportado pela V2", não bloqueia | idem | Alta (regra clara) |
| Liberação no Boss | Recurso potencial, não confirmado | Sempre confirmar uso real na V1 antes de tratar como configuração | `AFTER_SALE_V1_V2_GENIUS_MIGRATION_HANDOFF.md:93` | Alta |
| Integração Oracle (site/seller/loja) — específica de clientes V1 como Melissa | Integração equivalente na V2, campos a confirmar (não copiar URL de API como Store URL) | Confirmar loja/site/seller no corpo da configuração, nunca no texto do token | `DEPAR_EVIDENCIAS.md:28-29` | Média-baixa — nenhum código local implementa isso; só documentação de duas lojas específicas |
| Token/senha/credencial (qualquer origem) | Nenhum campo documental | Preenchimento manual pelo responsável, nunca registrado | regra repetida em todo o pacote | Alta |
| Loja (V1) | Loja (V2), via CSV do modelo oficial `Configurações > Lojas > Importar > Baixar modelo` | UTF-8, sem inventar valor, sem duplicar código, sinalizar CNPJ repetido sem remover | `RUNBOOK_MIGRACAO.md` | Alta (processo claro, nunca testado ao vivo) |
| Configuração de motivo/integração/reembolso na **Genius Returns** | Campo(s) equivalentes na V2, ainda não mapeados | Requer sessão de ensino humana + de-para próprio, sem copiar o mapa de Melissa | `GENIUS_PARA_V2_PREBRIEF.md` | Baixa — depende inteiramente de trabalho ainda não iniciado |

---

## 6. Etapas operacionais

Do recebimento de um cliente até a conclusão, na ordem correta:

1. Confirmar usuário, perfil e sessão de navegador (humano).
2. Identificar a origem do cliente: After Sale V1 ou Genius Returns — nunca presumir.
3. Confirmar cliente, produto e loja positivamente (nome no seletor **e** no cabeçalho/conteúdo da tela, mais identificador quando disponível) — repetir após qualquer troca de loja, recarga ou navegação sensível.
4. Fazer descoberta somente leitura completa da origem (todos os módulos visíveis em Configurações e correlatos).
5. Extrair a configuração efetiva por DOM/tela/exportação, registrando estado marcado e desmarcado, visibilidade, dependências e a fonte de cada dado.
6. Classificar cada evidência por proveniência (tela/DOM da origem > exportação > tela/DOM do destino > central de ajuda da origem > central de ajuda V1 > central de ajuda V2 > documentação interna > hipótese).
7. Montar o de-para por parâmetro, com um destino localizado na V2 ou uma razão explícita de ausência.
8. Registrar limitações e divergências encontradas, sem usar descrições genéricas.
9. Obter aprovação humana explícita antes de qualquer gravação.
10. Gravar somente na After Sale V2, na loja correta e única (nunca duas lojas selecionadas ao mesmo tempo).
11. Recarregar cada tela alterada e validar o valor persistido.
12. Repetir a conferência de escopo (cliente/loja) a cada gravação, não só uma vez no início.
13. Produzir relatório final independente por cliente, sem misturar origens diferentes.

---

## 7. Automação

| Etapa | Classificação | Observação |
|---|---|---|
| Confirmar identidade/escopo (item 1-3) | **Humana** | Exige julgamento visual/decisão, nunca deve ser pulada mesmo com automação |
| Descoberta somente leitura (item 4) | **Semiautomatizável** | Um agente com navegador autenticado pode navegar e capturar DOM/tela; humano define por onde começar e confirma o escopo |
| Extração estruturada (item 5) | **Semiautomatizável** | Automatizável tecnicamente (scraping de DOM/exportação), mas cada valor capturado precisa de checagem humana antes de virar "fato" |
| Classificação de evidência por proveniência (item 6) | **Automatizável em parte** | A etiqueta de fonte pode ser atribuída automaticamente pelo próprio método de captura; a decisão de qual evidência prevalece em conflito é humana |
| Montagem do de-para (item 7) | **Semiautomatizável** | Um agente pode propor o destino mais provável a partir de um glossário de equivalências já validado; carrega risco alto de falso-positivo em campos novos (ex.: primeiro cliente Genius) |
| Registro de divergências/limitações (item 8) | **Automatizável** | Geração de relatório estruturado a partir dos dados já capturados |
| Aprovação (item 9) | **Humana** | Não deve ser automatizada — é o ponto de controle central de todo o processo |
| Gravação na V2 (item 10) | **Semiautomatizável** | Tecnicamente automatizável via navegador, mas cada gravação deve ser precedida de checagem de escopo e seguida de validação — nunca em lote sem supervisão, especialmente na primeira execução por cliente |
| Recarregar e validar (item 11-12) | **Automatizável** | Comparação determinística entre valor esperado (do de-para aprovado) e valor lido após salvar |
| Relatório final (item 13) | **Automatizável** | Geração de documento a partir dos dados estruturados coletados nas etapas anteriores |

**Observação geral:** nada disso está implementado hoje como automação real — o que existe é um *domínio de dados* (tabelas + RPCs) pronto para receber os resultados de um processo que, na prática, ainda depende inteiramente de um agente com navegador autenticado (ou um humano) executando cada leitura e gravação uma de cada vez. A oportunidade de automação mais segura e imediata é a comparação determinística pós-gravação (item 11-12) e a geração de relatório (item 13), porque são as únicas etapas sem ambiguidade de julgamento humano.

---

## 8. Ferramentas e scripts existentes

- **`docs/CUSTOMER_OPERATIONS_MIGRATION_DOMAIN_V1.md`** + migration SQL `supabase/migrations/20260816150000_customer_operations_migration_domain_v1.sql` (1385 linhas): domínio de banco completo para *rastrear* a migração — 17 tabelas (origem, loja, snapshot de inventário, observação por funcionalidade, evidência, projeto, projeto de migração, elegibilidade, lote, leva, item de lote, aprovação, solicitação de execução, resultado de validação, comentários, atividades), 15 RPCs `security definer` (todas exigem `platform_admin` ou `engineering_manager`), RLS completo, auditoria automática. **Não lê nem escreve em nenhum sistema externo** — confirmado lendo o corpo das duas RPCs mais sensíveis (`rpc_admin_request_customer_migration_execution` e `rpc_admin_record_customer_migration_validation`): são inserções/atualizações puramente locais, sem chamada HTTP.
- **`apps/web/src/features/tenants/CustomerOperationsPanel.tsx`**: painel administrativo somente leitura que exibe esse rastreio (diretório de clientes, projetos de migração, observações de inventário). Não tem nenhum botão de gravação.
- **`supabase/tests/117_customer_operations_migration_domain_v1.sql`**: 40 asserções estruturais (tabelas/views/RLS/transições de estado existem e se comportam corretamente em isolamento) — não testa nenhuma RPC em execução real de ponta a ponta.
- **`scripts/local-qa/import-hubspot-client-directory.mjs`**: script real que importou as 264 empresas HubSpot para `customer_account_sources` (usado em 16/08/2026). É reaproveitável como padrão de "importação de diretório", mas não faz extração de configuração de loja.
- **Nenhum script de scraping, cliente de API ou exportador de configuração** existe para After Sale V1, V2 ou Genius Returns — a extração real, hoje, só pode ser feita por navegação autenticada (humana ou por agente com acesso de navegador), item por item.
- **Pipeline de Central de Ajuda (`scripts/knowledge/import-octadesk-drafts.mjs`, `publish-octadesk-public-help.mjs`)**: não é uma ferramenta de migração de clientes — é o pipeline que trouxe o conteúdo da base de conhecimento da Genius Returns para dentro do ConfiOne como central de ajuda pública. Só é relevante aqui como fonte indireta de conhecimento de domínio (seção 3).

---

## 9. Riscos

- **Confundir "Genius" (o mascote/nome interno do ConfiOne) com "Genius Returns" (a origem real da migração)** — risco de nomenclatura já detectado dentro dos próprios documentos do projeto e reforçado nesta investigação; qualquer novo colaborador (humano ou agente) precisa ser avisado explicitamente.
- **Tratar número histórico como fato atual** — os próprios documentos alertam para isso (17 status Oracle, 66 motivos, 47 regras de Melissa/Melissa App), mas é um erro fácil de cometer sob pressão de prazo.
- **Confundir liberação comercial (Boss) ou default da V2 com migração concluída** — regra central repetida em todo o material, mas é exatamente o tipo de atalho que parece funcionar (tela abre, retorna 200) sem provar nada.
- **Duplicar motivo em vez de editar o existente** — gera inconsistência visível ao cliente final.
- **Selecionar duas lojas simultaneamente na V2 (ex. Melissa e Melissa App)** — grava no cliente errado; o risco é maior porque nomes de loja podem ser parecidos.
- **Vazamento de credencial** — tokens Oracle, senhas, cookies. Regra: nunca armazenar, só apontar "preenchimento manual pelo responsável".
- **Começar a frente Genius sem a sessão de ensino humana** — sem isso, qualquer ação (mesmo de leitura) corre o risco de mexer no cliente errado ou mal-interpretar uma tela nunca vista antes.
- **CSV de lojas malformado** — codificação errada, coluna renomeada, bairro faltante, CNPJ duplicado removido automaticamente (proibido) — quebra a importação ou cria dado incorreto silenciosamente.
- **Falta de executor real** — como não há automação de gravação implementada, toda gravação real hoje depende de um humano ou de um agente com navegador autenticado operando com muito cuidado; isso é lento e propenso a erro humano de clique, mas é o único caminho seguro disponível agora.
- **Contagem de teste divergente da documentação** — o próprio domínio local de rastreio tem uma discrepância entre o que a documentação afirma (52 testes) e o que foi encontrado no código (~49 asserções em 2 arquivos, nenhuma comportamental) — não é um risco de migração de cliente, mas é um sinal de que a documentação interna pode estar otimista em relação ao código; vale reconferir antes de confiar cegamente em qualquer afirmação de "testado".

---

## 10. Validação

Uma migração só deve ser considerada concluída para um cliente/loja quando, simultaneamente:

1. Todos os parâmetros identificados na origem foram extraídos e classificados (nenhum item crítico sem leitura).
2. Todo equivalente suportado pela V2 foi aplicado **e** confirmado após recarregar a tela (não apenas salvo — lido de volta).
3. Motivos foram reutilizados (editados), não duplicados — confirmado por nova consulta pós-salvamento.
4. E-mails suportados foram migrados com tags válidas preservadas e validados por pré-visualização + salvamento + recarregamento; os não suportados estão documentados como tal.
5. Lojas ainda não importadas têm CSV válido pelo modelo oficial da V2, e cada loja importada foi conferida individualmente nas abas de dados, endereço, detalhes, ponto de devolução e contrato com Correios.
6. O escopo (cliente/loja) foi confirmado positivamente antes de cada leitura/gravação/validação — não apenas uma vez no início.
7. Toda limitação (não suportado / não localizado / não utiliza / bloqueio de acesso) está registrada com explicação concreta, não com "conferir individualmente".
8. Existe aprovação humana registrada antes de qualquer gravação.
9. Nenhum token/senha/cookie/credencial foi armazenado em nenhum artefato.
10. Existe um relatório final legível por alguém que não participou do processo, específico daquele cliente e daquela origem (nunca misturando Genius com After Sale V1, nem um cliente com outro).

**Critério explícito de não-conclusão:** painel V2 abrir, exibir valor padrão, ou responder HTTP 200 não é evidência de nada — é textualmente citado nos documentos do projeto como o erro a evitar.

---

## 11. Lacunas

Depois de esgotar repositório, documentação interna e centrais de ajuda públicas, estas lacunas permanecem:

1. **Relação corporativa exata entre "Confi" e "ClearSale".** A documentação interna e uma reportagem (Exame) dizem que a Confi é dona da After Sale e comprou a Genius Returns; fontes externas mais antigas (Crunchbase/Baguete/IPNews) dizem que a ClearSale comprou a Send4/After Sale em 2020. Não encontrei uma fonte que explique diretamente se Confi é sucessora/subsidiária da ClearSale nesse negócio, ou uma relação diferente. **Por que importa:** pouco, operacionalmente — não muda o processo de migração — mas pode importar para entender de quem pedir aprovações/acesso em última instância. **Onde procurei:** repositório inteiro, WebSearch com múltiplas variações. **Melhor forma de obter:** perguntar diretamente ao responsável, ou pesquisar registro societário (CNPJ) das duas empresas.

2. **URL e acesso à Central de Ajuda da Genius Returns.** Não está registrada em nenhum lugar do repositório, e a busca pública não encontrou uma central de ajuda/documentação técnica pública da Genius Returns (só site institucional e um portal white-label de uma marca específica). **Por que importa:** é um pré-requisito explícito antes de iniciar a frente Genius. **Onde procurei:** repositório inteiro, WebSearch com várias variações de consulta. **Melhor forma de obter:** pedir diretamente ao responsável humano, ou ele mesmo abrir a central no navegador para eu ler.

3. **Estado real da migração de Melissa e Melissa App.** Os documentos tratam Melissa como referência/precedente e Melissa App como tarefa em andamento em 18/08/2026, mas os artefatos (planilha, relatório) vivem só no Google Drive, fora deste repositório, e não há nenhum relatório de conclusão salvo localmente. **Por que importa:** não sei se devo continuar de onde uma sessão anterior parou ou recomeçar a extração da Melissa App do zero. **Onde procurei:** repositório inteiro (grep por "Melissa"), `docs/reports/`, ledger, project state. **Melhor forma de obter:** o responsável abrir a pasta do Drive (`https://drive.google.com/drive/folders/1QBdR8w_weqNlwk0YdD0UDshQXBzp-H4o`) comigo, ou me dizer diretamente o estado atual.

4. **Cliente, produto e loja da primeira operação Genius.** Ainda não foram ensinados/confirmados por ninguém. **Por que importa:** é o primeiro pré-requisito da frente B. **Onde procurei:** todo o pacote de handoff da migração. **Melhor forma de obter:** o responsável escolher e ensinar ao vivo.

5. **Conteúdo da seção "Migração V1 → V2" da própria central de ajuda pública da After Sale V2** (`atendimento.tgroup.com.br/baseaftersale/`). Vi que essa seção existe (na navegação de um artigo), mas não a li — não é bem uma lacuna de fonte esgotada, é uma pista nova e promissora que descobri nesta investigação e que vale seguir antes de qualquer extração ao vivo. **Onde procurei:** cheguei a essa central via WebFetch, mas o escopo desta rodada não incluiu navegar essa seção específica. **Melhor forma de obter:** eu mesmo posso ler isso na próxima sessão via WebFetch/WebSearch, sem depender do responsável.

6. **Terceiro arquivo de teste pgTAP de ACL** citado na documentação (52 testes em 3 arquivos) mas não localizado (encontrei só 2 arquivos, ~49 asserções). **Por que importa:** pouco para a migração de clientes em si, mas é um sinal de que a documentação interna pode estar um pouco à frente do código — vale não confiar cegamente em números "aprovados" sem reconferir. **Onde procurei:** `supabase/tests/` inteiro (120 arquivos), por nome e por grep de conteúdo. **Melhor forma de obter:** perguntar ao autor da documentação (Codex/sessão anterior) ou reconferir rodando a suíte local.

7. **Se há mais de uma "marca" (brand) além de "genius" e "After Sale" realmente carregada no banco do ConfiOne**, além da tabela/UI de `brands` existir no código. Não é crítico para a migração externa, mas afeta o entendimento de quão pronta está a infraestrutura de suporte multimarca do ConfiOne. **Onde procurei:** código de `BrandsSettingsPage.tsx` e docs de arquitetura multimarca, sem consultar dados reais de seed/produção. **Melhor forma de obter:** consulta direta ao banco (fora do escopo desta investigação, que foi só leitura de arquivos).

---

## 12. Nível de confiança

| Área | Nota (0-100) | Justificativa |
|---|---|---|
| Genius Returns (produto/domínio) | **45** | Só tenho a base de conhecimento pública (voltada ao lojista final, sem cobrir configuração administrativa interna) e nenhuma central de ajuda oficial encontrada; nunca vi o painel administrativo da Genius. |
| After Sale V1 | **75** | Central de ajuda pública rica e diretamente lida (11 categorias, terminologia real), mais um caso de referência documentado (Melissa/Melissa App) — mas nunca vi o painel V1 ao vivo, e os números de referência são declaradamente desatualizados. |
| After Sale V2 | **65** | Central de ajuda pública lida (estrutura e um artigo completo), incluindo a descoberta de uma seção "Migração V1 → V2" ainda não explorada — mas nunca vi o painel V2 ao vivo nem confirmei quais campos realmente existem lá. |
| Migração V1 → V2 | **60** | O processo, as regras de interpretação (ex. "-30 dias") e os estados de aceite estão bem documentados e fazem sentido internamente — mas nunca foram exercitados de ponta a ponta neste repositório; o único artefato de "sucesso" (Melissa) está fora do meu alcance de verificação. |
| Migração Genius → V2 | **20** | Sei a estrutura do processo esperado (mesmo formato que V1→V2) e algum vocabulário de produto via a KB pública, mas não tenho acesso ao painel, não tenho central de ajuda oficial, e nenhum cliente/loja foi definido — é essencialmente teórico ainda. |
| Validação pós-migração | **70** | O critério é claro e bem especificado nos documentos (recarregar + reler + comparar, nunca aceitar HTTP 200) — a lacuna é só a falta de um caso real já validado dentro deste repositório para confirmar que o critério funciona na prática. |

---

## 13. Próximo passo recomendado

**Resposta: B — READY WITH GAPS**, mas **com granularidade diferente por frente**:

- **Frente A (After Sale V1 → V2):** consigo iniciar a descoberta somente leitura de um cliente real (ex. retomar Melissa App) com segurança, seguindo o runbook já existente — desde que o responsável confirme se devo continuar de onde a sessão anterior de Melissa App parou (lacuna 3) ou recomeçar, e desde que eu tenha acesso de navegador autenticado à V1 e à V2. As lacunas restantes (números históricos, de-para exato) são exatamente o tipo de coisa que a própria extração ao vivo resolve — não bloqueiam o início, só impedem que eu declare qualquer coisa como "migrado" antes da hora.

- **Frente B (Genius → V2):** **C — NOT READY.** Faltam dois pré-requisitos que nenhuma investigação documental resolve: a sessão de ensino ao vivo com um humano, e o endereço/acesso à central de ajuda oficial da Genius. Não devo tentar nenhuma ação nessa frente, nem mesmo leitura, até que isso seja fornecido.

**Antes de qualquer execução ao vivo em qualquer frente**, recomendo como próximo passo de baixo custo e alto retorno: eu ler a seção "Migração V1 → V2" da própria central de ajuda pública da After Sale V2 (lacuna 5) — é a única fonte que ainda não explorei nesta rodada e pode encurtar bastante o trabalho de de-para.
