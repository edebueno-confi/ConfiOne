# Pré-brief: migração Genius para After Sale V2

## Finalidade

Preparar o Claude para uma futura migração de clientes Genius para After Sale V2. Este arquivo não é autorização para iniciar a operação. A primeira etapa será uma aula prática conduzida pelo responsável, com login, seleção de cliente e navegação.

## Por que é uma frente separada

Genius e After Sale V1 são origens diferentes. Um cliente Genius pode ter produtos, integrações, nomenclaturas, regras e telas que não existem na After Sale V1. O de-para deve ser construído por cliente e por funcionalidade, sem copiar automaticamente o mapa Melissa.

## Sequência obrigatória de aprendizado

1. Confirmar o usuário e a sessão de navegador.
2. Aprender o login da Genius com o humano.
3. Aprender como selecionar um cliente e validar o escopo.
4. Fazer uma navegação somente leitura completa.
5. Extrair todos os dados relevantes por DOM, tela e exportação disponível.
6. Ler a Central de Ajuda Genius.
7. Ler a Central de Ajuda After Sale V1.
8. Ler a Central de Ajuda After Sale V2.
9. Montar o de-para específico do cliente.
10. Só depois de aprovação, aplicar na V2.

## Escopo mínimo da extração Genius

Registrar, conforme existir no cliente:

- produto e versão de origem;
- e-commerce e lojas;
- integrações e sistemas externos;
- transportadoras e meios de postagem;
- modalidades de logística reversa;
- regras, prazos e aprovações;
- motivos e visibilidade para consumidor ou painel;
- reembolso, voucher e devolução;
- notificações e e-mails;
- dados de endereço e operação;
- dependências, recursos liberados e recursos realmente utilizados;
- limitações conhecidas para o destino V2.

## Regras de segurança

- Não alterar a Genius durante a descoberta.
- Confirmar o cliente antes de cada leitura e depois de qualquer troca de contexto.
- Não transportar tokens, senhas ou cookies.
- Não concluir equivalência apenas por nome parecido.
- Não considerar um recurso liberado como recurso utilizado.
- Não misturar a origem Genius com a origem After Sale V1 no relatório ou no CSV.
- Registrar separadamente o que a V2 não suporta e o que simplesmente não foi localizado.

## Resultado esperado da frente Genius

Para cada cliente Genius, entregar:

- inventário completo da origem;
- de-para para After Sale V2;
- CSV baseado no modelo oficial da V2, quando houver lojas;
- checklist por módulo;
- e-mails e HTML quando aplicável;
- pendências e limitações explicadas em linguagem humana;
- validação pós-save;
- relatório final independente dos relatórios Melissa e Melissa App.
