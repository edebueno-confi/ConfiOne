# Prompt de continuidade para o Claude

Você dará continuidade a um projeto de migração operacional. Leia primeiro todos os arquivos da pasta:

`C:\Projetos\ConfiOne\handoffs\after-sale-migration-claude`

O objetivo imediato é concluir a migração da **Melissa App**, da After Sale V1 para a After Sale V2. Depois dessa entrega, haverá uma segunda frente, separada, para migrar clientes da **Genius** para a After Sale V2.

## Regra mais importante

Não misture Melissa, Melissa App e Genius.

Melissa App é a tarefa atual. Genius é uma origem diferente e só deve começar depois que o responsável humano ensinar o login, a escolha do cliente e o processo de extração.

## Frente 1: Melissa App

### Sistemas

- After Sale V1: `https://admin.troquefacil.com.br/`
- After Sale V2: `https://admin-v2.troquefacil.com.br/`
- Boss, somente como fonte auxiliar: `https://boss.send4.com.br/ecommerces`

### Fonte e destino

- A V1 é a fonte efetiva da configuração do cliente.
- A V2 é o destino.
- Valores padrão da V2 não comprovam que a migração foi feita.
- Boss não substitui a configuração efetiva observada na V1.

### Segurança

1. Use o perfil corporativo correto do Chrome.
2. Mantenha apenas uma aba da V1 e uma aba da V2.
3. Nunca altere ou salve algo na V1, no Boss ou no código.
4. Na V2, só grave depois de extrair, comparar e confirmar o escopo.
5. Antes de cada leitura, edição, salvamento e validação, confirme a loja.
6. Na V1, confirme `Melissa App` no seletor e no conteúdo da tela.
7. Na V2, selecione somente `Melissa App`, nunca Melissa e Melissa App juntas.
8. Após trocar de loja, recarregar ou salvar, confirme novamente o escopo.
9. Não registre tokens, senhas, cookies, JWTs ou credenciais. O responsável preencherá secrets manualmente.

### Execução

Faça a extração completa da V1, incluindo estados marcados e desmarcados, motivos públicos e administrativos, prazos, status, reembolso, logística, Omni, integrações, Correios, lojas, configurações de loja, customizações, páginas e e-mails com HTML.

Para cada parâmetro, registre:

- módulo e nome na V1;
- configuração observada;
- destino equivalente na V2;
- valor aplicado;
- situação final;
- evidência;
- validação após recarregar.

Não crie motivos duplicados. Se o motivo já existir na V2, edite o cadastro existente. `-30 dias` na V1 representa motivo exclusivo do painel administrativo, não prazo negativo. Na V2, use prazo em branco e a opção de visibilidade administrativa equivalente.

Para e-mails, liste todos os eventos e modelos da V1, inclusive HTML avançado. Migre o que a V2 suportar, preserve tags válidas, valide por pré-visualização, salve e recarregue. O que não existir na V2 não bloqueia a migração, mas deve aparecer no relatório como não suportado.

Para lojas, use o modelo oficial baixado na V2. O CSV deve estar em UTF-8, conter todos os campos obrigatórios, inclusive bairro, não ter códigos duplicados e não incluir lojas já importadas. CNPJ repetido isoladamente deve ser sinalizado, não removido automaticamente. Código ou endereço conflitante exige revisão.

Depois do cadastro, confira cada loja nas abas de dados, endereço, detalhes, ponto de devolução e contrato com Correios. A importação do CSV não substitui a conferência dos parâmetros internos.

### Estados permitidos

- Migrado
- Migrado com ajuste
- Migrado parcialmente
- Não suportado pela V2
- Não localizado
- Não utiliza
- Bloqueio de acesso

Não use `conferir individualmente` como explicação. Informe o campo, o valor, o destino e o motivo concreto da pendência.

### Entrega Melissa App

Crie uma pasta própria no Drive, sem substituir os documentos Melissa, contendo:

- relatório humano resumido;
- planilha com dashboard;
- checklist detalhado por módulo;
- aba de motivos;
- aba de e-mails com HTML e resultado;
- aba de lojas e conferência do CSV;
- aba de pendências e limitações;
- evidências de validação pós-save.

## Frente 2: Genius para After Sale V2

Essa frente começa somente depois da conclusão documentada da Melissa App.

Você ainda não conhece o fluxo operacional completo da Genius. Portanto, não execute login, seleção de cliente, extração ou alteração na Genius sem receber instrução do responsável humano.

O humano deverá ensinar, na prática:

1. como acessar e autenticar na Genius;
2. como escolher o cliente correto;
3. como confirmar o cliente e o produto na tela;
4. como navegar por todos os módulos;
5. como extrair dados por DOM, tela ou exportação;
6. quais telas são somente leitura;
7. como identificar lojas, integrações, regras, motivos, e-mails e parâmetros;
8. como reconhecer a configuração efetivamente usada pelo cliente.

Antes da primeira escrita, faça uma sessão de descoberta somente leitura e documente o fluxo aprendido.

### Centrais de ajuda da frente Genius

Leia e compare:

1. Central de Ajuda da Genius;
2. Central de Ajuda da After Sale V1;
3. Central de Ajuda da After Sale V2.

As centrais têm funções diferentes:

- Genius explica a origem Genius;
- After Sale V1 explica a origem legada After Sale;
- After Sale V2 ajuda a localizar o destino atual.

Não trate um artigo da V1 ou da V2 como prova da configuração do cliente. A configuração real vem da extração do ambiente de origem.

O endereço da Central Genius ainda deverá ser fornecido ou aberto pelo responsável. Não invente URL.

### Regras para Genius

- Não reutilize automaticamente o de-para da Melissa.
- Não presuma que nomes iguais tenham o mesmo significado.
- Não misture dados Genius com dados After Sale.
- Não altere a Genius durante a descoberta.
- Não copie secrets.
- Não considere recurso liberado como recurso utilizado.
- Registre separadamente não suportado, não localizado, não utilizado e bloqueio de acesso.
- Crie documentação própria para cada cliente Genius.

## Critério final

Só declare uma frente concluída quando a origem tiver sido extraída, os equivalentes suportados tiverem sido aplicados, cada alteração tiver sido validada após recarregar e a documentação explicar claramente o que foi migrado, adaptado, parcialmente migrado, não suportado ou não localizado.

Não declare 100% quando houver parâmetro crítico sem leitura, sem destino conhecido ou sem validação.

Arquivos de referência locais:

- `PROMPT_CLAUDE_MELISSA_APP.md`
- `RUNBOOK_MIGRACAO.md`
- `DEPAR_EVIDENCIAS.md`
- `GENIUS_PARA_V2_PREBRIEF.md`
- `CENTRAIS_AJUDA_E_FONTES.md`

Pasta canônica Melissa no Drive:

`https://drive.google.com/drive/folders/1QBdR8w_weqNlwk0YdD0UDshQXBzp-H4o`
