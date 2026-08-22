# Handoff de migração: Genius e After Sale V1 para V2

**Produto de destino do contexto local:** ConfiOne
**Data:** 2026-08-20
**Status:** documentação de conhecimento e preparação operacional, não declaração de migração concluída.

## Como o Cloud deve usar este documento

Este é o ponto de entrada único para o tema. Leia primeiro este arquivo e depois as fontes indicadas em [Mapa de fontes locais](#mapa-de-fontes-locais).

O documento não autoriza login, scraping, alteração na origem, alteração no Boss, gravação na V2, envio de CSV, mudança de secrets, escrita externa ou execução de migração. Ele consolida conhecimento, regras de segurança, contratos locais e pendências para uma operação futura com aprovação humana e evidência.

## Resumo executivo

Existem duas origens diferentes:

1. **After Sale V1 → After Sale V2:** a configuração efetiva observada na V1 é a fonte de verdade operacional. A V2 é o destino autorizado. Defaults da V2 e liberações do Boss não provam uso ou equivalência.
2. **Genius → After Sale V2:** é uma frente separada. Genius não deve herdar automaticamente o de-para de Melissa, Melissa App ou outro cliente After Sale V1. Primeiro o responsável deve ensinar login, seleção do cliente, produto e extração. A primeira sessão deve ser somente leitura.

O padrão seguro é:

```text
confirmar identidade e escopo
  -> descobrir e extrair a origem sem alterar
  -> classificar evidências e limitações
  -> montar de-para por parâmetro
  -> obter aprovação humana
  -> gravar somente na V2 autorizada
  -> recarregar e validar cada alteração
  -> documentar resultado, divergências e pendências
```

O ConfiOne já possui um domínio backend para registrar origens, lojas, snapshots, evidências, projetos, aprovação, execução contratual e validação pós-save. Esse domínio ainda não executa login, scraping ou escrita externa.

## O que é fato, referência histórica e hipótese

### Fatos confirmados no repositório

- Há handoffs operacionais específicos em `handoffs/after-sale-migration-claude/`.
- O contrato local diferencia `after_sale/v1` de `genius/current` e proíbe equivalências automáticas entre origens.
- O escopo de loja deve ser individual, explícito e ligado ao cliente e à origem.
- A documentação separa descoberta, extração, de-para aprovado, escrita e validação.
- A URL da Central de Ajuda operacional da Genius não está registrada neste pacote.
- Não há autorização ou evidência local de escrita em Genius, After Sale V1, Boss ou After Sale V2 neste lote documental.

### Referências históricas que exigem rechecagem ao vivo

- Melissa App: referência de 17 status Oracle observados no DOM.
- Melissa App: referência de 66 motivos ativos, 4 públicos e 62 administrativos.
- Melissa: referência de 47 regras V2 por e-commerce em auditoria anterior.
- IDs e sites Oracle históricos: Melissa `889` / `B2CMN`; Melissa App `1445` / `B2CMNApp`.
- Quatro grupos principais de motivos foram observados em ambas as lojas, mas valores e quantidades devem ser extraídos novamente.

Esses números orientam a conferência. Não são prova do estado atual nem podem ser copiados para outro cliente.

### Hipóteses proibidas

- Não presumir que nomes iguais tenham o mesmo significado entre Genius, V1 e V2.
- Não presumir que um default na V2 foi migrado.
- Não presumir que uma funcionalidade liberada no Boss seja usada pelo cliente.
- Não presumir que um artigo de ajuda prove a configuração efetiva.
- Não presumir que cliente, loja ou produto atual sejam os mesmos da última execução.

## Precedência das evidências

Use esta ordem para decidir uma configuração:

1. tela ou DOM atual da origem do cliente;
2. exportação atual da origem;
3. tela ou DOM atual do destino V2;
4. Central de Ajuda do produto de origem;
5. Central de Ajuda After Sale V1;
6. Central de Ajuda After Sale V2;
7. documentação interna do ConfiOne;
8. referência histórica ou hipótese explicitamente marcada.

Documentação de ajuda explica significado, nomenclatura ou localização de um campo. Não prova que o cliente usa o recurso. Em conflito, registre ambas as evidências e peça decisão humana quando a diferença alterar o resultado.

## Frente A: After Sale V1 para After Sale V2

### Sistemas conhecidos

- V1: `https://admin.troquefacil.com.br/`
- V2: `https://admin-v2.troquefacil.com.br/`
- Boss, somente fonte auxiliar: `https://boss.send4.com.br/ecommerces`
- Central V1: `https://atendimento.tgroup.com.br/knowledge/base-de-conhecimento`
- Central V2: `https://atendimento.tgroup.com.br/baseaftersale/como-abrir-uma-solicita%C3%A7%C3%A3o-de-reversa`

### Fonte, destino e limites

- A V1 representa a configuração efetiva do cliente.
- A V2 é o destino operacional autorizado.
- O Boss ajuda a localizar liberações ou referências antigas, mas não substitui a V1 e não é destino.
- A V2 pode começar com defaults derivados de `RuleDefinitions`, `RetentionDefinitions` e `LeadTimeDefinitions`. Compare-os com a V1 antes de aceitá-los.
- Classifique cada parâmetro como `copiar`, `adaptar`, `manter default`, `sem equivalente` ou `confirmar`.

### Controle de identidade e escopo

Antes de cada leitura, comparação, edição, salvamento e validação:

- confirme o perfil e o usuário correto do navegador;
- na V1, use `Trocar e-commerce` e confirme cliente no seletor e no cabeçalho ou conteúdo;
- na V2, selecione somente uma loja, confirme o nome visível e use `companyId` ou identificador quando exposto;
- não use URL, rota, nome da aba, seleção anterior, spinner ou tela em branco como prova;
- após trocar de loja, recarregar, voltar ao seletor ou salvar, confirme tudo de novo;
- com seleção múltipla, cliente errado ou identificador divergente, pare sem salvar, corrija o escopo e reconfirme.

Melissa e Melissa App podem ter nomes, dados e estruturas parecidas. Nome sozinho não identifica o destino.

### Extração mínima da V1

Extraia o que estiver presente, marcado ou desmarcado, com valor, estado, visibilidade, dependência e evidência:

- configurações iniciais, status, busca, prazos e políticas;
- motivos de troca, devolução, públicos e administrativos;
- cancelamento, reembolso, voucher e devolução;
- logística reversa, coleta, postagem e transportadoras;
- Omni, retorno para lojas e integrações;
- Oracle, módulos financeiro, fidelização ou assistência quando existirem;
- customização visual, páginas, conteúdo e e-mails;
- lojas, endereço, detalhes, ponto de devolução e contrato com Correios;
- qualquer outro módulo visível em Configurações.

### De-para de parâmetros

| Evidência na V1 | Destino procurado na V2 | Decisão |
| --- | --- | --- |
| Parâmetro ativo | Campo equivalente | Aplicar e validar após recarregar |
| Parâmetro inativo | Campo equivalente | Manter inativo quando a equivalência for clara |
| Motivo público | Motivo de troca ou devolução | Reutilizar cadastro, sem duplicar |
| Motivo administrativo | Visibilidade exclusiva no painel | Prazo em branco e regra administrativa equivalente |
| E-mail com evento correspondente | Modelo ou evento equivalente | Migrar assunto, corpo e tags válidas |
| E-mail sem destino | Nenhum equivalente | Registrar como não suportado |
| Liberação no Boss | Recurso potencial | Confirmar uso na V1 |
| Token ou senha | Nenhum campo documental | Preenchimento manual pelo responsável |

### Motivos e a regra dos 30 dias

O marcador histórico `-30 dias` na V1 representa motivo exibido somente no painel administrativo. Não é prazo negativo.

Na V2, a representação esperada é prazo em branco e a opção equivalente a `Exibir motivo apenas no painel administrativo` habilitada. Compare nome, tipo, coleta, evidência, comentário, aprovação automática e efeitos restantes.

Localize primeiro o motivo equivalente e edite o cadastro existente. Não crie duplicatas. Não desative defaults sem evidência da V1 ou decisão de negócio. Após salvar, recarregue e audite duplicidade, ausência e visibilidade.

### Status e Oracle

Extraia os status Oracle novamente no cliente atual. A referência corrigida da Melissa App contém 17 status observados no DOM, mas a contagem da Melissa precisa ser confirmada separadamente. Use ID de loja e site juntos quando disponíveis. Não confunda `custom_seller_field`, `locationId`, `siteId` ou seller com URL de API.

Tokens Oracle nunca entram no relatório. O responsável preenche secrets manualmente no ambiente autorizado.

### E-mails

Para cada evento ou modelo da V1, registre evento, estado, assunto, HTML original quando disponível, tags, destino V2 e resultado. Preserve tags válidas como `{{company_name}}`, `{{exchange_return_terms_link}}` e `{{order_status}}`; não invente substituições. Pré-visualize, salve, recarregue e valide. Ausência de modelo na V2 não bloqueia, mas deve ser documentada.

### Lojas e CSV

Use exclusivamente o modelo oficial baixado em `V2 > Configurações > Lojas > Importar > Baixar modelo`.

- Use UTF-8, preserve acentos e mantenha nomes de colunas idênticos.
- Preencha obrigatórios, inclusive bairro, sem inventar valores.
- Não mantenha códigos duplicados; se código ou endereço conflitarem, separe para revisão.
- CNPJ repetido isoladamente deve ser sinalizado, não removido automaticamente.
- Não inclua lojas já importadas. Valide quantidade, códigos, endereços, CNPJs e e-commerce.

CSV não substitui a conferência da loja na V2. Depois de importar, confira `Dados da loja`, `Endereço da loja`, `Detalhes da loja`, `Ponto de devolução` e `Contrato com Correios`.

### Estados permitidos

| Estado | Significado |
| --- | --- |
| `Migrado` | Equivalente aplicado e conferido após recarregar. |
| `Migrado com ajuste` | Mesma finalidade, com nomenclatura ou representação diferente. |
| `Migrado parcialmente` | Somente parte da regra foi representada. |
| `Não suportado pela V2` | A V2 não oferece o recurso. |
| `Não localizado` | Há evidência na origem, mas o destino não foi encontrado. |
| `Não utiliza` | Recurso disponível ou liberado, sem evidência de uso. |
| `Bloqueio de acesso` | Leitura ou gravação depende de acesso ou dado do responsável. |

### Critério de conclusão da frente V1

Não declarar 100% com parâmetro crítico sem leitura, destino conhecido ou validação pós-save. Limitações da V2 podem existir, desde que estejam explícitas e a parte suportada esteja validada.

## Frente B: Genius para After Sale V2

### Por que é uma frente separada

Genius pode ter produtos, integrações, nomenclaturas, regras, telas, clientes e conceitos diferentes da After Sale V1. O de-para deve ser construído por cliente e funcionalidade. O mapa de Melissa ou Melissa App é referência de método, nunca configuração pronta.

### Pré-requisito humano

Antes da operação Genius, o responsável deve ensinar: login; seleção do cliente; confirmação de cliente, produto e identificadores; navegação; extração por DOM, tela ou exportação; telas somente leitura; e reconhecimento de configuração realmente utilizada.

O link da Central de Ajuda Genius não está registrado. O responsável deve fornecê-lo ou abri-lo no navegador. Não adivinhe a URL.

### Sequência obrigatória

1. Confirme perfil, usuário e sessão.
2. Aprenda login, seleção e contexto com o humano.
3. Faça navegação completa somente leitura.
4. Extraia inventário, parâmetros e evidências do cliente Genius.
5. Leia a Central Genius, a Central V1 e a Central V2.
6. Monte de-para específico por cliente e loja.
7. Obtenha aprovação humana por lote.
8. Grave somente na V2 autorizada.
9. Recarregue e valide cada alteração.
10. Entregue relatório independente de Melissa e Melissa App.

### Inventário mínimo Genius

Registrar, conforme existir: produto e versão; cliente, e-commerce e lojas; integrações; transportadoras e postagem; logística reversa; regras, prazos e aprovações; motivos e visibilidade; reembolso, voucher e devolução; notificações e e-mails com HTML; endereços; recursos liberados versus utilizados; dependências e limitações da V2.

### Regras de segurança Genius

- Não alterar Genius durante descoberta.
- Confirmar cliente antes de cada leitura e após troca de contexto.
- Não transportar tokens, senhas, cookies ou secrets.
- Não considerar equivalência por nome parecido.
- Não considerar recurso liberado como recurso utilizado.
- Não misturar evidência Genius com After Sale V1, Melissa ou Melissa App.
- Separar `não suportado`, `não localizado`, `não utiliza` e `bloqueio de acesso`.
- Criar documentação própria para cada cliente Genius.

## Registro mínimo de cada evidência

Cada linha do checklist deve conter cliente, origem e versão, loja e identificador, módulo, parâmetro, valor observado, fonte (`DOM`, `tela`, `exportação`, `central de ajuda`, `documento interno` ou `hipótese`), destino V2, valor aplicado, situação, aprovação, validação pós-reload e divergência ou limitação.

O inventário deve preservar origem, evidência, valor anterior, valor de destino, regra equivalente, decisão, executor autorizado e validação. Não registrar secrets.

## Contrato local do ConfiOne

O documento `docs/CUSTOMER_OPERATIONS_MIGRATION_DOMAIN_V1.md` descreve o suporte de backend para registrar a operação:

- `customer_account_sources`: origem e versão;
- `customer_account_stores`: loja por origem, cliente e identificador externo;
- `customer_inventory_snapshots`: inventário versionado e idempotente;
- `customer_inventory_feature_observations`: contratado, liberado, observado e uso confirmado;
- `customer_operation_evidence`: metadados de evidências privadas sem secrets;
- `customer_projects` e `customer_migration_projects`: projeto e migração para V2;
- `customer_migration_project_stores`: escopo explícito;
- avaliações de elegibilidade, aprovações, lotes, levas, execução e validação pós-save;
- comentários e atividades para decisões e histórico.

Limites atuais: `CustomerOperationsPanel` é leitura operacional aditiva; não há login automático, scraping ou escrita em Genius, V1, Boss ou V2. Escritas locais exigem perfil autorizado, RPCs auditáveis, elegibilidade, aprovação e lojas explicitamente vinculadas.

## Entregáveis por cliente

1. Relatório humano independente.
2. Checklist por módulo e parâmetro.
3. Inventário de lojas.
4. CSV pelo modelo oficial V2, quando aplicável.
5. Motivos públicos e administrativos.
6. E-mails, HTML, tags e resultado.
7. De-para aprovado.
8. Evidências pós-save.
9. Pendências, limitações e alertas.
10. Itens não suportados, não localizados, não utilizados e bloqueados.

Não misture Melissa, Melissa App e Genius. Para Genius, crie documentação própria por cliente.

## Registro da migração no ConfiOne

O domínio local deve ser usado para preservar rastreabilidade, não para inferir equivalência:

```text
origem confirmada
  -> loja e identificador confirmados
  -> snapshot sanitizado
  -> observações por funcionalidade
  -> projeto de migração V2
  -> avaliação de elegibilidade
  -> aprovação
  -> lote/onda
  -> solicitação de execução
  -> validação pós-save e divergências
```

## Mapa de fontes locais

### Ponto de entrada e pacote operacional

- [Este handoff consolidado](./AFTER_SALE_V1_V2_GENIUS_MIGRATION_HANDOFF.md)
- [README do pacote operacional](../handoffs/after-sale-migration-claude/README.md)
- [Runbook V1 → V2](../handoffs/after-sale-migration-claude/RUNBOOK_MIGRACAO.md)
- [Pré-brief Genius → V2](../handoffs/after-sale-migration-claude/GENIUS_PARA_V2_PREBRIEF.md)
- [Prompt de continuidade Melissa App e Genius](../handoffs/after-sale-migration-claude/PROMPT_CLAUDE_CONTINUIDADE_MELISSA_APP_E_GENIUS.md)
- [De-para e evidências](../handoffs/after-sale-migration-claude/DEPAR_EVIDENCIAS.md)
- [Centrais de ajuda e fontes](../handoffs/after-sale-migration-claude/CENTRAIS_AJUDA_E_FONTES.md)
- [Prompt completo da frente Melissa App](../handoffs/after-sale-migration-claude/PROMPT_CLAUDE_MELISSA_APP.md)
- [Artefatos e evidências](../handoffs/after-sale-migration-claude/ARTEFATOS_EVIDENCIAS.md)

### Contratos e estado do ConfiOne

- [Customer Operations and Migration Domain V1](./CUSTOMER_OPERATIONS_MIGRATION_DOMAIN_V1.md)
- [PROJECT_STATE](./PROJECT_STATE.md)
- [Política de atualização documental](./DOCUMENTATION_UPDATE_POLICY.md)
- [Runbook de governança documental](./DOCUMENTATION_GOVERNANCE_RUNBOOK.md)
- [Ledger documental](./DOCUMENTATION_LEDGER.md)
- [Índice geral](./README.md)
- [Estado atual de implementação](./context-handoff/03_CURRENT_IMPLEMENTATION_STATE.md)
- [Governança de conteúdo](./CONTENT_OPERATIONS_GOVERNANCE.md)
- [Governança de IA](./AI_GOVERNANCE.md)

### Relatórios relacionados à palavra Genius

Estes relatórios tratam da Central de Ajuda interna do ConfiOne, não da configuração operacional de clientes na plataforma Genius. Não substituem a Central Genius nem a extração do cliente.

- [Genius Help Center Executive Checkpoint](./reports/GENIUS_HELP_CENTER_EXECUTIVE_CHECKPOINT.md)
- [Genius Help Center Readiness Report](./reports/GENIUS_HELP_CENTER_READINESS_REPORT.md)
- [Help Center Content Viewer Access](./reports/HELP_CENTER_CONTENT_VIEWER_ACCESS_2026-07-20.md)
- [Help Center Improvement Audit](./reports/HELP_CENTER_IMPROVEMENT_AUDIT_2026-08-12.md)

### Artefatos externos referenciados

- Pasta canônica Melissa no Drive: `https://drive.google.com/drive/folders/1QBdR8w_weqNlwk0YdD0UDshQXBzp-H4o`
- Links da planilha e do relatório Melissa: `handoffs/after-sale-migration-claude/ARTEFATOS_EVIDENCIAS.md`.
- A busca no checkout atual não encontrou `outputs/aftersale-migracao-canonica.md` nem `outputs/aftersale-migracao-canonica.xlsx`; não tratar esses caminhos como arquivos locais disponíveis.

Trate esses artefatos como referência de formato e histórico. Para execução atual, confirme acesso, cliente, loja, valores e aprovação.

## Pendências e bloqueios

- URL e acesso à Central Genius ainda precisam ser fornecidos pelo responsável.
- Cliente Genius, produto, loja e identificadores da primeira operação ainda precisam ser ensinados e confirmados.
- Números históricos de Melissa e Melissa App exigem reextração ao vivo.
- Não há inventário atual de cada cliente externo neste repositório.
- O ConfiOne tem leitura operacional e contratos de controle, mas não executor externo implementado.
- Não declarar migração concluída porque painel V2 abre, exibe defaults ou retorna HTTP 200.

## Checklist final de aceite

- [ ] Perfil e conta corretos confirmados.
- [ ] Cliente, origem, versão e loja confirmados por identificador positivo.
- [ ] Origem extraída integralmente sem alteração.
- [ ] Evidências classificadas por proveniência.
- [ ] De-para produzido por parâmetro.
- [ ] Recursos liberados separados de recursos utilizados.
- [ ] Itens sem equivalente ou não localizados registrados.
- [ ] Aprovação humana registrada antes da escrita.
- [ ] Escrita feita somente no destino V2 correto.
- [ ] Cada alteração recarregada e validada.
- [ ] Motivos sem duplicidade e administrativos representados corretamente.
- [ ] E-mails, tags e limitações documentados.
- [ ] CSV validado pelo modelo oficial V2, quando aplicável.
- [ ] Nenhum secret, token, cookie ou senha registrado.
- [ ] Relatório independente por cliente e origem entregue.

## Resultado deste documento

Este arquivo organiza o conhecimento e aponta as fontes para o Cloud. Não afirma que uma migração Genius ou After Sale V1 → V2 esteja concluída. A próxima ação segura é escolher um cliente e uma origem, confirmar acesso e executar somente descoberta e extração, sem salvar nada, produzindo o primeiro inventário auditável.
