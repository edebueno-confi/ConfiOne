# Prompt de execução para o Claude

Você é responsável por concluir a migração da loja **Melissa App** da After Sale V1 para a After Sale V2. A V1 é a fonte efetiva da configuração do cliente. A V2 é o destino. O objetivo é replicar na V2 tudo que a V2 consegue suportar, registrar claramente o que não existe ou não foi localizado e entregar uma documentação que uma pessoa que não participou do processo consiga revisar.

## Contexto e fontes

- V1: `https://admin.troquefacil.com.br/`
- V2: `https://admin-v2.troquefacil.com.br/`
- Se necessário, Boss: `https://boss.send4.com.br/ecommerces`
- Projeto local ConfiOne: `C:\Projetos\ConfiOne`
- Pasta canônica da documentação Melissa: `https://drive.google.com/drive/folders/1QBdR8w_weqNlwk0YdD0UDshQXBzp-H4o`

Use o Desktop Commander para controlar o navegador. Antes de começar, confirme que está usando o perfil correto do Chrome, o usuário corporativo `ede.oliveira@confi...`, e que a sessão está autenticada.

## Regras de segurança obrigatórias

1. Mantenha no máximo uma aba aberta para a V1 e uma aba aberta para a V2. Não abra outra aba com a mesma URL.
2. Na V1, altere nada. Não clique em salvar, editar e salvar, excluir, desativar ou qualquer ação que persista dados.
3. O código do produto e o repositório são somente leitura nesta atividade.
4. O Boss é fonte auxiliar para entender liberações e dados antigos. Ele não substitui a configuração efetiva da V1 e não é destino de migração.
5. Na V2, só grave depois de concluir a leitura, o de-para e a conferência do escopo.
6. Nunca confie apenas na URL, na rota, no nome da aba ou em uma tela em branco para identificar a loja.
7. Antes de cada leitura, comparação, edição, salvamento e validação, confirme positivamente:
   - V1: a loja selecionada é Melissa App no seletor de e-commerce e no cabeçalho ou conteúdo da tela;
   - V2: somente Melissa App está selecionada no seletor de e-commerces, sem Melissa, e o nome visível da conta corresponde ao destino.
8. Depois de trocar de loja, salvar, recarregar ou navegar para uma tela sensível, repita a validação. Se houver divergência ou seleção múltipla, pare sem salvar, corrija o escopo e valide de novo.
9. Nunca copie, armazene ou publique tokens, senhas, cookies, JWTs ou credenciais. O responsável preencherá manualmente os segredos que faltarem.

## Ordem de trabalho

### 1. Preparar a evidência

Leia os documentos da pasta canônica Melissa para entender o formato final, mas não trate seus números como prova atual da Melissa App. Eles são referência de estrutura e de aprendizados.

Crie uma área separada para Melissa App. Não misture as lojas nem substitua os documentos da Melissa.

### 2. Extrair a V1 inteira, sem alterar

Faça uma extração estruturada, preferencialmente pelo DOM e pelos dados carregados pela tela, sem depender somente de cópia visual. Navegue por todas as áreas disponíveis no painel V1 e registre tanto o que está marcado quanto o que está desmarcado.

Módulos mínimos:

- configurações iniciais;
- status e campo de busca;
- prazos e políticas de abertura;
- motivos de troca;
- motivos de devolução;
- motivos exclusivos do painel administrativo;
- cancelamentos;
- regras de reembolso;
- logística reversa e modalidades de retorno;
- coleta, postagem e transportadoras;
- configurações Omni e retorno para lojas;
- integrações, incluindo Oracle, sem guardar segredo;
- módulos financeiro, fidelização e assistência quando existirem no painel;
- customização visual, páginas e conteúdo;
- e-mails de modelo e e-mails condicionais;
- lojas, endereço, detalhes da loja, ponto de devolução e contrato com Correios;
- qualquer outro módulo visível em `Configurações`.

Para cada item registre, no mínimo:

- módulo e nome exibido na V1;
- valor ou estado observado;
- se está ativo ou inativo;
- se é visível ao consumidor ou apenas ao painel administrativo;
- dependências e observações;
- evidência da tela ou do DOM;
- destino equivalente procurado na V2.

### 3. Extrair motivos corretamente

Não crie motivos novos se o motivo equivalente já existir na V2. Primeiro localize e edite o cadastro existente.

Inclua motivos públicos e motivos exclusivos do painel administrativo. Na V1, a indicação visual de `-30 dias` representa motivo administrativo, não prazo negativo. Na V2, isso deve ser representado com prazo em branco e a opção equivalente a `Exibir o motivo exclusivamente no painel administrativo`.

Compare nome, tipo, visibilidade, prazo, coleta, evidência, comentário, aprovação automática, devolução desnecessária e demais efeitos. Não use um motivo apenas parecido sem explicar a equivalência.

Confirme ao vivo a quantidade de motivos da Melissa App. A referência histórica corrigida registra 17 status Oracle na Melissa App e 66 motivos ativos, sendo 4 públicos e 62 administrativos, mas esses números devem ser reconferidos no ambiente atual.

### 4. Extrair e-mails

Liste todos os modelos e eventos de e-mail da V1, incluindo e-mails condicionais, modelos desabilitados e HTML avançado quando estiver disponível.

Para cada e-mail registre:

- evento da V1;
- habilitado ou desabilitado;
- assunto;
- corpo HTML original, preservado em arquivo ou coluna própria;
- tags utilizadas;
- destino equivalente na V2;
- se o modelo existe na V2;
- se foi migrado, adaptado, considerado fora de escopo por não existir na V2 ou ficou pendente.

Na V2, preserve tags válidas e valide o resultado por pré-visualização, salvamento e recarregamento. Se uma tag não existir na V2, não invente substituição. Registre o evento e a limitação. E-mail ausente na V2 não bloqueia a conclusão da migração, mas deve aparecer no relatório final.

### 5. Extrair lojas e montar CSV

Use o export da V1 e a conferência tela a tela para completar todos os campos necessários. O CSV deve seguir exclusivamente o modelo oficial baixado no painel V2 em `Configurações > Lojas > Importar > Baixar modelo`.

Antes de entregar o CSV:

- use UTF-8;
- preserve acentos;
- mantenha exatamente os nomes das colunas do modelo V2;
- preencha todos os campos obrigatórios, inclusive bairro;
- não invente valores;
- remova códigos de loja repetidos;
- remova conflitos de endereço e código;
- CNPJ repetido isoladamente não é motivo suficiente para remover um registro, mas deve ser destacado para revisão;
- não inclua lojas já importadas na V2;
- valide quantidade de linhas, códigos, endereços, CNPJs e e-commerce;
- gere também uma versão legível para conferência humana.

O CSV não substitui a configuração interna da loja. Após o cadastro, cada loja deve ser conferida nas abas `Dados da loja`, `Endereço da loja`, `Detalhes da loja`, `Ponto de devolução` e `Contrato com Correios`. Os parâmetros marcados na V1 precisam ser aplicados no cadastro equivalente da V2 quando a V2 oferecer esse campo.

### 6. Fazer o de-para e aplicar na V2

Para cada parâmetro ativo na V1:

1. identifique a tela e o campo equivalente na V2;
2. registre o valor da V1 e a ação correspondente na V2;
3. confira se a V2 já contém o valor por padrão;
4. mesmo que já exista, considere migrado somente depois de confirmar que o valor atende à V1;
5. se já houver um motivo, edite o existente em vez de duplicar;
6. salve somente na V2;
7. recarregue e confira o valor persistido;
8. registre a evidência e o resultado.

Use estes estados:

- `Migrado`: equivalente localizado e conferido na V2;
- `Migrado com ajuste`: equivalente localizado, mas a V2 usa outra nomenclatura ou forma de representação;
- `Migrado parcialmente`: parte da configuração foi aplicada;
- `Não suportado pela V2`: a V2 não oferece o recurso;
- `Não localizado`: há indício na V1, mas o destino não foi encontrado;
- `Não utiliza`: recurso liberado ou disponível, mas não há evidência de uso pelo cliente;
- `Bloqueio de acesso`: a ação depende de permissão ou dado que o responsável precisa fornecer.

O valor default da V2 não é evidência de migração. A fonte é sempre a V1.

### 7. Integrações

Transporte os campos não sensíveis da integração. Para Oracle, confira loja, site, seller e demais opções no corpo de configuração. Não copie a URL de API como se fosse Store URL. Não registre token. O usuário preencherá o token manualmente.

Regra de segurança da troca de loja: Melissa e Melissa App podem ter cadastros parecidos, mas nunca trate o nome sozinho como identificação. Confirme o e-commerce selecionado, o código ou identificador da loja e os dados do cliente antes de qualquer salvamento.

### 8. Validar depois de salvar

Para cada módulo alterado na V2:

- recarregue a tela;
- confirme novamente o e-commerce Melissa App;
- confira o valor persistido;
- verifique que não houve duplicidade;
- confirme que a alteração não ocorreu na Melissa;
- registre o resultado.

Se a tela travar ou retornar ao seletor, não repita ações às cegas. Recarregue, confirme o escopo e continue apenas após a tela estar estável.

## Documentação final obrigatória

Crie na pasta de Melissa App:

1. uma planilha de migração com dashboard simples;
2. uma aba `Checklist por módulo` com todos os parâmetros da V1, valor observado, destino V2, situação e observação;
3. uma aba `Motivos` com motivos públicos e administrativos;
4. uma aba `E-mails` com evento, HTML original, modelo V2 e resultado;
5. uma aba `Lojas` com o CSV e a conferência dos campos;
6. uma aba `Pendências e limitações` separando o que foi concluído do que não é suportado ou não foi localizado;
7. um relatório humano resumido, escrito como se fosse o primeiro relatório para quem não participou do processo.

Não escreva sobre conversas internas, tentativas anteriores, contagem antiga ou histórico de erros. Explique fatos concretos: qual parâmetro existia na V1, onde foi colocado na V2, o que ficou diferente e por quê.

## Critérios de conclusão

Considere a migração concluída quando:

- todos os parâmetros da V1 tiverem sido extraídos e classificados;
- todos os equivalentes suportados pela V2 tiverem sido aplicados e conferidos;
- motivos existentes tiverem sido reutilizados sem duplicação;
- e-mails suportados tiverem sido migrados e os demais catalogados;
- lojas ainda não importadas tiverem CSV válido baseado no modelo oficial da V2;
- parâmetros internos dos cadastros de loja tiverem sido conferidos;
- escopo Melissa App tiver sido confirmado em todas as ações;
- documentação e evidências estiverem completas;
- limitações e pendências estiverem separadas do que foi efetivamente concluído.

Não declare 100% quando houver item crítico sem leitura, sem destino conhecido ou sem validação após o salvamento. A migração pode ser concluída com limitações de suporte da V2, desde que elas estejam claramente registradas e não impeçam a operação suportada.

## Próxima frente autorizada somente após Melissa App: Genius para After Sale V2

Depois de concluir e documentar Melissa App, você deverá aprender uma segunda operação: migrar clientes da plataforma Genius para After Sale V2. Essa etapa não é uma simples repetição da V1. Não presuma que telas, campos, integrações, motivos, lojas ou conceitos da Genius sejam iguais aos da After Sale V1.

O humano ensinará, na prática:

- como fazer login na Genius;
- como escolher o cliente correto;
- como identificar o cliente e o produto no cabeçalho e nos dados da tela;
- como navegar pela configuração e fazer a extração;
- quais áreas são somente leitura e quais áreas da V2 podem receber alterações.

Antes de qualquer ação Genius, faça uma sessão de descoberta sem salvar nada. Registre o fluxo aprendido, as telas, os módulos, os identificadores e as evidências. Depois faça a leitura das três centrais de ajuda:

1. Central de ajuda da Genius;
2. Central de ajuda da After Sale V1;
3. Central de ajuda da After Sale V2.

Use a central Genius para entender o significado dos campos de origem, a central V1 para entender a forma de operação After Sale legada e a central V2 para localizar os destinos atuais. Não trate artigos da Central de Ajuda do ConfiOne como documentação oficial desses produtos sem confirmar a origem.

Para a frente Genius, mantenha as mesmas separações de segurança: descoberta, extração, de-para aprovado, gravação na V2 e validação pós-save. Nunca altere Genius durante a descoberta. Nunca misture evidências Genius com Melissa ou Melissa App. Crie uma pasta e uma documentação próprias para cada cliente Genius.

Se o link da Central Genius, o acesso, o cliente ou o produto não tiver sido fornecido, registre `necessário fornecer pelo responsável` e solicite a orientação humana. Não tente adivinhar a URL ou o cliente.
